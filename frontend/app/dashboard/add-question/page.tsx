"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { testsApi } from "@/lib/api"
import type { Test } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"

function AddQuestionForm() {
  const searchParams = useSearchParams()
  const defaultTestId = searchParams.get("testId") || ""

  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    testId: defaultTestId,
    sectionName: "default",
    questionText: "",
    questionType: "single",
    marks: "1",
    negativeMarks: "0",
    topic: "",
  })
  const [options, setOptions] = useState(["", "", "", ""])
  const [correctAnswer, setCorrectAnswer] = useState<string[]>([])
  const [image, setImage] = useState<File | null>(null)

  useEffect(() => {
    testsApi
      .getAll()
      .then((data) => setTests(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function updateOption(index: number, value: string) {
    const updated = [...options]
    updated[index] = value
    setOptions(updated)
  }

  function addOption() {
    setOptions([...options, ""])
  }

  function removeOption(index: number) {
    if (options.length <= 2) return
    const updated = options.filter((_, i) => i !== index)
    setOptions(updated)
    setCorrectAnswer(correctAnswer.filter((a) => a !== options[index]))
  }

  function toggleCorrectAnswer(option: string) {
    if (form.questionType === "single") {
      setCorrectAnswer([option])
    } else {
      setCorrectAnswer((prev) =>
        prev.includes(option) ? prev.filter((a) => a !== option) : [...prev, option]
      )
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!form.testId) {
      toast.error("Please select a test")
      return
    }
    if (correctAnswer.length === 0) {
      toast.error("Please select at least one correct answer")
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append("questionText", form.questionText)
    formData.append("questionType", form.questionType)
    formData.append("marks", form.marks)
    formData.append("negativeMarks", form.negativeMarks)
    formData.append("topic", form.topic)
    options.filter(Boolean).forEach((opt) => formData.append("options", opt))
    correctAnswer.forEach((ans) => formData.append("correctAnswer", ans))
    if (image) formData.append("image", image)

    try {
      await testsApi.addQuestion(form.testId, form.sectionName, formData)
      toast.success("Question added successfully!")
      setForm((prev) => ({
        ...prev,
        questionText: "",
        marks: "1",
        negativeMarks: "0",
        topic: "",
      }))
      setOptions(["", "", "", ""])
      setCorrectAnswer([])
      setImage(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add question")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Add Question</h2>
        <p className="text-muted-foreground">Add questions to an existing test</p>
      </div>

      <Card className="border-border/50 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Question Details</CardTitle>
          <CardDescription>Fill in the question information</CardDescription>
        </CardHeader>
        <CardContent>  
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Test</Label>
                <Select value={form.testId} onValueChange={(v) => updateField("testId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a test" />
                  </SelectTrigger>
                  <SelectContent>
                    {tests.map((test) => (
                      <SelectItem key={test._id} value={test._id}>
                        {test.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="sectionName">Section Name</Label>
                <Input
                  id="sectionName"
                  placeholder="e.g. Section A"
                  value={form.sectionName}
                  onChange={(e) => updateField("sectionName", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="questionText">Question</Label>
              <Textarea
                id="questionText"
                placeholder="Enter the question text..."
                rows={3}
                value={form.questionText}
                onChange={(e) => updateField("questionText", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col gap-2">
                <Label>Type</Label>
                <Select
                  value={form.questionType}
                  onValueChange={(v) => {
                    updateField("questionType", v)
                    setCorrectAnswer([])
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single">Single Choice</SelectItem>
                    <SelectItem value="multiple">Multiple Choice</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="marks">Marks</Label>
                <Input
                  id="marks"
                  type="number"
                  min="0"
                  value={form.marks}
                  onChange={(e) => updateField("marks", e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="negativeMarks">Negative Marks</Label>
                <Input
                  id="negativeMarks"
                  type="number"
                  min="0"
                  value={form.negativeMarks}
                  onChange={(e) => updateField("negativeMarks", e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="topic">Topic</Label>
              <Input
                id="topic"
                placeholder="e.g. Algebra, Thermodynamics"
                value={form.topic}
                onChange={(e) => updateField("topic", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label>Options (click to mark as correct)</Label>
              <div className="flex flex-col gap-2">
                {options.map((opt, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => opt && toggleCorrectAnswer(opt)}
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-medium transition-colors ${
                        correctAnswer.includes(opt) && opt
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </button>
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + i)}`}
                      value={opt}
                      onChange={(e) => updateOption(i, e.target.value)}
                      required
                    />
                    {options.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="shrink-0"
                        onClick={() => removeOption(i)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={addOption}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add Option
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="image">Image (optional)</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>

            <Button type="submit" className="w-full md:w-auto" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add Question
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AddQuestionPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <AddQuestionForm />
    </Suspense>
  )
}
