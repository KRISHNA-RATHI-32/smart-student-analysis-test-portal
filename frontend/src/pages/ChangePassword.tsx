import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RoleLayout from "@/components/layouts/RoleLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KeyRound, Loader2, Eye, EyeOff } from "lucide-react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { validatePassword, validateConfirmPassword, passwordRules } from "@/lib/validators";

type FieldErrors = {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

const ChangePassword = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ─── Regex validation ───
    const errors: FieldErrors = {
      oldPassword: !oldPassword.trim() ? "Current password is required." : "",
      newPassword: validatePassword(newPassword),
      confirmPassword: validateConfirmPassword(confirmPassword, newPassword),
    };

    // Extra: new password must differ from old
    if (!errors.newPassword && oldPassword === newPassword) {
      errors.newPassword = "New password must differ from current password.";
    }

    const hasErrors = Object.values(errors).some((e) => e !== "");
    if (hasErrors) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setLoading(true);
    try {
      await authApi.changePassword({ oldPassword, newPassword });
      toast.success("Password changed! Please log in again.");
      // Backend clears cookies on password change, so we logout locally
      await logout();
      navigate("/login");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <RoleLayout>
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Change Password</h1>
          <p className="text-muted-foreground mt-1">Update your account password</p>
        </div>

        <Card className="glass-elevated">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              Update Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Current Password */}
              <div className="space-y-2">
                <Label htmlFor="oldPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="oldPassword"
                    type={showOld ? "text" : "password"}
                    value={oldPassword}
                    onChange={(e) => {
                      setOldPassword(e.target.value);
                      if (fieldErrors.oldPassword) setFieldErrors((p) => ({ ...p, oldPassword: "" }));
                    }}
                    placeholder="Enter current password"
                    className={`pr-10 ${fieldErrors.oldPassword ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.oldPassword && <p className="text-xs text-destructive">{fieldErrors.oldPassword}</p>}
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (fieldErrors.newPassword) {
                        setFieldErrors((p) => ({ ...p, newPassword: validatePassword(e.target.value) }));
                      }
                      if (confirmPassword && fieldErrors.confirmPassword) {
                        setFieldErrors((p) => ({
                          ...p,
                          confirmPassword: validateConfirmPassword(confirmPassword, e.target.value),
                        }));
                      }
                    }}
                    onBlur={() => setFieldErrors((p) => ({ ...p, newPassword: validatePassword(newPassword) }))}
                    placeholder="Min. 8 characters"
                    className={`pr-10 ${fieldErrors.newPassword ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {fieldErrors.newPassword && <p className="text-xs text-destructive">{fieldErrors.newPassword}</p>}

                {/* Live password strength checklist */}
                {newPassword && (
                  <ul className="mt-2 space-y-0.5 text-xs bg-muted/50 rounded-lg p-3">
                    {passwordRules.map((rule) => (
                      <li key={rule.label} className={rule.test(newPassword) ? "text-green-600" : "text-muted-foreground"}>
                        {rule.test(newPassword) ? "✓" : "○"} {rule.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) {
                      setFieldErrors((p) => ({
                        ...p,
                        confirmPassword: validateConfirmPassword(e.target.value, newPassword),
                      }));
                    }
                  }}
                  onBlur={() =>
                    setFieldErrors((p) => ({
                      ...p,
                      confirmPassword: validateConfirmPassword(confirmPassword, newPassword),
                    }))
                  }
                  placeholder="Re-enter new password"
                  className={fieldErrors.confirmPassword ? "border-destructive" : ""}
                />
                {fieldErrors.confirmPassword && <p className="text-xs text-destructive">{fieldErrors.confirmPassword}</p>}
                {confirmPassword && !fieldErrors.confirmPassword && (
                  <p className="text-xs text-green-600">✓ Passwords match</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Changing...</> : "Change Password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </RoleLayout>
  );
};

export default ChangePassword;
