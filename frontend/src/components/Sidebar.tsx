import React from "react";
import { NavLink } from "react-router-dom";
import { Home, Settings, FolderOpen, Info, Package } from "lucide-react";
import logoIcon from "../../assets/icons/Srt-Translator--icon.svg";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/files", label: "Old Files", icon: FolderOpen },
  { to: "/packages", label: "Packages", icon: Package },
  { to: "/settings/general", label: "Settings", icon: Settings },
  { to: "/about", label: "About", icon: Info },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-base-300 bg-base-100 dark:border-dark-base-300 dark:bg-dark-base-100">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-base-300 px-5 py-4 dark:border-dark-base-300">
        <img src={logoIcon} alt="SRT Translator" className="h-7 w-7 rounded" />
        <span className="text-lg font-bold text-base-content dark:text-dark-base-content">
          SRT Translator
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary dark:bg-dark-primary/20 dark:text-dark-primary"
                  : "text-base-content/70 hover:bg-base-200 dark:text-dark-base-content/50 dark:hover:bg-dark-base-200"
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
