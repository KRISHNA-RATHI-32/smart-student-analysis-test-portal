"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { testsApi } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

export default function CreateTestPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    title: "",
    duration: "",
    totalMarks: "",
    category: "",
  })
  const [thumbnail, setThumbnail] = useState<File | null>(null)

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData()
    formData.append("title", form.title)
    formData.append("duration", form.duration)
    formData.append("totalMarks", form.totalMarks)
    formData.append("category", form.category)
    if (thumbnail) formData.append("thumbnail", thumbnail)

    try {
      const result = await testsApi.create(formData)
      toast.success("Test created successfully!")
      router.push(`/dashboard/add-question?testId=${result._id || result.test?._id || ""}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create test")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Create Test</h2>
        <p className="text-muted-foreground">Design and publish a new exam for students</p>
      </div>

      <Card className="border-border/50 max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Test Details</CardTitle>
          <CardDescription>Fill in the information for your new test</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g. Mathematics Mid-term Exam"
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  placeholder="60"
                  value={form.duration}
                  onChange={(e) => updateField("duration", e.target.value)}
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  type="number"
                  min="1"
                  placeholder="100"
                  value={form.totalMarks}
                  onChange={(e) => updateField("totalMarks", e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                placeholder="e.g. Mathematics, Science, History"
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="thumbnail">Thumbnail (optional)</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnail(e.target.files?.[0] || null)}
                className="cursor-pointer"
              />
            </div>

            <Button type="submit" className="w-full md:w-auto" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Create Test
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
