import { useState, useEffect } from "react";
import RoleLayout from "@/components/layouts/RoleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { adminApi, type UserPayload } from "@/lib/api";
import {
  validateFullName,
  validateEmail,
  validateUsername,
  validatePassword,
} from "@/lib/validators";

type TeacherFieldErrors = {
  fullName?: string;
  email?: string;
  username?: string;
  password?: string;
};

const UserManagement = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserPayload[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeacher, setNewTeacher] = useState({ fullName: "", email: "", username: "", password: "" });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [teacherFieldErrors, setTeacherFieldErrors] = useState<TeacherFieldErrors>({});

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getAllUsers();
      setUsers(res.data);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const students = users.filter((u) => u.role === "student");
  const teachers = users.filter((u) => u.role === "teacher");

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.username.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTeachers = teachers.filter((t) =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase())
  );

  const updateTeacherField = (field: string, value: string) => {
    setNewTeacher((p) => ({ ...p, [field]: value }));
    // Live-clear errors once the user corrects
    if (teacherFieldErrors[field as keyof TeacherFieldErrors]) {
      const validator =
        field === "fullName" ? validateFullName :
        field === "email" ? validateEmail :
        field === "username" ? validateUsername :
        validatePassword;
      setTeacherFieldErrors((p) => ({ ...p, [field]: validator(value) }));
    }
  };

  const handleCreateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();

    // ─── Regex validation ───
    const errors: TeacherFieldErrors = {
      fullName: validateFullName(newTeacher.fullName),
      email: validateEmail(newTeacher.email),
      username: validateUsername(newTeacher.username),
      password: validatePassword(newTeacher.password),
    };

    const hasErrors = Object.values(errors).some((e) => e !== "");
    if (hasErrors) {
      setTeacherFieldErrors(errors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setTeacherFieldErrors({});
    setCreating(true);
    try {
      await adminApi.addTeacher(newTeacher);
      toast.success("Teacher account created!");
      setDialogOpen(false);
      setNewTeacher({ fullName: "", email: "", username: "", password: "" });
      setTeacherFieldErrors({});
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to create teacher");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeletingId(userId);
    try {
      await adminApi.deleteUser(userId);
      toast.success("User deleted successfully");
      setUsers((prev) => prev.filter((u) => u._id !== userId));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <RoleLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">User Management</h1>
            <p className="text-muted-foreground mt-1">
              {students.length} students · {teachers.length} teachers
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Teacher</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Teacher Account</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTeacher} className="space-y-4 mt-4" noValidate>
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={newTeacher.fullName}
                    onChange={(e) => updateTeacherField("fullName", e.target.value)}
                    onBlur={() => setTeacherFieldErrors((p) => ({ ...p, fullName: validateFullName(newTeacher.fullName) }))}
                    placeholder="Dr. John Smith"
                    className={teacherFieldErrors.fullName ? "border-destructive" : ""}
                  />
                  {teacherFieldErrors.fullName && <p className="text-xs text-destructive">{teacherFieldErrors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => updateTeacherField("email", e.target.value)}
                    onBlur={() => setTeacherFieldErrors((p) => ({ ...p, email: validateEmail(newTeacher.email) }))}
                    placeholder="john@school.edu"
                    className={teacherFieldErrors.email ? "border-destructive" : ""}
                  />
                  {teacherFieldErrors.email && <p className="text-xs text-destructive">{teacherFieldErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={newTeacher.username}
                    onChange={(e) => updateTeacherField("username", e.target.value.toLowerCase())}
                    onBlur={() => setTeacherFieldErrors((p) => ({ ...p, username: validateUsername(newTeacher.username) }))}
                    placeholder="johnsmith"
                    className={teacherFieldErrors.username ? "border-destructive" : ""}
                  />
                  {teacherFieldErrors.username && <p className="text-xs text-destructive">{teacherFieldErrors.username}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={newTeacher.password}
                    onChange={(e) => updateTeacherField("password", e.target.value)}
                    onBlur={() => setTeacherFieldErrors((p) => ({ ...p, password: validatePassword(newTeacher.password) }))}
                    placeholder="Min. 8 characters"
                    className={teacherFieldErrors.password ? "border-destructive" : ""}
                  />
                  {teacherFieldErrors.password && <p className="text-xs text-destructive">{teacherFieldErrors.password}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={creating}>
                  {creating ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : "Create Teacher"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search users by name, email, or username..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="students">
            <TabsList>
              <TabsTrigger value="students">Students ({students.length})</TabsTrigger>
              <TabsTrigger value="teachers">Teachers ({teachers.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="students" className="mt-4">
              <div className="glass-elevated rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          {search ? "No students match your search" : "No students registered yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStudents.map((s) => (
                        <TableRow key={s._id}>
                          <TableCell className="font-medium">{s.fullName}</TableCell>
                          <TableCell>{s.email}</TableCell>
                          <TableCell className="text-muted-foreground">{s.username}</TableCell>
                          <TableCell>
                            <Badge variant={s.isVerified ? "default" : "secondary"}>
                              {s.isVerified ? "Verified" : "Pending"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {s.fullName}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the student account and all their data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(s._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deletingId === s._id}
                                  >
                                    {deletingId === s._id ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            <TabsContent value="teachers" className="mt-4">
              <div className="glass-elevated rounded-xl overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          {search ? "No teachers match your search" : "No teachers added yet"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTeachers.map((t) => (
                        <TableRow key={t._id}>
                          <TableCell className="font-medium">{t.fullName}</TableCell>
                          <TableCell>{t.email}</TableCell>
                          <TableCell className="text-muted-foreground">{t.username}</TableCell>
                          <TableCell>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {t.fullName}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will permanently delete the teacher account.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(t._id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deletingId === t._id}
                                  >
                                    {deletingId === t._id ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </RoleLayout>
  );
};

export default UserManagement;
