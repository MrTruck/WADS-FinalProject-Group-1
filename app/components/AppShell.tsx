"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import NotificationManager from "./NotificationManager";

export default function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideNavigation =
    pathname === "/login" ||
    pathname === "/register";

  return (
    <>
      {!hideNavigation && <NotificationManager />}

      <div className="flex min-h-screen min-w-0">
        {!hideNavigation && (
          <div className="hidden shrink-0 md:block">
            <Sidebar />
          </div>
        )}

        <main className="min-w-0 flex-1 overflow-x-hidden bg-zinc-50">
          {children}
        </main>
      </div>
    </>
  );
}

