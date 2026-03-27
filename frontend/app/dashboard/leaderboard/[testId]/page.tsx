"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { resultsApi } from "@/lib/api"
import type { LeaderboardEntry } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Medal, ChevronLeft, ChevronRight } from "lucide-react"
import { toast } from "sonner"

export default function LeaderboardPage() {
  const params = useParams()
  const testId = params.testId as string
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    resultsApi
      .leaderboard(testId, page, 10)
      .then((data) => {
        setEntries(Array.isArray(data) ? data : data.data || [])
        if (!Array.isArray(data) && data.totalPages) {
          setTotalPages(data.totalPages)
        }
      })
      .catch((err) => toast.error(err.message || "Failed to load leaderboard"))
      .finally(() => setLoading(false))
  }, [testId, page])

  function getRankBadge(rank: number) {
    if (rank === 1) return <Medal className="h-5 w-5 text-chart-3" />
    if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />
    if (rank === 3) return <Medal className="h-5 w-5 text-chart-5" />
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Leaderboard</h2>
        <p className="text-muted-foreground">See how you rank against other students</p>
      </div>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No submissions yet for this test.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Accuracy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entries.map((entry) => (
                      <TableRow key={entry.rank}>
                        <TableCell className="text-center">
                          {getRankBadge(entry.rank)}
                        </TableCell>
                        <TableCell className="font-medium">{entry.studentName}</TableCell>
                        <TableCell className="text-right">{entry.score}</TableCell>
                        <TableCell className="text-right">{entry.accuracy}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
