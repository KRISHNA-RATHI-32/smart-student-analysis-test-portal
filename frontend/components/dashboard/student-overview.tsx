"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ClipboardList, Trophy, BarChart3, ArrowRight } from "lucide-react"

export function StudentOverview() {
  const cards = [
    {
      title: "Available Tests",
      description: "Browse and attempt available exams",
      icon: ClipboardList,
      href: "/dashboard/tests",
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "My Results",
      description: "View your past test scores and performance",
      icon: Trophy,
      href: "/dashboard/results",
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Analytics",
      description: "Deep dive into your learning progress",
      icon: BarChart3,
      href: "/dashboard/analytics",
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h2>
        <p className="text-muted-foreground">
          Here is an overview of your exam portal. Select a section to get started.
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
