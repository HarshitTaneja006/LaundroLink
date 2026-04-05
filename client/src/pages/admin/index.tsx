import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import AdminSidebar from "./AdminSidebar";
import AdminTopbar from "./AdminTopbar";
import QueuePage from "./pages/Queue";
import AuditPage from "./pages/Audit";
import CommsPage from "./pages/Comms";
import StudentsPage from "./pages/Students";
import SchedulePage from "./pages/Schedule";
import LostFoundPage from "./pages/LostFound";

type AdminPage = "queue" | "audit" | "comms" | "students" | "schedule" | "lf";

export default function AdminPortal() {
  const { logout } = useAuth();
  const [activePage, setActivePage] = useState<AdminPage>("queue");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const pages: Record<AdminPage, JSX.Element> = {
    queue:    <QueuePage />,
    audit:    <AuditPage />,
    comms:    <CommsPage />,
    students: <StudentsPage />,
    schedule: <SchedulePage />,
    lf:       <LostFoundPage />,
  };

  return (
    <div style={{ display: "flex", height: "100vh", background: "#1a2133" }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[99] md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <AdminSidebar
        active={activePage}
        onNavigate={(p) => { setActivePage(p as AdminPage); setSidebarOpen(false); }}
        isOpen={sidebarOpen}
        onLogout={() => logout()}
      />
      <div
        style={{
          flex: 1,
          background: "#ffffff",
          borderRadius: "12px 0 0 12px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          margin: "8px 8px 8px 0",
        }}
      >
        <AdminTopbar activePage={activePage} onHamburger={() => setSidebarOpen(true)} />
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {pages[activePage]}
        </div>
      </div>
    </div>
  );
}
