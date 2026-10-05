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
    Menu,
    type LucideIcon,
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
import type { RoleName, WorkspaceSummaryDto, UserDto } from "@repo/core";
import { toast } from "sonner";

interface NavbarProps {
    currentWorkspace?: WorkspaceSummaryDto;
    workspaces?: WorkspaceSummaryDto[];
    user?: UserDto;
    userRole?: RoleName;
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

    // Each item declares the lowest workspace role that may see it. These mirror
    // the API guards: members listing needs at least viewer, audit log needs
    // admin (workspaces.ts:429). Without this, a viewer is offered pages that
    // answer 403 and then render a misleading empty state.
    const ROLE_RANK: Record<RoleName, number> = { viewer: 1, editor: 2, admin: 3, owner: 4 };
    const rank = userRole ? ROLE_RANK[userRole] : 0;

    type NavItem = { label: string; href: string; icon: LucideIcon; minRole: RoleName };
    const allNavItems: NavItem[] = wsSlug
        ? [
              { label: "Projects", href: `/w/${wsSlug}`, icon: FolderKanban, minRole: "viewer" },
              { label: "Members", href: `/w/${wsSlug}/settings/members`, icon: Users, minRole: "editor" },
              { label: "Service Tokens", href: `/w/${wsSlug}/settings/tokens`, icon: Key, minRole: "viewer" },
              { label: "Audit Log", href: `/w/${wsSlug}/settings/audit`, icon: History, minRole: "admin" },
          ]
        : [];

    const navItems = allNavItems
        .filter((item) => rank >= ROLE_RANK[item.minRole])
        .map(({ minRole: _minRole, ...item }) => item);

    const isActiveItem = (href: string) => pathname === href || (href !== `/w/${wsSlug}` && pathname.startsWith(href));

    const linkClass = (isActive: boolean) =>
        `flex shrink-0 items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
            isActive
                ? "bg-secondary text-secondary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        }`;

    return (
        <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between gap-2 px-4 md:px-8">
                {/* Left: Brand & Workspace Selector */}
                <div className="flex min-w-0 items-center gap-2 sm:gap-4 lg:gap-6">
                    <Link href="/" className="flex shrink-0 items-center gap-2.5 group">
                        <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
                            <Lock className="h-5 w-5" />
                        </div>
                        <span className="hidden font-bold text-xl tracking-tight sm:inline">Seal</span>
                    </Link>

                    <span className="hidden shrink-0 text-muted-foreground/30 font-light text-lg sm:inline">/</span>

                    {/* Workspace Switcher */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-9 min-w-0 max-w-37.5 sm:max-w-none px-2 sm:px-3 font-medium flex items-center gap-2 border border-border/40 hover:bg-muted/60"
                            >
                                <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <span className="truncate">
                                    {currentWorkspace ? currentWorkspace.name : "Select Workspace"}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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

                    {/* Nav items: inline from xl up, behind a menu below that */}
                    <nav className="hidden xl:flex shrink-0 items-center gap-1 pl-4 border-l border-border/40">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Link key={item.href} href={item.href} className={linkClass(isActiveItem(item.href))}>
                                    <Icon className="h-4 w-4 shrink-0" />
                                    <span>{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {navItems.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Open workspace navigation"
                                    className="xl:hidden shrink-0 h-9 w-9 rounded-lg"
                                >
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-52">
                                {navItems.map((item) => {
                                    const Icon = item.icon;
                                    return (
                                        <DropdownMenuItem
                                            key={item.href}
                                            onClick={() => router.push(item.href)}
                                            className={`cursor-pointer gap-2 whitespace-nowrap ${
                                                isActiveItem(item.href) ? "bg-muted font-semibold" : ""
                                            }`}
                                        >
                                            <Icon className="h-4 w-4 text-muted-foreground" />
                                            {item.label}
                                        </DropdownMenuItem>
                                    );
                                })}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>

                {/* Right: Actions & Profile */}
                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    {userRole && (
                        <span className="hidden xl:inline-flex text-xs font-mono uppercase px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-semibold">
                            Role: {userRole}
                        </span>
                    )}

                    {/* Theme Toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="relative h-9 w-9 shrink-0 rounded-lg"
                    >
                        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Toggle theme</span>
                    </Button>

                    {/* User Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-9 shrink-0 px-2 sm:px-2.5 flex items-center gap-2 rounded-lg"
                            >
                                <div className="h-7 w-7 shrink-0 rounded-full bg-primary/20 text-primary font-semibold text-xs flex items-center justify-center border border-primary/30">
                                    {user?.name?.charAt(0).toUpperCase() || "U"}
                                </div>
                                <span className="hidden sm:inline-block font-medium text-sm truncate max-w-25">
                                    {user?.name || "Account"}
                                </span>
                                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
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
