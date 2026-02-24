import React from "react";
import { Outlet, NavLink } from "react-router-dom";

const tabs = [
  { to: "/settings/general", label: "General" },
  { to: "/settings/matching", label: "Matching Words" },
  { to: "/settings/removal", label: "Remove Words" },
];

export default function SettingsLayout() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-white">
        Settings
      </h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white text-blue-700 shadow dark:bg-gray-700 dark:text-blue-300"
                  : "text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              }`
            }
          >
            {tab.label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  );
}
