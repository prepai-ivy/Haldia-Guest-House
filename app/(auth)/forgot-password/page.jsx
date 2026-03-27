"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Notification from "@/components/ui/Notification";
import { apiClient } from "@/lib/apiClient";

export default function ForgotPassword() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // STEP 1 → Send OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient("/auth/send-otp", {
        method: "POST",
        body: { email },
      });

      setStep(2);

      setNotification({
        type: "success",
        title: "OTP Sent",
        message: "Check your email for verification code.",
      });
    } catch (err) {
      setNotification({
        type: "error",
        title: "Failed",
        message: err.message || "Could not send OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  // STEP 2 → Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await apiClient("/auth/verify-otp", {
        method: "POST",
        body: { email, otp },
      });

      setStep(3);

      setNotification({
        type: "success",
        title: "Verified",
        message: "OTP verified successfully.",
      });
    } catch (err) {
      setNotification({
        type: "error",
        title: "Invalid OTP",
        message: err.message || "Please enter correct OTP.",
      });
    } finally {
      setLoading(false);
    }
  };

  // STEP 3 → Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setNotification({
        type: "error",
        title: "Password Mismatch",
        message: "Passwords do not match.",
      });
      return;
    }

    setLoading(true);

    try {
      await apiClient("/auth/reset-password", {
        method: "POST",
        body: { email, otp, password },
      });

      setNotification({
        type: "success",
        title: "Password Updated",
        message: "Your password has been reset successfully.",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setNotification({
        type: "error",
        title: "Failed",
        message: err.message || "Could not reset password.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-header items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="flex items-center justify-center mx-auto mb-6">
            <Image src="/logo.png" alt="Lalbaba Guest House" width={200} height={200} />
          </div>
          <p className="text-primary-foreground/60 mt-6">
            Guest House Inventory Management System
          </p>
          <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
            <p className="text-white/90 text-sm leading-relaxed">
              Secure password recovery and account protection.
            </p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background overflow-y-auto">
        <div className="lg:hidden relative">
          <div className="gradient-header flex flex-col items-center justify-center pt-14 pb-24 px-8">
            <Image src="/logo.png" alt="Lalbaba Guest House" width={160} height={160} />
            <p className="text-white/70 text-sm mt-3 tracking-wide">Guest House Management System</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-background rounded-t-3xl" />
        </div>
        <div className="w-full flex-1 flex items-center lg:items-center justify-center px-6 lg:px-8 -mt-4 lg:mt-0">
        <div className="w-full max-w-md bg-card p-6 lg:p-8 rounded-2xl border">
          <h2 className="text-2xl font-semibold mb-2">Reset Password</h2>
          <p className="text-muted-foreground mb-6">
            {step === 1 && "Enter your email to receive OTP"}
            {step === 2 && "Enter the OTP sent to your email"}
            {step === 3 && "Set your new password"}
          </p>

          {/* STEP 1 */}
          {step === 1 && (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Send OTP"}
              </Button>
            </form>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <div className="space-y-2">
                <Label>OTP</Label>
                <Input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
              </div>

              <Button className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "Verify OTP"}
              </Button>
            </form>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <Button className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          )}

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Remember your password?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-primary hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
        </div>
      </div>

      {notification && (
        <Notification
          type={notification.type}
          title={notification.title}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}
