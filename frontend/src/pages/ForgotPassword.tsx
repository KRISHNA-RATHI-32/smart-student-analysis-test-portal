import React from "react";
import { authApi } from "../lib/api";
import {
  validateEmail,
  validateOtp,
  validatePassword,
  validateConfirmPassword,
  passwordRules,
  OTP_REGEX,
} from "../lib/validators";

const ForgotPassword = () => {
  const [email, setEmail] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [step, setStep] = React.useState(1);

  // ─── Field-level validation errors ───
  const [fieldErrors, setFieldErrors] = React.useState<{
    email?: string;
    otp?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  // ─── Step 1: Send OTP ─────────────────────────────────────────
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    if (emailErr) {
      setFieldErrors({ email: emailErr });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await authApi.forgotPassword({ email });
      setMessage(response.message);
      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 2: Verify OTP ───────────────────────────────────────
  const handleVerifyForgotPasswordOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpErr = validateOtp(otp);
    if (otpErr) {
      setFieldErrors({ otp: otpErr });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await authApi.verifyForgotPasswordOtp({ email, otp });
      setMessage(response.message);
      setStep(3);
    } catch (err: any) {
      setError(err.message || "Invalid or expired OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step 3: Reset Password ───────────────────────────────────
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwErr = validatePassword(newPassword);
    const cpwErr = validateConfirmPassword(confirmPassword, newPassword);
    if (pwErr || cpwErr) {
      setFieldErrors({ newPassword: pwErr, confirmPassword: cpwErr });
      return;
    }
    setFieldErrors({});
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const response = await authApi.resetPassword({ email, otp, newPassword });
      setMessage(response.message);
      setStep(4);
    } catch (err: any) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Step indicator dots ──────────────────────────────────────
  const steps = ["Email", "OTP", "New Password", "Done"];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((label, i) => (
            <React.Fragment key={label}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors
                    ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"}`}
                >
                  {step > i + 1 ? "✓" : i + 1}
                </div>
                <span className="text-xs text-gray-500 hidden sm:block">{label}</span>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${step > i + 1 ? "bg-green-400" : "bg-gray-200"}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <h2 className="text-2xl font-bold mb-2 text-center text-gray-900">
          {step === 1 && "Forgot Password"}
          {step === 2 && "Verify OTP"}
          {step === 3 && "Reset Password"}
          {step === 4 && "All Done!"}
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          {step === 1 && "Enter your registered email to receive an OTP."}
          {step === 2 && `A 6-digit OTP was sent to ${email}.`}
          {step === 3 && "Choose a strong new password."}
          {step === 4 && "Your password has been reset successfully."}
        </p>

        {/* Global success / error banners */}
        {message && (
          <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {message}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* ── Step 1: Email ─────────────────────────────── */}
        {step === 1 && (
          <form onSubmit={handleForgotPassword} noValidate>
            <div className="mb-5">
              <label htmlFor="fp-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                id="fp-email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: validateEmail(e.target.value) }));
                }}
                onBlur={() => setFieldErrors((prev) => ({ ...prev, email: validateEmail(email) }))}
                placeholder="you@example.com"
                className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2
                  ${fieldErrors.email ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-indigo-400"}`}
              />
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending OTP…" : "Send OTP"}
            </button>
          </form>
        )}

        {/* ── Step 2: OTP ───────────────────────────────── */}
        {step === 2 && (
          <form onSubmit={handleVerifyForgotPasswordOtp} noValidate>
            <div className="mb-5">
              <label htmlFor="fp-otp" className="block text-sm font-medium text-gray-700 mb-1">
                6-Digit OTP
              </label>
              <input
                type="text"
                id="fp-otp"
                value={otp}
                maxLength={6}
                onChange={(e) => {
                  // Only allow digits via regex
                  const val = e.target.value.replace(/\D/g, "");
                  setOtp(val);
                  if (fieldErrors.otp) setFieldErrors((prev) => ({ ...prev, otp: validateOtp(val) }));
                }}
                onBlur={() => setFieldErrors((prev) => ({ ...prev, otp: validateOtp(otp) }))}
                placeholder="123456"
                className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm tracking-widest font-mono focus:outline-none focus:ring-2
                  ${fieldErrors.otp ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-indigo-400"}`}
              />
              {fieldErrors.otp && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.otp}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Verifying…" : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => { setStep(1); setOtp(""); setFieldErrors({}); setMessage(""); setError(""); }}
              className="mt-3 w-full text-sm text-indigo-600 hover:underline text-center"
            >
              ← Change email / Resend OTP
            </button>
          </form>
        )}

        {/* ── Step 3: New Password ──────────────────────── */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} noValidate>
            <div className="mb-4">
              <label htmlFor="fp-newpw" className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                id="fp-newpw"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (fieldErrors.newPassword) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      newPassword: validatePassword(e.target.value),
                      confirmPassword: validateConfirmPassword(confirmPassword, e.target.value),
                    }));
                  }
                }}
                onBlur={() => setFieldErrors((prev) => ({ ...prev, newPassword: validatePassword(newPassword) }))}
                placeholder="••••••••"
                className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2
                  ${fieldErrors.newPassword ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-indigo-400"}`}
              />
              {fieldErrors.newPassword && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.newPassword}</p>
              )}
              {/* Password strength hint */}
              {newPassword && !fieldErrors.newPassword && (
                <p className="mt-1 text-xs text-green-600">✓ Strong password</p>
              )}
            </div>
            <div className="mb-5">
              <label htmlFor="fp-confirmpw" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                id="fp-confirmpw"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (fieldErrors.confirmPassword) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      confirmPassword: validateConfirmPassword(e.target.value, newPassword),
                    }));
                  }
                }}
                onBlur={() =>
                  setFieldErrors((prev) => ({
                    ...prev,
                    confirmPassword: validateConfirmPassword(confirmPassword, newPassword),
                  }))
                }
                placeholder="••••••••"
                className={`block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2
                  ${fieldErrors.confirmPassword ? "border-red-400 focus:ring-red-300" : "border-gray-300 focus:ring-indigo-400"}`}
              />
              {fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>
              )}
              {confirmPassword && !fieldErrors.confirmPassword && (
                <p className="mt-1 text-xs text-green-600">✓ Passwords match</p>
              )}
            </div>

            {/* Password rules checklist */}
            <ul className="mb-5 space-y-1 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
              {passwordRules.map((rule) => (
                <li key={rule.label} className={rule.test(newPassword) ? "text-green-600" : ""}>
                  {rule.test(newPassword) ? "✓" : "○"} {rule.label}
                </li>
              ))}
            </ul>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}

        {/* ── Step 4: Success ───────────────────────────── */}
        {step === 4 && (
          <div className="text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-lg font-semibold text-gray-900">Password Reset Successful</h3>
            <p className="mt-2 text-sm text-gray-600">
              You can now log in with your new password.
            </p>
            <a
              href="/login"
              className="mt-6 inline-block bg-indigo-600 text-white py-2.5 px-8 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Go to Login
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;