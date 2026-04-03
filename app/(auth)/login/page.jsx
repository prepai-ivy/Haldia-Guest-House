"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import Notification from "@/components/ui/Notification";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(email, password);

      if (result.success) {
        setNotification({
          type: "success",
          title: "Login Successful",
          message: "Redirecting to dashboard...",
        });

        setTimeout(() => {
          router.push("/dashboard");
        }, 1200);
      } else {
        setNotification({
          type: "error",
          title: "Login Failed",
          message: result.error || "Invalid credentials",
        });
      }
    } catch (_err) {
      setNotification({
        type: "error",
        title: "Server Error",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
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
              Streamlined room allocation, real-time availability tracking, and
              seamless booking management for all guest houses.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col bg-background">
        {/* Mobile: gradient header with logo overlapped by card */}
        <div className="lg:hidden relative">
          <div className="gradient-header flex flex-col items-center justify-center pt-14 pb-24 px-8">
            <Image src="/logo.png" alt="Lalbaba Guest House" width={160} height={160} />
            <p className="text-white/70 text-sm mt-3 tracking-wide">Guest House Management System</p>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-background rounded-t-3xl" />
        </div>

        <div className="w-full flex-1 flex items-center lg:items-center justify-center px-6 lg:px-8 -mt-4 lg:mt-0">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl p-8 shadow-elevated border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-muted-foreground mb-8">
              Sign in to access your dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="text-sm text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center text-sm text-muted-foreground mt-4">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => router.push("/signup")}
                  className="text-primary hover:underline font-medium"
                >
                  Create account
                </button>
              </div>
            </form>
          </div>
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
