"use client"

import { useEffect, useState } from "react"
import { testsApi, resultsApi } from "@/lib/api"
import type { Test, Submission } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Clock, Users } from "lucide-react"
import { toast } from "sonner"

export default function SubmissionsPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [selectedTest, setSelectedTest] = useState("")
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(false)
  const [testsLoading, setTestsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    testsApi
      .getAll()
      .then((data) => setTests(Array.isArray(data) ? data : []))
      .catch(() => toast.error("Failed to load tests"))
      .finally(() => setTestsLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedTest) return
    setLoading(true)
    resultsApi
      .teacherSubmissions(selectedTest, page, 10)
      .then((data) => {
        setSubmissions(Array.isArray(data) ? data : data.data || [])
        if (!Array.isArray(data) && data.totalPages) {
          setTotalPages(data.totalPages)
        }
      })
      .catch((err) => toast.error(err.message || "Failed to load submissions"))
      .finally(() => setLoading(false))
  }, [selectedTest, page])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">View Submissions</h2>
        <p className="text-muted-foreground">Review student performance and results</p>
      </div>

      <div className="flex flex-col gap-4 max-w-sm">
        <label className="text-sm font-medium text-foreground">Select Test</label>
        {testsLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : (
          <Select
            value={selectedTest}
            onValueChange={(v) => {
              setSelectedTest(v)
              setPage(1)
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a test to view submissions" />
            </SelectTrigger>
            <SelectContent>
              {tests.map((test) => (
                <SelectItem key={test._id} value={test._id}>
                  {test.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedTest && (
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                <Users className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <CardTitle className="text-base">Student Submissions</CardTitle>
                <CardDescription>
                  {tests.find((t) => t._id === selectedTest)?.title || "Selected Test"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex flex-col gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : submissions.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No submissions for this test yet.
              </p>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead className="text-right">Score</TableHead>
                        <TableHead className="text-right">Accuracy</TableHead>
                        <TableHead className="text-right">Time Taken</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {submissions.map((sub, i) => (
                        <TableRow key={i}>
                          <TableCell className="font-medium">{sub.studentName}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant="secondary">{sub.score}</Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span
                              className={
                                sub.accuracy >= 70
                                  ? "text-success"
                                  : sub.accuracy >= 40
                                    ? "text-warning"
                                    : "text-destructive"
                              }
                            >
                              {sub.accuracy}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="flex items-center justify-end gap-1 text-muted-foreground">
                              <Clock className="h-3.5 w-3.5" />
                              {Math.round(sub.timeTaken / 60)}m
                            </span>
                          </TableCell>
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
      )}
    </div>
  )
}
