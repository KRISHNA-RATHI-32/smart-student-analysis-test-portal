"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FilePlus, MessageSquarePlus, Users, ArrowRight } from "lucide-react"

export function TeacherOverview() {
  const cards = [
    {
      title: "Create Test",
      description: "Design and publish new exams for students",
      icon: FilePlus,
      href: "/dashboard/create-test",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Add Questions",
      description: "Add questions to your existing tests",
      icon: MessageSquarePlus,
      href: "/dashboard/add-question",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "View Submissions",
      description: "Review student performance and results",
      icon: Users,
      href: "/dashboard/submissions",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Teacher Dashboard</h2>
        <p className="text-muted-foreground">
          Manage your tests, add questions, and track student performance.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.title} className="group border-border/50 transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center gap-4 pb-2">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.color}`} />
              </div>
              <CardTitle className="text-base">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">{card.description}</p>
              <Button variant="ghost" className="w-fit p-0 text-primary" asChild>
                <Link href={card.href}>
                  Go to {card.title.toLowerCase()}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
