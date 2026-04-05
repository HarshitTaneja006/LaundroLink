import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import LaundryDay from "./views/LaundryDay";
import TrackOrder from "./views/TrackOrder";
import LostItem from "./views/LostItem";
import FoundItems from "./views/FoundItems";
import ReportItem from "./views/ReportItem";
import Notifications from "./views/Notifications";
import QRCodeView from "./views/QRCode";
import Profile from "./views/Profile";

interface StudentPortalProps {
  username: string;
  displayName?: string | null;
  email?: string | null;
  role: string;
  onLogout: () => void;
}

export default function StudentPortal({ username, displayName, email, role, onLogout }: StudentPortalProps) {
  const [activeTab, setActiveTab] = useState("Laundry Day");

  const renderContent = () => {
    switch (activeTab) {
      case "Laundry Day":    return <LaundryDay username={username} />;
      case "Track Order":    return <TrackOrder />;
      case "Lost Item":      return <LostItem />;
      case "Found Items":    return <FoundItems />;
      case "Report Item":    return <ReportItem />;
      case "Notifications":  return <Notifications />;
      case "My QR Code":     return <QRCodeView username={username} />;
      case "Profile":        return <Profile username={username} role={role} email={email} displayName={displayName} />;
      default:               return <LaundryDay username={username} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#f3f6f9] font-sans text-slate-800 overflow-hidden">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header username={displayName || username} role="Active Scholar" onNotificationsClick={() => setActiveTab("Notifications")} />
        <main className="flex-1 overflow-y-auto p-8 lg:px-12 xl:px-16 pb-24">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
