import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TranslationBanner from "./TranslationBanner";

export default function Layout() {
  return (
    <div className="flex h-screen bg-base-100 dark:bg-dark-base-100">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TranslationBanner />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
