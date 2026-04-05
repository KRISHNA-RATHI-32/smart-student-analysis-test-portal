import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import RoleLayout from "@/components/layouts/RoleLayout";
import StatCard from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Plus, Clock, BookOpen, Loader2 } from "lucide-react";
import { testApi, type TestPayload } from "@/lib/api";
import { toast } from "sonner";

const TeacherDashboard = () => {
  const [tests, setTests] = useState<TestPayload[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await testApi.getAllTests();
        setTests(res.data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load tests");
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Teacher Dashboard</h1>
            <p className="text-muted-foreground mt-1">Manage your tests and view results</p>
          </div>
          <Link to="/teacher/create-test">
            <Button><Plus className="h-4 w-4 mr-2" />Create Test</Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Total Tests" value={tests.length} icon={<ClipboardList className="h-5 w-5" />} />
          <StatCard label="Total Marks (All)" value={tests.reduce((s, t) => s + t.totalMarks, 0)} icon={<BookOpen className="h-5 w-5" />} />
          <StatCard label="Avg Duration" value={tests.length ? `${Math.round(tests.reduce((s, t) => s + t.duration, 0) / tests.length)} min` : "—"} icon={<Clock className="h-5 w-5" />} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Your Tests</h2>
          {tests.length === 0 ? (
            <div className="glass-elevated rounded-xl p-8 text-center">
              <p className="text-muted-foreground">No tests created yet. Create your first test!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {tests.map((test) => (
                <div key={test._id} className="glass-elevated rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {test.thumbnail && (
                      <img
                        src={test.thumbnail}
                        alt={test.title}
                        className="h-14 w-14 rounded-lg object-cover shrink-0"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">{test.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {test.category || "General"} · {test.totalMarks} marks · {test.duration} min
                      </p>
                      {test.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{test.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="capitalize">{test.category || "general"}</Badge>
                    <Link to={`/teacher/results/${test._id}`}>
                      <Button variant="outline" size="sm">View Results</Button>
                    </Link>
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

export default TeacherDashboard;
