import { useEffect, useState } from "react";
import { Users, Layers, BookOpen, GraduationCap, Loader2 } from "lucide-react";
import StatCard from "@/components/StatCard";
import RoleLayout from "@/components/layouts/RoleLayout";
import { adminApi, testApi, type UserPayload, type TestPayload } from "@/lib/api";
import { toast } from "sonner";

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserPayload[]>([]);
  const [tests, setTests] = useState<TestPayload[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, testsRes] = await Promise.all([
          adminApi.getAllUsers(),
          testApi.getAllTests(),
        ]);
        setUsers(usersRes.data);
        setTests(testsRes.data);
      } catch (err: any) {
        toast.error(err.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const studentCount = users.filter((u) => u.role === "student").length;
  const teacherCount = users.filter((u) => u.role === "teacher").length;

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
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of the exam portal</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total Students" value={studentCount} icon={<GraduationCap className="h-5 w-5" />} />
          <StatCard label="Total Teachers" value={teacherCount} icon={<Users className="h-5 w-5" />} />
          <StatCard label="Total Users" value={users.length} icon={<Layers className="h-5 w-5" />} />
          <StatCard label="Total Tests" value={tests.length} icon={<BookOpen className="h-5 w-5" />} />
        </div>

        {/* Recent Users */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Recent Users</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {users.slice(0, 6).map((user) => (
              <div key={user._id} className="glass-elevated rounded-xl p-4 flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{user.fullName}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    user.role === "admin"
                      ? "bg-destructive/10 text-destructive"
                      : user.role === "teacher"
                        ? "bg-info/10 text-info"
                        : "bg-accent/10 text-accent"
                  }`}>
                    {user.role}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </RoleLayout>
  );
};

export default AdminDashboard;
