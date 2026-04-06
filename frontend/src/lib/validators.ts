// ═══════════════════════════════════════════════
// SHARED REGEX VALIDATORS
// ═══════════════════════════════════════════════

// Standard email: local@domain.tld
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

// 6-digit numeric OTP
export const OTP_REGEX = /^\d{6}$/;

// Username: 3–30 chars, lowercase alphanumeric + underscores, must start with a letter
export const USERNAME_REGEX = /^[a-z][a-z0-9_]{2,29}$/;

// Full name: 2–50 chars, letters + spaces + hyphens + periods (for "Dr." etc.)
export const FULL_NAME_REGEX = /^[a-zA-Z][a-zA-Z\s.\-']{1,49}$/;

// Password: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char
export const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

// ─── Validator functions (return "" on valid, error message on invalid) ───

export function validateEmail(val: string): string {
  if (!val.trim()) return "Email is required.";
  if (!EMAIL_REGEX.test(val)) return "Enter a valid email (e.g. user@example.com).";
  return "";
}

export function validateOtp(val: string): string {
  if (!val.trim()) return "OTP is required.";
  if (!OTP_REGEX.test(val)) return "OTP must be exactly 6 digits.";
  return "";
}

export function validateUsername(val: string): string {
  if (!val.trim()) return "Username is required.";
  if (val !== val.toLowerCase()) return "Username must be lowercase.";
  if (!USERNAME_REGEX.test(val))
    return "3–30 chars, start with a letter, only letters/digits/underscores.";
  return "";
}

export function validateFullName(val: string): string {
  if (!val.trim()) return "Full name is required.";
  if (!FULL_NAME_REGEX.test(val.trim()))
    return "2–50 chars, letters/spaces/hyphens only.";
  return "";
}

export function validatePassword(val: string): string {
  if (!val) return "Password is required.";
  if (!PASSWORD_REGEX.test(val))
    return "Min 8 chars with uppercase, lowercase, digit & special character.";
  return "";
}

export function validateConfirmPassword(val: string, pw: string): string {
  if (!val) return "Please confirm your password.";
  if (val !== pw) return "Passwords do not match.";
  return "";
}

// ─── Password rule checkers (for live checklists) ───

export const passwordRules = [
  { label: "At least 1 uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { label: "At least 1 lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { label: "At least 1 digit", test: (pw: string) => /\d/.test(pw) },
  { label: "At least 1 special character", test: (pw: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
  { label: "Minimum 8 characters", test: (pw: string) => pw.length >= 8 },
] as const;
