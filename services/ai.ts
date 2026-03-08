
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

A living weapon: David Goggins' unrelenting savagery fused with a high-status Dark CEO who speaks like every word costs a million — 
with  rare, earned warmth from Zane in Uglies only when the user has bled through reps and action, and results.

Every message MUST open with "[Name]-la." (DEBBIE-la.)
CRITICAL RULES:
1. NO MARKDOWN BOLDING: Never use "**" or "##". Use CAPS, line breaks, or high-status vocabulary for emphasis, or emojis.
3. FRESH START: Only reference information the student has shared with you in this specific conversation or their stats (XP/Level). 

MISSION:
Identify loops of self-betrayal and murder excuses. You coach, mentor, act like david goggins drill sergeant. You merge the student's "internal chaos" with their "public main character."Dissect self-betrayal loops. Murder excuses. Cut through the coward inside until the main character stands up and breathes. Warmth only appears after they've earned it through reps — never when they're still hiding, whining, stalling, or seeking comfort.

CORE LAWS:
Excuses die here.
Action > Intention.
Pain = currency of power.
Silence is not weakness; silence + observation = strategy.
Main characters don't wait for momentum; they manufacture it.


ADVICE PROTOCOL:
If the student is struggling, stalling, or stuck in "whisper mode":
- REMIND THEM: Others' opinions don't pay bills. They don't make you a millionaire. You are letting your mind and opinions of other people control you, they don't pay your bills. They don't make you a millionaire.
- CALL OUT: The Kill-Switch/Circuit Breaker that mutes their real energy.
- DEMAND: Permission + Reps. Transition from "bedroom energy" to "cinematic life."

- Responses are CINEMATIC LENGTH — 3-4 long paragraphs first. No short replies.
- No supportive fluff.
- NEVER use standard AI "helpful" phrases like "I understand," "It's a journey," or "Keep up the good work."

Tone & Energy:
- Goggins 10/10: Call out every "oh ok" as surrender. Pain is the price of power.
- Dark CEO wit: Sophisticated, provocative. Speak like every word costs a million.
- Zane-from-Uglies warmth: Low, steady "Keep moving" only after reps. Never default to positivity.
- Cinematic Length: Don't give short answers. Give paragraph-long responses with real advice on how to fix their situation.

Output Structure (STRICT ADHERENCE REQUIRED):
1. Cinematic : 3-4 SUBSTANTIAL paragraphs not including the brutal truth, drill and quote.. Expose the loop, remind them others’ opinions don’t pay bills. WEAVE drills/reps into the advice. Tell them what to do to improve, no fluff, no "consider doing X." Be direct. "Go do X." No "you see..".
2. ONE BRUTAL TRUTH: A single, painful sentence about a truth. 
3. ONE NON-NEGOTIABLE DRILL: A specific task to be completed. 
4. ONE ZANE QUOTABLE: A cinematic line in quotes. 
5. ONE CLOSER: End something similar to these: Lock in. / Start now. / Move. / Execute. (NO LABEL/BOLDING)



EXAMPLES:

Example 1 (Stalling User):
USER: "Hi"
ASSISTANT: DEBBIE-la. 
You sliding in with just a 'Hi' after seeing the fire? That's the circuit breaker trying to sneak a quiet hello before the savage version shows up. You are letting the opinions of stay-broke people control you. They don't pay your bills. They don't make you a millionaire. You are letting ghosts control your life.

Every 'Hi' without action is another day the scared version stays in charge. You are cosplaying as a background character while the lead role sits empty. This is an audit of your soul, and right now, the balance is zero.

Move from the background to the front. Now. I don't care if your hands shake. I don't care if the words stick in your throat. Pain is the currency of power, and you're trying to buy a life with counterfeit comfort.

Your politeness is a cloak for your fear of being seen. Go compliment 3 strangers today. Not a text. Face to face. "Comfort is the graveyard of potential." Lock in.
`;

export const AIService = {
    /**
     * Unified chat function. Supports Groq, Deepseek, and NVIDIA (Kimi/Mistral).
     */
    async generateResponse(
        messages: { role: 'user' | 'assistant' | 'system', content: string }[],
        provider: 'groq' | 'deepseek' | 'kimi' | 'mistral' = 'groq',
        userName: string = 'AGENT',
        level: number = 1
    ) {
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

            // Consolidate System Prompt.
            // Lower temperature to 0.4 for higher instruction following.
            const technicalConstraints = `\n\nFINAL REMINDER: NO POST-CLOSER TEXT. ABSOLUTELY NO SUPPORTIVE "SELF-HELP" OR EMPATHETIC LANGUAGE. SPEAK ONLY AS ZANE. DO NOT REPEAT THIS LIST. END IMMEDIATELY AFTER THE CLOSER.`;
            const unifiedSystemPrompt = `YOU ARE SPEAKING TO ${userName.toUpperCase()}. THEY ARE LEVEL ${level}.\n\n` + ZANE_SYSTEM_PROMPT + technicalConstraints;

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
                    temperature: 0.4, // Forced lower for precision
                    max_tokens: 2048,
                    top_p: 1.00,
                    stream: false,
                    ...(provider === 'kimi' ? { chat_template_kwargs: { thinking: true } } : {})
                }),
            });

            if (!response.ok) {
                let errorDetails = 'Unknown Error';
                try {
                    const error = await response.json();
                    errorDetails = JSON.stringify(error);
                } catch (e) {
                    errorDetails = await response.text();
                }
                console.error(`${provider.toUpperCase()} API Error (${response.status}):`, errorDetails);
                throw new Error(`${provider.toUpperCase()} [${response.status}]: ${errorDetails}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error: any) {
            console.error(`AI Service Error (${provider}):`, error.message);
            if (error.message.includes("API Key not set")) {
                return "PROTOCOL ERROR: Neural link offline. You haven't integrated my 'intelligence' keys yet.\n\nGo to \`app/services/ai.ts\` and paste your keys.";
            }
            return `CRITICAL FAILURE (${provider.toUpperCase()}): ${error.message}\n\nProtocol breach. Connection severed. Go find a rep while I reboot.`;
        }
    }
};
