import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { toast } from "sonner";
import { OTP_REGEX } from "@/lib/validators";

const RESEND_COOLDOWN = 60; // seconds

const VerifyOtpPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setUser } = useAuth();
  const email = (location.state as any)?.email || "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState("");

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Redirect if no email in state
  useEffect(() => {
    if (!email) {
      toast.error("No email found. Please register first.");
      navigate("/register");
    }
  }, [email, navigate]);

  const handleOtpChange = (value: string) => {
    setOtp(value);
    // Clear error once user enters 6 valid digits
    if (OTP_REGEX.test(value)) {
      setOtpError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ─── Regex validation: must be exactly 6 digits ───
    if (!OTP_REGEX.test(otp)) {
      setOtpError("Please enter a valid 6-digit OTP.");
      return;
    }
    setOtpError("");
    setLoading(true);
    try {
      const res = await authApi.verifyOtp({ email, otp });
      // Backend auto-logs in via cookies after OTP verification
      const userData = res.data.user;
      const u = {
        id: userData._id,
        role: userData.role as "admin" | "teacher" | "student",
        email: userData.email,
        fullName: userData.fullName,
        username: userData.username,
      };
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
      toast.success("Email verified! Welcome aboard!");
      navigate(`/${u.role}/dashboard`);
    } catch (err: any) {
      toast.error(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    try {
      await authApi.resendOtp({ email });
      toast.success("OTP resent! Check your inbox.");
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend OTP");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex items-center gap-3 justify-center">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">ExamPortal</span>
        </div>

        <div className="glass-elevated rounded-2xl p-8 space-y-6">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Verify your email</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a 6-digit code to <span className="font-medium text-foreground">{email || "your email"}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center gap-2">
              <InputOTP maxLength={6} value={otp} onChange={handleOtpChange}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              {otpError && <p className="text-xs text-destructive">{otpError}</p>}
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? "Verifying..." : "Verify Email"}
            </Button>
          </form>

          <div className="pt-2 border-t border-border">
            <button
              onClick={handleResendOtp}
              disabled={resendCooldown > 0}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${resendCooldown > 0 ? "" : "hover:animate-spin"}`} />
              {resendCooldown > 0
                ? `Resend OTP in ${resendCooldown}s`
                : "Resend OTP"
              }
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
