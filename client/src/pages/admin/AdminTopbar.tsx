import { useAuth } from "@/hooks/use-auth";

const pagePlaceholders: Record<string, string> = {
  queue: "Search orders, students...",
  audit: "Search QR code, student ID...",
  comms: "Search messages, topics...",
  students: "Search students, ID, room...",
  schedule: "Search schedule...",
  lf: "Search lost & found items...",
};

interface Props {
  activePage: string;
  onHamburger: () => void;
}

export default function AdminTopbar({ activePage, onHamburger }: Props) {
  const { user } = useAuth();
  const initials = (user?.displayName || user?.username || "A")
    .split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="flex items-center gap-3 px-6 py-3.5 bg-white flex-shrink-0" style={{ borderBottom: "1px solid #e5e7eb" }}>
      <button
        onClick={onHamburger}
        className="md:hidden flex flex-col gap-1 p-2 rounded-md border border-gray-200"
        aria-label="Open sidebar"
        data-testid="admin-hamburger"
      >
        <span className="block w-4 h-0.5 bg-gray-800 rounded" />
        <span className="block w-4 h-0.5 bg-gray-800 rounded" />
        <span className="block w-4 h-0.5 bg-gray-800 rounded" />
      </button>

      <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md px-3 py-2">
        <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={pagePlaceholders[activePage] || "Search..."}
          className="flex-1 bg-transparent outline-none text-[13px] text-gray-700 placeholder-gray-400"
          data-testid="admin-search"
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="w-8 h-8 rounded-md border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>
        <div className="flex items-center gap-2 cursor-pointer" data-testid="admin-user-info">
          <div className="text-right hidden sm:block">
            <div className="text-[13px] font-semibold">{user?.displayName || user?.username}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Admin</div>
          </div>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[11px] font-bold"
            style={{ background: "linear-gradient(135deg,#1e6cff,#8b5cf6)" }}
          >
            {initials}
          </div>
        </div>
      </div>
    </div>
  );
}
