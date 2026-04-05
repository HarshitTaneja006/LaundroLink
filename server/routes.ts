import express, { type Express, type Request, type Response } from "express";
import { createServer, type Server } from "http";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { storage } from "./storage";
import { hashPassword, comparePasswords } from "./auth";
import {
  loginSchema, insertUserSchema, startSessionSchema,
  insertLostItemSchema, insertFoundItemSchema, updateProfileSchema,
} from "@shared/schema";
import { type User } from "@shared/schema";
import { pool } from "./db";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { triggerMatchingForFoundItem, triggerMatchingForLostItem } from "./matching";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const upload = multer({
  dest: UPLOADS_DIR,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only PNG, JPG, and WebP images are allowed"));
  },
});

const PgSession = connectPgSimple(session);

function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: Function) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    if (!roles.includes((req.user as User).role)) return res.status(403).json({ message: "Forbidden" });
    next();
  };
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  app.use(
    session({
      store: new PgSession({ pool, createTableIfMissing: true }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours instead of 7 days
      },
    })
  );

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) return done(null, false, { message: "Invalid username or password" });
        const valid = await comparePasswords(password, user.password);
        if (!valid) return done(null, false, { message: "Invalid username or password" });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser((user, done) => done(null, (user as User).id));
  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  app.use(passport.initialize());
  app.use(passport.session());

  // Simple CSRF protection middleware
  app.use((req, res, next) => {
    if (req.method === "GET" || req.method === "OPTIONS" || req.method === "HEAD") {
      // Generate a CSRF token for GET requests
      if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString("hex");
      }
      res.setHeader("X-CSRF-Token", req.session.csrfToken);
      return next();
    }

    // Verify CSRF token on state-changing requests
    const token = req.headers["x-csrf-token"] || req.body?.csrfToken;
    if (!token || token !== req.session.csrfToken) {
      return res.status(403).json({ message: "CSRF token invalid or missing" });
    }
    next();
  });

  await storage.seedMachines();

  // Rate limiting for auth endpoints (simple in-memory implementation)
  const authAttempts = new Map<string, { count: number; resetTime: number }>();
  const MAX_ATTEMPTS = 5;
  const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

  function checkRateLimit(identifier: string): boolean {
    const now = Date.now();
    const record = authAttempts.get(identifier);

    if (!record || record.resetTime < now) {
      authAttempts.set(identifier, { count: 1, resetTime: now + WINDOW_MS });
      return true;
    }

    if (record.count >= MAX_ATTEMPTS) {
      return false;
    }

    record.count++;
    return true;
  }

  // ── CSRF Token (Public) ────────────────────────────────────────
  app.get("/api/csrf-token", (req, res) => {
    // CSRF token is automatically set by the middleware on GET requests
    res.json({ message: "OK" });
  });

  // ── Auth ──────────────────────────────────────────────────────────
  app.post("/api/auth/register", async (req, res) => {
    try {
      const identifier = `register:${req.body.username || req.ip}`;
      if (!checkRateLimit(identifier)) {
        return res.status(429).json({ message: "Too many registration attempts. Please try again later." });
      }

      const data = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByUsername(data.username);
      if (existing) return res.status(409).json({ message: "Username already taken" });
      const hashed = await hashPassword(data.password);
      const user = await storage.createUser({ ...data, password: hashed });
      const { password: _, ...safeUser } = user;
      req.login(user, (err) => {
        if (err) return res.status(500).json({ message: "Login after register failed" });
        res.status(201).json(safeUser);
      });
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: fromZodError(err).message });
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", (req, res, next) => {
    try {
      const identifier = `login:${req.body.username || req.ip}`;
      if (!checkRateLimit(identifier)) {
        return res.status(429).json({ message: "Too many login attempts. Please try again later." });
      }

      loginSchema.parse(req.body);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: fromZodError(err).message });
    }
    passport.authenticate("local", (err: any, user: User | false, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info?.message || "Invalid credentials" });
      req.login(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        const { password: _, ...safeUser } = user;
        res.json(safeUser);
      });
    })(req, res, next);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, (req, res) => {
    const { password: _, ...safeUser } = req.user as User;
    res.json(safeUser);
  });

  // ── Profile ───────────────────────────────────────────────────────
  app.put("/api/profile", requireAuth, async (req, res) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const user = await storage.updateUserProfile((req.user as User).id, data);
      if (!user) return res.status(404).json({ message: "User not found" });
      const { password: _, ...safeUser } = user;
      res.json(safeUser);
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: fromZodError(err).message });
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ── Machines ──────────────────────────────────────────────────────
  app.get("/api/machines", requireAuth, async (_req, res) => {
    try {
      const list = await storage.getMachines();
      res.json(list);
    } catch {
      res.status(500).json({ message: "Failed to fetch machines" });
    }
  });

  app.patch("/api/machines/:id/status", requireRole("staff", "admin"), async (req, res) => {
    try {
      const { status } = req.body;
      const validStatuses = ["available", "in_use", "maintenance"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status value" });
      }
      const machine = await storage.updateMachineStatus(req.params.id, status);
      if (!machine) return res.status(404).json({ message: "Machine not found" });
      res.json(machine);
    } catch {
      res.status(500).json({ message: "Failed to update machine" });
    }
  });

  // ── Sessions ──────────────────────────────────────────────────────
  app.get("/api/sessions", requireAuth, async (req, res) => {
    try {
      const sessions = await storage.getUserSessions((req.user as User).id);
      res.json(sessions);
    } catch {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  app.get("/api/sessions/active", requireAuth, async (req, res) => {
    try {
      const sessions = await storage.getActiveSessions((req.user as User).id);
      res.json(sessions);
    } catch {
      res.status(500).json({ message: "Failed to fetch active sessions" });
    }
  });

  app.post("/api/sessions", requireAuth, async (req, res) => {
    try {
      const { machineId } = startSessionSchema.parse(req.body);
      const session = await storage.startSession((req.user as User).id, machineId);
      res.status(201).json(session);
    } catch (err: any) {
      if (err instanceof ZodError) return res.status(400).json({ message: fromZodError(err).message });
      res.status(400).json({ message: err.message || "Failed to start session" });
    }
  });

  app.patch("/api/sessions/:id/complete", requireAuth, async (req, res) => {
    try {
      const session = await storage.completeSession(req.params.id);
      if (!session) return res.status(404).json({ message: "Session not found" });
      res.json(session);
    } catch {
      res.status(500).json({ message: "Failed to complete session" });
    }
  });

  app.patch("/api/sessions/:id/cancel", requireAuth, async (req, res) => {
    try {
      const session = await storage.cancelSession(req.params.id, (req.user as User).id);
      if (!session) return res.status(404).json({ message: "Session not found" });
      res.json(session);
    } catch {
      res.status(500).json({ message: "Failed to cancel session" });
    }
  });

  // ── Lost Items ────────────────────────────────────────────────────
  app.get("/api/lost-items", requireAuth, async (req, res) => {
    try {
      const items = await storage.getLostItems((req.user as User).id);
      res.json(items);
    } catch {
      res.status(500).json({ message: "Failed to fetch lost items" });
    }
  });

  app.post("/api/lost-items", requireAuth, async (req, res) => {
    try {
      const data = insertLostItemSchema.parse(req.body);
      const item = await storage.createLostItem((req.user as User).id, data);
      res.status(201).json(item);
      // Run AI matching in the background (non-blocking)
      triggerMatchingForLostItem(item).catch((e) =>
        console.error("[matching] triggerMatchingForLostItem error:", e)
      );
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: fromZodError(err).message });
      res.status(500).json({ message: "Failed to report lost item" });
    }
  });

  // ── Found Items ───────────────────────────────────────────────────
  app.get("/api/found-items", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      // Students only see found items that match their lost item reports (≥60%)
      if (user.role === "student") {
        const items = await storage.getMatchedFoundItemsForUser(user.id);
        return res.json(items);
      }
      // Staff and admin see all unclaimed found items
      const items = await storage.getFoundItems();
      res.json(items);
    } catch {
      res.status(500).json({ message: "Failed to fetch found items" });
    }
  });

  app.post("/api/found-items", requireAuth, async (req, res) => {
    try {
      const data = insertFoundItemSchema.parse(req.body);
      const item = await storage.createFoundItem((req.user as User).id, data);
      res.status(201).json(item);
      // Run AI matching in the background (non-blocking)
      if (item.imageUrl) {
        triggerMatchingForFoundItem(item).catch((e) =>
          console.error("[matching] triggerMatchingForFoundItem error:", e)
        );
      }
    } catch (err) {
      if (err instanceof ZodError) return res.status(400).json({ message: fromZodError(err).message });
      res.status(500).json({ message: "Failed to report found item" });
    }
  });

  app.post("/api/found-items/:id/claim", requireAuth, async (req, res) => {
    try {
      const item = await storage.claimFoundItem(req.params.id, (req.user as User).id);
      if (!item) return res.status(404).json({ message: "Item not found or already claimed" });
      res.json(item);
    } catch {
      res.status(500).json({ message: "Failed to claim item" });
    }
  });

  // ── Notifications ─────────────────────────────────────────────────
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const list = await storage.getNotifications((req.user as User).id);
      res.json(list);
    } catch {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.patch("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await storage.markAllNotificationsRead((req.user as User).id);
      res.json({ message: "All notifications marked as read" });
    } catch {
      res.status(500).json({ message: "Failed to mark notifications as read" });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notification = await storage.markNotificationRead(req.params.id, (req.user as User).id);
      if (!notification) return res.status(404).json({ message: "Notification not found" });
      res.json(notification);
    } catch {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // ── Staff Scanner (Dhobi Terminal) ───────────────────────────────
  function requireStaff(req: Request, res: Response, next: Function) {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    const u = req.user as User;
    if (u.role !== "staff" && u.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    next();
  }

  app.get("/api/student/workflow", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const workflow = await storage.getWorkflowByUserId(user.id);
      res.set("Cache-Control", "no-store");
      res.json(workflow ? {
        status: workflow.status,
        bagId: workflow.bag_id,
        updatedAt: workflow.updated_at,
      } : null);
    } catch {
      res.status(500).json({ message: "Failed to fetch workflow" });
    }
  });

  app.get("/api/student/queue-position", requireAuth, async (req, res) => {
    try {
      const user = req.user as User;
      const position = await storage.getQueuePosition(user.id);
      res.json(position);
    } catch {
      res.status(500).json({ message: "Failed to fetch queue position" });
    }
  });

  app.get("/api/staff/student/:username", requireStaff, async (req, res) => {
    try {
      const username = decodeURIComponent(req.params.username).trim();
      const student = await storage.getStudentByUsername(username);
      if (!student) return res.status(404).json({ message: "Student not found", scanned: username });
      const workflow = await storage.getWorkflowByUserId(student.id);
      res.json({
        id: student.id,
        username: student.username,
        displayName: student.displayName,
        email: student.email,
        workflow: workflow ? {
          status: workflow.status,
          bagId: workflow.bag_id,
          updatedAt: workflow.updated_at,
        } : null,
      });
    } catch {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.put("/api/staff/student/:username/status", requireStaff, async (req, res) => {
    try {
      const { status, bagId } = req.body;
      const validStatuses = ["hand_in", "washing", "ready_for_pickup", "delivered"];
      if (!validStatuses.includes(status)) return res.status(400).json({ message: "Invalid status" });
      const student = await storage.getStudentByUsername(req.params.username);
      if (!student) return res.status(404).json({ message: "Student not found" });
      const workflow = await storage.upsertWorkflow(student.id, status, bagId);
      // Notify the student when their status changes
      const statusLabels: Record<string, string> = {
        hand_in: "Your laundry has been handed in.",
        washing: "Your laundry is now being washed.",
        ready_for_pickup: "Your laundry is ready for pickup!",
        delivered: "Your laundry has been delivered.",
      };
      await storage.createNotification(student.id, {
        title: "Laundry status updated",
        message: statusLabels[status],
        type: status === "ready_for_pickup" || status === "delivered" ? "success" : "info",
      });
      res.json({ status: workflow.status, bagId: workflow.bag_id, updatedAt: workflow.updated_at });
    } catch {
      res.status(500).json({ message: "Failed to update status" });
    }
  });

  // ── Admin Portal ─────────────────────────────────────────────────
  // Rate limiting for admin/staff data retrieval (50 requests per 15 min per user)
  const adminAttempts = new Map<string, { count: number; resetTime: number }>();
  const ADMIN_MAX_ATTEMPTS = 50;
  const ADMIN_WINDOW_MS = 15 * 60 * 1000;

  function checkAdminRateLimit(userId: string): boolean {
    const now = Date.now();
    const record = adminAttempts.get(userId);

    if (!record || record.resetTime < now) {
      adminAttempts.set(userId, { count: 1, resetTime: now + ADMIN_WINDOW_MS });
      return true;
    }

    if (record.count >= ADMIN_MAX_ATTEMPTS) {
      return false;
    }

    record.count++;
    return true;
  }

  function requireAdmin(req: Request, res: Response, next: Function) {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    if ((req.user as User).role !== "admin") return res.status(403).json({ message: "Admin access required" });

    // Rate limit admin data access
    if (!checkAdminRateLimit((req.user as User).id)) {
      return res.status(429).json({ message: "Too many requests. Please try again later." });
    }

    next();
  }

  app.get("/api/admin/students", requireAdmin, async (_req, res) => {
    try {
      const students = await storage.getAllStudentsWithWorkflow();
      res.json(students);
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  app.get("/api/admin/workflows", requireAdmin, async (_req, res) => {
    try {
      const workflows = await storage.getAllWorkflows();
      res.json(workflows);
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  app.get("/api/admin/notifications", requireAdmin, async (_req, res) => {
    try {
      const items = await storage.getAllNotifications();
      res.json(items);
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  app.get("/api/admin/lost-items", requireAdmin, async (_req, res) => {
    try {
      const items = await storage.getAllLostItems();
      res.json(items);
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  app.get("/api/admin/found-items", requireAdmin, async (_req, res) => {
    try {
      const items = await storage.getAllFoundItems();
      res.json(items);
    } catch { res.status(500).json({ message: "Failed" }); }
  });

  // ── File Upload ───────────────────────────────────────────────────
  app.post("/api/upload", requireAuth, upload.single("photo"), async (req, res) => {
    try {
      if (!req.file) return res.status(400).json({ message: "No file uploaded" });
      const ext = req.file.mimetype === "image/png" ? ".png"
        : req.file.mimetype === "image/webp" ? ".webp" : ".jpg";
      // Generate a secure random filename instead of using multer's default
      const secureFilename = `${Date.now()}_${crypto.randomBytes(8).toString("hex")}${ext}`;
      const newPath = path.join(UPLOADS_DIR, secureFilename);

      // Use async rename to prevent race conditions
      try {
        await fs.promises.rename(req.file.path, newPath);
        res.json({ url: `/uploads/${secureFilename}` });
      } catch (err) {
        // Clean up failed upload
        try {
          await fs.promises.unlink(req.file.path);
        } catch (e) {
          // File already cleaned up or doesn't exist
        }
        res.status(500).json({ message: "Upload processing failed" });
      }
    } catch {
      res.status(500).json({ message: "Upload failed" });
    }
  });

  app.use("/uploads", (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });
    next();
  }, express.static(UPLOADS_DIR));

  return httpServer;
}
