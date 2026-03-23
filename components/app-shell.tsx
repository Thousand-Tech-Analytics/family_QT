import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/bottom-navigation";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-transparent">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pb-28 pt-6 sm:px-5">
        <main className="flex-1">{children}</main>
      </div>
      <BottomNavigation />
    </div>
  );
}
