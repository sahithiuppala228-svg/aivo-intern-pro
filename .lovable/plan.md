

# Add Password Reset Flow

## Problem
Users are getting "Invalid login credentials" because they forgot their passwords. The "Forgot password?" button on the auth page is non-functional — it doesn't trigger any action.

## Solution
Implement a complete password reset flow with two parts:

### 1. Forgot Password Dialog (on Auth page)
- Convert the existing "Forgot password?" button into a trigger for a dialog/modal
- User enters their email address
- Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`
- Shows success message: "Check your email for a password reset link"

### 2. Reset Password Page (`/reset-password`)
- New public route (not behind `ProtectedRoute`)
- Detects `type=recovery` in URL hash (set by the reset email link)
- Shows a form with new password + confirm password fields
- Calls `supabase.auth.updateUser({ password })` to set the new password
- Redirects to `/auth` on success with a toast confirmation

### Files to Modify
- **`src/pages/Auth.tsx`** — Add forgot password dialog with email input and reset request logic
- **`src/pages/ResetPassword.tsx`** — New page for setting a new password after clicking the email link
- **`src/App.tsx`** — Add `/reset-password` as a public route

### No database changes needed — this uses built-in auth functionality.

