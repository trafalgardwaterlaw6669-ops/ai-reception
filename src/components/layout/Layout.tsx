import { Outlet } from "react-router";
import { Sidebar } from "./Sidebar";
import { AIChatWidget } from "../AIChatWidget";
import { LiveVoiceWidget } from "../LiveVoiceWidget";

export function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 h-full">
          <Outlet />
        </div>
        <AIChatWidget />
        <LiveVoiceWidget />
      </main>
    </div>
  );
}
