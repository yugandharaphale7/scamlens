"use client";

import { useMemo, useState } from "react";
import { demos } from "@/lib/demos";
import type { AnalysisResult, OutputLanguage } from "@/lib/analysis";

const inputTabs = [
  { id: "text", label: "Paste text" },
  { id: "image", label: "Upload screenshot" },
  { id: "url", label: "Enter URL" },
] as const;
type InputType = (typeof inputTabs)[number]["id"];

const labels: Record<OutputLanguage, Record<string, string>> = {
  en: { analyze: "Analyze with ScamLens", intro: "Scan a message, screenshot, or public webpage. ScamLens separates claims from evidence so you can verify safely.", privacy: "Privacy-first design", how: "How ScamLens works", risk: "Potential risk indicators detected", tactics: "Psychological tactics detected", claims: "Claims requiring verification", next: "Safe next steps", extracted: "Extracted content" },
  hi: { analyze: "ScamLens से विश्लेषण करें", intro: "संदेश, स्क्रीनशॉट या सार्वजनिक वेबपेज स्कैन करें। ScamLens दावों और सबूत को अलग करता है ताकि आप सुरक्षित रूप से जाँच कर सकें।", privacy: "गोपनीयता-प्रथम डिज़ाइन", how: "ScamLens कैसे काम करता है", risk: "संभावित जोखिम संकेत मिले", tactics: "मनोवैज्ञानिक तरीके", claims: "जिन दावों की जाँच ज़रूरी है", next: "सुरक्षित अगले कदम", extracted: "निकाली गई सामग्री" },
  mr: { analyze: "ScamLens ने विश्लेषण करा", intro: "मेसेज, स्क्रीनशॉट किंवा सार्वजनिक वेबपेज स्कॅन करा. सुरक्षित पडताळणीसाठी ScamLens दावे आणि पुरावे वेगळे दाखवते.", privacy: "गोपनीयता-प्रथम डिझाइन", how: "ScamLens कसे काम करते", risk: "संभाव्य जोखीम संकेत सापडले", tactics: "मानसिक प्रभावाचे तंत्र", claims: "पडताळणी आवश्यक असलेले दावे", next: "सुरक्षित पुढील पावले", extracted: "मिळालेला मजकूर" },
};

function Attention({ level }: { level: AnalysisResult["attention_level"] }) {
  return <div className="attention"><small>Attention level</small><strong>{level}</strong></div>;
}

function Results({ result, language, onReset }: { result: AnalysisResult; language: OutputLanguage; onReset: () => void }) {
  const copy = labels[language];
  return (
    <section className="results" aria-live="polite">
      {result.mode === "demo" && <div className="demo-label">◉ Demo Scenario · pre-generated</div>}
      {result.mode === "limited" && <div className="demo-label">◌ Limited local analysis · live AI not configured</div>}
      <div className="result-overview">
        <div><h2>{copy.risk}</h2><p>{result.summary}</p></div><Attention level={result.attention_level} />
      </div>
      {result.extracted_content && <div className="result-block"><h3>{copy.extracted}</h3><p className="evidence">{result.extracted_content.slice(0, 900)}{result.extracted_content.length > 900 ? "…" : ""}</p><p className="helper">Source: {result.source_url || "uploaded screenshot"}. This is content extraction, not proof of any claim.</p></div>}
      <div className="result-block"><h3>{copy.risk}</h3><p className="block-intro">The attention level is a communication aid. It does not prove that content is fraudulent.</p>{result.indicators.length ? <div className="indicator-list">{result.indicators.map((item, index) => <article className="indicator" key={`${item.category}-${index}`}><div className="indicator-top"><div className="indicator-title"><span className="flag">⚑</span>{item.category}</div><span className={`severity ${item.severity}`}>{item.severity}</span></div><div className="evidence">“{item.evidence}”</div><div className="indicator-explain"><div><strong>Why this matters</strong>{item.explanation}</div><div><strong>What to verify</strong>{item.verification_action}</div></div></article>)}</div> : <p className="empty-state">No obvious warning pattern was found in this pass. That is not proof that the content is safe; verify important claims independently.</p>}</div>
      <div className="result-block"><h3>{copy.tactics}</h3><p className="block-intro">These communication techniques may influence decisions. Their presence alone does not prove fraud.</p>{result.manipulation_tactics.length ? <div className="tactic-list">{result.manipulation_tactics.map((tactic, index) => <div className="tactic" key={`${tactic.type}-${index}`}><strong>{tactic.type.replace("_", " ")}</strong><p><b>Evidence:</b> “{tactic.evidence}”<br />{tactic.explanation}</p></div>)}</div> : <p className="empty-state">No clear manipulation tactic was identified.</p>}</div>
      <div className="result-block"><h3>{copy.claims}</h3><div className="claim-table">{result.claims.map((claim, index) => <article className="claim" key={`${claim.claim}-${index}`}><div><p>{claim.claim}</p><small><b>Entity:</b> {claim.entity}<br /><b>Evidence:</b> {claim.evidence}<br /><b>Source:</b> {claim.source}</small></div><span className={`status ${claim.status}`}>{claim.status.replace("_", " ")}</span></article>)}</div></div>
      <div className="result-block"><h3>{copy.next}</h3><div className="steps-list">{result.recommended_verification_steps.map((step, index) => <div className="step" key={index}>{index + 1}. {step}</div>)}</div></div>
      <div className="safety">{result.safety_notice}</div>
      <button className="button-quiet" onClick={onReset}>← Analyze another piece of content</button>
    </section>
  );
}

export default function HomePage() {
  const [tab, setTab] = useState<InputType>("text");
  const [language, setLanguage] = useState<OutputLanguage>("en");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [imageData, setImageData] = useState("");
  const [imageName, setImageName] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const copy = labels[language];

  const selectedDemo = useMemo(() => demos.find((demo) => demo.id === "guaranteed-return"), []);

  function reset() { setResult(null); setError(""); }

  function loadDemo(id: string) {
    const demo = demos.find((item) => item.id === id);
    if (!demo) return;
    setText(demo.input); setTab("text"); setResult(demo.result); setError("");
    window.requestAnimationFrame(() => document.getElementById("analyze")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  function handleImage(file?: File) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setError("Upload a PNG, JPG, JPEG, or WebP screenshot."); return; }
    if (file.size > 5_000_000) { setError("This screenshot is too large. Please upload an image under 5 MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setImageData(String(reader.result)); setImageName(file.name); setError(""); };
    reader.onerror = () => setError("ScamLens could not read that screenshot. Please choose a clearer local image file.");
    reader.readAsDataURL(file);
  }

  async function analyze() {
    setError(""); setResult(null); setLoading(true);
    try {
      const payload: Record<string, string> = { inputType: tab, outputLanguage: language };
      if (tab === "text") payload.text = text;
      if (tab === "url") payload.url = url;
      if (tab === "image") { payload.imageData = imageData; payload.mimeType = imageData.split(";")[0]?.replace("data:", "") || "image/png"; }
      const response = await fetch("/api/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error || "ScamLens could not analyze that input.");
      setResult(data as AnalysisResult);
    } catch (caught) { setError(caught instanceof Error ? caught.message : "ScamLens could not analyze that input. Please try again."); }
    finally { setLoading(false); }
  }

  return <main className="site-shell">
    <header className="topbar"><a className="brand" href="#top" aria-label="ScamLens home"><span className="brand-mark" aria-hidden="true" /> SCAMLENS</a><nav className="nav"><a href="#how">How it works</a><a href="#detects">What it detects</a><a href="#privacy">Privacy</a><a href="#analyze" className="nav-cta">Analyze content</a></nav></header>
    <section className="hero" id="top"><div><div className="eyebrow">Investor safety / Bharat-first</div><h1>SCAMLENS<span>Scan. Understand. Verify.</span></h1><p className="hero-subtitle">Understand suspicious financial content before you act.</p><p className="hero-copy">ScamLens uses explainable AI to identify potential warning signs, extract financial claims, explain manipulation tactics, and guide you toward safer verification.</p><div className="hero-actions"><a className="button-primary" href="#analyze">Analyze Content</a><button className="button-secondary" onClick={() => loadDemo(selectedDemo?.id || "guaranteed-return")}>Try Demo</button></div><div className="hero-note"><span className="pulse-dot" /> No account required · no sensitive credentials needed</div></div><div className="hero-scan" aria-label="ScamLens visual preview"><div className="scan-top"><span>Signal lens / 001</span><span>Evidence first</span></div><div className="scan-grid" /><div className="scan-lens" /><div className="scan-badge"><strong>05</strong> warning patterns mapped</div></div></section>
    <div className="analyzer-wrap" id="analyze"><div className="analyzer-card"><div className="analyzer-head"><div><div className="eyebrow">Live analysis desk</div><h2>What would you like to check?</h2></div><label className="helper">Output language<select className="language-select" value={language} onChange={(event) => setLanguage(event.target.value as OutputLanguage)}><option value="en">English</option><option value="hi">हिन्दी</option><option value="mr">मराठी</option></select></label></div><div className="tabs" role="tablist">{inputTabs.map((item) => <button role="tab" aria-selected={tab === item.id} className={`tab ${tab === item.id ? "active" : ""}`} key={item.id} onClick={() => { setTab(item.id); setError(""); }}>{item.label}</button>)}</div><div className="analyzer-body">{tab === "text" && <><textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Paste a suspicious investment message here..." maxLength={18000} aria-label="Suspicious financial message" /><div className="input-meta"><span>Include the exact wording when possible.</span><span>{text.length.toLocaleString()} / 18,000</span></div></>}{tab === "url" && <><input className="url-input" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com/public-page" aria-label="Public URL" /><p className="helper" style={{ marginTop: 10 }}>Only publicly accessible HTTP(S) pages are retrieved. ScamLens will say when a page could not be independently analyzed.</p></>}{tab === "image" && <div className="dropzone">{imageData ? <><img className="preview" src={imageData} alt="Uploaded suspicious message preview" /><strong>{imageName}</strong><span>Ready to analyze. The image is not saved by ScamLens.</span></> : <><div><div className="drop-icon">⌁</div><strong>Upload a screenshot of a suspicious financial message</strong><span>PNG, JPG, JPEG or WebP · up to 5 MB</span><input className="file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => handleImage(event.target.files?.[0])} aria-label="Upload screenshot" /></div></>}</div>}{error && <div className="error-box" role="alert">{error}</div>}<div className="analyze-actions"><span className="helper">{loading ? <span className="loading-note"><span className="spinner" /> Reviewing claims and evidence…</span> : copy.intro}</span><button className="button-primary" onClick={analyze} disabled={loading}>{loading ? "Analyzing…" : copy.analyze}</button></div>{result && <Results result={result} language={language} onReset={reset} />}</div></div></div>
    <div className="privacy-bar" id="privacy"><div className="privacy-bar-inner"><strong>{copy.privacy}.</strong> Do not upload OTPs, passwords, PINs, bank credentials, card details, or other sensitive financial information. ScamLens does not require account creation for core analysis and does not intentionally store submitted messages or screenshots. When live AI is enabled, submitted content is sent to Gemini for analysis and is not intentionally stored by this app.</div></div>
    <section className="section" id="how"><div className="section-heading"><div className="eyebrow">A guided safety check</div><h2>{copy.how}</h2><p>From a forwarded message to a clearer next step, ScamLens keeps the reasoning visible and the language simple.</p></div><div className="feature-grid">{[{ n: "01", title: "Submit content", body: "Paste text, upload a screenshot, or enter a public URL." }, { n: "02", title: "Extract claims", body: "Separate the message into individual promises, requests, and entities." }, { n: "03", title: "Detect warning signs", body: "Look for urgency, guaranteed returns, authority claims, payment requests, and more." }, { n: "04", title: "Verify important claims", body: "Keep AI interpretation separate from real external evidence." }, { n: "05", title: "Explain findings", body: "Show exact snippets, why they matter, and the uncertainty that remains." }, { n: "06", title: "Guide safe next steps", body: "Point toward official sources and safer behavior without telling you what to invest in." }].map((item) => <article className="feature-card" key={item.n}><span className="number">{item.n}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></section>
    <section className="section-band" id="detects"><div className="section-inner"><div className="section-heading"><div className="eyebrow" style={{ color: "var(--amber)" }}>Signals, not verdicts</div><h2>What it detects</h2><p>ScamLens is designed to help a first-time investor slow down, see the technique, and know what to verify next.</p></div><div className="dark-grid">{[{ title: "Financial claims", body: "Guaranteed or unrealistic returns, deposits, fees, and promises that need evidence." }, { title: "Pressure patterns", body: "Urgency, scarcity, fear, greed, social proof, and trust exploitation." }, { title: "Authority cues", body: "Regulatory names, impersonation, suspicious contacts, and unverifiable approvals." }].map((item) => <article className="dark-card" key={item.title}><h3>{item.title}</h3><p>{item.body}</p></article>)}</div></div></section>
    <section className="section"><div className="section-heading"><div className="eyebrow">Try five judge-ready scenarios</div><h2>Demo mode, without the API key.</h2><p>Explore pre-generated examples to understand the product in under 30 seconds. Every example is clearly labeled and is not live verification.</p></div><div className="demo-strip">{demos.map((demo) => <button className="demo-chip" key={demo.id} onClick={() => loadDemo(demo.id)}>◉ {demo.name}</button>)}</div></section>
    <footer className="footer"><div><strong>SCAMLENS</strong> · Scan. Understand. Verify.</div><div>ScamLens provides informational risk analysis and does not provide investment advice, predict investment outcomes, or determine with certainty whether content is fraudulent. Always independently verify important financial claims through authoritative sources.</div></footer>
  </main>;
}
