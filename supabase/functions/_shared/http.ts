export function environment(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}
export function headers(request: Request): Record<string, string> {
  const base = new URL(environment("APP_BASE_URL")).origin;
  const origin = request.headers.get("Origin");
  if (origin && origin !== base) throw new Error("Origin denied");
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": base,
    "Access-Control-Allow-Headers":
      "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
    "Cache-Control": "no-store",
  };
}
export const json = (
  data: unknown,
  status: number,
  h: Record<string, string>,
) => new Response(JSON.stringify(data), { status, headers: h });
export const escapeHtml = (input: unknown) =>
  String(input ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
