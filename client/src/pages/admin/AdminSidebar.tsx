const logoPath = "/laundrolink-logo.png";

const navItems = [
  {
    id: "queue", label: "Queue",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M4 6h16M4 10h16M4 14h8M4 18h8" />
      </svg>
    ),
  },
  {
    id: "audit", label: "Audit",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
  {
    id: "comms", label: "Comms",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
      </svg>
    ),
  },
  {
    id: "students", label: "Students",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" />
      </svg>
    ),
  },
  {
    id: "schedule", label: "Schedule",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    id: "lf", label: "L&F",
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  },
];

interface Props {
  active: string;
  onNavigate: (id: string) => void;
  isOpen: boolean;
  onLogout: () => void;
}

export default function AdminSidebar({ active, onNavigate, isOpen, onLogout }: Props) {
  return (
    <aside
      className={`flex flex-col flex-shrink-0 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"} fixed md:static z-[200] h-full`}
      style={{ width: 200, background: "#0f1420" }}
      data-testid="admin-sidebar"
    >
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "1px solid #2a3347" }}>
        <img src={logoPath} alt="LaundroLink" className="h-11 w-auto mb-2" />
        <span className="text-[10px] font-medium tracking-[1.5px] uppercase mt-0.5 block" style={{ color: "#9aa3b2" }}>
          Admin Console
        </span>
      </div>

      <nav className="flex-1 p-2.5 flex flex-col gap-0.5">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            data-testid={`nav-${item.id}`}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium w-full text-left transition-all duration-150"
            style={{
              background: active === item.id ? "#1e6cff" : "transparent",
              color: active === item.id ? "#fff" : "#9aa3b2",
            }}
            onMouseEnter={(e) => {
              if (active !== item.id) {
                (e.currentTarget as HTMLButtonElement).style.background = "#1a2133";
                (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              }
            }}
            onMouseLeave={(e) => {
              if (active !== item.id) {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
                (e.currentTarget as HTMLButtonElement).style.color = "#9aa3b2";
              }
            }}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-2.5 flex flex-col gap-0.5" style={{ borderTop: "1px solid #2a3347" }}>
        <button
          onClick={onLogout}
          data-testid="admin-logout"
          className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[12px] font-medium w-full transition-all"
          style={{ color: "#9aa3b2" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "#1a2133";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            (e.currentTarget as HTMLButtonElement).style.color = "#9aa3b2";
          }}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
