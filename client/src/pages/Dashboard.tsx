import { useAuth } from "@/hooks/use-auth";
import StudentPortalComponent from "@/pages/student";
import StaffScanner from "@/pages/StaffScanner";
import AdminPortal from "@/pages/admin";

export function Dashboard() {
  const { user, logout } = useAuth();

  if (!user) return null;

  if (user.role === "student") {
    return (
      <StudentPortalComponent
        username={user.username}
        displayName={user.displayName}
        email={user.email}
        role={user.role}
        onLogout={logout}
      />
    );
  }

  if (user.role === "admin") {
    return <AdminPortal />;
  }

  return <StaffScanner onClose={logout} />;
}
