import { LogOut, Search, Settings2, Share2, UsersRound } from "lucide-react";
import { Suspense } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { PageLoader } from "@/components/common/PageLoader";
import { Logo } from "@/components/layout/Logo";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "ค้นหา", icon: Search, end: true },
  { to: "/people", label: "คนทั้งหมด", icon: UsersRound, end: false },
  { to: "/graph", label: "แผนผัง", icon: Share2, end: false },
  { to: "/admin", label: "จัดการ", icon: Settings2, end: false },
];

function TopBar() {
  const { username, logout } = useAuth();

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 bg-card px-4 shadow-soft md:px-6">
      <Link to="/" aria-label="หน้าค้นหา" className="flex min-w-0 items-center gap-2 rounded-md">
        <Logo className="size-9 shrink-0" />
        {/* The four labelled destinations need this width on small laptops. */}
        <span className="truncate text-lg font-semibold md:hidden lg:inline">3 ชั่วโมงไร้ค่า</span>
      </Link>

      <nav aria-label="เมนูหลัก" className="hidden flex-1 items-center justify-center gap-1 md:flex">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex h-11 items-center gap-2 rounded-full px-3 text-sm font-medium whitespace-nowrap lg:px-4 transition-[background-color,color,transform] duration-200 motion-safe:active:scale-[0.97]",
                isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="ml-auto flex shrink-0 items-center gap-1 md:ml-0">
        <ThemeToggle />
        <span className="hidden max-w-24 truncate px-2 text-sm text-muted-foreground lg:block">{username}</span>
        <Button variant="ghost" className="hidden md:inline-flex" onClick={() => void logout()}>
          <LogOut className="size-4" />
          ออกจากระบบ
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => void logout()}
          aria-label="ออกจากระบบ"
        >
          <LogOut className="size-5" />
        </Button>
      </div>
    </header>
  );
}

function BottomBar() {
  return (
    <nav
      aria-label="เมนูหลัก"
      className="flex shrink-0 bg-card pb-[env(safe-area-inset-bottom)] shadow-soft md:hidden"
    >
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex min-h-16 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-[color,transform] duration-200 motion-safe:active:scale-[0.97]",
              isActive ? "text-primary" : "text-muted-foreground",
            )
          }
        >
          <Icon className="size-6" />
          <span className="truncate">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * The frame around every signed-in page. Both bars are plain flex children, so
 * `main` takes exactly the remaining height and the graph's `h-full` still works.
 */
export function AppShell() {
  return (
    <div className="flex h-svh w-full flex-col overflow-hidden bg-background text-foreground">
      <TopBar />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <BottomBar />
    </div>
  );
}
