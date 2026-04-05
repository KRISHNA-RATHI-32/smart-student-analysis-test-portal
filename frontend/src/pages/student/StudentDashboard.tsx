import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import RoleLayout from "@/components/layouts/RoleLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, PlayCircle, CheckCircle2, Loader2, BookOpen, Target } from "lucide-react";
import { testApi, resultApi, type TestPayload } from "@/lib/api";
import { toast } from "sonner";
import StatCard from "@/components/StatCard";

interface TestWithStatus extends TestPayload {
  attemptStatus: "not-started" | "started" | "completed";
  score?: number;
}

const StudentDashboard = () => {
  const [tests, setTests] = useState<TestWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const testsRes = await testApi.getAllTests();
        const allTests = testsRes.data;

        // Check attempt status for each test
        const testsWithStatus = await Promise.all(
          allTests.map(async (test) => {
            try {
              const statusRes = await resultApi.getAttemptStatus(test._id);
              return {
                ...test,
                attemptStatus: statusRes.data.status,
                score: statusRes.data.score,
              } as TestWithStatus;
            } catch {
              return { ...test, attemptStatus: "not-started" as const } as TestWithStatus;
            }
          })
        );

        setTests(testsWithStatus);
      } catch (err: any) {
        toast.error(err.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const pending = tests.filter((t) => t.attemptStatus === "not-started" || t.attemptStatus === "started");
  const completed = tests.filter((t) => t.attemptStatus === "completed");

  if (loading) {
    return (
      <RoleLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </RoleLayout>
    );
  }

  return (
    <RoleLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your assigned tests and results</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Total Tests" value={tests.length} icon={<BookOpen className="h-5 w-5" />} />
          <StatCard label="Completed" value={completed.length} icon={<CheckCircle2 className="h-5 w-5" />} />
          <StatCard label="Pending" value={pending.length} icon={<Clock className="h-5 w-5" />} />
        </div>

        {/* Pending */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />Pending Tests ({pending.length})
          </h2>
          {pending.length === 0 ? (
            <div className="glass-elevated rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-sm">No pending tests — you're all caught up! 🎉</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {pending.map((test) => (
                <div key={test._id} className="glass-elevated rounded-xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    {test.thumbnail && (
                      <img src={test.thumbnail} alt={test.title} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">{test.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {test.category || "General"} · {test.totalMarks} marks · {test.duration} min
                      </p>
                    </div>
                  </div>
                  {test.attemptStatus === "started" ? (
                    <Link to={`/test/${test._id}`}>
                      <Button className="w-full" variant="secondary">
                        <PlayCircle className="h-4 w-4 mr-2" />Resume Test
                      </Button>
                    </Link>
                  ) : (
                    <Link to={`/test/${test._id}`}>
                      <Button className="w-full">
                        <PlayCircle className="h-4 w-4 mr-2" />Start Test
                      </Button>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Completed */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success" />Completed Tests ({completed.length})
          </h2>
          {completed.length === 0 ? (
            <div className="glass-elevated rounded-xl p-8 text-center">
              <p className="text-muted-foreground text-sm">No completed tests yet</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {completed.map((r) => (
                <div key={r._id} className="glass-elevated rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {r.thumbnail && (
                      <img src={r.thumbnail} alt={r.title} className="h-10 w-10 rounded-lg object-cover shrink-0" />
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">{r.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{r.category || "General"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {r.score ?? "—"}<span className="text-sm text-muted-foreground">/{r.totalMarks}</span>
                    </p>
                    <Badge variant={r.score !== undefined && (r.score / r.totalMarks * 100) >= 40 ? "default" : "destructive"}>
                      {r.score !== undefined && (r.score / r.totalMarks * 100) >= 40 ? "Passed" : "Failed"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </RoleLayout>
  );
};

export default StudentDashboard;
