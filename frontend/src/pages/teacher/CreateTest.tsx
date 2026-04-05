import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import RoleLayout from "@/components/layouts/RoleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, CheckCircle2, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { testApi } from "@/lib/api";

interface QuestionForm {
  questionText: string;
  questionType: "mcq" | "multi-select" | "one-word";
  options: string[];
  correctAnswer: string[];
  marks: number;
  negativeMarks: number;
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  questionImage?: File;
}

const emptyQuestion = (): QuestionForm => ({
  questionText: "",
  questionType: "mcq",
  options: ["", "", "", ""],
  correctAnswer: [],
  marks: 4,
  negativeMarks: 1,
  topic: "",
  difficulty: "medium",
});

type Step = "details" | "questions" | "done";

const CreateTest = () => {
  const navigate = useNavigate();
  const thumbnailRef = useRef<HTMLInputElement>(null);

  // Step state
  const [step, setStep] = useState<Step>("details");

  // Step 1: Test details
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [totalMarks, setTotalMarks] = useState("100");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [creatingTest, setCreatingTest] = useState(false);
  const [createdTestId, setCreatedTestId] = useState<string | null>(null);

  // Step 2: Questions
  const [sectionName, setSectionName] = useState("Default");
  const [questions, setQuestions] = useState<QuestionForm[]>([emptyQuestion()]);
  const [addingQuestion, setAddingQuestion] = useState<number | null>(null); // index being added
  const [addedCount, setAddedCount] = useState(0);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // Step 1 submit: Create test shell
  const handleCreateTest = async () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (!thumbnail) { toast.error("Thumbnail image is required"); return; }
    if (!duration || Number(duration) < 1) { toast.error("Valid duration is required"); return; }
    if (!totalMarks || Number(totalMarks) < 1) { toast.error("Valid total marks is required"); return; }

    setCreatingTest(true);
    try {
      const res = await testApi.createTest({
        title,
        description: description || undefined,
        duration: Number(duration),
        totalMarks: Number(totalMarks),
        category: category || undefined,
        thumbnail,
      });
      setCreatedTestId(res.data._id);
      setStep("questions");
      toast.success("Test created! Now add questions.");
    } catch (err: any) {
      toast.error(err.message || "Failed to create test");
    } finally {
      setCreatingTest(false);
    }
  };

  // Step 2: Add individual questions
  const updateQuestion = (idx: number, updates: Partial<QuestionForm>) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? { ...q, ...updates } : q)));
  };

  const updateOption = (qIdx: number, oIdx: number, text: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        const opts = [...q.options];
        opts[oIdx] = text;
        return { ...q, options: opts };
      })
    );
  };

  const toggleCorrectAnswer = (qIdx: number, value: string, isMulti: boolean) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIdx) return q;
        if (isMulti) {
          const current = q.correctAnswer;
          const updated = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];
          return { ...q, correctAnswer: updated };
        }
        return { ...q, correctAnswer: [value] };
      })
    );
  };

  const removeQuestion = (idx: number) => {
    if (questions.length <= 1) return;
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleAddQuestion = async (idx: number) => {
    const q = questions[idx];
    if (!q.questionText.trim()) { toast.error(`Question ${idx + 1} needs text`); return; }
    if (!createdTestId) { toast.error("Test not created yet"); return; }

    if (q.questionType !== "one-word") {
      if (q.options.some((o) => !o.trim())) { toast.error(`All options required for Q${idx + 1}`); return; }
      if (q.correctAnswer.length === 0) { toast.error(`Select correct answer for Q${idx + 1}`); return; }
    } else {
      if (q.correctAnswer.length === 0 || !q.correctAnswer[0].trim()) {
        toast.error(`Correct answer required for Q${idx + 1}`);
        return;
      }
    }

    setAddingQuestion(idx);
    try {
      await testApi.addQuestionToSection(createdTestId, sectionName, {
        questionText: q.questionText,
        questionType: q.questionType,
        options: q.questionType !== "one-word" ? q.options : undefined,
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        topic: q.topic || undefined,
        difficulty: q.difficulty,
        questionImage: q.questionImage,
      });
      setAddedCount((c) => c + 1);
      toast.success(`Question ${idx + 1} added successfully`);
    } catch (err: any) {
      toast.error(err.message || `Failed to add question ${idx + 1}`);
    } finally {
      setAddingQuestion(null);
    }
  };

  const handleAddAllQuestions = async () => {
    for (let i = 0; i < questions.length; i++) {
      await handleAddQuestion(i);
    }
  };

  const handleFinish = () => {
    setStep("done");
    toast.success("Test setup complete!");
  };

  // ─── STEP 1: Test Details ───
  if (step === "details") {
    return (
      <RoleLayout>
        <div className="space-y-6 max-w-2xl">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create New Test</h1>
            <p className="text-muted-foreground mt-1">Step 1: Set up test details</p>
          </div>

          <Card className="glass-elevated">
            <CardHeader><CardTitle className="text-lg">Test Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Title *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Data Structures Midterm" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional test description" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Duration (min) *</Label>
                  <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} min="1" />
                </div>
                <div className="space-y-2">
                  <Label>Total Marks *</Label>
                  <Input type="number" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} min="1" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Math, Science" />
                </div>
              </div>

              {/* Thumbnail Upload */}
              <div className="space-y-2">
                <Label>Thumbnail Image *</Label>
                <div
                  className="border-2 border-dashed border-border rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => thumbnailRef.current?.click()}
                >
                  {thumbnailPreview ? (
                    <img src={thumbnailPreview} alt="Thumbnail preview" className="mx-auto h-32 rounded-lg object-cover" />
                  ) : (
                    <div className="space-y-2">
                      <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">Click to upload thumbnail image</p>
                    </div>
                  )}
                  <input
                    ref={thumbnailRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleThumbnailChange}
                  />
                </div>
              </div>

              <Button onClick={handleCreateTest} disabled={creatingTest} className="w-full">
                {creatingTest ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating Test...</> : "Create Test & Continue →"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </RoleLayout>
    );
  }

  // ─── STEP 2: Add Questions ───
  if (step === "questions") {
    return (
      <RoleLayout>
        <div className="space-y-6 max-w-4xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Add Questions</h1>
              <p className="text-muted-foreground mt-1">
                Step 2: Add questions to "{title}" · {addedCount} added
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Section Name</Label>
                <Input
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  placeholder="Section name"
                  className="w-40 h-8 text-sm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((q, qIdx) => (
              <Card key={qIdx} className="glass-elevated">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">Question {qIdx + 1}</CardTitle>
                    <Badge variant="outline" className="capitalize">{q.difficulty}</Badge>
                    <Badge variant="secondary" className="capitalize">{q.questionType.replace("-", " ")}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAddQuestion(qIdx)}
                      disabled={addingQuestion === qIdx}
                    >
                      {addingQuestion === qIdx ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                      Add to Test
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => removeQuestion(qIdx)} disabled={questions.length <= 1}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-1 space-y-2">
                      <Label>Type</Label>
                      <Select value={q.questionType} onValueChange={(v) => updateQuestion(qIdx, { questionType: v as QuestionForm["questionType"], correctAnswer: [] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mcq">MCQ (Single)</SelectItem>
                          <SelectItem value="multi-select">Multi-Select</SelectItem>
                          <SelectItem value="one-word">One Word</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Marks</Label>
                      <Input type="number" value={q.marks} onChange={(e) => updateQuestion(qIdx, { marks: Number(e.target.value) })} min="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Negative</Label>
                      <Input type="number" value={q.negativeMarks} onChange={(e) => updateQuestion(qIdx, { negativeMarks: Number(e.target.value) })} min="0" />
                    </div>
                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select value={q.difficulty} onValueChange={(v) => updateQuestion(qIdx, { difficulty: v as QuestionForm["difficulty"] })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-3 space-y-2">
                      <Label>Question Text *</Label>
                      <Textarea value={q.questionText} onChange={(e) => updateQuestion(qIdx, { questionText: e.target.value })} placeholder="Enter your question..." />
                    </div>
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <Input value={q.topic} onChange={(e) => updateQuestion(qIdx, { topic: e.target.value })} placeholder="e.g. Arrays" />
                    </div>
                  </div>

                  {/* Options for MCQ / Multi-select */}
                  {q.questionType !== "one-word" ? (
                    <div className="space-y-3">
                      <Label>Options (click to mark correct)</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt, oIdx) => {
                          const optLabel = String.fromCharCode(65 + oIdx);
                          const isCorrect = q.correctAnswer.includes(opt) && opt.trim() !== "";
                          return (
                            <div
                              key={oIdx}
                              onClick={() => {
                                if (opt.trim()) toggleCorrectAnswer(qIdx, opt, q.questionType === "multi-select");
                              }}
                              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                                isCorrect ? "border-accent bg-accent/10" : "border-border hover:border-muted-foreground/30"
                              }`}
                            >
                              <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                isCorrect ? "border-accent bg-accent" : "border-muted-foreground/30"
                              }`}>
                                {isCorrect && <div className="h-2 w-2 rounded-full bg-accent-foreground" />}
                              </div>
                              <Input
                                value={opt}
                                onChange={(e) => { e.stopPropagation(); updateOption(qIdx, oIdx, e.target.value); }}
                                onClick={(e) => e.stopPropagation()}
                                placeholder={`Option ${optLabel}`}
                                className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>Correct Answer *</Label>
                      <Input
                        value={q.correctAnswer[0] || ""}
                        onChange={(e) => updateQuestion(qIdx, { correctAnswer: [e.target.value] })}
                        placeholder="Type the correct answer"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={() => setQuestions([...questions, emptyQuestion()])}>
              <Plus className="h-4 w-4 mr-2" />Add Another Question
            </Button>
            <Button variant="secondary" onClick={handleAddAllQuestions} className="sm:ml-auto">
              <Upload className="h-4 w-4 mr-2" />Add All to Test
            </Button>
            <Button onClick={handleFinish}>
              <CheckCircle2 className="h-4 w-4 mr-2" />Finish
            </Button>
          </div>
        </div>
      </RoleLayout>
    );
  }

  // ─── STEP 3: Done ───
  return (
    <RoleLayout>
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
          <CheckCircle2 className="h-10 w-10 text-accent" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Test Created Successfully!</h1>
          <p className="text-muted-foreground">
            "{title}" with {addedCount} questions has been created.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {
            setStep("details");
            setTitle(""); setDescription(""); setDuration("60"); setTotalMarks("100"); setCategory("");
            setThumbnail(null); setThumbnailPreview(null); setCreatedTestId(null);
            setQuestions([emptyQuestion()]); setAddedCount(0); setSectionName("Default");
          }}>
            Create Another Test
          </Button>
          <Button onClick={() => navigate("/teacher/dashboard")}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    </RoleLayout>
  );
};

export default CreateTest;
