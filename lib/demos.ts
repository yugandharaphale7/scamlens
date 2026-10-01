import type { AnalysisResult } from "./analysis";

export type DemoScenario = {
  id: string;
  name: string;
  description: string;
  input: string;
  result: AnalysisResult;
};

const baseNotice = "Demo Scenario — This example is pre-generated for education and is not live verification. ScamLens provides informational risk analysis, not investment advice or a fraud verdict.";

export const demos: DemoScenario[] = [
  {
    id: "guaranteed-return",
    name: "Guaranteed Return Investment Message",
    description: "A high-pressure message combining guaranteed returns, authority, scarcity, and a fee.",
    input: "SEBI approved ABC Wealth. We guarantee 18% monthly returns. Only 5 slots remain. Pay ₹5,000 registration fee today.",
    result: {
      attention_level: "HIGH",
      summary: "This message combines a guaranteed-return promise with urgency, scarcity, a regulatory claim, and a payment request. Each claim needs independent verification before any action.",
      detected_language: "English",
      indicators: [
        { category: "Guaranteed return", severity: "HIGH", evidence: "We guarantee 18% monthly returns.", explanation: "The message presents a financial outcome as certain. Certainty language can hide the real risk and evidence behind a claim.", verification_action: "Check the claim against authoritative investor-protection information; do not treat the promise as proof." },
        { category: "Urgency", severity: "HIGH", evidence: "Pay ₹5,000 registration fee today.", explanation: "The deadline creates pressure to act before there is time for independent checks.", verification_action: "Pause and verify the organization through an official channel before sending money." },
        { category: "Scarcity", severity: "MEDIUM", evidence: "Only 5 slots remain.", explanation: "Limited-slot language can make a user fear missing out.", verification_action: "Look for the allocation claim on a trusted official source, not just in this message." },
        { category: "Regulatory claim", severity: "HIGH", evidence: "SEBI approved ABC Wealth.", explanation: "Using a regulator's name can create authority. The claim still requires independent verification.", verification_action: "Check the regulator's official website directly; never rely on a sender-provided link." },
        { category: "Payment request", severity: "HIGH", evidence: "₹5,000 registration fee", explanation: "The sender asks for money before the underlying claim is established.", verification_action: "Do not send a fee based on this message. Verify the entity and payment purpose through an official source." },
      ],
      claims: [
        { claim: "SEBI approved ABC Wealth.", entity: "ABC Wealth / SEBI", status: "UNVERIFIED", evidence: "SEBI approved ABC Wealth.", source: "No live source checked in demo mode" },
        { claim: "18% monthly returns are guaranteed.", entity: "ABC Wealth", status: "UNVERIFIED", evidence: "We guarantee 18% monthly returns.", source: "No live source checked in demo mode" },
        { claim: "Only 5 slots remain.", entity: "ABC Wealth", status: "UNCLEAR", evidence: "Only 5 slots remain.", source: "No live source checked in demo mode" },
        { claim: "₹5,000 registration fee is required.", entity: "ABC Wealth", status: "UNCLEAR", evidence: "Pay ₹5,000 registration fee today.", source: "No live source checked in demo mode" },
      ],
      manipulation_tactics: [
        { type: "greed", evidence: "18% monthly returns", explanation: "A very attractive outcome may pull attention away from questions about risk and evidence." },
        { type: "urgency", evidence: "today", explanation: "A deadline reduces time for a careful check." },
        { type: "authority", evidence: "SEBI approved", explanation: "A regulator's name may be used to borrow trust; its presence alone does not prove fraud." },
        { type: "scarcity", evidence: "Only 5 slots remain", explanation: "A limited allocation can create fear of missing out." },
      ],
      recommended_verification_steps: ["Find the entity using the regulator's official website, not the message's contact details.", "Do not pay a registration or processing fee until the entity and reason for payment are independently confirmed.", "Never share OTPs, passwords, PINs, bank credentials, or card details.", "If you already sent money, contact your bank and the appropriate official reporting channel promptly."],
      safety_notice: baseNotice,
      mode: "demo",
      demo_name: "Guaranteed Return Investment Message",
    },
  },
  {
    id: "fake-regulatory",
    name: "Fake Regulatory Approval",
    description: "A message that borrows authority from a regulator to create trust.",
    input: "RBI approved this private trading group. Government guaranteed. Join through this link before the list closes.",
    result: {
      attention_level: "HIGH",
      summary: "The message uses official-sounding authority and a closing deadline, but no live evidence has been checked in this demo.",
      detected_language: "English",
      indicators: [
        { category: "Regulatory or authority claim", severity: "HIGH", evidence: "RBI approved this private trading group.", explanation: "A regulator's name can make a message feel official without proving the claim.", verification_action: "Open the regulator's official website independently and search for the entity or notice." },
        { category: "Urgency", severity: "MEDIUM", evidence: "before the list closes", explanation: "A closing deadline can discourage careful verification.", verification_action: "Do not click or share details until the claim is independently checked." },
      ],
      claims: [{ claim: "RBI approved this private trading group.", entity: "Private trading group / RBI", status: "UNVERIFIED", evidence: "RBI approved this private trading group.", source: "No live source checked in demo mode" }, { claim: "Government guaranteed.", entity: "Government", status: "UNVERIFIED", evidence: "Government guaranteed.", source: "No live source checked in demo mode" }],
      manipulation_tactics: [{ type: "authority", evidence: "RBI approved", explanation: "Official names may be used to borrow trust; their presence alone does not prove fraud." }, { type: "urgency", evidence: "before the list closes", explanation: "The deadline limits time for independent research." }],
      recommended_verification_steps: ["Search the claim on the regulator's official website directly.", "Treat a sender-provided badge, certificate, or URL as unverified until corroborated.", "Do not share personal or financial information to join a group."],
      safety_notice: baseNotice,
      mode: "demo",
      demo_name: "Fake Regulatory Approval",
    },
  },
  {
    id: "fake-kyc",
    name: "Fake KYC Urgency Message",
    description: "A KYC-themed message requesting sensitive information under pressure.",
    input: "Your KYC will expire today. Send OTP, PAN, and bank details immediately or your account will be blocked.",
    result: {
      attention_level: "HIGH",
      summary: "This message combines an urgent account threat with a request for sensitive information. ScamLens will never ask you to submit those secrets.",
      detected_language: "English",
      indicators: [
        { category: "Sensitive information request", severity: "HIGH", evidence: "Send OTP, PAN, and bank details", explanation: "Requests for OTPs and bank credentials can expose accounts and identity information.", verification_action: "Never share OTPs, passwords, PINs, bank credentials, or card details in response to a message." },
        { category: "Urgency and fear", severity: "HIGH", evidence: "today ... account will be blocked", explanation: "A threat of immediate loss can pressure a user into skipping checks.", verification_action: "Contact the institution using a number from its official website or app, not this message." },
      ],
      claims: [{ claim: "Your KYC will expire today.", entity: "Unidentified account provider", status: "UNVERIFIED", evidence: "Your KYC will expire today.", source: "No live source checked in demo mode" }, { claim: "Your account will be blocked.", entity: "Unidentified account provider", status: "UNVERIFIED", evidence: "your account will be blocked", source: "No live source checked in demo mode" }],
      manipulation_tactics: [{ type: "fear", evidence: "account will be blocked", explanation: "Fear of losing access can make a request feel more credible than it is." }, { type: "urgency", evidence: "today", explanation: "A short deadline leaves little time for verification." }],
      recommended_verification_steps: ["Close the message and contact the institution through its official app or website.", "Never share an OTP, password, PIN, bank credential, or card detail with a caller or message sender.", "If you shared information, contact your bank or institution promptly."],
      safety_notice: baseNotice,
      mode: "demo",
      demo_name: "Fake KYC Urgency Message",
    },
  },
  {
    id: "whatsapp-advisor",
    name: "Suspicious WhatsApp Investment Advisor",
    description: "A direct-message pitch using social proof, certainty, and an unofficial contact channel.",
    input: "Hello sir, I am your personal market advisor. Our VIP WhatsApp group has 98% success. Join now and send the starter deposit to my UPI.",
    result: {
      attention_level: "HIGH",
      summary: "The message relies on a personal-advisor identity, social proof, urgency, and a direct payment request. These elements require careful verification.",
      detected_language: "English",
      indicators: [
        { category: "Social proof and impersonation", severity: "MEDIUM", evidence: "Our VIP WhatsApp group has 98% success.", explanation: "A success statistic without a reliable source can make a group look more trustworthy than the evidence supports.", verification_action: "Do not rely on testimonials or group membership as proof; independently check the organization." },
        { category: "Payment request", severity: "HIGH", evidence: "send the starter deposit to my UPI", explanation: "The message directs money to an individual payment channel before the entity is verified.", verification_action: "Do not transfer money to a personal UPI based on a message." },
        { category: "Urgency", severity: "MEDIUM", evidence: "Join now", explanation: "The call to act now limits time for verification.", verification_action: "Pause and verify the person and organization through an official channel." },
      ],
      claims: [{ claim: "Our VIP WhatsApp group has 98% success.", entity: "Unidentified WhatsApp group", status: "UNVERIFIED", evidence: "98% success", source: "No live source checked in demo mode" }],
      manipulation_tactics: [{ type: "social_proof", evidence: "98% success", explanation: "A large success claim can substitute for evidence and make a user feel others are already participating." }, { type: "urgency", evidence: "Join now", explanation: "The immediate call to action reduces reflection time." }],
      recommended_verification_steps: ["Verify the identity and organization independently, using contact details from an official source.", "Do not send deposits or fees to personal UPI IDs from unsolicited messages.", "Do not share sensitive information in WhatsApp groups."],
      safety_notice: baseNotice,
      mode: "demo",
      demo_name: "Suspicious WhatsApp Investment Advisor",
    },
  },
  {
    id: "education",
    name: "Legitimate Financial Education",
    description: "Informational content that encourages learning and independent verification without a promise.",
    input: "Financial education note: diversification can reduce concentration risk, but it cannot remove risk. Read official investor education resources and compare information before making decisions.",
    result: {
      attention_level: "LOW",
      summary: "This is informational content that acknowledges risk and encourages independent learning. A low attention level is not a guarantee of safety.",
      detected_language: "English",
      indicators: [],
      claims: [{ claim: "Diversification can reduce concentration risk, but it cannot remove risk.", entity: "Financial education concept", status: "NOT_CHECKED", evidence: "diversification can reduce concentration risk", source: "No live source checked in demo mode" }],
      manipulation_tactics: [],
      recommended_verification_steps: ["Use official investor-education resources for general information.", "Check important claims against authoritative sources and consider your own circumstances before acting."],
      safety_notice: baseNotice,
      mode: "demo",
      demo_name: "Legitimate Financial Education",
    },
  },
];
