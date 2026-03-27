"use client"

import { useAuth } from "@/lib/auth-context"
import { StudentOverview } from "@/components/dashboard/student-overview"
import { TeacherOverview } from "@/components/dashboard/teacher-overview"

export default function DashboardPage() {
  const { user } = useAuth()

  if (user?.role === "teacher") {
    return <TeacherOverview />
  }

  return <StudentOverview />
}
