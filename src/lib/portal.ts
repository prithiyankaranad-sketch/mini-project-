import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { requireSupabase } from "./supabase";
import type { Json } from "../types/database";
export async function publicQuery<T>(
  resource: string,
  args: Record<string, Json>,
  schema: z.ZodType<T>,
): Promise<T> {
  const { data, error } = await requireSupabase().rpc("portal_public", {
    resource,
    args,
  });
  if (error) throw error;
  return schema.parse(data);
}
export async function privateQuery<T>(
  resource: string,
  args: Record<string, Json>,
  schema: z.ZodType<T>,
): Promise<T> {
  const { data, error } = await requireSupabase().rpc("portal_read", {
    resource,
    args,
  });
  if (error) throw error;
  return schema.parse(data);
}
export async function command<T = Record<string, unknown>>(
  operation: string,
  payload: Record<string, Json>,
  schema?: z.ZodType<T>,
): Promise<T> {
  const { data, error } = await requireSupabase().rpc("portal_command", {
    operation,
    payload,
  });
  if (error) throw error;
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "error" in data
  )
    throw new Error(String(data.error));
  return schema ? schema.parse(data) : (data as unknown as T);
}
export function useRemote<T>(load: () => Promise<T>, key: string) {
  const loader = useRef(load);
  loader.current = load;
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string;
  }>({ data: null, loading: true, error: "" });
  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: "" });
    void loader
      .current()
      .then((data) => {
        if (!cancelled) setState({ data, loading: false, error: "" });
      })
      .catch((error) => {
        if (!cancelled)
          setState({
            data: null,
            loading: false,
            error: error instanceof Error ? error.message : "Request failed.",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [key, revision]);
  return { ...state, reload: () => setRevision((v) => v + 1) };
}
export function institutionDate(value: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}
export function institutionInput(value: string): string {
  const p = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Asia/Kolkata",
  }).formatToParts(new Date(value));
  const v = (k: string) => p.find((x) => x.type === k)?.value;
  return `${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}`;
}
export function institutionToUtc(value: string): string {
  const date = new Date(`${value}:00+05:30`);
  if (!Number.isFinite(date.getTime())) throw new Error("Invalid date/time");
  return date.toISOString();
}
export function csvContent(rows: Record<string, unknown>[]): string {
  if (!rows.length) throw new Error("No records to export.");
  const keys = Object.keys(rows[0]!);
  const cell = (v: unknown) => {
    let s = typeof v === "object" ? JSON.stringify(v) : String(v ?? "");
    if (/^[\s]*[=+\-@\t\r]/.test(s)) s = "'" + s;
    return '"' + s.replaceAll('"', '""') + '"';
  };
  const content = [
    keys.map(cell).join(","),
    ...rows.map((row) => keys.map((k) => cell(row[k])).join(",")),
  ].join("\r\n");
  return content;
}
export function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  const url = URL.createObjectURL(
    new Blob(["\ufeff" + csvContent(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
