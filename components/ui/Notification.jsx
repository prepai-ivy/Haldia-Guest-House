"use client";

import { useEffect, useRef, useState } from "react";
import { X, CheckCircle, AlertCircle } from "lucide-react";

export default function Notification({
  type = "success",
  title,
  message,
  onClose,
  duration = 5000,
}) {
  const [progress, setProgress] = useState(100);

  // Callers typically pass an inline `onClose={() => ...}`, which is a new function
  // reference on every parent re-render (e.g. every keystroke in a form elsewhere on the
  // page). Keeping it in a ref instead of the effect's dependency array means the
  // countdown/progress bar no longer restarts on every unrelated re-render — only when
  // the notification is actually replaced (title/message identity) or unmounted.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const percentage = 100 - (elapsed / duration) * 100;

      setProgress(percentage > 0 ? percentage : 0);
    }, 50);

    const timer = setTimeout(() => {
      onCloseRef.current();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration, title, message]);

  const isSuccess = type === "success";

  return (
    <div className="fixed bottom-5 right-5 z-[9999] animate-fade-in">
      <div
        className={`w-80 rounded-lg shadow-lg border overflow-hidden
        ${isSuccess
            ? "bg-green-50 border-green-200"
            : "bg-red-50 border-red-200"
          }`}
      >
        {/* Content */}
        <div className="p-4 flex gap-3 items-start">
          <div>
            {isSuccess ? (
              <CheckCircle className="text-green-600" size={22} />
            ) : (
              <AlertCircle className="text-red-600" size={22} />
            )}
          </div>

          <div className="flex-1">
            <h4
              className={`font-semibold ${
                isSuccess ? "text-green-700" : "text-red-700"
              }`}
            >
              {title}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {message}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div
            className={`h-1 transition-all duration-50 ${
              isSuccess ? "bg-green-500" : "bg-red-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
