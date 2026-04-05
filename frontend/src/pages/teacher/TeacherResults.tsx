import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import RoleLayout from "@/components/layouts/RoleLayout";
import StatCard from "@/components/StatCard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Users, BarChart3, Target, TrendingUp, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { testApi, resultApi, type TestPayload } from "@/lib/api";
import { toast } from "sonner";

interface Submission {
  _id: string;
  studentName: string;
  score: number;
  totalMarks: number;
  timeTaken: number;
  submittedAt: string;
  accuracy: number;
}

const TeacherResults = () => {
  const { testId: paramTestId } = useParams<{ testId: string }>();
  const [tests, setTests] = useState<TestPayload[]>([]);
  const [selectedTestId, setSelectedTestId] = useState(paramTestId || "");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDocs, setTotalDocs] = useState(0);

  // Fetch test list
  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await testApi.getAllTests();
        setTests(res.data);
        if (!selectedTestId && res.data.length > 0) {
          setSelectedTestId(res.data[0]._id);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load tests");
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  // Fetch submissions when test changes
  useEffect(() => {
    if (!selectedTestId) return;
    const fetchSubmissions = async () => {
      setLoadingSubs(true);
      try {
        const res = await resultApi.getTestSubmissions(selectedTestId, page, 10);
        setSubmissions(res.data.docs);
        setTotalPages(res.data.totalPages);
        setTotalDocs(res.data.totalDocs);
      } catch (err: any) {
        toast.error(err.message || "Failed to load submissions");
        setSubmissions([]);
      } finally {
        setLoadingSubs(false);
      }
    };
    fetchSubmissions();
  }, [selectedTestId, page]);

  const avg = submissions.length
    ? Math.round(submissions.reduce((s, r) => s + r.accuracy, 0) / submissions.length)
    : 0;
  const passCount = submissions.filter((r) => r.accuracy >= 40).length;
  const passRate = submissions.length ? Math.round((passCount / submissions.length) * 100) : 0;
  const highestScore = submissions.length ? Math.max(...submissions.map((r) => r.score)) : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

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
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Test Results</h1>
            <p className="text-muted-foreground mt-1">
              {totalDocs} submission{totalDocs !== 1 ? "s" : ""} total
            </p>
          </div>
          <Select value={selectedTestId} onValueChange={(v) => { setSelectedTestId(v); setPage(1); }}>
            <SelectTrigger className="w-60"><SelectValue placeholder="Select test" /></SelectTrigger>
            <SelectContent>
              {tests.map((t) => (
                <SelectItem key={t._id} value={t._id}>{t.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <StatCard label="Total Submissions" value={totalDocs} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Avg Accuracy" value={`${avg}%`} icon={<BarChart3 className="h-5 w-5" />} />
          <StatCard label="Pass Rate (≥40%)" value={`${passRate}%`} icon={<Target className="h-5 w-5" />} />
          <StatCard label="Highest Score" value={highestScore} icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        <div className="glass-elevated rounded-xl overflow-hidden">
          {loadingSubs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No submissions yet for this test
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Time Taken</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((r, idx) => (
                  <TableRow key={r._id}>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {(page - 1) * 10 + idx + 1}
                    </TableCell>
                    <TableCell className="font-medium">{r.studentName}</TableCell>
                    <TableCell>{r.score}/{r.totalMarks}</TableCell>
                    <TableCell>
                      <span className={
                        r.accuracy >= 75 ? "text-success font-medium" :
                        r.accuracy >= 40 ? "text-warning font-medium" :
                        "text-destructive font-medium"
                      }>
                        {r.accuracy.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{formatTime(r.timeTaken)}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(r.submittedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.accuracy >= 40 ? "default" : "destructive"}>
                        {r.accuracy >= 40 ? "Passed" : "Failed"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </RoleLayout>
  );
};

export default TeacherResults;
