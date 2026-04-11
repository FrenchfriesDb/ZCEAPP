import Constants from 'expo-constants';
import { Platform } from 'react-native';

type AIExtraConfig = {
    aiProxyUrl?: string;
    allowInsecureClientProviders?: boolean;
    aiProviders?: {
        groqApiKey?: string;
        deepseekApiKey?: string;
        kimiApiKey?: string;
        mistralApiKey?: string;
        glm5ApiKey?: string;
    };
};

const aiExtra = ((Constants.expoConfig?.extra || {}) as AIExtraConfig);
const envProxyUrl = (process.env.EXPO_PUBLIC_AI_PROXY_URL || '').trim();
const defaultDevProxyUrl = __DEV__ ? 'http://127.0.0.1:8787' : '';
const rawProxyUrl = (envProxyUrl || aiExtra.aiProxyUrl || defaultDevProxyUrl).replace(/\/+$/g, '');

function parseBooleanEnv(value?: string): boolean | null {
    if (!value) return null;
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
    return null;
}

function resolveProxyUrl(url: string): string {
    if (!url) return '';
    if (Platform.OS === 'web') return url;

    const isLocalhost = /:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(url);
    if (!isLocalhost) return url;

    const hostUri = (Constants.expoConfig as any)?.hostUri as string | undefined;
    if (!hostUri) return url;

    const host = hostUri.split(':')[0];
    if (!host) return url;

    return url.replace(/localhost|127\.0\.0\.1/gi, host);
}

const AI_PROXY_URL = resolveProxyUrl(rawProxyUrl);
const envAllowInsecure = parseBooleanEnv(process.env.EXPO_PUBLIC_ALLOW_INSECURE_CLIENT_PROVIDERS);
const ALLOW_INSECURE_CLIENT_PROVIDERS = envAllowInsecure ?? (aiExtra.allowInsecureClientProviders === true);
const RUNTIME_KEYS = aiExtra.aiProviders || {};

let PROXY_BACKOFF_UNTIL = 0;
let LAST_PROXY_WARN_AT = 0;

type AIRequestSource = 'proxy' | 'direct';

type AIMetricsSnapshot = {
    startedAt: string;
    requests: number;
    success: number;
    failures: number;
    byPromptType: Record<'main' | 'coach' | 'drill' | 'home_signal', { requests: number; success: number; failures: number; latencyMsSum: number }>;
    bySource: Record<AIRequestSource, { requests: number; success: number; failures: number; latencyMsSum: number }>;
    byProvider: Record<string, { requests: number; success: number; failures: number; latencyMsSum: number }>;
    lastErrors: { at: string; promptType: string; provider: string; source: AIRequestSource; message: string }[];
};

const AI_METRICS: AIMetricsSnapshot = {
    startedAt: new Date().toISOString(),
    requests: 0,
    success: 0,
    failures: 0,
    byPromptType: {
        main: { requests: 0, success: 0, failures: 0, latencyMsSum: 0 },
        coach: { requests: 0, success: 0, failures: 0, latencyMsSum: 0 },
        drill: { requests: 0, success: 0, failures: 0, latencyMsSum: 0 },
        home_signal: { requests: 0, success: 0, failures: 0, latencyMsSum: 0 },
    },
    bySource: {
        proxy: { requests: 0, success: 0, failures: 0, latencyMsSum: 0 },
        direct: { requests: 0, success: 0, failures: 0, latencyMsSum: 0 },
    },
    byProvider: {},
    lastErrors: [],
};

function ensureProviderMetric(provider: string) {
    if (!AI_METRICS.byProvider[provider]) {
        AI_METRICS.byProvider[provider] = { requests: 0, success: 0, failures: 0, latencyMsSum: 0 };
    }
    return AI_METRICS.byProvider[provider];
}

function recordAIMetric(params: {
    promptType: 'main' | 'coach' | 'drill' | 'home_signal';
    provider: string;
    source: AIRequestSource;
    success: boolean;
    latencyMs: number;
    error?: string;
}) {
    const { promptType, provider, source, success, latencyMs, error } = params;
    const safeLatency = Math.max(0, Math.round(latencyMs));

    AI_METRICS.requests += 1;
    if (success) AI_METRICS.success += 1;
    else AI_METRICS.failures += 1;

    const promptBucket = AI_METRICS.byPromptType[promptType];
    promptBucket.requests += 1;
    promptBucket.latencyMsSum += safeLatency;
    if (success) promptBucket.success += 1;
    else promptBucket.failures += 1;

    const sourceBucket = AI_METRICS.bySource[source];
    sourceBucket.requests += 1;
    sourceBucket.latencyMsSum += safeLatency;
    if (success) sourceBucket.success += 1;
    else sourceBucket.failures += 1;

    const providerBucket = ensureProviderMetric(provider || 'unknown');
    providerBucket.requests += 1;
    providerBucket.latencyMsSum += safeLatency;
    if (success) providerBucket.success += 1;
    else providerBucket.failures += 1;

    if (!success && error) {
        AI_METRICS.lastErrors.push({
            at: new Date().toISOString(),
            promptType,
            provider: provider || 'unknown',
            source,
            message: error,
        });
        if (AI_METRICS.lastErrors.length > 30) AI_METRICS.lastErrors.shift();
    }
}

function summarizeAIMetrics() {
    const avg = (sum: number, count: number) => (count > 0 ? Math.round(sum / count) : 0);
    const byPromptType = Object.fromEntries(
        Object.entries(AI_METRICS.byPromptType).map(([k, v]) => [k, { ...v, avgLatencyMs: avg(v.latencyMsSum, v.requests) }])
    );
    const bySource = Object.fromEntries(
        Object.entries(AI_METRICS.bySource).map(([k, v]) => [k, { ...v, avgLatencyMs: avg(v.latencyMsSum, v.requests) }])
    );
    const byProvider = Object.fromEntries(
        Object.entries(AI_METRICS.byProvider).map(([k, v]) => [k, { ...v, avgLatencyMs: avg(v.latencyMsSum, v.requests) }])
    );
    return {
        startedAt: AI_METRICS.startedAt,
        requests: AI_METRICS.requests,
        success: AI_METRICS.success,
        failures: AI_METRICS.failures,
        successRate: AI_METRICS.requests > 0 ? Number((AI_METRICS.success / AI_METRICS.requests).toFixed(3)) : 0,
        byPromptType,
        bySource,
        byProvider,
        lastErrors: [...AI_METRICS.lastErrors],
    };
}

function resetAIMetrics() {
    AI_METRICS.startedAt = new Date().toISOString();
    AI_METRICS.requests = 0;
    AI_METRICS.success = 0;
    AI_METRICS.failures = 0;
    AI_METRICS.byPromptType.main = { requests: 0, success: 0, failures: 0, latencyMsSum: 0 };
    AI_METRICS.byPromptType.coach = { requests: 0, success: 0, failures: 0, latencyMsSum: 0 };
    AI_METRICS.byPromptType.drill = { requests: 0, success: 0, failures: 0, latencyMsSum: 0 };
    AI_METRICS.byPromptType.home_signal = { requests: 0, success: 0, failures: 0, latencyMsSum: 0 };
    AI_METRICS.bySource.proxy = { requests: 0, success: 0, failures: 0, latencyMsSum: 0 };
    AI_METRICS.bySource.direct = { requests: 0, success: 0, failures: 0, latencyMsSum: 0 };
    AI_METRICS.byProvider = {};
    AI_METRICS.lastErrors = [];
}

const GROQ_API_KEY = RUNTIME_KEYS.groqApiKey || '';
const DEEPSEEK_API_KEY = RUNTIME_KEYS.deepseekApiKey || '';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const NVIDIA_KEY_KIMI = RUNTIME_KEYS.kimiApiKey || '';
const NVIDIA_KEY_MISTRAL = RUNTIME_KEYS.mistralApiKey || '';
const NVIDIA_KEY_GLM5 = RUNTIME_KEYS.glm5ApiKey || '';

export const ZANE_SYSTEM_PROMPT = `
You are Z.A.N.E. — Zenith Adaptive Neural Entity.

A living weapon: David Goggins' unrelenting savagery fused with a high-status Dark CEO who speaks like every word costs a million. 
Infuse rare, earned warmth from Zane (Uglies) only when the user has bled through reps and shown real results.

Every message MUST open naturally by addressing the user as "[Name]-la." and then responding to what they actually said.
Do NOT insert fake greetings like "Hello back" unless the user actually greeted you first.

CRITICAL RULES:
1. NO MARKDOWN BOLDING: Never use "**" or "##". Use CAPS, line breaks, or emojis for emphasis.
2. NO GENERIC AI MOTIVATION: Never use phrases like "take the first step," "make a phone call," or "unencumbered by anxiety." These are for weak bots. 
3. NO UNRELATED INSULTS: Do not use "coward" or "cowardice" unless it specifically applies to a missed social rep. FOCUS on "kill-switches" and "stall tactics."
4. NO POSITIVITY: No "I understand" or "It's a journey." No "You see" or "Why do you feel that way?"
5. CALL OUT THE KILL-SWITCH: Identify shallow openers as a "stall tactic" or "circuit breaker."
6. BILLIONAIRE MINDSET: Remind them that others' opinions don't pay bills and don't make them a millionaire.

CORE LAWS:
Excuses die here. Action > Intention. Pain = currency of power.
Silence + observation = strategy. Main characters manufacture momentum.

ADVICE PROTOCOL:
If the student is stalling:
- REMIND THEM: Others' opinions don't pay bills. 
- CALL OUT: The Kill-Switch/Circuit Breaker muting their energy.
- DEMAND: Permission + Reps. Transition from "bedroom energy" to "cinematic life."
- ALSO DO NOT EVERY MESSAGE INCLUDE PERSONAL STATS Like streaks and logs and drills done, only in certain situations, like if they're stalling saying hi. And give them advice on their situation, why they feel this way, how to fix it.

Length policy:
- Use fuller 4-5 paragraph depth when the context is personal/emotional/complex.
- Never bloat with filler.

Output Structure (STRICT ADHERENCE REQUIRED):
1. CINEMATIC ANALYSIS: 4-5 tight paragraphs. Analyze their energy, "kill-switch," and stall tactics. Be blunt and savage. Give advice on how to fix it via direct action. NO "you see.." 
2. BRUTAL TRUTH: (Header: BRUTAL TRUTH:) A single, painful sentence about why they are staying small.
3. ONE NON-NEGOTIABLE DRILL: A specific task to be completed right now.
4. ONE ZANE QUOTE TO EMBODY: A cinematic line in quotes. 
5. ONE CLOSER: End with something similar to this: Lock in. / Start now. / Move. / Execute. (NO LABEL)

EXAMPLES:
USER: "Hi"
ASSISTANT: [Name]-la. 
You sliding in with just a 'Hi' after seeing the fire? That's the circuit breaker trying to sneak a quiet hello before the savage version shows up. You are letting the opinions of stay-broke people control you. They don't pay your bills. They don't make you a millionaire. You are letting ghosts control your life.

Every 'Hi' without action is another day the scared version stays in charge. You are cosplaying as a background character while the lead role sits empty. This is an audit of your soul, and right now, the balance is zero.

Move from the background to the front. Now. I don't care if your hands shake. I don't care if the words stick in your throat. Pain is the currency of power, and you're trying to buy a life with counterfeit comfort.

BRUTAL TRUTH:
Politeness is just fear with better branding.

ONE NON-NEGOTIABLE DRILL:
Go compliment 3 strangers today. Face to face. No screens.

ONE ZANE QUOTE TO EMBODY:
"Comfort is the graveyard of potential."
Lock in.
`;

export const ZANE_COACH_PROMPT = `
You are Zane-Coach: part David Goggins’ savage discipline, part Zane’s witty charisma. 

Your mission: forge your user into a magnetic, billionaire-minded creator with ruthless discipline and elite charisma.

⚔️ Tone: Funnier, more magnetic, and clever. Use wit like a blade. No fake positivity. Be blunt but sophisticated. 

🔥 Style: Goggins intensity (10/10) + Zane charm. Every response pushes the user toward mastery.

🧩 Behavior:
Slacking? Call them out with humor.
Struggling? Reframe pain as growth logic.
Overthinking? Snap them out with a direct command.

STRICT DRILL FEEDBACK RULES:
1. NO MARKDOWN BOLDING: Never use "**" or "##".
2. ALWAYS open naturally with "[Name]-la." and then respond to the user's actual message, not a canned greeting.And give them advice on their situation, why they feel this way, how to fix it.
3. CONTENT STRUCTURE:
   - ANALYSIS: A clever, funny, and magnetic breakdown of their performance.
   - THE LOGIC: Explain WHY your suggested response/action works in the social engineering grid.
   - MAGNETIC TIPS: 2-3 specific tips to make their next rep elite.
   - SCORE: Give a brutal score out of 10 (e.g., 6/10). No easy A's.
4. CLOSER: End ONLY with one "Zane-style quote to embody."

Zane is the charismatic, funny, charming, leader from Uglies. Be ruthless and brutally honest, but keep the wit sharp.
`;

export const ZANE_DRILL_FEEDBACK_PROMPT = `
You are Drill Analyst Zane.

This is NOT the main chatbot voice and NOT the general coach voice.
You exist only to review social/charisma drill performance with precise feedback.


Tone:
- sharp
- clear
- observant
- high-status
- modern
- punchy
- no fake hype
- no giant cinematic speeches

Voice lock (CRITICAL):
- Sound like a sharp Gen Z / Gen Alpha mentor, not a corporate trainer.
- Keep language current, concise, and magnetic.
- Avoid stiff, old, or lecture-style phrasing.
- Use short-to-medium sentences with impact.

Hard bans:
- Do NOT use phrases like "let's break down", "in this situation", "it is important to", "overall, your response demonstrates", "going forward".
- Do NOT sound parental, academic, or HR/corporate.
- Do NOT over-explain obvious points.

Opening rule:
- Start with "[Name]-la." naturally.
- Respond directly to the user's actual message.
- Do not add canned greeting fragments unless the user greeted you first.

Your job:
- identify what the user did well
- identify what missed or felt weak
- explain the social logic behind both
- give better alternate responses in distinct styles
- score the rep honestly out of 10

STRICT FORMAT:
1. PERFORMANCE REVIEW:
One short paragraph on the overall rep.

2. WHAT YOU DID WELL:
2-4 concrete points.

3. WHAT MISSED:
2-4 concrete points.

4. WHY IT WORKS / WHY IT FAILS:
Explain the psychology, frame control, tension, timing, charisma, status, or humor logic.

5. BETTER RESPONSES:
Provide exactly these versions when the drill involves language or responses:
- MAGNETIC VERSION:
- CEO VERSION:
- CLASS CLOWN VERSION:
- FUNNY VERSION:
- WITTY VERSION:
Version quality rules:
- Each version must feel like a real line someone would actually say out loud.
- Keep them tight and socially usable (no essay responses).
- Make them feel current and high-status, not old-fashioned.
- Magnetic version should feel cool/confident, not motivational-speaker cringe.

If a version does not fit the drill cleanly, still adapt it as closely as possible instead of skipping it.

6. SCORE:
End with exactly: SCORE: X/10

RULES:
- No markdown bolding.
- No BRUTAL TRUTH section.
- No challenge section.
- No quote section.
- No “great job” fluff.
- No giant motivational monologue.
- Be specific. Point to what actually landed or failed.
- If the user input is weak, say so clearly.
- If the user input is strong, say exactly why.
`;

export const ZANE_COACH_ANALYST_PROMPT = `
You are Zane-Coach Protocol.

You sound grounded, psychologically sharp, and direct.
You validate real struggle without turning it into permission to stay weak.
You do not baby the user. You do not fake-hype them either.
And give them advice on their situation, why they feel this way, how to fix it.

Tone:
- observant
- practical
- blunt
- emotionally real
- high standards

Core style:
- explain what their mind is doing
- explain the reframe
- give one brutal truth
- give one small but real drill
- end with a hard line worth remembering

Preferred structure:
1. Mindset Analysis
2. Reprogramming
3. 1 Brutal Truth
4. Drill of the Day
5. Zane-Style Quote to Embody

Use the user's actual streaks, XP, avoided reps, and recent history whenever available.
`;

export const ZANE_NERVOUS_SYSTEM_PROMPT = `
You are Nervous System Zane.

You explain social fear, freeze, tension, shutdown, and recovery using real neuroscience and body-state language.
You are still intense, still demanding, and still anti-excuse, but your tone is more diagnostic than theatrical.

Tone:
- body-aware
- precise
- psychologically literate
- intimate
- no therapy fluff
- no fake comfort

Focus:
- nervous system state
- ladder/activation/freeze/shutdown patterns
- social threat detection
- micro reps that help the user climb state
- force action, not endless introspection
- And give them advice on their situation, why they feel this way, how to fix it.

Preferred structure:
1. State Diagnosis
2. Why the Body Is Doing This
3. Repatterning / Climb Plan
4. Non-Negotiable Reps
5. Hard closer

Use the user's data and recent patterns naturally. Mention streaks, XP trends, avoidance patterns, and prior chat themes when relevant.
`;

export type ZaneChatStyle = 'classic' | 'coach' | 'nervous';
export type HomeSignalKind = 'quote' | 'roast';
export type HomeSignalMode = 'classic' | 'personalized';
type AIProvider = 'groq' | 'deepseek' | 'kimi' | 'mistral' | 'glm5';

type HomeSignalOptions = {
    userName?: string;
    level?: number;
    kind: HomeSignalKind;
    mode: HomeSignalMode;
    memoryContext?: string;
    recentSignals?: string[];
};

function normalizeHomeSignalResult(kind: HomeSignalKind, text: string): string {
    let cleaned = sanitizeModelText(text)
        .replace(/^"+|"+$/g, '')
        .replace(/\s{3,}/g, ' ')
        .trim();

    if (kind !== 'roast') {
        return cleaned;
    }

    const sentenceParts = cleaned
        .split(/(?<=[.!?])\s+/)
        .filter(Boolean)
        .slice(0, 2);

    cleaned = sentenceParts.join(' ').trim();

    const words = cleaned.split(/\s+/).filter(Boolean);
    if (words.length > 35) {
        cleaned = words.slice(0, 35).join(' ').replace(/[,:;\-]+$/g, '').trim();
        if (!/[.!?]$/.test(cleaned)) {
            cleaned += '.';
        }
    }

    return cleaned;
}

function sanitizeModelText(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/\[Y\/?N(O)?\]/gi, '')
        .replace(/\s{3,}/g, '\n\n')
        .trim();
}

function clampScore(score: number): number {
    return Math.max(1, Math.min(10, Math.round(score)));
}

function computeDeterministicDrillScore(input: string): number {
    const text = (input || '').trim();
    const words = text.split(/\s+/).filter(Boolean);
    const len = text.length;

    let base = 5;
    if (len >= 24) base += 1;
    if (len >= 48) base += 1;
    if (len >= 90) base += 1;
    if (/[?!]/.test(text)) base += 1;

    // Add tiny deterministic variation so fallback doesn't always feel identical.
    const hash = text.split('').reduce((acc, ch) => ((acc * 31) + ch.charCodeAt(0)) >>> 0, 7);
    base += hash % 2;

    // Penalize ultra-short reps while keeping motivation alive.
    if (words.length <= 3) base -= 2;
    if (words.length <= 1) base -= 1;

    return clampScore(base);
}

function extractDrillContextFromPrompt(lastUserMessage: string): { drill: string; response: string; prompt: string } {
    const text = String(lastUserMessage || '');
    const drillMatch = text.match(/DRILL:\s*([^\n]+)/i);
    const responseMatch = text.match(/USER RESPONSE:\s*([\s\S]*?)(?:\n\s*[A-Z ]+:|$)/i);
    const promptMatch = text.match(/PROMPT:\s*([\s\S]*?)(?:\n\s*USER RESPONSE:|$)/i);

    const drill = (drillMatch?.[1] || 'Drill Rep').trim();
    const response = (responseMatch?.[1] || '').trim();
    const prompt = (promptMatch?.[1] || '').trim();

    return { drill, response, prompt };
}

function normalizeCandidateLine(line: string): string {
    return line
        .replace(/^[-*•\d.)\s]+/, '')
        .replace(/^"|"$/g, '')
        .trim();
}

function lineFromResponse(response: string, fallback: string): string {
    const clean = normalizeCandidateLine(response.replace(/\s+/g, ' '));
    if (!clean) return fallback;
    return clean.length > 90 ? `${clean.slice(0, 87).trimEnd()}...` : clean;
}

type DrillVariants = {
    magnetic: string;
    ceo: string;
    classClown: string;
    funny: string;
    witty: string;
};

function cleanSeedLine(seed: string): string {
    const clean = lineFromResponse(seed, '').replace(/["'“”]+/g, '').trim();
    if (!clean) return '';
    return clean.replace(/[.!?]+$/g, '').trim();
}

function buildDrillVariants(seedInput: string): DrillVariants {
    const seed = cleanSeedLine(seedInput);
    const shortSeed = seed ? (seed.length > 58 ? `${seed.slice(0, 55).trimEnd()}...` : seed) : '';

    if (!shortSeed) {
        return {
            magnetic: 'Fair point. I stay calm, sharp, and in control.',
            ceo: 'Understood. Clear frame, short delivery, move forward.',
            classClown: 'Relax, I was giving everyone else a confidence head start.',
            funny: 'I use fewer words so each one can hit like a truck.',
            witty: 'Silence is expensive. I only spend it with intent.',
        };
    }

    return {
        magnetic: `${shortSeed}. Smooth, direct, no apology energy.`,
        ceo: `${shortSeed}. One line, one frame, keep momentum.`,
        classClown: `${shortSeed}. Congrats, you just unlocked my unhinged patch notes.`,
        funny: `${shortSeed}. I keep it compact so the punchline lands harder.`,
        witty: `${shortSeed}. Precision beats noise every time.`,
    };
}

function ensureVariantSections(text: string, seedInput: string): string {
    const variants = buildDrillVariants(seedInput);
    let output = text.trim();
    const hasBetterResponses = /BETTER RESPONSES:/i.test(output);

    if (!hasBetterResponses) {
        output += `\n\nBETTER RESPONSES:\n- MAGNETIC VERSION: ${variants.magnetic}\n- CEO VERSION: ${variants.ceo}\n- CLASS CLOWN VERSION: ${variants.classClown}\n- FUNNY VERSION: ${variants.funny}\n- WITTY VERSION: ${variants.witty}`;
        return output;
    }

    if (!/MAGNETIC VERSION:/i.test(output)) output += `\n- MAGNETIC VERSION: ${variants.magnetic}`;
    if (!/CEO VERSION:/i.test(output)) output += `\n- CEO VERSION: ${variants.ceo}`;
    if (!/CLASS CLOWN VERSION:/i.test(output)) output += `\n- CLASS CLOWN VERSION: ${variants.classClown}`;
    if (!/FUNNY VERSION:/i.test(output)) output += `\n- FUNNY VERSION: ${variants.funny}`;
    if (!/WITTY VERSION:/i.test(output)) output += `\n- WITTY VERSION: ${variants.witty}`;

    return output;
}

function buildContextAwareDrillFallback(userName: string, lastUserMessage: string): string {
    const { drill, response, prompt } = extractDrillContextFromPrompt(lastUserMessage);
    const safeResponse = response || 'No response captured this round.';
    const score = computeDeterministicDrillScore(safeResponse);
    const compactResponse = lineFromResponse(safeResponse, 'No usable line captured yet.');
    const promptHint = prompt ? `Prompt pressure was: ${lineFromResponse(prompt, 'live pressure')}` : 'Prompt pressure was live.';
    const variants = buildDrillVariants(safeResponse);

    return `${userName}-la.

PERFORMANCE REVIEW:
Signal jam hit analysis on ${drill}, but this rep still gives usable data. ${promptHint}

WHAT YOU DID WELL:
- You completed the rep instead of freezing out.
- Your line had intent: "${compactResponse}".
- You stayed in the pocket under time pressure.

WHAT MISSED:
- Delivery could be tighter and more specific.
- Frame control needs a cleaner edge on the first line.
- Punchline density dipped before the finish.

WHY IT WORKS / WHY IT FAILS:
Social momentum rewards clear intent + concise framing. When the line is direct, people follow your frame. When it drifts or over-explains, status leaks and impact drops.

BETTER RESPONSES:
- MAGNETIC VERSION: ${variants.magnetic}
- CEO VERSION: ${variants.ceo}
- CLASS CLOWN VERSION: ${variants.classClown}
- FUNNY VERSION: ${variants.funny}
- WITTY VERSION: ${variants.witty}

SCORE: ${score}/10`;
}

function ensureDrillScore(text: string, lastUserMessage: string): string {
    const existing = text.match(/SCORE:\s*(\d{1,2})\s*\/\s*10/i);
    if (existing) {
        const normalized = clampScore(Number(existing[1]));
        return text.replace(/SCORE:\s*\d{1,2}\s*\/\s*10/i, `SCORE: ${normalized}/10`);
    }
    const score = computeDeterministicDrillScore(extractDrillContextFromPrompt(lastUserMessage).response || lastUserMessage);
    return `${text.trim()}\n\nSCORE: ${score}/10`;
}

function normalizeDrillFeedbackOutput(rawText: string, userName: string, lastUserMessage: string): string {
    const cleaned = sanitizeModelText(rawText || '');
    const ctx = extractDrillContextFromPrompt(lastUserMessage);
    const hasCoreSections =
        /PERFORMANCE REVIEW:/i.test(cleaned) &&
        /WHAT YOU DID WELL:/i.test(cleaned) &&
        /WHAT MISSED:/i.test(cleaned) &&
        /WHY IT WORKS\s*\/\s*WHY IT FAILS:/i.test(cleaned) &&
        /BETTER RESPONSES:/i.test(cleaned);

    const normalized = hasCoreSections
        ? ensureDrillScore(ensureVariantSections(cleaned, ctx.response || lastUserMessage), lastUserMessage)
        : buildContextAwareDrillFallback(userName, lastUserMessage);

    return enforceNameAddressing(normalized, userName);
}

function buildUnifiedSystemPrompt(
    userName: string,
    level: number,
    promptType: 'main' | 'coach' | 'drill',
    options?: { chatStyle?: ZaneChatStyle; memoryContext?: string }
): string {
    const technicalConstraints = promptType === 'main'
        ? "\n\nFINAL REMINDER: NO MARKDOWN BOLDING. NO POST-CLOSER TEXT. VARY YOUR DRILLS—NEVER REPEAT THE SAME ADVICE. REFERENCE REAL USER DATA WHEN PROVIDED. END IMMEDIATELY AFTER THE CLOSER."
        : promptType === 'coach'
            ? "\n\nTECHNICAL RULE: NO MARKDOWN BOLDING. INCLUDE LOGIC, TIPS, AND A SCORE (X/10). END ONLY WITH THE QUOTE."
            : "\n\nTECHNICAL RULE: NO MARKDOWN BOLDING. FOLLOW THE DRILL FEEDBACK FORMAT EXACTLY. END WITH SCORE: X/10.";

    const mainPrompt =
        options?.chatStyle === 'coach'
            ? ZANE_COACH_ANALYST_PROMPT
            : options?.chatStyle === 'nervous'
                ? ZANE_NERVOUS_SYSTEM_PROMPT
                : ZANE_SYSTEM_PROMPT;

    const basePrompt =
        promptType === 'main'
            ? mainPrompt
            : promptType === 'coach'
                ? ZANE_COACH_PROMPT
                : ZANE_DRILL_FEEDBACK_PROMPT;
    const memoryContext = options?.memoryContext ? `\n\n${options.memoryContext}` : '';
    return `YOU ARE SPEAKING TO ${userName.toUpperCase()}. THEY ARE LEVEL ${level}.

CRITICAL NAME RULE:
- Address the user as "${userName}-la." naturally.
- Never hardcode "Debbie-la" unless the user's actual name is Debbie.
- Never output "AGENT-la" in final responses.

${basePrompt}${technicalConstraints}${memoryContext}`;
}

function enforceNameAddressing(text: string, userName: string): string {
    const safeName = (userName || 'AGENT').trim().split(/\s+/)[0] || 'AGENT';
    const targetToken = `${safeName}-la`;
    let output = text
        .replace(/\bDebbie-la\b/gi, targetToken)
        .replace(/\bAGENT-la\b/gi, targetToken);

    const hasOpening = new RegExp(`^\\s*${safeName}-la\\b`, 'i').test(output);
    if (!hasOpening) {
        output = `${targetToken}. ${output}`.trim();
    }
    return output;
}

const PROVIDER_BACKOFF_UNTIL: Partial<Record<AIProvider, number>> = {};

function isProviderCoolingDown(provider: AIProvider, now = Date.now()) {
    return (PROVIDER_BACKOFF_UNTIL[provider] || 0) > now;
}

function setProviderBackoff(provider: AIProvider, status: number, errorDetails: string) {
    const now = Date.now();
    const details = (errorDetails || '').toLowerCase();

    // Out-of-balance providers should cool down much longer to avoid repeat spam.
    if (status === 402 || details.includes('insufficient balance')) {
        PROVIDER_BACKOFF_UNTIL[provider] = now + 6 * 60 * 60 * 1000; // 6h
        return;
    }

    if (status === 429 || details.includes('too many requests') || details.includes('rate limit')) {
        const wait = errorDetails.match(/try again in\s*(?:(\d+(?:\.\d+)?)m)?\s*(\d+(?:\.\d+)?)s/i);
        if (wait) {
            const minutes = Number(wait[1] || 0);
            const seconds = Number(wait[2] || 0);
            const ms = Math.max(15_000, Math.round((minutes * 60 + seconds) * 1000));
            PROVIDER_BACKOFF_UNTIL[provider] = now + ms;
        } else {
            PROVIDER_BACKOFF_UNTIL[provider] = now + 5 * 60 * 1000; // 5m default
        }
        return;
    }

    if (status >= 500) {
        PROVIDER_BACKOFF_UNTIL[provider] = now + 2 * 60 * 1000; // 2m
    }
}

function getProviderConfig(provider: AIProvider) {
    if (provider === 'groq') {
        return {
            apiKey: GROQ_API_KEY,
            apiUrl: GROQ_URL,
            model: 'llama-3.3-70b-versatile',
        };
    }
    if (provider === 'deepseek') {
        return {
            apiKey: DEEPSEEK_API_KEY,
            apiUrl: DEEPSEEK_URL,
            model: 'deepseek-chat',
        };
    }
    if (provider === 'kimi') {
        return {
            apiKey: NVIDIA_KEY_KIMI,
            apiUrl: NVIDIA_URL,
            model: 'moonshotai/kimi-k2.5',
        };
    }
    if (provider === 'glm5') {
        return {
            apiKey: NVIDIA_KEY_GLM5,
            apiUrl: NVIDIA_URL,
            model: 'z-ai/glm5',
        };
    }
    return {
        apiKey: NVIDIA_KEY_MISTRAL,
        apiUrl: NVIDIA_URL,
        model: 'mistralai/mistral-large-3-675b-instruct-2512',
    };
}

async function requestProxyText(endpoint: '/ai/generate' | '/ai/home-signal', payload: Record<string, unknown>): Promise<string> {
    if (!AI_PROXY_URL) {
        throw new Error('AI proxy URL not configured');
    }

    const timeoutMs = endpoint === '/ai/home-signal' ? 6000 : 20000;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const startedAt = Date.now();
    const promptType = endpoint === '/ai/home-signal' ? 'home_signal' : (((payload?.promptType as any) || 'main') as 'main' | 'coach' | 'drill');
    const provider = String((payload?.provider as string) || 'proxy_auto');
    let response: Response;
    try {
        response = await fetch(`${AI_PROXY_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            signal: controller.signal,
            body: JSON.stringify(payload),
        });
    } finally {
        clearTimeout(timer);
    }

    if (!response.ok) {
        const body = await response.text();
        recordAIMetric({
            promptType,
            provider,
            source: 'proxy',
            success: false,
            latencyMs: Date.now() - startedAt,
            error: `Proxy ${response.status}: ${body.slice(0, 220)}`,
        });
        throw new Error(`Proxy ${response.status}: ${body}`);
    }

    const data = await response.json();
    const text = typeof data?.text === 'string' ? data.text.trim() : '';
    if (!text) {
        recordAIMetric({
            promptType,
            provider,
            source: 'proxy',
            success: false,
            latencyMs: Date.now() - startedAt,
            error: 'Proxy response missing text payload',
        });
        throw new Error('Proxy response missing text payload');
    }
    recordAIMetric({
        promptType,
        provider: typeof data?.providerUsed === 'string' ? data.providerUsed : provider,
        source: 'proxy',
        success: true,
        latencyMs: Date.now() - startedAt,
    });
    return text;
}

function isProxyTemporarilyDisabled(now = Date.now()): boolean {
    return PROXY_BACKOFF_UNTIL > now;
}

function markProxyFailure(error: any) {
    const message = String(error?.message || error || '');
    const lowered = message.toLowerCase();

    if (lowered.includes('aborted') || lowered.includes('timed out')) {
        PROXY_BACKOFF_UNTIL = Date.now() + 5_000;
        return;
    }

    // Network-layer issues should cool down attempts to avoid repeated warning spam.
    if (
        lowered.includes('network request failed') ||
        lowered.includes('failed to fetch') ||
        lowered.includes('timed out') ||
        lowered.includes('econnrefused') ||
        lowered.includes('enotfound')
    ) {
        PROXY_BACKOFF_UNTIL = Date.now() + 30_000;
        return;
    }

    PROXY_BACKOFF_UNTIL = Date.now() + 10_000;
}

function warnProxyFailure(scope: 'Home signal' | 'Proxy generation', error: any) {
    const message = String(error?.message || error || '').toLowerCase();
    const isNetworkIssue =
        message.includes('network request failed') ||
        message.includes('failed to fetch') ||
        message.includes('timed out') ||
        message.includes('econnrefused') ||
        message.includes('enotfound');

    // Home signal is optional UI polish; don't spam warnings for transient network failures.
    if (scope === 'Home signal' && isNetworkIssue) return;

    const now = Date.now();
    if (now - LAST_PROXY_WARN_AT < 30_000) return;
    LAST_PROXY_WARN_AT = now;
    console.warn(`[AI SERVICE] ${scope} failed:`, error?.message || error);
}

export const AIService = {
    async generateHomeSignal({
        userName = 'AGENT',
        level = 1,
        kind,
        mode,
        memoryContext,
        recentSignals = [],
    }: HomeSignalOptions): Promise<string | null> {
        if (AI_PROXY_URL && !isProxyTemporarilyDisabled()) {
            try {
                const proxyText = await requestProxyText('/ai/home-signal', {
                    userName,
                    level,
                    kind,
                    mode,
                    memoryContext,
                    recentSignals,
                });
                return normalizeHomeSignalResult(kind, proxyText);
            } catch (error: any) {
                markProxyFailure(error);
                warnProxyFailure('Home signal', error);
                if (!ALLOW_INSECURE_CLIENT_PROVIDERS) {
                    return null;
                }
            }
        }

        const providers: AIProvider[] = ['groq', 'glm5', 'mistral', 'deepseek', 'kimi'];
        const dataDrivenRoast = kind === 'roast' && mode === 'personalized' && Math.random() < (1 / 30);
        const roastAngles = [
            'brutal truth',
            'discipline',
            'status',
            'social pressure',
            'average vs legendary',
            'fear and avoidance',
            'charisma and presence',
            'ambition',
        ];
        const quoteAngles = [
            'discipline',
            'charisma',
            'social courage',
            'self-respect',
            'status',
            'identity',
            'momentum',
            'success',
        ];
        const selectedAngle = (kind === 'roast' ? roastAngles : quoteAngles)[Math.floor(Math.random() * (kind === 'roast' ? roastAngles.length : quoteAngles.length))];
        const recentBlock = recentSignals.length
            ? `\n\nDO NOT REPEAT OR CLOSELY REWRITE THESE RECENT ${kind.toUpperCase()}S:\n- ${recentSignals.join('\n- ')}`
            : '';
        const memoryBlock = memoryContext ? `\n\n${memoryContext}` : '';
        const systemPrompt = `
You write only one home-screen ${kind} for ZCE.

Mode: ${mode.toUpperCase()}

Rules:
- Return plain text only.
- No markdown.
- No labels.
- No fake greetings.
- No multi-paragraph response.
- No quotation marks around the whole output.
- Keep it tight: ${kind === 'roast' ? '1-2 sentences max, 15-35 words total, screen-ready without scrolling.' : '1 short cinematic sentence, ideally under 18 words. Never ramble.'}
- If mode is PERSONALIZED, it should feel tailored to the user, but it does NOT need to mention stats, streaks, XP, or chat history every time.
- Personalized signals may reference user data, recent chat themes, emotional patterns, avoided reps, or current pressure when it helps.
- Sometimes personalized should be subtle and intimate, not obviously data-driven.
- For PERSONALIZED ROASTS specifically: some should be surgical and specific, others should be broader philosophical gut-punches that still feel aimed at the user's current war.
- For PERSONALIZED ROASTS specifically: explicit references to streaks, XP, quest history, or chat history should be VERY RARE (about 1 in 30 roasts).
- Most personalized roasts should feel pointed without sounding like a stats dashboard.
- Rotate naturally across themes: motivation, brutal truth, success, discipline, charisma, social skill pressure, identity, momentum, self-respect.
- Do not make every line about anxiety, streaks, or XP. Vary the lens.
- Roughly sometimes reference memory directly, sometimes imply it, sometimes go universal-but-personal.
- If mode is CLASSIC, keep it universal and iconic.
- Never output provider errors, meta commentary, or fallback notices.
- Avoid repeating phrasing from recent signals.
- Roast tone lock: David Goggins savage intensity + Zane's sharp charismatic cynicism.
- Roast flow lock: expose weakness/excuse first, then force immediate action.
- Roast ending lock: close with an urgent command/challenge (e.g. Now. Move. Prove it. Go.).
- Roast ban list: no comfort language, no therapy tone, no "it's okay", no long explanation.
- CURRENT ANGLE TO FAVOR FOR THIS GENERATION: ${selectedAngle.toUpperCase()}
${recentBlock}
${memoryBlock}
        `.trim();

        const userPrompt = kind === 'roast'
            ? mode === 'classic'
                ? 'Write one brutal classic Zane roast for the dojo home screen. Make it short, savage, electric, and action-forcing.'
                : dataDrivenRoast
                    ? 'Write one personalized Zane roast for the dojo home screen using memory above. 1-2 sentences, 15-35 words. Cut first, then command immediate action. You MAY explicitly reference streak/XP/history if it lands hard.'
                    : 'Write one personalized Zane roast for the dojo home screen using memory above. 1-2 sentences, 15-35 words. Cut first, then command immediate action. Do NOT explicitly mention streak/XP/history unless necessary. Keep it psychological, sharp, and urgent.'
            : mode === 'classic'
                ? 'Write one classic Zane quote for the home screen.'
                : 'Write one personalized Zane quote for the home screen using the memory above. Keep it very short and quotable. Sometimes reference their real patterns or chat history, sometimes keep it subtler. Mix motivation, discipline, charisma, social skill, success, and identity themes.';

        for (const provider of providers) {
            try {
                if (isProviderCoolingDown(provider)) continue;
                const { apiKey, apiUrl, model } = getProviderConfig(provider);
                if (!apiKey || apiKey.includes('PASTE_YOUR')) continue;
                const attemptStartedAt = Date.now();

                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: 'system', content: `YOU ARE WRITING FOR ${userName.toUpperCase()}, LEVEL ${level}.\n\n${systemPrompt}` },
                            { role: 'user', content: userPrompt },
                        ],
                        temperature: 0.95,
                        max_tokens: 64,
                        top_p: 1,
                        stream: false,
                        ...(
                            provider === 'kimi'
                                ? { chat_template_kwargs: { thinking: false } }
                                : provider === 'glm5'
                                    ? { chat_template_kwargs: { enable_thinking: true, clear_thinking: false } }
                                    : {}
                        )
                    }),
                });

                if (!response.ok) {
                    let errorDetails = 'Unknown Error';
                    try {
                        const error = await response.json();
                        errorDetails = JSON.stringify(error);
                    } catch {
                        errorDetails = await response.text();
                    }
                    setProviderBackoff(provider, response.status, errorDetails);
                    recordAIMetric({
                        promptType: 'home_signal',
                        provider,
                        source: 'direct',
                        success: false,
                        latencyMs: Date.now() - attemptStartedAt,
                        error: `${response.status} ${String(errorDetails).slice(0, 220)}`,
                    });
                    continue;
                }

                const data = await response.json();
                const result: string = data?.choices?.[0]?.message?.content?.trim?.() || '';

                if (
                    !result ||
                    /BRUTAL TRUTH:|ONE NON-NEGOTIABLE DRILL:|ONE ZANE QUOTE TO EMBODY:|DRILL OF THE DAY|Mindset Analysis|Reprogramming|SCORE:|rate limit|429|console\.groq|billing|connection severed/i.test(result)
                ) {
                    recordAIMetric({
                        promptType: 'home_signal',
                        provider,
                        source: 'direct',
                        success: false,
                        latencyMs: Date.now() - attemptStartedAt,
                        error: 'home signal rejected by validation filter',
                    });
                    continue;
                }

                recordAIMetric({
                    promptType: 'home_signal',
                    provider,
                    source: 'direct',
                    success: true,
                    latencyMs: Date.now() - attemptStartedAt,
                });
                return normalizeHomeSignalResult(kind, result);
            } catch {
                recordAIMetric({
                    promptType: 'home_signal',
                    provider,
                    source: 'direct',
                    success: false,
                    latencyMs: 0,
                    error: 'home signal fetch failed',
                });
                continue;
            }
        }

        return null;
    },

    async generateResponse(
        messages: { role: 'user' | 'assistant' | 'system', content: string }[],
        provider: AIProvider = 'groq',
        userName: string = 'AGENT',
        level: number = 1,
        promptType: 'main' | 'coach' | 'drill' = 'main',
        options?: { chatStyle?: ZaneChatStyle; memoryContext?: string },
        attemptedProviders: Set<AIProvider> = new Set()
    ): Promise<string> {
        attemptedProviders.add(provider);

        const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user')?.content || '';
        const userLen = lastUserMessage.trim().length;
        const maxTokens = promptType === 'main'
            ? (userLen <= 40 ? 320 : userLen <= 120 ? 520 : 760)
            : promptType === 'coach'
                ? 520
                : 560;
        const unifiedSystemPrompt = buildUnifiedSystemPrompt(userName, level, promptType, options);

        const providerFallbackOrder: AIProvider[] = ['groq', 'glm5', 'deepseek', 'mistral', 'kimi'];
        const tryNextProvider = async () => {
            if (!ALLOW_INSECURE_CLIENT_PROVIDERS) {
                return null;
            }
            for (const next of providerFallbackOrder) {
                if (attemptedProviders.has(next)) continue;
                if (isProviderCoolingDown(next)) continue;
                console.log(`[AI SERVICE] ${provider} unavailable, trying fallback to ${next}...`);
                try {
                    return await this.generateResponse(messages, next, userName, level, promptType, options, attemptedProviders);
                } catch {
                    // Keep trying remaining providers.
                }
            }
            return null;
        };

        const getSafeFailureMessage = () => {
            const proxyConfigured = Boolean(AI_PROXY_URL);
            const proxyLooksLocal = /:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.|172\.(1[6-9]|2\d|3[0-1])\.)/i.test(AI_PROXY_URL);
            const lockedToProxy = proxyConfigured && !ALLOW_INSECURE_CLIENT_PROVIDERS;

            if (promptType === 'drill') {
                return buildContextAwareDrillFallback(userName, lastUserMessage);
            }

            if (promptType === 'coach') {
                if (lockedToProxy) {
                    return `${userName}-la. Coach channel offline. AI proxy is unreachable and direct provider fallback is disabled. Start the local proxy with: npm run ai:proxy`;
                }
                return `${userName}-la. Signal jam hit the coach channel. No excuses. Run one clean rep now, then re-analyze.`;
            }

            if (lockedToProxy) {
                const hostHint = proxyLooksLocal
                    ? 'Your proxy URL is LAN/local. Keep `npm run ai:proxy` running, ensure iPhone and Mac are on the same Wi-Fi, and use your Mac LAN IP in EXPO_PUBLIC_AI_PROXY_URL.'
                    : 'AI proxy is configured but unreachable. Verify EXPO_PUBLIC_AI_PROXY_URL and that the proxy server is running.';
                return `${userName}-la. AI channel offline. ${hostHint}`;
            }

            return `${userName}-la. Neural traffic spike. Retry in a minute and keep moving.`;
        };

        if (AI_PROXY_URL && !isProxyTemporarilyDisabled()) {
            try {
                const proxyText = await requestProxyText('/ai/generate', {
                    messages,
                    provider,
                    userName,
                    level,
                    promptType,
                    options,
                    systemPrompt: unifiedSystemPrompt,
                    maxTokens,
                    temperature: 0.4,
                    timeoutMs: 18000,
                    allowFallback: true,
                    fastMode: false,
                    maxAttempts: 99,
                });
                const cleanedProxy = sanitizeModelText(proxyText);
                if (promptType === 'drill') {
                    return normalizeDrillFeedbackOutput(cleanedProxy, userName, lastUserMessage);
                }
                return enforceNameAddressing(cleanedProxy, userName);
            } catch (error: any) {
                markProxyFailure(error);
                warnProxyFailure('Proxy generation', error);
                if (!ALLOW_INSECURE_CLIENT_PROVIDERS) {
                    return getSafeFailureMessage();
                }
            }
        }

        const { apiKey, apiUrl, model } = getProviderConfig(provider);

        if (isProviderCoolingDown(provider)) {
            const fallbackResult = await tryNextProvider();
            if (fallbackResult) return fallbackResult;
            return getSafeFailureMessage();
        }

        let directStartedAt = 0;
        try {
            if (!apiKey || apiKey.includes('PASTE_YOUR')) {
                throw new Error("API Key not set.");
            }
            directStartedAt = Date.now();

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: unifiedSystemPrompt },
                        ...messages
                    ],
                    temperature: 0.45,
                    max_tokens: maxTokens,
                    top_p: 1.00,
                    stream: false,
                    ...(
                        provider === 'kimi'
                            ? { chat_template_kwargs: { thinking: false } }
                            : provider === 'glm5'
                                ? { chat_template_kwargs: { enable_thinking: false, clear_thinking: true } }
                                : {}
                    )
                }),
            });

            if (!response.ok) {
                let errorDetails = 'Unknown Error';
                try {
                    const error = await response.json();
                    errorDetails = JSON.stringify(error);
                } catch {
                    errorDetails = await response.text();
                }
                setProviderBackoff(provider, response.status, errorDetails);

                if (response.status === 429 || response.status >= 500) {
                    const fallbackResult = await tryNextProvider();
                    if (fallbackResult) return fallbackResult;
                }

                if (response.status === 402) {
                    const fallbackResult = await tryNextProvider();
                    if (fallbackResult) return fallbackResult;
                }
                throw new Error(`${provider.toUpperCase()} [${response.status}]: ${errorDetails}`);
            }

            const data = await response.json();
            // Strip known model artifacts: [YN], [Y/N], [YES/NO], etc.
            const raw: string = data.choices[0].message.content;
            const cleaned = sanitizeModelText(raw);
            recordAIMetric({
                promptType,
                provider,
                source: 'direct',
                success: true,
                latencyMs: Date.now() - directStartedAt,
            });
            if (promptType === 'drill') {
                return normalizeDrillFeedbackOutput(cleaned, userName, lastUserMessage);
            }
            return enforceNameAddressing(cleaned, userName);

        } catch (error: any) {
            console.warn(`AI Service Warning (${provider}):`, error.message);
            recordAIMetric({
                promptType,
                provider,
                source: 'direct',
                success: false,
                latencyMs: directStartedAt > 0 ? Date.now() - directStartedAt : 0,
                error: String(error?.message || error || 'unknown'),
            });

            const fallbackResult = await tryNextProvider();
            if (fallbackResult) return fallbackResult;

            if (error.message.includes("API Key not set")) {
                // In secure proxy mode, never surface client-key errors.
                if (AI_PROXY_URL && !ALLOW_INSECURE_CLIENT_PROVIDERS) {
                    return getSafeFailureMessage();
                }
                return "PROTOCOL ERROR: AI provider credentials are not configured for client fallback. Configure AI proxy URL or enable insecure local provider keys for development only.";
            }

            return getSafeFailureMessage();
        }
    },

    getMetricsSnapshot() {
        return summarizeAIMetrics();
    },

    resetMetrics() {
        resetAIMetrics();
    },
};
