import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/lib/api";
import { GraduationCap, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  validateEmail,
  validateUsername,
  validateFullName,
  validatePassword,
  passwordRules,
} from "@/lib/validators";

type FieldErrors = {
  fullName?: string;
  email?: string;
  username?: string;
  password?: string;
};

const RegisterPage = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: "", email: "", username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    // Live-clear errors once the user starts correcting
    if (fieldErrors[field as keyof FieldErrors]) {
      const validator =
        field === "fullName" ? validateFullName :
        field === "email" ? validateEmail :
        field === "username" ? validateUsername :
        validatePassword;
      setFieldErrors((p) => ({ ...p, [field]: validator(value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ─── Run all regex validators ───
    const errors: FieldErrors = {
      fullName: validateFullName(form.fullName),
      email: validateEmail(form.email),
      username: validateUsername(form.username),
      password: validatePassword(form.password),
    };

    const hasErrors = Object.values(errors).some((e) => e !== "");
    if (hasErrors) {
      setFieldErrors(errors);
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      await authApi.register(form);
      toast.success("Registration successful! Please verify your email.");
      navigate("/verify-otp", { state: { email: form.email } });
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="max-w-md text-center">
          <GraduationCap className="mx-auto h-16 w-16 text-accent mb-6" />
          <h1 className="text-4xl font-bold text-primary-foreground mb-4">Join ExamPortal</h1>
          <p className="text-primary-foreground/70 text-lg">
            Create your student account and start taking exams assigned by your teachers.
          </p>
        </div>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">ExamPortal</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
            <p className="mt-2 text-sm text-muted-foreground">Register as a student to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
                onBlur={() => setFieldErrors((p) => ({ ...p, fullName: validateFullName(form.fullName) }))}
                className={`h-11 ${fieldErrors.fullName ? "border-destructive" : ""}`}
              />
              {fieldErrors.fullName && <p className="text-xs text-destructive">{fieldErrors.fullName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                onBlur={() => setFieldErrors((p) => ({ ...p, email: validateEmail(form.email) }))}
                className={`h-11 ${fieldErrors.email ? "border-destructive" : ""}`}
              />
              {fieldErrors.email && <p className="text-xs text-destructive">{fieldErrors.email}</p>}
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="johndoe"
                value={form.username}
                onChange={(e) => update("username", e.target.value.toLowerCase())}
                onBlur={() => setFieldErrors((p) => ({ ...p, username: validateUsername(form.username) }))}
                className={`h-11 ${fieldErrors.username ? "border-destructive" : ""}`}
              />
              {fieldErrors.username && <p className="text-xs text-destructive">{fieldErrors.username}</p>}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => update("password", e.target.value)}
                  onBlur={() => setFieldErrors((p) => ({ ...p, password: validatePassword(form.password) }))}
                  className={`h-11 pr-10 ${fieldErrors.password ? "border-destructive" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-destructive">{fieldErrors.password}</p>}

              {/* Live password strength checklist */}
              {form.password && (
                <ul className="mt-2 space-y-0.5 text-xs bg-muted/50 rounded-lg p-3">
                  {passwordRules.map((rule) => (
                    <li key={rule.label} className={rule.test(form.password) ? "text-green-600" : "text-muted-foreground"}>
                      {rule.test(form.password) ? "✓" : "○"} {rule.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
