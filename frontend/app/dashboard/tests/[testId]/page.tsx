"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { testsApi, resultsApi } from "@/lib/api"
import type { Question, AnswerPayload } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Clock, ChevronLeft, ChevronRight, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function TestAttemptPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.testId as string

  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Map<string, string[]>>(new Map())
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const questionStartTime = useRef(Date.now())
  const timeSpentMap = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    testsApi
      .getQuestions(testId)
      .then((data) => {
        const q = Array.isArray(data) ? data : []
        setQuestions(q)
        setTimeLeft(q.length * 120) // 2 min per question default
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load questions")
      })
      .finally(() => setLoading(false))
  }, [testId])

  useEffect(() => {
    if (timeLeft <= 0 || questions.length === 0) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSubmit()
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questions.length])

  const recordTimeSpent = useCallback(() => {
    if (questions.length === 0) return
    const qId = questions[currentIndex]._id
    const spent = (Date.now() - questionStartTime.current) / 1000
    timeSpentMap.current.set(qId, (timeSpentMap.current.get(qId) || 0) + spent)
    questionStartTime.current = Date.now()
  }, [currentIndex, questions])

  function selectOption(option: string) {
    const qId = questions[currentIndex]._id
    const current = answers.get(qId) || []
    const type = questions[currentIndex].questionType

    if (type === "multiple") {
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option]
      setAnswers(new Map(answers.set(qId, updated)))
    } else {
      setAnswers(new Map(answers.set(qId, [option])))
    }
  }

  function goToQuestion(index: number) {
    recordTimeSpent()
    setCurrentIndex(index)
  }

  async function handleSubmit() {
    recordTimeSpent()
    setSubmitting(true)
    setShowConfirm(false)

    const payload: AnswerPayload[] = questions.map((q) => ({
      questionId: q._id,
      selectedOption: answers.get(q._id) || [],
      timeSpent: Math.round(timeSpentMap.current.get(q._id) || 0),
    }))

    try {
      await resultsApi.submit(testId, { answers: payload })
      toast.success("Test submitted successfully!")
      router.push("/dashboard/results")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Submission failed")
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground">No questions found for this test.</p>
          <Button className="mt-4" onClick={() => router.push("/dashboard/tests")}>
            Back to Tests
          </Button>
        </CardContent>
      </Card>
    )
  }

  const current = questions[currentIndex]
  const selectedOptions = answers.get(current._id) || []
  const answeredCount = Array.from(answers.values()).filter((a) => a.length > 0).length
  const progressPercent = (answeredCount / questions.length) * 100

  return (
    <div className="flex flex-col gap-4">
      {/* Timer and Progress */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Badge
            variant={timeLeft < 60 ? "destructive" : "secondary"}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm"
          >
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <span className="text-sm text-muted-foreground">
          {answeredCount}/{questions.length} answered
        </span>
      </div>

      <Progress value={progressPercent} className="h-2" />

      {/* Question Card */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-relaxed">
              {current.questionText}
            </CardTitle>
            <div className="flex shrink-0 gap-2">
              <Badge variant="outline">{current.marks} marks</Badge>
              {current.negativeMarks > 0 && (
                <Badge variant="destructive" className="shrink-0">
                  -{current.negativeMarks}
                </Badge>
              )}
            </div>
          </div>
          {current.topic && (
            <Badge variant="secondary" className="w-fit mt-2">
              {current.topic}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {current.image && (
            <img
              src={current.image}
              alt="Question illustration"
              className="mb-4 max-h-48 rounded-lg border border-border object-contain"
            />
          )}
          <div className="flex flex-col gap-2">
            {current.options.map((option, i) => {
              const isSelected = selectedOptions.includes(option)
              return (
                <button
                  key={i}
                  onClick={() => selectOption(option)}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-all ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-card-foreground hover:border-primary/50 hover:bg-primary/5"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium ${
                      isSelected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30 text-muted-foreground"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}
                  </span>
                  {option}
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Question Navigator */}
      <div className="flex flex-wrap gap-2">
        {questions.map((q, i) => {
          const isAnswered = (answers.get(q._id) || []).length > 0
          const isCurrent = i === currentIndex
          return (
            <button
              key={q._id}
              onClick={() => goToQuestion(i)}
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                isCurrent
                  ? "bg-primary text-primary-foreground shadow"
                  : isAnswered
                    ? "bg-success/20 text-success border border-success/30"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {i + 1}
            </button>
          )
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => goToQuestion(currentIndex - 1)}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>
        <div className="flex gap-2">
          {currentIndex < questions.length - 1 ? (
            <Button onClick={() => goToQuestion(currentIndex + 1)}>
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={() => setShowConfirm(true)} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Send className="mr-2 h-4 w-4" />
              Submit Test
            </Button>
          )}
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {answeredCount} out of {questions.length} questions.
              {answeredCount < questions.length &&
                ` ${questions.length - answeredCount} questions are unanswered.`}{" "}
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
