"use client"

import { useEffect, useState } from "react"
import { resultsApi } from "@/lib/api"
import type { TopicAnalysis, SpeedAccuracy, ProgressPoint } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts"

export default function AnalyticsPage() {
  const [topicData, setTopicData] = useState<TopicAnalysis[]>([])
  const [speedData, setSpeedData] = useState<SpeedAccuracy[]>([])
  const [progressData, setProgressData] = useState<ProgressPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.allSettled([
      resultsApi.topicAnalysis(),
      resultsApi.speedAccuracy(),
      resultsApi.progressGraph(),
    ])
      .then(([topics, speed, progress]) => {
        if (topics.status === "fulfilled") setTopicData(Array.isArray(topics.value) ? topics.value : [])
        if (speed.status === "fulfilled") setSpeedData(Array.isArray(speed.value) ? speed.value : [])
        if (progress.status === "fulfilled") setProgressData(Array.isArray(progress.value) ? progress.value : [])
      })
      .catch(() => toast.error("Failed to load analytics"))
      .finally(() => setLoading(false))
  }, [])

  const chartStyle = {
    fontSize: 12,
    fill: "var(--color-muted-foreground)",
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h2>
        <p className="text-muted-foreground">
          Deep dive into your learning progress and performance
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-border/50">
              <CardHeader>
                <Skeleton className="h-5 w-40" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Topic-wise Analysis */}
          <Card className="border-border/50 md:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Topic-wise Accuracy</CardTitle>
              <CardDescription>Your accuracy breakdown by topic</CardDescription>
            </CardHeader>
            <CardContent>
              {topicData.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  No topic data available yet. Take some tests first.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topicData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="topic" tick={chartStyle} />
                    <YAxis tick={chartStyle} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        color: "var(--color-card-foreground)",
                      }}
                    />
                    <Bar
                      dataKey="accuracy"
                      fill="var(--color-chart-1)"
                      radius={[4, 4, 0, 0]}
                      name="Accuracy %"
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Speed vs Accuracy */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Speed vs Accuracy</CardTitle>
              <CardDescription>How speed impacts your accuracy</CardDescription>
            </CardHeader>
            <CardContent>
              {speedData.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Not enough data available.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis
                      dataKey="speed"
                      name="Speed (s/q)"
                      tick={chartStyle}
                      label={{ value: "Speed (s/q)", position: "insideBottom", offset: -5, style: chartStyle }}
                    />
                    <YAxis
                      dataKey="accuracy"
                      name="Accuracy %"
                      tick={chartStyle}
                      domain={[0, 100]}
                    />
                    <ZAxis range={[64, 64]} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        color: "var(--color-card-foreground)",
                      }}
                    />
                    <Scatter data={speedData} fill="var(--color-chart-2)" />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Progress Over Time */}
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-base">Progress Over Time</CardTitle>
              <CardDescription>Your score trend across tests</CardDescription>
            </CardHeader>
            <CardContent>
              {progressData.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground">
                  Not enough data available.
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" tick={chartStyle} />
                    <YAxis tick={chartStyle} />
                    <Tooltip
                      contentStyle={{
                        background: "var(--color-card)",
                        border: "1px solid var(--color-border)",
                        borderRadius: "8px",
                        color: "var(--color-card-foreground)",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="var(--color-chart-1)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-chart-1)", r: 4 }}
                      name="Score"
                    />
                    <Line
                      type="monotone"
                      dataKey="accuracy"
                      stroke="var(--color-chart-2)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-chart-2)", r: 4 }}
                      name="Accuracy %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
