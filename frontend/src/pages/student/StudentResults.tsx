import { useState, useEffect } from "react";
import RoleLayout from "@/components/layouts/RoleLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { resultApi } from "@/lib/api";
import { toast } from "sonner";
import StatCard from "@/components/StatCard";
import { Target, BarChart3, Clock } from "lucide-react";

interface MyResult {
  _id: string;
  score: number;
  totalMarks: number;
  timeTaken: number;
  createdAt: string;
  testTitle: string;
  accuracy: number;
}

const StudentResults = () => {
  const [results, setResults] = useState<MyResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await resultApi.getMyResults();
        setResults(res.data);
      } catch (err: any) {
        toast.error(err.message || "Failed to fetch results");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  const avgAccuracy = results.length
    ? Math.round(results.reduce((s, r) => s + r.accuracy, 0) / results.length)
    : 0;
  const totalScore = results.reduce((s, r) => s + r.score, 0);
  const avgTime = results.length
    ? Math.round(results.reduce((s, r) => s + r.timeTaken, 0) / results.length)
    : 0;

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
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Results</h1>
          <p className="text-muted-foreground mt-1">
            {results.length} test{results.length !== 1 ? "s" : ""} completed
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Avg Accuracy" value={`${avgAccuracy}%`} icon={<Target className="h-5 w-5" />} />
          <StatCard label="Total Score" value={totalScore} icon={<BarChart3 className="h-5 w-5" />} />
          <StatCard label="Avg Time" value={formatTime(avgTime)} icon={<Clock className="h-5 w-5" />} />
        </div>

        <div className="glass-elevated rounded-xl overflow-hidden">
          {results.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No results yet. Take a test to see your performance!
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r) => (
                  <TableRow key={r._id}>
                    <TableCell className="font-medium">{r.testTitle}</TableCell>
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
                    <TableCell className="text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
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
      </div>
    </RoleLayout>
  );
};

export default StudentResults;
