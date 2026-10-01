import { NextResponse } from "next/server";
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { load } from "cheerio";
import { localAnalyze, normalizeAnalysis, type OutputLanguage } from "@/lib/analysis";

export const runtime = "nodejs";

const MAX_TEXT = 18000;
const MAX_PAGE_BYTES = 120000;
const MAX_IMAGE_BYTES = 5_000_000;
const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function stripCodeFence(value: string) {
  return value.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
}

function isPrivateIp(address: string) {
  const normalized = address.toLowerCase().replace(/^\[|\]$/g, "");
  if (isIP(normalized) === 4) {
    const [a, b] = normalized.split(".").map(Number);
    return a === 0 || a === 10 || a === 127 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19)) || a >= 224;
  }
  if (isIP(normalized) === 6) {
    if (normalized === "::" || normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || /^(fe8|fe9|fea|feb)/.test(normalized)) return true;
    if (normalized.startsWith("::ffff:")) return isPrivateIp(normalized.slice(7));
  }
  return false;
}

async function assertPublicUrl(url: URL) {
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname.endsWith(".local") || hostname.endsWith(".internal") || hostname.endsWith(".home.arpa")) throw new Error("private-host");
  if (isPrivateIp(hostname)) throw new Error("private-address");
  try {
    const records = await lookup(hostname, { all: true, verbatim: true });
    if (!records.length || records.some((record) => isPrivateIp(record.address))) throw new Error("private-address");
  } catch {
    throw new Error("unresolvable-host");
  }
}

async function readBoundedText(response: Response) {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_PAGE_BYTES) throw new Error("page-too-large");
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}

function htmlToText(html: string) {
  const $ = load(html);
  $("script, style, noscript, svg, nav, footer").remove();
  const title = $("title").first().text().trim();
  const body = $("main").text() || $("article").text() || $("body").text();
  const text = body.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
  return { title, text };
}

async function fetchUrl(url: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    let current = new URL(url);
    for (let hop = 0; hop < 4; hop += 1) {
      await assertPublicUrl(current);
      const response = await fetch(current, { signal: controller.signal, headers: { "User-Agent": "ScamLens/1.0 content-safety-reader" }, redirect: "manual" });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        if (!location) throw new Error("redirect-without-location");
        current = new URL(location, current);
        continue;
      }
      if (!response.ok) throw new Error("non-2xx");
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("text/plain")) throw new Error("unsupported-content");
      return htmlToText(await readBoundedText(response));
    }
    throw new Error("too-many-redirects");
  } finally {
    clearTimeout(timer);
  }
}

function promptFor(language: OutputLanguage, content: string, sourceDescription: string) {
  const languageName = language === "hi" ? "Hindi" : language === "mr" ? "Marathi" : "English";
  return `You are ScamLens, an investor-safety and financial-content-literacy assistant for Indian retail investors. Analyze the supplied ${sourceDescription} and return ONLY valid JSON, with no markdown fences, matching this shape: {"attention_level":"HIGH|MEDIUM|LOW","summary":"string","detected_language":"string","indicators":[{"category":"string","severity":"HIGH|MEDIUM|LOW","evidence":"exact quote from content","explanation":"simple explanation","verification_action":"safe verification step"}],"claims":[{"claim":"individual claim","entity":"entity or Not independently identified","status":"VERIFIED|UNVERIFIED|UNCLEAR|NOT_CHECKED","evidence":"exact content or No evidence","source":"actual source used or No external source checked"}],"manipulation_tactics":[{"type":"urgency|greed|fear|authority|scarcity|social_proof|other","evidence":"exact quote","explanation":"educational explanation"}],"recommended_verification_steps":["string"],"safety_notice":"string"}. Explain in ${languageName}. Never provide BUY, SELL, HOLD, stock-price predictions, return predictions, portfolio recommendations, broker or financial-product recommendations, or encouragement to speculate. Do not say fraud or scam is proven. Use uncertainty-aware language. Do not invent a source, URL, regulator approval, or verification result. Only mark a claim VERIFIED when actual authoritative evidence is present; otherwise use UNVERIFIED, UNCLEAR, or NOT_CHECKED. Never ask the user for OTPs, passwords, PINs, bank credentials, or card details. A warning sign is a reason to verify, not proof by itself. Content:\n${content}`;
}

async function callGemini(prompt: string, image?: { mimeType: string; data: string }) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const parts: Array<Record<string, unknown>> = [{ text: prompt }];
  if (image) parts.push({ inline_data: { mime_type: image.mimeType, data: image.data } });
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts }], generationConfig: { temperature: 0.1, responseMimeType: "application/json" } }),
  });
  if (!response.ok) throw new Error("AI request failed");
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const text = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!text) throw new Error("AI response was empty");
  return JSON.parse(stripCodeFence(text));
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as { inputType?: string; text?: string; url?: string; imageData?: string; mimeType?: string; outputLanguage?: OutputLanguage };
    const language: OutputLanguage = body.outputLanguage === "hi" || body.outputLanguage === "mr" ? body.outputLanguage : "en";
    const inputType = body.inputType;

    if (inputType === "text") {
      const text = (body.text || "").trim();
      if (text.length < 8) return jsonError("Paste a little more content so ScamLens can inspect the claim.");
      if (text.length > MAX_TEXT) return jsonError("This message is too long. Please analyze a shorter excerpt.");
      if (!process.env.GEMINI_API_KEY) return NextResponse.json(localAnalyze(text, language, "limited"));
      try {
        const result = normalizeAnalysis(await callGemini(promptFor(language, text, "message")), text, language);
        if (!result) return NextResponse.json(localAnalyze(text, language, "limited"));
        return NextResponse.json(result);
      } catch {
        return NextResponse.json({ error: "Live AI analysis is temporarily unavailable. Please try again or use a Demo Scenario." }, { status: 502 });
      }
    }

    if (inputType === "url") {
      const url = (body.url || "").trim();
      let parsed: URL;
      try { parsed = new URL(url); } catch { return jsonError("Enter a complete public URL beginning with http:// or https://."); }
      if (!["http:", "https:"].includes(parsed.protocol)) return jsonError("Only public http:// or https:// URLs can be analyzed.");
      let page: { title: string; text: string };
      try { page = await fetchUrl(parsed.toString()); } catch { return NextResponse.json({ error: "Unable to retrieve this webpage. Its contents could not be independently analyzed." }, { status: 422 }); }
      if (page.text.length < 30) return NextResponse.json({ error: "This webpage did not contain enough readable text to analyze independently." }, { status: 422 });
      if (!process.env.GEMINI_API_KEY) return NextResponse.json({ ...localAnalyze(page.text, language, "limited"), extracted_content: page.text, source_url: parsed.toString() });
      try {
        const result = normalizeAnalysis(await callGemini(promptFor(language, `Page title: ${page.title}\nPage text: ${page.text}`, "public webpage")), page.text, language);
        if (!result) return NextResponse.json(localAnalyze(page.text, language, "limited"));
        return NextResponse.json({ ...result, extracted_content: page.text, source_url: parsed.toString() });
      } catch {
        return NextResponse.json({ error: "Live AI analysis is temporarily unavailable. The webpage was retrieved but could not be safely summarized." }, { status: 502 });
      }
    }

    if (inputType === "image") {
      const imageData = body.imageData || "";
      const match = imageData.match(/^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i);
      if (!match) return jsonError("Upload a PNG, JPG, JPEG, or WebP screenshot.");
      if (Buffer.byteLength(match[2], "base64") > MAX_IMAGE_BYTES) return jsonError("This screenshot is too large. Please upload an image under 5 MB.");
      if (!process.env.GEMINI_API_KEY) return NextResponse.json({ error: "Screenshot analysis needs a live AI key. You can still try all Demo Scenarios without one." }, { status: 503 });
      try {
        const result = normalizeAnalysis(await callGemini(promptFor(language, "Read the visible text and visual context in the attached screenshot. If the text is not reliably readable, return no claims and explain that the image needs to be clearer; do not invent quotes.", "screenshot"), { mimeType: match[1].replace("jpg", "jpeg"), data: match[2] }), "", language);
        if (!result) return NextResponse.json({ error: "Unable to reliably read this image. Please upload a clearer screenshot." }, { status: 422 });
        return NextResponse.json(result);
      } catch {
        return NextResponse.json({ error: "Unable to complete screenshot analysis right now. Please upload a clearer image or use a Demo Scenario." }, { status: 502 });
      }
    }

    return jsonError("Choose text, screenshot, or URL before analyzing.");
  } catch {
    return NextResponse.json({ error: "ScamLens could not process that request. Please try again with a smaller input." }, { status: 500 });
  }
}
