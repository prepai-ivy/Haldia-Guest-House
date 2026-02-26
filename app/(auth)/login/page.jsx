"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2 } from "lucide-react";
import Notification from "@/components/ui/Notification";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notification, setNotification] = useState(null);
  const [loading, setLoading] = useState(false);

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
    } catch (err) {
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

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold text-foreground">Lalbaba</h1>
            <p className="text-primary text-sm">ENGINEERING GROUP</p>
          </div>

          <div className="bg-card rounded-2xl p-8 shadow-elevated border border-border">
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              Welcome back
            </h2>
            <p className="text-muted-foreground mb-8">
              Sign in to access your dashboard
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@lalbaba.com"
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

                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11"
                />
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
