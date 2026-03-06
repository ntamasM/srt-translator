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
      <h1 className="mb-4 text-2xl font-bold text-base-content dark:text-dark-base-content">
        Settings
      </h1>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-base-200 p-1 dark:bg-dark-base-200">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors ${
                isActive
                  ? "bg-base-100 text-primary shadow dark:bg-dark-base-300 dark:text-dark-primary"
                  : "text-base-content/70 hover:text-base-content dark:text-dark-base-content/50 dark:hover:text-dark-base-content"
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
