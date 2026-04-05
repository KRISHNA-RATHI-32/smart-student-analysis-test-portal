import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  ClipboardList, BarChart3, LogOut, Menu, X, ChevronRight,
  Layers, Trophy, Brain, KeyRound
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navConfig: Record<string, NavItem[]> = {
  admin: [
    { label: "Dashboard", path: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Users", path: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { label: "Batches", path: "/admin/batches", icon: <Layers className="h-5 w-5" /> },
  ],
  teacher: [
    { label: "Dashboard", path: "/teacher/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Create Test", path: "/teacher/create-test", icon: <ClipboardList className="h-5 w-5" /> },
    { label: "Results", path: "/teacher/results", icon: <BarChart3 className="h-5 w-5" /> },
  ],
  student: [
    { label: "Dashboard", path: "/student/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "My Results", path: "/student/results", icon: <BarChart3 className="h-5 w-5" /> },
    { label: "Analytics", path: "/student/analytics", icon: <Brain className="h-5 w-5" /> },
    { label: "Leaderboard", path: "/student/leaderboard", icon: <Trophy className="h-5 w-5" /> },
  ],
};

const RoleLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;
  const items = navConfig[user.role] || [];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col gradient-hero transition-transform duration-300 lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6 border-b border-sidebar-border">
          <GraduationCap className="h-7 w-7 text-sidebar-primary" />
          <span className="text-lg font-bold text-sidebar-foreground">ExamPortal</span>
          <button className="ml-auto lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {items.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                {item.icon}
                {item.label}
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            );
          })}
        </nav>

        {/* User & Actions */}
        <div className="border-t border-sidebar-border p-4 space-y-1">
          <div className="mb-3 px-1">
            <p className="text-sm font-medium text-sidebar-foreground">{user.fullName}</p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</p>
          </div>
          <Link
            to="/change-password"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
              location.pathname === "/change-password"
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
            )}
          >
            <KeyRound className="h-5 w-5" />
            Change Password
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-all"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-card/80 backdrop-blur-md px-6">
          <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5 text-foreground" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-foreground">{user.fullName}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default RoleLayout;
