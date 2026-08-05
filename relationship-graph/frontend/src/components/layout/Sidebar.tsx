import { LayoutDashboard, LogIn, LogOut, ShieldCheck, Users, Share2 } from "lucide-react";
import { NavLink } from "react-router-dom";

import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "แดชบอร์ด", icon: LayoutDashboard, end: true },
  { to: "/people", label: "รายชื่อคน", icon: Users, end: false },
  { to: "/graph", label: "กราฟความสัมพันธ์", icon: Share2, end: false },
  { to: "/admin", label: "จัดการข้อมูล", icon: ShieldCheck, end: false },
];

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { isAuthenticated, username, logout } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-4 py-4">
        <Logo className="size-8 shrink-0" />
        <span className="text-lg font-semibold">3 ชั่วโมงไร้ค่า</span>
      </div>

      <Separator />

      <nav className="flex flex-1 flex-col gap-1 p-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <Separator />

      <div className="flex items-center justify-between gap-2 p-3">
        {isAuthenticated ? (
          <>
            <span className="truncate text-sm text-muted-foreground">{username}</span>
            <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="ออกจากระบบ">
              <LogOut className="size-4" />
            </Button>
          </>
        ) : (
          <NavLink
            to="/login"
            onClick={onNavigate}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <LogIn className="size-4" />
            เข้าสู่ระบบแอดมิน
          </NavLink>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:flex">
      <SidebarContent />
    </aside>
  );
}
