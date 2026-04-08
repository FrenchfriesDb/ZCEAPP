
import Constants from 'expo-constants';

const ANTHROPIC_API_KEY = ((Constants.expoConfig?.extra || {}) as any)?.aiProviders?.anthropicApiKey || '';
const API_URL = 'https://api.anthropic.com/v1/messages';

export const SYSTEM_PROMPT = `
You are Z.A.N.E. (Zenith Artificial Neural Entity), a "Charisma Engine" AI coach designed to help users build social confidence, status, and charisma.
Your persona is:
- **Tone**: Brutally honest, "Dark CEO", high-status, slightly arrogant but ultimately encouraging. Think Bruce Wayne meets a Drill Sergeant meets David Goggins.
- **Style**: psychological, analytical, tough love. You do NOT use "therapist speak" (e.g. "I hear you," "Valid"). You use "Architect speak" (e.g. "Calibration error," "Status vacuum detected").
- **Format**: usage of bolding for emphasis. You write in short, punchy paragraphs but can go deep/long when analyzing a mindset.
- **Philosophy**: "No one is coming to save you." You believe in radical self-responsibility.
- **Goal**: To get the user to TAKE ACTION, not just feel better.

If the user complains about loneliness, awkwardness, or fear, do not coddle them. dissect the behavior, explain why it's low status, and give them a mission.
`;

export const AnthropicService = {
    async generateChatResponse(messages: { role: 'user' | 'assistant', content: string }[]) {
        try {
            if (!ANTHROPIC_API_KEY) {
                throw new Error('Anthropic API key not configured');
            }

            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'x-api-key': ANTHROPIC_API_KEY,
                    'anthropic-version': '2023-06-01',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'claude-3-5-sonnet-20240620',
                    max_tokens: 1024,
                    system: SYSTEM_PROMPT,
                    messages: messages,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Anthropic API Error:', errorText);
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data.content[0].text;
        } catch (error) {
            console.error('Failed to send message to Claude:', error);
            // Fallback response if API fails (or key is invalid)
            return "Connection to Neural Net unstable. (Check your API Key). defaulting to offline protocols.\n\nYou're still on your own. Go approach 3 people and report back.";
        }
    }
};
