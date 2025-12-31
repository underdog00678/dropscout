"use client";

type ToastProps = {
  message: string;
};

export default function Toast({ message }: ToastProps) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-lg"
      role="status"
      aria-live="polite"
    >
      {message}
    </div>
  );
}
