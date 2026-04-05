import { useState, useEffect } from "react";
import RoleLayout from "@/components/layouts/RoleLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, Zap, TrendingUp, Target } from "lucide-react";
import { resultApi } from "@/lib/api";
import { toast } from "sonner";
import StatCard from "@/components/StatCard";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
  ScatterChart, Scatter, ZAxis,
} from "recharts";

interface TopicAnalysis {
  topic: string;
  accuracy: number;
  avgTime: number;
  status: "Weak" | "Medium" | "Strong";
}

interface SpeedAccuracy {
  topic: string;
  avgTime: number;
  accuracy: number;
  performance: string;
}

interface ProgressPoint {
  createdAt: string;
  testTitle: string;
  accuracy: number;
}

const statusColors: Record<string, string> = {
  Weak: "hsl(0, 72%, 51%)",
  Medium: "hsl(38, 92%, 50%)",
  Strong: "hsl(152, 60%, 40%)",
};

const performanceColors: Record<string, string> = {
  "Fast & Accurate": "hsl(152, 60%, 40%)",
  "Accurate but Slow": "hsl(38, 92%, 50%)",
  "Slow & Inaccurate": "hsl(0, 72%, 51%)",
  "Moderate": "hsl(210, 80%, 52%)",
};

const StudentAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<TopicAnalysis[]>([]);
  const [speedAcc, setSpeedAcc] = useState<SpeedAccuracy[]>([]);
  const [progress, setProgress] = useState<ProgressPoint[]>([]);
  const [overallAccuracy, setOverallAccuracy] = useState(0);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [topicsRes, speedRes, progressRes, resultsRes] = await Promise.all([
          resultApi.getTopicAnalysis().catch(() => ({ data: [] })),
          resultApi.getSpeedVsAccuracy().catch(() => ({ data: [] })),
          resultApi.getProgressGraph().catch(() => ({ data: [] })),
          resultApi.getMyResults().catch(() => ({ data: [] })),
        ]);

        setTopics(topicsRes.data as TopicAnalysis[]);
        setSpeedAcc(speedRes.data as SpeedAccuracy[]);
        setProgress(progressRes.data as ProgressPoint[]);

        // Compute overall accuracy from results
        const results = resultsRes.data;
        if (Array.isArray(results) && results.length > 0) {
          const totalScore = (results as any[]).reduce((s: number, r: any) => s + r.score, 0);
          const totalMarks = (results as any[]).reduce((s: number, r: any) => s + r.totalMarks, 0);
          setOverallAccuracy(totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0);
        }
      } catch (err: any) {
        toast.error(err.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
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

  const weakTopics = topics.filter((t) => t.status === "Weak").length;
  const strongTopics = topics.filter((t) => t.status === "Strong").length;

  return (
    <RoleLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground mt-1">Deep insights into your performance</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          <StatCard label="Overall Accuracy" value={`${overallAccuracy}%`} icon={<Target className="h-5 w-5" />} />
          <StatCard label="Topics Analyzed" value={topics.length} icon={<Brain className="h-5 w-5" />} />
          <StatCard label="Weak Topics" value={weakTopics} icon={<Zap className="h-5 w-5" />} />
          <StatCard label="Strong Topics" value={strongTopics} icon={<TrendingUp className="h-5 w-5" />} />
        </div>

        {/* Progress Over Time */}
        <Card className="glass-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progress Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {progress.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Take some tests to see your progress</p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={progress.map((p, i) => ({ ...p, label: `Test ${i + 1}` }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="testTitle"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => v.length > 12 ? v.substring(0, 12) + "…" : v}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickFormatter={(v) => `${v}%`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`, "Accuracy"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Topic-wise Analysis */}
        <Card className="glass-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Topic-wise Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topics.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No topic data available yet</p>
            ) : (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topics}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="topic"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => v || "Unknown"}
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      tickFormatter={(v) => `${v}%`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value.toFixed(1)}%`, "Accuracy"]}
                    />
                    <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                      {topics.map((t, i) => (
                        <Cell key={i} fill={statusColors[t.status]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>

                {/* Topic Table */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {topics.map((t, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <div>
                        <p className="font-medium text-foreground text-sm">{t.topic || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">
                          Avg time: {t.avgTime ? `${t.avgTime.toFixed(0)}s` : "—"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: statusColors[t.status] }}>
                          {t.accuracy.toFixed(0)}%
                        </p>
                        <Badge
                          variant="outline"
                          className="text-xs"
                          style={{
                            borderColor: statusColors[t.status],
                            color: statusColors[t.status],
                          }}
                        >
                          {t.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Speed vs Accuracy */}
        <Card className="glass-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Speed vs Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            {speedAcc.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No data available yet</p>
            ) : (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="avgTime"
                      name="Avg Time (s)"
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      label={{ value: "Avg Time (seconds)", position: "bottom", offset: 0, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                    />
                    <YAxis
                      dataKey="accuracy"
                      name="Accuracy (%)"
                      domain={[0, 100]}
                      tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                      label={{ value: "Accuracy %", angle: -90, position: "left", offset: 0, style: { fontSize: 11, fill: "hsl(var(--muted-foreground))" } }}
                    />
                    <ZAxis range={[100, 300]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: 12,
                      }}
                      formatter={(value: number, name: string) => [
                        name === "avgTime" ? `${value.toFixed(0)}s` : `${value.toFixed(1)}%`,
                        name === "avgTime" ? "Avg Time" : "Accuracy",
                      ]}
                      labelFormatter={(label) => ""}
                    />
                    <Scatter data={speedAcc} fill="hsl(var(--primary))">
                      {speedAcc.map((entry, i) => (
                        <Cell key={i} fill={performanceColors[entry.performance] || "hsl(var(--primary))"} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>

                {/* Performance Legend */}
                <div className="flex flex-wrap gap-4 justify-center">
                  {Object.entries(performanceColors).map(([label, color]) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>

                {/* Performance Cards */}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {speedAcc.map((s, i) => (
                    <div key={i} className="p-3 rounded-lg border border-border text-center space-y-1">
                      <p className="font-medium text-foreground text-sm">{s.topic || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.avgTime.toFixed(0)}s avg · {s.accuracy.toFixed(0)}%
                      </p>
                      <Badge
                        variant="outline"
                        style={{
                          borderColor: performanceColors[s.performance] || "hsl(var(--border))",
                          color: performanceColors[s.performance] || "inherit",
                        }}
                        className="text-xs"
                      >
                        {s.performance}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </RoleLayout>
  );
};

export default StudentAnalytics;
