import { useState, useEffect } from "react";
import RoleLayout from "@/components/layouts/RoleLayout";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, ChevronLeft, ChevronRight, Loader2, Crown, Star } from "lucide-react";
import { testApi, resultApi, type TestPayload } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface LeaderboardEntry {
  rank: number;
  score: number;
  timeTaken: number;
  totalMarks: number;
  studentName: string;
  accuracy: number;
}

const Leaderboard = () => {
  const { user } = useAuth();
  const [tests, setTests] = useState<TestPayload[]>([]);
  const [selectedTestId, setSelectedTestId] = useState("");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [totalStudents, setTotalStudents] = useState(0);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const res = await testApi.getAllTests();
        setTests(res.data);
        if (res.data.length > 0) {
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

  useEffect(() => {
    if (!selectedTestId) return;
    const fetchLeaderboard = async () => {
      setLoadingBoard(true);
      try {
        const [boardRes, rankRes] = await Promise.all([
          resultApi.getLeaderboard(selectedTestId, page, 10),
          resultApi.getMyRank(selectedTestId).catch(() => ({ data: { rank: null, totalStudents: 0 } })),
        ]);
        setEntries(boardRes.data.docs);
        setTotalPages(boardRes.data.totalPages);
        setMyRank(rankRes.data.rank);
        setTotalStudents(rankRes.data.totalStudents);
      } catch (err: any) {
        if (err.message?.includes("No results")) {
          setEntries([]);
          setMyRank(null);
          setTotalStudents(0);
        } else {
          toast.error(err.message || "Failed to load leaderboard");
        }
      } finally {
        setLoadingBoard(false);
      }
    };
    fetchLeaderboard();
  }, [selectedTestId, page]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-mono text-muted-foreground">#{rank}</span>;
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
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-6 w-6 text-warning" />
              Leaderboard
            </h1>
            <p className="text-muted-foreground mt-1">See how you rank against others</p>
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

        {/* My Rank Card */}
        {myRank !== null && (
          <Card className="glass-elevated border-primary/20">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Star className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Your Rank</p>
                  <p className="text-2xl font-bold text-foreground">#{myRank}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Out of</p>
                <p className="text-lg font-semibold text-foreground">{totalStudents} students</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard Table */}
        <div className="glass-elevated rounded-xl overflow-hidden">
          {loadingBoard ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No results yet for this test
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => {
                  const isMe = entry.studentName === user?.fullName;
                  return (
                    <TableRow key={entry.rank} className={isMe ? "bg-primary/5" : ""}>
                      <TableCell className="text-center">{getRankBadge(entry.rank)}</TableCell>
                      <TableCell className="font-medium">
                        {entry.studentName}
                        {isMe && <Badge variant="outline" className="ml-2 text-xs">You</Badge>}
                      </TableCell>
                      <TableCell>
                        <span className="font-semibold">{entry.score}</span>
                        <span className="text-muted-foreground">/{entry.totalMarks}</span>
                      </TableCell>
                      <TableCell>
                        <span className={
                          entry.accuracy >= 75 ? "text-success font-medium" :
                          entry.accuracy >= 40 ? "text-warning font-medium" :
                          "text-destructive font-medium"
                        }>
                          {entry.accuracy.toFixed(1)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatTime(entry.timeTaken)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </RoleLayout>
  );
};

export default Leaderboard;
