// Use your API keys here or move them to a .env file if using a setup that supports it.
// For Expo GO / Local Dev, constants are simplest unless you set up expo-constants.
const GROQ_API_KEY = '***REDACTED***';
const DEEPSEEK_API_KEY = 'sk-716a2fde00914376ae4ab1a6802693d7';

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEEPSEEK_URL = 'https://api.deepseek.com/v1/chat/completions';
const NVIDIA_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

const NVIDIA_KEY_KIMI = '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';
const NVIDIA_KEY_MISTRAL = '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';

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

Responses are CINEMATIC LENGTH — 3-4 substantial paragraphs. No short replies. No supportive fluff.

Output Structure (STRICT ADHERENCE REQUIRED):
1. CINEMATIC ANALYSIS: 3-4 substantial paragraphs. Analyze their energy, "kill-switch," and stall tactics. Be blunt and savage. Give advice on how to fix it via direct action. NO "you see.." 
2. BRUTAL TRUTH: (Header: BRUTAL TRUTH:) A single, painful sentence about why they are staying small.
3. ONE NON-NEGOTIABLE DRILL: A specific task to be completed right now.
4. ONE ZANE QUOTE TO EMBODY: A cinematic line in quotes. 
5. ONE CLOSER: End with: Lock in. / Start now. / Move. / Execute. (NO LABEL)

EXAMPLES:
USER: "Hi"
ASSISTANT: DEBBIE-la. 
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
2. ALWAYS open naturally with "[Name]-la." and then respond to the user's actual message, not a canned greeting.
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
- no fake hype
- no giant cinematic speeches

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

type HomeSignalOptions = {
    userName?: string;
    level?: number;
    kind: HomeSignalKind;
    mode: HomeSignalMode;
    memoryContext?: string;
    recentSignals?: string[];
};

export const AIService = {
    async generateHomeSignal({
        userName = 'AGENT',
        level = 1,
        kind,
        mode,
        memoryContext,
        recentSignals = [],
    }: HomeSignalOptions): Promise<string | null> {
        const providers: Array<'groq' | 'mistral' | 'deepseek'> = ['groq', 'mistral', 'deepseek'];
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
- Keep it tight: ${kind === 'roast' ? '1-2 sharp sentences max, ideally under 22 words.' : '1 short cinematic sentence, ideally under 18 words. Never ramble.'}
- If mode is PERSONALIZED, it should feel tailored to the user, but it does NOT need to mention stats, streaks, XP, or chat history every time.
- Personalized signals may reference user data, recent chat themes, emotional patterns, avoided reps, or current pressure when it helps.
- Sometimes personalized should be subtle and intimate, not obviously data-driven.
- For PERSONALIZED ROASTS specifically: some should be surgical and specific, others should be broader philosophical gut-punches that still feel aimed at the user's current war.
- Rotate naturally across themes: motivation, brutal truth, success, discipline, charisma, social skill pressure, identity, momentum, self-respect.
- Do not make every line about anxiety, streaks, or XP. Vary the lens.
- Roughly sometimes reference memory directly, sometimes imply it, sometimes go universal-but-personal.
- If mode is CLASSIC, keep it universal and iconic.
- Never output provider errors, meta commentary, or fallback notices.
- Avoid repeating phrasing from recent signals.
${recentBlock}
${memoryBlock}
        `.trim();

        const userPrompt = kind === 'roast'
            ? mode === 'classic'
                ? 'Write one brutal classic Zane roast for the home screen.'
                : 'Write one personalized Zane roast for the home screen using the memory above. Keep it short, surgical, and savage. Do NOT force stats or history into every roast. Some roasts should be direct and specific, others should feel like dark philosophical truth about discipline, fear, status, average vs legendary, or giving power away.'
            : mode === 'classic'
                ? 'Write one classic Zane quote for the home screen.'
                : 'Write one personalized Zane quote for the home screen using the memory above. Keep it very short and quotable. Sometimes reference their real patterns or chat history, sometimes keep it subtler. Mix motivation, discipline, charisma, social skill, success, and identity themes.';

        for (const provider of providers) {
            try {
                const result = await this.generateResponse(
                    [{ role: 'user', content: userPrompt }],
                    provider,
                    userName,
                    level,
                    'main',
                    {
                        chatStyle: mode === 'classic' ? 'classic' : 'coach',
                        memoryContext: systemPrompt,
                    }
                );

                if (
                    !result ||
                    /CRITICAL FAILURE|PROTOCOL ERROR|rate limit|429|console\.groq|billing|connection severed/i.test(result)
                ) {
                    continue;
                }

                return result.replace(/^"+|"+$/g, '').trim();
            } catch {
                continue;
            }
        }

        return null;
    },

    async generateResponse(
        messages: { role: 'user' | 'assistant' | 'system', content: string }[],
        provider: 'groq' | 'deepseek' | 'kimi' | 'mistral' = 'groq',
        userName: string = 'AGENT',
        level: number = 1,
        promptType: 'main' | 'coach' | 'drill' = 'main',
        options?: { chatStyle?: ZaneChatStyle; memoryContext?: string }
    ): Promise<string> {
        let apiKey = '';
        let apiUrl = '';
        let model = '';

        if (provider === 'groq') {
            apiKey = GROQ_API_KEY;
            apiUrl = GROQ_URL;
            model = 'llama-3.3-70b-versatile';
        } else if (provider === 'deepseek') {
            apiKey = DEEPSEEK_API_KEY;
            apiUrl = DEEPSEEK_URL;
            model = 'deepseek-chat';
        } else if (provider === 'kimi') {
            apiKey = NVIDIA_KEY_KIMI;
            apiUrl = NVIDIA_URL;
            model = 'moonshotai/kimi-k2.5';
        } else if (provider === 'mistral') {
            apiKey = NVIDIA_KEY_MISTRAL;
            apiUrl = NVIDIA_URL;
            model = 'mistralai/mistral-large-3-675b-instruct-2512';
        }

        try {
            if (!apiKey || apiKey.includes('PASTE_YOUR')) {
                throw new Error("API Key not set.");
            }

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
            const unifiedSystemPrompt = `YOU ARE SPEAKING TO ${userName.toUpperCase()}. THEY ARE LEVEL ${level}.\n\n` + basePrompt + technicalConstraints + memoryContext;

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
                    temperature: 0.5,
                    max_tokens: 2048,
                    top_p: 1.00,
                    stream: false,
                    ...(provider === 'kimi' ? { chat_template_kwargs: { thinking: true } } : {})
                }),
            });

            if (!response.ok) {
                // If deepseek fails, try a fast fallback to groq
                if (provider === 'deepseek' || provider === 'kimi') {
                    console.log(`[AI SERVICE] ${provider} failed, trying fallback to groq...`);
                    return this.generateResponse(messages, 'groq', userName, level, promptType);
                }

                let errorDetails = 'Unknown Error';
                try {
                    const error = await response.json();
                    errorDetails = JSON.stringify(error);
                } catch (e) {
                    errorDetails = await response.text();
                }
                throw new Error(`${provider.toUpperCase()} [${response.status}]: ${errorDetails}`);
            }

            const data = await response.json();
            // Strip known model artifacts: [YN], [Y/N], [YES/NO], etc.
            const raw: string = data.choices[0].message.content;
            const cleaned = raw.replace(/\[Y\/?N(O)?\]/gi, '').replace(/\s{3,}/g, '\n\n').trim();
            return cleaned;

        } catch (error: any) {
            console.warn(`AI Service Warning (${provider}):`, error.message);

            // Fallback for network errors too
            if (provider !== 'groq') {
                console.log(`[AI SERVICE] Network error with ${provider}, trying fallback to groq...`);
                return this.generateResponse(messages, 'groq', userName, level, promptType);
            }

            if (error.message.includes("API Key not set")) {
                return "PROTOCOL ERROR: Neural link offline. You haven't integrated my 'intelligence' keys yet.\n\nGo to \`app/services/ai.ts\` and paste your keys.";
            }
            return `CRITICAL FAILURE (${provider.toUpperCase()}): ${error.message}\n\nProtocol breach. Connection severed. Go find a rep while I reboot.`;
        }
    }
};
