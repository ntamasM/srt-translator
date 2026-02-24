import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Settings,
  BookOpen,
  Trash2,
  Clapperboard,
  FolderOpen,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/files", label: "Old Files", icon: FolderOpen },
  { to: "/settings/general", label: "General", icon: Settings },
  { to: "/settings/matching", label: "Matching Words", icon: BookOpen },
  { to: "/settings/removal", label: "Remove Words", icon: Trash2 },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      {/* Logo */}
      <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-4 dark:border-gray-700">
        <Clapperboard size={24} className="text-blue-600" />
        <span className="text-lg font-bold text-gray-900 dark:text-white">
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
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
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
