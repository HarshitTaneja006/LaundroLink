import { db } from "./db";
import { pool } from "./db";
import { users, machines, laundrySessions, lostItems, foundItems, notifications } from "@shared/schema";
import { eq, and, desc, ne, isNotNull, ilike } from "drizzle-orm";
import {
  type User, type InsertUser,
  type Machine, type InsertMachine,
  type LaundrySession,
  type LostItem, type FoundItem, type Notification,
} from "@shared/schema";
import { addMinutes } from "date-fns";

export interface ItemMatch {
  id: string;
  lostItemId: string;
  foundItemId: string;
  matchPercentage: number;
  reasoning: string | null;
  notified: boolean;
  createdAt: Date;
}

export interface MatchedFoundItem extends FoundItem {
  matchPercentage: number;
  reasoning: string | null;
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(id: string, data: { displayName?: string; email?: string }): Promise<User | undefined>;

  getMachines(): Promise<Machine[]>;
  getMachine(id: string): Promise<Machine | undefined>;
  updateMachineStatus(id: string, status: Machine["status"]): Promise<Machine | undefined>;
  seedMachines(): Promise<void>;

  getActiveSessions(userId: string): Promise<LaundrySession[]>;
  getUserSessions(userId: string): Promise<LaundrySession[]>;
  startSession(userId: string, machineId: string): Promise<LaundrySession>;
  completeSession(sessionId: string): Promise<LaundrySession | undefined>;
  cancelSession(sessionId: string, userId: string): Promise<LaundrySession | undefined>;

  getLostItems(userId: string): Promise<LostItem[]>;
  createLostItem(userId: string, data: { clothingType: string; color: string; description: string }): Promise<LostItem>;

  getFoundItems(): Promise<FoundItem[]>;
  getFoundItem(id: string): Promise<FoundItem | undefined>;
  createFoundItem(userId: string, data: { clothingType: string; color: string; description: string; location: string; imageUrl?: string }): Promise<FoundItem>;
  claimFoundItem(id: string, userId: string): Promise<FoundItem | undefined>;

  getNotifications(userId: string): Promise<Notification[]>;
  createNotification(userId: string, data: { title: string; message: string; type: Notification["type"] }): Promise<Notification>;
  markNotificationRead(id: string, userId: string): Promise<Notification | undefined>;
  markAllNotificationsRead(userId: string): Promise<void>;

  getAllActiveLostItems(): Promise<LostItem[]>;
  getAllFoundItemsWithImages(): Promise<FoundItem[]>;
  saveMatch(lostItemId: string, foundItemId: string, matchPercentage: number, reasoning: string): Promise<ItemMatch>;
  getMatchedFoundItemsForUser(userId: string): Promise<MatchedFoundItem[]>;
  markLostItemMatched(id: string): Promise<void>;
}

export class DrizzleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    // Case-insensitive lookup so QR scans always match regardless of casing
    const [user] = await db.select().from(users).where(
      ilike(users.username, username.trim())
    );
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserProfile(id: string, data: { displayName?: string; email?: string }): Promise<User | undefined> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getMachines(): Promise<Machine[]> {
    return db.select().from(machines);
  }

  async getMachine(id: string): Promise<Machine | undefined> {
    const [machine] = await db.select().from(machines).where(eq(machines.id, id));
    return machine;
  }

  async updateMachineStatus(id: string, status: Machine["status"]): Promise<Machine | undefined> {
    const [machine] = await db.update(machines).set({ status }).where(eq(machines.id, id)).returning();
    return machine;
  }

  async seedMachines(): Promise<void> {
    const existing = await db.select().from(machines);
    if (existing.length > 0) return;
    await db.insert(machines).values([
      { name: "Washer A1", type: "washer", location: "Building A - Ground Floor", status: "available", cycleTimeMinutes: 30 },
      { name: "Washer A2", type: "washer", location: "Building A - Ground Floor", status: "available", cycleTimeMinutes: 30 },
      { name: "Dryer A1", type: "dryer", location: "Building A - Ground Floor", status: "available", cycleTimeMinutes: 45 },
      { name: "Washer B1", type: "washer", location: "Building B - Level 1", status: "available", cycleTimeMinutes: 30 },
      { name: "Washer B2", type: "washer", location: "Building B - Level 1", status: "maintenance", cycleTimeMinutes: 30 },
      { name: "Dryer B1", type: "dryer", location: "Building B - Level 1", status: "available", cycleTimeMinutes: 45 },
    ]);
  }

  async getActiveSessions(userId: string): Promise<LaundrySession[]> {
    return db.select().from(laundrySessions).where(
      and(eq(laundrySessions.userId, userId), eq(laundrySessions.status, "active"))
    );
  }

  async getUserSessions(userId: string): Promise<LaundrySession[]> {
    return db.select().from(laundrySessions)
      .where(eq(laundrySessions.userId, userId))
      .orderBy(desc(laundrySessions.startedAt));
  }

  async startSession(userId: string, machineId: string): Promise<LaundrySession> {
    const machine = await this.getMachine(machineId);
    if (!machine) throw new Error("Machine not found");
    if (machine.status !== "available") throw new Error("Machine is not available");
    const endsAt = addMinutes(new Date(), machine.cycleTimeMinutes);
    const [session] = await db.insert(laundrySessions).values({ userId, machineId, endsAt, status: "active" }).returning();
    await this.updateMachineStatus(machineId, "in_use");
    await this.createNotification(userId, {
      title: "Laundry cycle started",
      message: `Your cycle on ${machine.name} has started. It should be done in ${machine.cycleTimeMinutes} minutes.`,
      type: "info",
    });
    return session;
  }

  async completeSession(sessionId: string): Promise<LaundrySession | undefined> {
    const [session] = await db.update(laundrySessions)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(laundrySessions.id, sessionId))
      .returning();
    if (session) {
      await this.updateMachineStatus(session.machineId, "available");
      await this.createNotification(session.userId, {
        title: "Laundry cycle complete",
        message: "Your clothes are ready for pickup. Please collect them from the collection point.",
        type: "success",
      });
    }
    return session;
  }

  async cancelSession(sessionId: string, userId: string): Promise<LaundrySession | undefined> {
    const [session] = await db.update(laundrySessions)
      .set({ status: "cancelled", completedAt: new Date() })
      .where(and(eq(laundrySessions.id, sessionId), eq(laundrySessions.userId, userId)))
      .returning();
    if (session) await this.updateMachineStatus(session.machineId, "available");
    return session;
  }

  async getLostItems(userId: string): Promise<LostItem[]> {
    return db.select().from(lostItems)
      .where(eq(lostItems.userId, userId))
      .orderBy(desc(lostItems.createdAt));
  }

  async createLostItem(userId: string, data: { clothingType: string; color: string; description: string }): Promise<LostItem> {
    const [item] = await db.insert(lostItems).values({ userId, ...data, status: "searching" }).returning();
    await this.createNotification(userId, {
      title: "Lost item reported",
      message: `Your report for a ${data.color} ${data.clothingType} is now active. We'll notify you if a match is found.`,
      type: "info",
    });
    return item;
  }

  async getFoundItems(): Promise<FoundItem[]> {
    return db.select().from(foundItems)
      .where(eq(foundItems.status, "unclaimed"))
      .orderBy(desc(foundItems.createdAt));
  }

  async getFoundItem(id: string): Promise<FoundItem | undefined> {
    const [item] = await db.select().from(foundItems).where(eq(foundItems.id, id));
    return item;
  }

  async createFoundItem(userId: string, data: { clothingType: string; color: string; description: string; location: string; imageUrl?: string }): Promise<FoundItem> {
    const [item] = await db.insert(foundItems).values({ reportedByUserId: userId, ...data, status: "unclaimed" }).returning();
    return item;
  }

  async claimFoundItem(id: string, userId: string): Promise<FoundItem | undefined> {
    const [item] = await db.update(foundItems)
      .set({ status: "claimed", claimedByUserId: userId })
      .where(and(eq(foundItems.id, id), eq(foundItems.status, "unclaimed")))
      .returning();
    if (item) {
      await this.createNotification(userId, {
        title: "Item claim submitted",
        message: `Your claim for the ${item.color} ${item.clothingType} has been submitted. Staff will verify and contact you.`,
        type: "success",
      });
    }
    return item;
  }

  async getNotifications(userId: string): Promise<Notification[]> {
    return db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(userId: string, data: { title: string; message: string; type: Notification["type"] }): Promise<Notification> {
    const [notification] = await db.insert(notifications).values({ userId, ...data }).returning();
    return notification;
  }

  async markNotificationRead(id: string, userId: string): Promise<Notification | undefined> {
    const [notification] = await db.update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning();
    return notification;
  }

  async markAllNotificationsRead(userId: string): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.userId, userId));
  }

  async getAllActiveLostItems(): Promise<LostItem[]> {
    return db.select().from(lostItems).where(ne(lostItems.status, "resolved"));
  }

  async getAllFoundItemsWithImages(): Promise<FoundItem[]> {
    return db.select().from(foundItems)
      .where(and(eq(foundItems.status, "unclaimed"), isNotNull(foundItems.imageUrl)));
  }

  async saveMatch(lostItemId: string, foundItemId: string, matchPercentage: number, reasoning: string): Promise<ItemMatch> {
    const res = await pool.query(
      `INSERT INTO item_matches (lost_item_id, found_item_id, match_percentage, reasoning)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (lost_item_id, found_item_id) DO UPDATE
         SET match_percentage = EXCLUDED.match_percentage,
             reasoning = EXCLUDED.reasoning
       RETURNING *`,
      [lostItemId, foundItemId, matchPercentage, reasoning]
    );
    const row = res.rows[0];
    return {
      id: row.id,
      lostItemId: row.lost_item_id,
      foundItemId: row.found_item_id,
      matchPercentage: row.match_percentage,
      reasoning: row.reasoning,
      notified: row.notified,
      createdAt: row.created_at,
    };
  }

  async getMatchedFoundItemsForUser(userId: string): Promise<MatchedFoundItem[]> {
    const res = await pool.query(
      `SELECT fi.*, im.match_percentage, im.reasoning
       FROM item_matches im
       JOIN lost_items li ON li.id = im.lost_item_id
       JOIN found_items fi ON fi.id = im.found_item_id
       WHERE li.user_id = $1
         AND fi.status = 'unclaimed'
         AND im.match_percentage >= 60
       ORDER BY im.match_percentage DESC, fi.created_at DESC`,
      [userId]
    );
    return res.rows.map((row: any) => ({
      id: row.id,
      reportedByUserId: row.reported_by_user_id,
      clothingType: row.clothing_type,
      color: row.color,
      description: row.description,
      location: row.location,
      imageUrl: row.image_url,
      status: row.status,
      claimedByUserId: row.claimed_by_user_id,
      createdAt: row.created_at,
      matchPercentage: row.match_percentage,
      reasoning: row.reasoning,
    }));
  }

  async markLostItemMatched(id: string): Promise<void> {
    await db.update(lostItems).set({ status: "matched" }).where(eq(lostItems.id, id));
  }

  // ── Admin ─────────────────────────────────────────────────────────
  async getAllNotifications(): Promise<any[]> {
    const res = await pool.query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 100`);
    return res.rows;
  }

  async getAllLostItems(): Promise<any[]> {
    const res = await pool.query(`SELECT * FROM lost_items ORDER BY created_at DESC LIMIT 500`);
    return res.rows;
  }

  async getAllFoundItems(): Promise<any[]> {
    const res = await pool.query(`SELECT * FROM found_items ORDER BY created_at DESC LIMIT 500`);
    return res.rows;
  }

  async getAllStudentsWithWorkflow(): Promise<any[]> {
    const res = await pool.query(`
      SELECT u.id, u.username, u.display_name, u.email, u.created_at,
             w.status as workflow_status, w.bag_id, w.updated_at as workflow_updated_at
      FROM users u
      LEFT JOIN laundry_workflow w ON w.user_id = u.id
      WHERE u.role = 'student'
      ORDER BY u.created_at DESC
    `);
    return res.rows;
  }

  async getAllWorkflows(): Promise<any[]> {
    const res = await pool.query(`
      SELECT w.*, u.username, u.display_name
      FROM laundry_workflow w
      JOIN users u ON u.id = w.user_id
      ORDER BY w.updated_at DESC
    `);
    return res.rows;
  }

  // ── Laundry Workflow (Dhobi Terminal) ─────────────────────────────
  async getStudentByUsername(username: string): Promise<User | undefined> {
    return this.getUserByUsername(username);
  }

  async getWorkflowByUserId(userId: string): Promise<any | null> {
    const res = await pool.query(
      `SELECT * FROM laundry_workflow WHERE user_id = $1`,
      [userId]
    );
    return res.rows[0] || null;
  }

  async getQueuePosition(userId: string): Promise<{ aheadCount: number; position: number }> {
    // Get the current user's workflow created_at
    const myRes = await pool.query(
      `SELECT created_at FROM laundry_workflow WHERE user_id = $1`,
      [userId]
    );
    if (!myRes.rows[0]) return { aheadCount: 0, position: 1 };
    const myCreatedAt = myRes.rows[0].created_at;

    // Count bags in hand_in or washing that were created BEFORE this user's bag
    const aheadRes = await pool.query(
      `SELECT COUNT(*) FROM laundry_workflow
       WHERE status IN ('hand_in', 'washing')
         AND user_id != $1
         AND created_at < $2`,
      [userId, myCreatedAt]
    );
    const aheadCount = parseInt(aheadRes.rows[0].count, 10);
    return { aheadCount, position: aheadCount + 1 };
  }

  async upsertWorkflow(userId: string, status: string, bagId?: string): Promise<any> {
    const res = await pool.query(
      `INSERT INTO laundry_workflow (user_id, status, bag_id, updated_at)
       VALUES ($1, $2, $3, now())
       ON CONFLICT (user_id) DO UPDATE
         SET status = EXCLUDED.status,
             bag_id = COALESCE(EXCLUDED.bag_id, laundry_workflow.bag_id),
             updated_at = now()
       RETURNING *`,
      [userId, status, bagId || null]
    );
    return res.rows[0];
  }
}

export const storage = new DrizzleStorage();
