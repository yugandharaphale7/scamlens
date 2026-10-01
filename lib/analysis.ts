export type AttentionLevel = "HIGH" | "MEDIUM" | "LOW";
export type Severity = "HIGH" | "MEDIUM" | "LOW";
export type ClaimStatus = "VERIFIED" | "UNVERIFIED" | "UNCLEAR" | "NOT_CHECKED";
export type OutputLanguage = "en" | "hi" | "mr";

export type Indicator = {
  category: string;
  severity: Severity;
  evidence: string;
  explanation: string;
  verification_action: string;
};

export type Claim = {
  claim: string;
  entity: string;
  status: ClaimStatus;
  evidence: string;
  source: string;
};

export type Tactic = {
  type: string;
  evidence: string;
  explanation: string;
};

export type AnalysisResult = {
  attention_level: AttentionLevel;
  summary: string;
  detected_language: string;
  indicators: Indicator[];
  claims: Claim[];
  manipulation_tactics: Tactic[];
  recommended_verification_steps: string[];
  safety_notice: string;
  extracted_content?: string;
  source_url?: string;
  mode?: "live" | "limited" | "demo";
  demo_name?: string;
};

const SAFETY_NOTICE =
  "ScamLens provides informational risk analysis. It does not provide investment advice, predict outcomes, or determine with certainty whether content is fraudulent. Independently verify important claims through authoritative sources.";

const languageCopy: Record<OutputLanguage, { limited: string; verify: string; summary: string }> = {
  en: {
    limited: "Limited local analysis is shown because live AI is not configured. Treat these signals as prompts to verify, not a verdict.",
    verify: "Check the claim independently on the official regulator or organization website before sharing money or information.",
    summary: "This content contains language that deserves a slower, independent review before you act.",
  },
  hi: {
    limited: "लाइव AI कॉन्फ़िगर नहीं है, इसलिए सीमित स्थानीय विश्लेषण दिखाया गया है। इन्हें चेतावनी के संकेत समझें, अंतिम फैसला नहीं।",
    verify: "पैसा या जानकारी साझा करने से पहले आधिकारिक नियामक या संस्था की वेबसाइट पर दावे की स्वतंत्र रूप से जाँच करें।",
    summary: "इस सामग्री में ऐसे शब्द हैं जिनकी कार्रवाई से पहले शांत होकर स्वतंत्र जाँच ज़रूरी है।",
  },
  mr: {
    limited: "लाइव्ह AI कॉन्फिगर केलेले नाही, म्हणून मर्यादित स्थानिक विश्लेषण दाखवले आहे. हे संकेत आहेत, अंतिम निर्णय नाही.",
    verify: "पैसे किंवा माहिती देण्यापूर्वी अधिकृत नियामक किंवा संस्थेच्या वेबसाइटवर दाव्याची स्वतंत्र तपासणी करा.",
    summary: "या मजकुरात कृती करण्यापूर्वी शांतपणे स्वतंत्र तपासणी करण्यासारखी भाषा आहे.",
  },
};

function cleanText(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

const unsafeGuidance = /\b(buy|sell|hold|invest in|stock[- ]price|return prediction|portfolio recommendation|broker recommendation|financial product recommendation|guaranteed return)\b/i;
const safeSummary = "Several claims require independent verification. Do not act on a recommendation in this content; verify the underlying claim through an authoritative source.";
const safeAction = "Pause and verify the underlying claim through an authoritative source before taking action.";
const safeTactic = "This communication may influence decisions. Its presence alone does not prove fraud.";

function safeGuidanceText(value: string, fallback: string) {
  return unsafeGuidance.test(value) ? fallback : value;
}

function severityFromMatches(text: string, terms: string[]): Severity {
  return terms.some((term) => text.toLowerCase().includes(term.toLowerCase())) ? "HIGH" : "MEDIUM";
}

function findEvidence(text: string, terms: string[]) {
  const lines = text.split(/\n|[.!?]+/).map((line) => line.trim()).filter(Boolean);
  return lines.find((line) => terms.some((term) => line.toLowerCase().includes(term.toLowerCase()))) || terms[0];
}

export function localAnalyze(text: string, language: OutputLanguage, mode: "limited" | "demo" = "limited"): AnalysisResult {
  const source = text.trim();
  const indicators: Indicator[] = [];
  const tactics: Tactic[] = [];
  const claims: Claim[] = source
    .split(/\n|[.!?]+/)
    .map((claim) => claim.trim())
    .filter((claim) => claim.length > 8)
    .slice(0, 8)
    .map((claim) => ({
      claim,
      entity: "Not independently identified",
      status: "NOT_CHECKED" as ClaimStatus,
      evidence: claim,
      source: "User-provided content; no external source checked",
    }));

  const rules: Array<{ category: string; terms: string[]; explanation: string; action: string; tactic: string }> = [
    { category: "Guaranteed return", terms: ["guaranteed", "risk-free", "double your money", "पक्का", "हमी", "हमीदार"], explanation: "The message presents a financial outcome as certain or unusually safe.", action: "Treat the promise as unverified and compare it with official investor-protection guidance.", tactic: "greed" },
    { category: "Urgency", terms: ["act now", "today", "last chance", "immediate", "तुरंत", "आज ही", "आत्ताच"], explanation: "Pressure to act quickly can reduce the time available for independent checks.", action: "Pause. Do not pay or share information until the claim is independently checked.", tactic: "urgency" },
    { category: "Scarcity", terms: ["only", "slots", "limited", "allocation", "सीमित", "slots", "मर्यादित"], explanation: "Scarcity language can make a user feel they will lose an opportunity if they wait.", action: "Check whether the scarcity claim appears on an official source; no result is not proof of fraud.", tactic: "scarcity" },
    { category: "Regulatory or authority claim", terms: ["sebi", "rbi", "government approved", "approved by", "सरकार", "मान्यता", "मंजूर"], explanation: "A regulator or government name can be used to create trust, but the statement still needs independent verification.", action: "Search the regulator's official website directly; do not rely on a link or screenshot supplied by the sender.", tactic: "authority" },
    { category: "Payment request", terms: ["upi", "registration fee", "processing fee", "deposit", "bank transfer", "payment", "भुगतान", "फी", "फीस"], explanation: "A payment request can create financial exposure before the underlying claim is established.", action: "Do not send money based on this message. Verify the organization and fee through an official channel.", tactic: "fear" },
    { category: "Sensitive information request", terms: ["otp", "pin", "password", "bank details", "card details", "kyc", "ओटीपी", "पासवर्ड"], explanation: "Requests for secrets or account credentials can put personal and financial security at risk.", action: "Never share OTPs, passwords, PINs, bank credentials, or card details in response to a message.", tactic: "fear" },
  ];

  for (const rule of rules) {
    if (rule.terms.some((term) => source.toLowerCase().includes(term.toLowerCase()))) {
      const evidence = findEvidence(source, rule.terms);
      indicators.push({ category: rule.category, severity: severityFromMatches(source, rule.terms), evidence, explanation: rule.explanation, verification_action: rule.action });
      tactics.push({ type: rule.tactic, evidence, explanation: `This may appeal to ${rule.tactic} or trust. Its presence alone does not prove fraud.` });
    }
  }

  const level: AttentionLevel = indicators.length >= 3 ? "HIGH" : indicators.length > 0 ? "MEDIUM" : "LOW";
  const copy = languageCopy[language];
  return {
    attention_level: level,
    summary: indicators.length ? copy.summary : "No obvious warning pattern was found by the limited local check. This is not proof that the content is safe.",
    detected_language: language === "en" ? "English or mixed" : language === "hi" ? "Hindi or mixed" : "Marathi or mixed",
    indicators,
    claims: claims.length ? claims : [{ claim: source || "No claim supplied", entity: "Not identified", status: "NOT_CHECKED", evidence: source || "No evidence", source: "No external source checked" }],
    manipulation_tactics: tactics,
    recommended_verification_steps: [copy.verify, "Use contact details from an official website, not from the suspicious message.", "If money or sensitive information has already been shared, contact the relevant bank or official cybercrime channel promptly."],
    safety_notice: mode === "limited" ? `${copy.limited} ${SAFETY_NOTICE}` : SAFETY_NOTICE,
    mode,
  };
}

export function normalizeAnalysis(value: unknown, fallbackText: string, language: OutputLanguage): AnalysisResult | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const attention = raw.attention_level === "HIGH" || raw.attention_level === "MEDIUM" || raw.attention_level === "LOW" ? raw.attention_level : "MEDIUM";
  const indicators = Array.isArray(raw.indicators) ? raw.indicators.map((item) => {
    const entry = (item || {}) as Record<string, unknown>;
    const severity: Severity = entry.severity === "HIGH" || entry.severity === "MEDIUM" || entry.severity === "LOW" ? entry.severity as Severity : "MEDIUM";
    return { category: cleanText(entry.category, "Potential warning sign"), severity, evidence: cleanText(entry.evidence, "Evidence not provided"), explanation: cleanText(entry.explanation, "This point requires independent review."), verification_action: cleanText(entry.verification_action, "Verify this claim through an authoritative source.") };
  }).filter((item) => item.evidence !== "Evidence not provided") : [];
  const claims = Array.isArray(raw.claims) ? raw.claims.map((item) => {
    const entry = (item || {}) as Record<string, unknown>;
    const requestedStatus = ["VERIFIED", "UNVERIFIED", "UNCLEAR", "NOT_CHECKED"].includes(String(entry.status)) ? String(entry.status) as ClaimStatus : "NOT_CHECKED";
    const status: ClaimStatus = requestedStatus === "VERIFIED" ? "UNVERIFIED" : requestedStatus;
    return { claim: cleanText(entry.claim, "Claim not extracted"), entity: cleanText(entry.entity, "Not independently identified"), status, evidence: cleanText(entry.evidence, "No evidence supplied"), source: cleanText(entry.source, "No external source checked") };
  }).filter((item) => item.claim !== "Claim not extracted") : [];
  const tactics = Array.isArray(raw.manipulation_tactics) ? raw.manipulation_tactics.map((item) => {
    const entry = (item || {}) as Record<string, unknown>;
    const explanation = cleanText(entry.explanation, "This is an educational signal, not proof of fraud.");
    return { type: cleanText(entry.type, "other"), evidence: cleanText(entry.evidence, "Evidence not provided"), explanation: safeGuidanceText(explanation, safeTactic) };
  }) : [];
  const summary = cleanText(raw.summary, "Several claims require independent verification.");
  const steps = Array.isArray(raw.recommended_verification_steps) ? raw.recommended_verification_steps.filter((step): step is string => typeof step === "string").slice(0, 8).map((step) => safeGuidanceText(step, safeAction)) : [];
  const normalized: AnalysisResult = {
    attention_level: attention,
    summary: safeGuidanceText(summary, safeSummary),
    detected_language: cleanText(raw.detected_language, language === "en" ? "English or mixed" : language === "hi" ? "Hindi or mixed" : "Marathi or mixed"),
    indicators,
    claims,
    manipulation_tactics: tactics,
    recommended_verification_steps: steps,
    safety_notice: safeGuidanceText(cleanText(raw.safety_notice, SAFETY_NOTICE), SAFETY_NOTICE),
    mode: "live",
  };
  normalized.indicators = normalized.indicators.map((indicator) => ({ ...indicator, explanation: safeGuidanceText(indicator.explanation, safeSummary), verification_action: safeGuidanceText(indicator.verification_action, safeAction) }));
  if (!normalized.indicators.length && !normalized.claims.length) return fallbackText.trim() ? localAnalyze(fallbackText, language) : null;
  return normalized;
}

export { SAFETY_NOTICE };
