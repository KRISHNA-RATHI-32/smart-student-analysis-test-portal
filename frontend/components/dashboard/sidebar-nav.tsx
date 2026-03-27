"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import {
  BookOpen,
  LayoutDashboard,
  ClipboardList,
  Trophy,
  BarChart3,
  FilePlus,
  MessageSquarePlus,
  Users,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/tests", label: "Tests", icon: ClipboardList },
  { href: "/dashboard/results", label: "My Results", icon: Trophy },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
]

const teacherLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/create-test", label: "Create Test", icon: FilePlus },
  { href: "/dashboard/add-question", label: "Add Question", icon: MessageSquarePlus },
  { href: "/dashboard/submissions", label: "Submissions", icon: Users },
]

interface SidebarNavProps {
  open: boolean
  onClose: () => void
}

export function SidebarNav({ open, onClose }: SidebarNavProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const links = user?.role === "teacher" ? teacherLinks : studentLinks

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-300 md:static md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-6">
          <Link href="/dashboard" className="flex items-center gap-2 text-sidebar-primary">
            <BookOpen className="h-6 w-6" />
            <span className="text-lg font-bold tracking-tight">ExamIQ</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-sidebar-foreground"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4">
          <div className="flex flex-col gap-1">
            {links.map((link) => {
              const isActive =
                link.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground text-sm font-medium">
              {user?.fullName?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {user?.fullName || "User"}
              </p>
              <p className="truncate text-xs text-sidebar-foreground/60 capitalize">
                {user?.role || "student"}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
