import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, ChevronLeft, ChevronRight, Flag, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { testApi, resultApi, type TestQuestionsPayload } from "@/lib/api";

interface FlatQuestion {
  _id: string;
  questionText: string;
  questionType: "mcq" | "multi-select" | "one-word";
  options: string[];
  marks: number;
  negativeMarks: number;
  topic?: string;
  sectionName: string;
}

interface Answer {
  questionId: string;
  options: string[];   // selected option texts (for mcq/multi) or typed answer
  timeSpent: number;   // seconds spent on this question
}

interface SubmitSummary {
  totalQuestions: number;
  correct: number;
  incorrect: number;
  accuracy: string;
  score: number;
  totalMarks: number;
}

const TestEnvironment = () => {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState(true);
  const [testData, setTestData] = useState<TestQuestionsPayload | null>(null);
  const [questions, setQuestions] = useState<FlatQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [summary, setSummary] = useState<SubmitSummary | null>(null);

  // Per-question time tracking
  const questionStartTime = useRef(Date.now());
  const timeSpentMap = useRef<Record<string, number>>({});

  // Initialize test
  useEffect(() => {
    if (!testId) return;
    const initTest = async () => {
      try {
        // Check if already completed
        const status = await resultApi.getAttemptStatus(testId);
        if (status.data.status === "completed") {
          toast.info("You've already completed this test");
          navigate("/student/dashboard");
          return;
        }

        // Start test (or resume if already started)
        await resultApi.startTest(testId);

        // Fetch questions
        const questionsRes = await testApi.getTestQuestions(testId);
        const data = questionsRes.data;
        setTestData(data);

        // Flatten sections into individual questions
        const flat: FlatQuestion[] = [];
        data.sections.forEach((section) => {
          section.questions.forEach((q) => {
            flat.push({
              ...q,
              sectionName: section.sectionName,
            });
          });
        });
        setQuestions(flat);
        setTimeLeft(data.duration * 60);

        // If resuming a started test, compute remaining time
        if (status.data.status === "started" && status.data.startTime) {
          const elapsed = Math.floor((Date.now() - new Date(status.data.startTime).getTime()) / 1000);
          const remaining = Math.max(0, data.duration * 60 - elapsed);
          setTimeLeft(remaining);
          if (remaining <= 0) {
            toast.warning("Time expired! Auto-submitting...");
            // Will trigger auto-submit in timer effect
          }
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load test");
        navigate("/student/dashboard");
      } finally {
        setLoading(false);
      }
    };
    initTest();
  }, [testId, navigate]);

  // Record time when switching questions
  const recordTimeForCurrentQuestion = useCallback(() => {
    if (questions.length === 0) return;
    const qId = questions[currentQ]._id;
    const elapsed = (Date.now() - questionStartTime.current) / 1000;
    timeSpentMap.current[qId] = (timeSpentMap.current[qId] || 0) + elapsed;
    questionStartTime.current = Date.now();
  }, [currentQ, questions]);

  // Countdown timer
  useEffect(() => {
    if (loading || submitted || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [loading, submitted]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const question = questions[currentQ];

  const setAnswer = (questionId: string, options: string[]) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        options,
        timeSpent: 0, // will be populated on submit
      },
    }));
  };

  const handleMcqSelect = (optionText: string) => {
    setAnswer(question._id, [optionText]);
  };

  const handleMultiSelect = (optionText: string) => {
    const current = answers[question._id]?.options || [];
    const updated = current.includes(optionText)
      ? current.filter((v) => v !== optionText)
      : [...current, optionText];
    setAnswer(question._id, updated);
  };

  const handleTextInput = (text: string) => {
    setAnswer(question._id, [text]);
  };

  const handleNavigate = (newIdx: number) => {
    recordTimeForCurrentQuestion();
    setCurrentQ(newIdx);
    questionStartTime.current = Date.now();
  };

  const toggleFlag = () => {
    setFlagged((prev) => {
      const next = new Set(prev);
      if (next.has(question._id)) next.delete(question._id);
      else next.add(question._id);
      return next;
    });
  };

  const answeredCount = Object.keys(answers).filter((k) => {
    const a = answers[k];
    return a.options.length > 0 && a.options.some((o) => o.trim() !== "");
  }).length;

  const handleAutoSubmit = useCallback(() => {
    toast.warning("Time's up! Auto-submitting your test.");
    doSubmit();
  }, []);

  const doSubmit = async () => {
    if (!testId || submitted) return;
    setSubmitting(true);

    // Record time for current question
    recordTimeForCurrentQuestion();

    // Build answers array with timeSpent
    const submissionAnswers = questions.map((q) => {
      const ans = answers[q._id];
      return {
        questionId: q._id,
        options: ans?.options || [],
        timeSpent: Math.round(timeSpentMap.current[q._id] || 0),
      };
    }).filter((a) => a.options.length > 0 && a.options.some((o) => o.trim() !== ""));

    const totalTimeTaken = Object.values(timeSpentMap.current).reduce((s, v) => s + v, 0);

    try {
      const res = await resultApi.submitTest(testId, {
        answers: submissionAnswers,
        timeTaken: Math.round(totalTimeTaken),
      });
      setSubmitted(true);
      setSummary({
        ...res.data.summary,
        score: res.data.result.score,
        totalMarks: res.data.result.totalMarks,
      });
      setShowSubmitDialog(false);
      toast.success("Test submitted successfully!");
    } catch (err: any) {
      toast.error(err.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Loading test...</p>
        </div>
      </div>
    );
  }

  // Show summary after submission
  if (submitted && summary) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <Card className="glass-elevated max-w-lg w-full">
          <CardContent className="pt-8 text-center space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Test Submitted!</h1>
              <p className="text-muted-foreground mt-1">{testData?.title}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                <p className="text-sm text-muted-foreground">Score</p>
                <p className="text-3xl font-bold text-foreground">
                  {summary.score}<span className="text-lg text-muted-foreground">/{summary.totalMarks}</span>
                </p>
              </div>
              <div className="p-4 rounded-xl bg-accent/5 border border-accent/10">
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-3xl font-bold text-foreground">{summary.accuracy}</p>
              </div>
              <div className="p-4 rounded-xl bg-success/5 border border-success/10">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-2xl font-bold text-success">{summary.correct}</p>
              </div>
              <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/10">
                <p className="text-sm text-muted-foreground">Incorrect</p>
                <p className="text-2xl font-bold text-destructive">{summary.incorrect}</p>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {summary.totalQuestions - summary.correct - summary.incorrect} question(s) were unanswered
            </p>

            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate("/student/results")}>
                View All Results
              </Button>
              <Button onClick={() => navigate("/student/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!question) return null;

  const answer = answers[question._id];
  const isUrgent = timeLeft < 300;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-card/90 backdrop-blur-md px-4 sm:px-6 py-3">
        <div>
          <h1 className="text-base font-semibold text-foreground">{testData?.title}</h1>
          <p className="text-xs text-muted-foreground">
            Question {currentQ + 1} of {questions.length}
            {question.sectionName !== "Default" && ` · ${question.sectionName}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2 font-mono text-sm font-bold",
            isUrgent ? "bg-destructive/10 text-destructive animate-pulse" : "bg-muted text-foreground"
          )}>
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
          <Button onClick={() => setShowSubmitDialog(true)} variant={isUrgent ? "destructive" : "default"} size="sm">
            Submit Test
          </Button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Main content */}
        <main className="flex-1 p-6 sm:p-8 max-w-4xl mx-auto w-full">
          <div className="glass-elevated rounded-xl p-6 sm:p-8 space-y-6 animate-fade-in" key={currentQ}>
            {/* Question header */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">Q{currentQ + 1}</Badge>
                  <Badge variant="secondary" className="capitalize">{question.questionType.replace("-", " ")}</Badge>
                  <span className="text-xs text-muted-foreground">+{question.marks} / -{question.negativeMarks}</span>
                  {question.topic && <Badge variant="outline" className="text-xs">{question.topic}</Badge>}
                </div>
                <h2 className="text-lg font-semibold text-foreground">{question.questionText}</h2>
              </div>
              <Button variant={flagged.has(question._id) ? "default" : "ghost"} size="icon" onClick={toggleFlag} title="Flag for review">
                <Flag className="h-4 w-4" />
              </Button>
            </div>

            {/* MCQ */}
            {question.questionType === "mcq" && (
              <div className="space-y-3">
                {question.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMcqSelect(opt)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all",
                      answer?.options.includes(opt)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold",
                      answer?.options.includes(opt) ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30"
                    )}>
                      {String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm text-foreground">{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Multi-select */}
            {question.questionType === "multi-select" && (
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">Select all that apply</p>
                {question.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMultiSelect(opt)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all",
                      answer?.options.includes(opt)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/30"
                    )}
                  >
                    <div className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded border-2",
                      answer?.options.includes(opt) ? "border-primary bg-primary" : "border-muted-foreground/30"
                    )}>
                      {answer?.options.includes(opt) && (
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className="text-sm text-foreground">{opt}</span>
                  </button>
                ))}
              </div>
            )}

            {/* One-word */}
            {question.questionType === "one-word" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Type your answer below</p>
                <Input
                  value={answer?.options?.[0] || ""}
                  onChange={(e) => handleTextInput(e.target.value)}
                  placeholder="Your answer..."
                  className="max-w-md h-12 text-base"
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Button variant="outline" disabled={currentQ === 0} onClick={() => handleNavigate(currentQ - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" />Previous
              </Button>
              <span className="text-sm text-muted-foreground">{answeredCount}/{questions.length} answered</span>
              <Button variant="outline" disabled={currentQ === questions.length - 1} onClick={() => handleNavigate(currentQ + 1)}>
                Next<ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </main>

        {/* Question grid sidebar */}
        <aside className="hidden lg:block w-64 border-l border-border bg-card/50 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Questions</h3>
          <div className="grid grid-cols-5 gap-2">
            {questions.map((q, idx) => {
              const a = answers[q._id];
              const isAnswered = a && a.options.length > 0 && a.options.some((o) => o.trim() !== "");
              const isFlagged = flagged.has(q._id);
              const isCurrent = idx === currentQ;
              return (
                <button
                  key={q._id}
                  onClick={() => handleNavigate(idx)}
                  className={cn(
                    "relative flex h-10 w-10 items-center justify-center rounded-lg text-xs font-semibold transition-all",
                    isCurrent
                      ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                      : isAnswered
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {idx + 1}
                  {isFlagged && (
                    <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-warning" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-6 space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-accent/20 border border-accent/30" /> Answered</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-muted" /> Not answered</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded bg-primary" /> Current</div>
            <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-full bg-warning" /> Flagged</div>
          </div>
        </aside>
      </div>

      {/* Submit confirmation */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Confirm Submission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <p className="text-sm text-muted-foreground">
              You have answered <span className="font-semibold text-foreground">{answeredCount}</span> out of <span className="font-semibold text-foreground">{questions.length}</span> questions.
            </p>
            {answeredCount < questions.length && (
              <p className="text-sm text-destructive">
                {questions.length - answeredCount} question(s) are unanswered.
              </p>
            )}
            {flagged.size > 0 && (
              <p className="text-sm text-warning">
                {flagged.size} question(s) are flagged for review.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>Go Back</Button>
            <Button onClick={doSubmit} disabled={submitting}>
              {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</> : "Submit Test"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TestEnvironment;
