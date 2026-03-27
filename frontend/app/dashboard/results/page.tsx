"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { resultsApi } from "@/lib/api"
import type { Result, Test } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Trophy, Target, Clock, BarChart3 } from "lucide-react"
import { toast } from "sonner"

export default function ResultsPage() {
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resultsApi
      .myResults()
      .then((data) => setResults(Array.isArray(data) ? data : []))
      .catch((err) => toast.error(err.message || "Failed to load results"))
      .finally(() => setLoading(false))
  }, [])

  const totalTests = results.length
  const avgScore =
    totalTests > 0
      ? Math.round(results.reduce((sum, r) => sum + r.score, 0) / totalTests)
      : 0
  const avgAccuracy =
    totalTests > 0
      ? Math.round(results.reduce((sum, r) => sum + r.accuracy, 0) / totalTests)
      : 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">My Results</h2>
        <p className="text-muted-foreground">View your past test scores and performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-1/10">
              <Trophy className="h-6 w-6 text-chart-1" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tests Taken</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? <Skeleton className="h-7 w-12" /> : totalTests}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
              <BarChart3 className="h-6 w-6 text-chart-2" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Score</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? <Skeleton className="h-7 w-12" /> : avgScore}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-3/10">
              <Target className="h-6 w-6 text-chart-3" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Accuracy</p>
              <p className="text-2xl font-bold text-foreground">
                {loading ? <Skeleton className="h-7 w-12" /> : `${avgAccuracy}%`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results Table */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Test History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="mb-4 text-muted-foreground">You haven't taken any tests yet.</p>
              <Button asChild>
                <Link href="/dashboard/tests">Browse Tests</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Accuracy</TableHead>
                    <TableHead className="text-right">Time</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => {
                    const testName =
                      typeof result.testId === "object"
                        ? (result.testId as Test).title
                        : "Test"
                    const testIdStr =
                      typeof result.testId === "object"
                        ? (result.testId as Test)._id
                        : result.testId
                    return (
                      <TableRow key={result._id}>
                        <TableCell className="font-medium">{testName}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{result.score}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              result.accuracy >= 70
                                ? "text-success"
                                : result.accuracy >= 40
                                  ? "text-warning"
                                  : "text-destructive"
                            }
                          >
                            {result.accuracy}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="flex items-center justify-end gap-1 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            {Math.round(result.timeTaken / 60)}m
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/dashboard/leaderboard/${testIdStr}`}>
                              Leaderboard
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
