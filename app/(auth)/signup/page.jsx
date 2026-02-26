"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2 } from "lucide-react";
import { signup } from "@/services/authApi";
import Notification from "@/components/ui/Notification";

export default function Signup() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    department: "",
  });

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSendOtp = async () => {
    if (!form.email) {
      setNotification({
        type: "error",
        title: "Email Required",
        message: "Enter email first",
      });
      return;
    }

    setLoading(true);

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/auth/signup/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email }),
        }
      );

      setStep(2);

      setNotification({
        type: "success",
        title: "OTP Sent",
        message: "Check your email",
      });
    } catch (err) {
      setNotification({
        type: "error",
        title: "Failed",
        message: "Could not send OTP",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"}/auth/signup/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: form.email,
            otp,
          }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message);
      }

      setEmailVerified(true);

      setNotification({
        type: "success",
        title: "Verified",
        message: "Email verified successfully",
      });
    } catch (err) {
      setNotification({
        type: "error",
        title: "Invalid OTP",
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!emailVerified) {
      setNotification({
        type: "error",
        title: "Email Not Verified",
        message: "Please verify your email first",
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setNotification({
        type: "error",
        title: "Password Mismatch",
        message: "Passwords do not match.",
      });
      return;
    }

    if (form.password.length < 6) {
      setNotification({
        type: "error",
        title: "Weak Password",
        message: "Password must be at least 6 characters.",
      });
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...payload } = form;
      await signup(payload);

      setNotification({
        type: "success",
        title: "Account Created",
        message: "Your account has been created successfully.",
      });

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      setNotification({
        type: "error",
        title: "Signup Failed",
        message: err.message || "Something went wrong.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-header items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Lalbaba</h1>
          <p className="text-primary-foreground/80 text-lg mb-2">
            ENGINEERING GROUP
          </p>
          <p className="text-primary-foreground/60 mt-6">
            Guest House Inventory Management System
          </p>
          <div className="mt-12 p-6 bg-white/10 rounded-xl backdrop-blur-sm">
            <p className="text-white/90 text-sm leading-relaxed">
              Streamlined room allocation, real-time availability tracking, and
              seamless booking management for all guest houses.
            </p>
          </div>
        </div>
      </div>

      {/* Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md bg-card p-8 rounded-2xl border">
          <h2 className="text-2xl font-semibold mb-2">Create account</h2>
          <p className="text-muted-foreground mb-6">Sign up as a customer</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  required
                  disabled={emailVerified}
                />
                {!emailVerified && (
                  <Button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={loading}
                  >
                    Verify
                  </Button>
                )}
              </div>
            </div>

            {step === 2 && !emailVerified && (
              <div className="space-y-2">
                <Label>Enter OTP</Label>
                <div className="flex gap-2">
                  <Input
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="6 digit OTP"
                  />
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={loading}
                  >
                    Verify OTP
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Department</Label>
              <Input
                value={form.department}
                onChange={(e) => handleChange("department", e.target.value)}
                placeholder="Engineering / HR / Admin"
              />
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => handleChange("password", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                value={form.confirmPassword}
                onChange={(e) =>
                  handleChange("confirmPassword", e.target.value)
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground mt-6 text-center">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-primary hover:underline"
            >
              Sign in
            </button>
          </p>
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
