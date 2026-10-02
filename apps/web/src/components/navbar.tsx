"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Lock,
  Building2,
  FolderKanban,
  Users,
  Key,
  History,
  Laptop,
  LogOut,
  ChevronDown,
  Plus,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import type { WorkspaceSummaryDto, UserDto } from "@repo/core";
import { toast } from "sonner";

interface NavbarProps {
  currentWorkspace?: WorkspaceSummaryDto;
  workspaces?: WorkspaceSummaryDto[];
  user?: UserDto;
  userRole?: string;
}

export function Navbar({ currentWorkspace, workspaces = [], user, userRole }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged out");
      router.push("/login");
    } catch {
      toast.error("Logout failed");
    }
  };

  const wsSlug = currentWorkspace?.slug;

  const navItems = wsSlug
    ? [
        { label: "Projects", href: `/w/${wsSlug}`, icon: FolderKanban },
        { label: "Members", href: `/w/${wsSlug}/settings/members`, icon: Users },
        { label: "Service Tokens", href: `/w/${wsSlug}/settings/tokens`, icon: Key },
        { label: "Audit Log", href: `/w/${wsSlug}/settings/audit`, icon: History },
      ]
    : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* Left: Brand & Workspace Selector */}
        <div className="flex items-center space-x-6">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Lock className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl tracking-tight">seal</span>
          </Link>

          <span className="text-muted-foreground/30 font-light text-lg">/</span>

          {/* Workspace Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-9 px-3 font-medium flex items-center space-x-2 border border-border/40 hover:bg-muted/60"
              >
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <span className="truncate max-w-[140px]">
                  {currentWorkspace ? currentWorkspace.name : "Select Workspace"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((ws) => (
                <DropdownMenuItem
                  key={ws.id}
                  onClick={() => router.push(`/w/${ws.slug}`)}
                  className={`cursor-pointer ${
                    ws.id === currentWorkspace?.id ? "bg-muted font-semibold" : ""
                  }`}
                >
                  <Building2 className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="truncate flex-1">{ws.name}</span>
                  {ws.role && (
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground">
                      {ws.role}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/onboarding")}
                className="cursor-pointer text-primary focus:text-primary font-medium"
              >
                <Plus className="mr-2 h-4 w-4" /> Create Workspace
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Nav items */}
          <nav className="hidden md:flex items-center space-x-1 pl-4 border-l border-border/40">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== `/w/${wsSlug}` && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? "bg-secondary text-secondary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions & Profile */}
        <div className="flex items-center space-x-3">
          {userRole && (
            <span className="hidden sm:inline-flex text-xs font-mono uppercase px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-semibold">
              Role: {userRole}
            </span>
          )}

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-lg"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2.5 flex items-center space-x-2 rounded-lg">
                <div className="h-7 w-7 rounded-full bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center border border-primary/30">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="hidden sm:inline-block font-medium text-sm truncate max-w-[100px]">
                  {user?.name || "Account"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs text-muted-foreground leading-none">{user?.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => router.push("/account/devices")}
                className="cursor-pointer"
              >
                <Laptop className="mr-2 h-4 w-4 text-muted-foreground" />
                My Authorized Devices
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="cursor-pointer text-destructive focus:text-destructive font-medium"
              >
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
