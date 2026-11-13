const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Each function returns an error message, or "" when the value is fine.

export function checkEmail(email) {
  if (!email.trim()) return "Enter your email.";
  if (!EMAIL_PATTERN.test(email.trim())) return "This does not look like an email address.";
  return "";
}

export function checkName(name) {
  return name.trim().length < 2 ? "Enter your name." : "";
}

export function checkNewPassword(password) {
  return password.length < 8 ? "Use at least 8 characters." : "";
}
