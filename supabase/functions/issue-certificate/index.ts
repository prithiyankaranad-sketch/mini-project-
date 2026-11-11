import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { PDFDocument, rgb } from "npm:pdf-lib@1.17.1";
import fontkit from "npm:@pdf-lib/fontkit@1.1.1";
import { environment, headers, json } from "../_shared/http.ts";
Deno.serve(async (request) => {
  let h: Record<string, string>;
  try {
    h = headers(request);
  } catch {
    return new Response("Origin denied", { status: 403 });
  }
  if (request.method === "OPTIONS") return new Response(null, { headers: h });
  if (request.method !== "POST")
    return json({ error: "POST required" }, 405, h);
  try {
    const url = environment("SUPABASE_URL");
    const key = environment("SUPABASE_ANON_KEY");
    const authorization = request.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer "))
      return json({ error: "Authentication required" }, 401, h);
    const userClient = createClient(url, key, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: identity, error: authError } =
      await userClient.auth.getUser();
    if (authError || !identity.user)
      return json({ error: "Invalid authentication" }, 401, h);
    const body = await request.json();
    const { data: cert, error } = await userClient.rpc("portal_command", {
      operation: "certificate_prepare",
      payload: body,
    });
    if (error || cert?.error)
      return json({ error: error?.message ?? String(cert.error) }, 403, h);
    if (cert.status === "issued")
      return json({ id: cert.id, status: "issued" }, 200, h);
    const service = createClient(
      url,
      environment("SUPABASE_SERVICE_ROLE_KEY"),
      { auth: { persistSession: false } },
    );
    const pdf = await PDFDocument.create();
    pdf.registerFontkit(fontkit);
    const fontBytes = await Deno.readFile(
      new URL("../_shared/NotoSans-Regular.ttf", import.meta.url),
    );
    const coverage = fontkit.create(fontBytes);
    for (const value of Object.values(
      cert.snapshot as Record<string, string>,
    )) {
      for (const character of value) {
        if (
          !/\s/.test(character) &&
          !coverage.hasGlyphForCodePoint(character.codePointAt(0)!)
        )
          return json(
            {
              error:
                "The approved PDF font does not support all characters. Configure an institution-approved font covering the exact participant and template text; no name was substituted.",
            },
            422,
            h,
          );
      }
    }
    const font = await pdf.embedFont(fontBytes, { subset: true });
    let page = pdf.addPage([842, 595]);
    const blue = rgb(0.03, 0.08, 0.17);
    const accent = rgb(0.08, 0.39, 0.95);
    page.drawRectangle({
      x: 20,
      y: 20,
      width: 802,
      height: 555,
      borderColor: accent,
      borderWidth: 2,
    });
    function centered(text: string, y: number, size: number, max = 740) {
      // Unsupported characters fail explicitly; no substituted/fabricated participant name.
      while (font.widthOfTextAtSize(text, size) > max && size > 12) size -= 1;
      if (font.widthOfTextAtSize(text, size) > max)
        throw new Error("Approved text exceeds certificate layout bounds");
      page.drawText(text, {
        x: (842 - font.widthOfTextAtSize(text, size)) / 2,
        y,
        size,
        font,
        color: blue,
      });
    }
    function wrap(text: string, width: number, size: number) {
      const lines: string[] = [];
      let line = "";
      for (const word of text.split(/\s+/)) {
        if (font.widthOfTextAtSize(word, size) > width)
          throw new Error(
            "Approved text contains a word wider than the certificate layout",
          );
        const next = line ? line + " " + word : word;
        if (font.widthOfTextAtSize(next, size) > width && line) {
          lines.push(line);
          line = word;
        } else line = next;
      }
      if (line) lines.push(line);
      return lines;
    }
    const issuedAt = new Date();
    const s = cert.snapshot as Record<string, string>;
    centered(s.institution, 520, 20);
    centered(
      `Certificate of ${String(cert.type).replaceAll("_", " ")}`,
      460,
      30,
    );
    centered("This certificate is presented to", 410, 14);
    centered(s.participant, 355, 32);
    centered(s.event, 310, 22);
    const bodyLines = wrap(s.body, 720, 13);
    let y = 270;
    for (const line of bodyLines) {
      if (y < 175) {
        page = pdf.addPage([842, 595]);
        y = 520;
      }
      page.drawText(line, { x: 60, y, size: 13, font, color: blue });
      y -= 20;
    }
    centered(
      "Issue date: " +
        new Intl.DateTimeFormat("en-IN", {
          dateStyle: "long",
          timeZone: "Asia/Kolkata",
        }).format(issuedAt),
      150,
      11,
    );
    centered(s.signatory_name, 115, 18);
    centered(s.signatory_title, 91, 13);
    const verificationUrl = `${environment("APP_BASE_URL").replace(/\/$/, "")}/verify/${cert.verification_id}`;
    page.drawText(`Certificate ID: ${cert.verification_id}`, {
      x: 60,
      y: 60,
      size: 9,
      font,
      color: blue,
    });
    const verificationLines = wrap(verificationUrl, 720, 9);
    verificationLines.forEach((line, i) =>
      page.drawText(line, {
        x: 60,
        y: 43 - i * 12,
        size: 9,
        font,
        color: blue,
      }),
    );
    pdf.setTitle(`Certificate - ${s.event}`);
    pdf.setSubject(`Approved ${cert.type} certificate`);
    pdf.setCreationDate(issuedAt);
    const path = `${cert.user_id}/${cert.id}.pdf`;
    const { error: uploadError } = await service.storage
      .from("certificates")
      .upload(path, await pdf.save(), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadError) throw uploadError;
    const { error: finishError } = await service.rpc("complete_certificate", {
      certificate_id: cert.id,
      storage_path: path,
      generation_token: cert.generation_lease,
      document_issued_at: issuedAt.toISOString(),
    });
    if (finishError) throw finishError;
    return json({ id: cert.id, status: "issued" }, 200, h);
  } catch (error) {
    console.error(
      "Certificate operation failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return json(
      {
        error:
          "Certificate generation failed. Review server configuration and logs; issuance is not assumed successful.",
      },
      500,
      h,
    );
  }
});
