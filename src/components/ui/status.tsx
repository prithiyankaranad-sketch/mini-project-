import { LoaderCircle, ShieldAlert } from "lucide-react";
export function Loading({ text = "Loading your account…" }: { text?: string }) {
  return (
    <div className="status" role="status">
      <LoaderCircle className="spinner" size={22} />
      {text}
    </div>
  );
}
export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="notice notice-error" role="alert">
      <ShieldAlert size={20} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
export function SuccessMessage({ message }: { message: string }) {
  return (
    <div className="notice notice-success" role="status">
      {message}
    </div>
  );
}
export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "The request failed. Please retry.";
}
