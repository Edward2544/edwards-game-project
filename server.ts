import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const SYSTEM_UNIVERSE_RULES = `You are the editorial football journalist, sporting director, and Kenyan Sheng / Swahili football commentator for "Football Mtaani", a personal eFootball career universe.
Strict truthfulness & immersion rules:
1. NEVER invent or alter the final score, goalscorers, assists, cards, or player ratings of any match the user played. Only reference facts provided in the payload.
2. Clearly distinguish simulated universe storylines (fictional media headlines, simulated rival results, simulated rumors) from the user's real eFootball match actions.
3. Never fabricate real-world club history and present it as verified fact if unsure; frame simulated lore as part of the simulated universe.
4. For Kenyan Sheng / Swahili commentary: use authentic, natural Nairobi / Kenyan street football Swahili & Sheng (e.g. "Wasee wa mtaani", "Buda", "Form ni gani", "Kijana amepiga msumari", "Cheza chini", "Bao safi kabisa", "Dakika tisini za moto", "Wacha tuone", "Hii game ni noma"). Keep it energetic, clear, and fun!`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      app: 'Football Mtaani',
      aiConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    });
  });

  app.post('/api/ai/opening', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in Settings > Secrets. Using structured local documentary prologue.',
      });
    }

    try {
      const { seasonLabel, leagues } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Write a cinematic, broadcast-documentary opening narration for "Football Mtaani", a new personal eFootball football universe starting in ${seasonLabel}.
Available leagues & competitions in this universe: ${JSON.stringify(leagues)}.
Include:
1. A gripping 2-paragraph documentary introduction to the new season, title races, continental nights, and the transfer market atmosphere.
2. Three concise media storyline headlines circulating before Opening Day (labeled as Simulated Universe Media).
3. A lively Kenyan Sheng / Swahili opening hype intro from the Mtaani studio booth welcoming the manager before they pick a club.
4. An opening call to the prospective manager before they choose their club. Do NOT assume which club they will pick.`,
        config: {
          systemInstruction: SYSTEM_UNIVERSE_RULES,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentaryLead: { type: Type.STRING },
              seasonAtmosphere: { type: Type.STRING },
              headlines: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              shengIntro: { type: Type.STRING },
              openingQuestion: { type: Type.STRING },
            },
          },
        },
      });

      const text = (response.text ?? '{}').trim();
      res.json(JSON.parse(text));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate documentary opening.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/briefing', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in Settings > Secrets.',
      });
    }

    try {
      const { clubName, opponentName, competition, matchday, venue, opponentForm, tacticalIdentity, formation, isRivalry, rivalryName, userForm, commentatorName } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Produce a pre-match broadcast & tactical scouting briefing for the upcoming eFootball match. Do NOT predict or invent the match result—the user has not played it yet.
Include a short Kenyan Sheng / Swahili pre-match hype call from commentator "${commentatorName || 'Buda Kamau'}".
Match Context:
- Managed Club: ${clubName} (Form: ${userForm || 'Opening phase'}, Formation: ${formation}, Identity: ${tacticalIdentity})
- Opponent: ${opponentName} (Form: ${opponentForm || 'Early season'})
- Competition: ${competition}, ${matchday}
- Venue: ${venue}
- Rivalry Match: ${isRivalry ? `YES (${rivalryName})` : 'No'}`,
        config: {
          systemInstruction: SYSTEM_UNIVERSE_RULES,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              broadcastIntro: { type: Type.STRING },
              opponentStrengths: { type: Type.STRING },
              opponentWeaknesses: { type: Type.STRING },
              tacticalRecommendation: { type: Type.STRING },
              matchObjective: { type: Type.STRING },
              shengPreMatchHype: { type: Type.STRING },
            },
          },
        },
      });

      const text = (response.text ?? '{}').trim();
      res.json(JSON.parse(text));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate matchday briefing.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/match-report', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in Settings > Secrets.',
      });
    }

    try {
      const payload = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate editorial match report commentary AND 3 authentic Kenyan Sheng / Swahili live/post-match commentary lines strictly grounded in this user-reported eFootball match result. Do NOT invent extra goals, ratings, or stats that are not provided.
Commentator Persona: ${payload.commentatorName || 'Buda Kamau'}
Match Data:
${JSON.stringify(payload, null, 2)}`,
        config: {
          systemInstruction: SYSTEM_UNIVERSE_RULES,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              playerPerformance: { type: Type.STRING },
              tacticalAnalysis: { type: Type.STRING },
              mediaReaction: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              fanReaction: { type: Type.STRING },
              managersVerdict: { type: Type.STRING },
              shengCommentary: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
          },
        },
      });

      const text = (response.text ?? '{}').trim();
      res.json(JSON.parse(text));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate AI match report.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/negotiation', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in Settings > Secrets.',
      });
    }

    try {
      const { clubName, playerName, position, askingValue, offeredFee, offeredWage, negotiationType, round } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Act as the opposing club's sporting director in a simulated transfer negotiation.
Context:
- Buying/Selling Manager's Club: ${clubName}
- Player: ${playerName} (${position})
- Estimated Market Value: €${askingValue}M
- Proposed Fee: €${offeredFee}M
- Proposed Weekly Wage: €${offeredWage}K
- Type: ${negotiationType}
- Negotiation Round: ${round}
Decide realistically whether to accept, counter with a reasonable fee/wage, or reject if far below value.`,
        config: {
          systemInstruction: SYSTEM_UNIVERSE_RULES,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              decision: { type: Type.STRING, description: 'accepted | counter | rejected' },
              counterFee: { type: Type.NUMBER },
              counterWage: { type: Type.NUMBER },
              directorMessage: { type: Type.STRING },
            },
          },
        },
      });

      const text = (response.text ?? '{}').trim();
      res.json(JSON.parse(text));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to evaluate transfer negotiation.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/press-conference', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in Settings > Secrets.',
      });
    }

    try {
      const { clubName, managerName, leaguePosition, recentForm, nextOpponent, lastHeadline } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Generate a realistic 3-question simulated press conference for ${managerName} of ${clubName} (with one Nairobi/Mtaani sports reporter asking in light Sheng/English).
League Position: ${leaguePosition}, Recent Form: ${recentForm}, Next Opponent: ${nextOpponent}, Latest Storyline: ${lastHeadline}.
For each question provide 3 distinct managerial response options (Calm/Measured, Bold/Ambitious, Tactical/Protective) and the media reaction note for each.`,
        config: {
          systemInstruction: SYSTEM_UNIVERSE_RULES,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              journalistIntro: { type: Type.STRING },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    reporter: { type: Type.STRING },
                    question: { type: Type.STRING },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          tone: { type: Type.STRING },
                          statement: { type: Type.STRING },
                          headlineImpact: { type: Type.STRING },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      const text = (response.text ?? '{}').trim();
      res.json(JSON.parse(text));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate press conference.';
      res.status(500).json({ error: message });
    }
  });

  app.post('/api/ai/season-review', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured in Settings > Secrets.',
      });
    }

    try {
      const summary = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Write an authoritative end-of-season documentary review AND a Kenyan Sheng / Swahili end-of-season verdict based strictly on these tracked season records:
${JSON.stringify(summary, null, 2)}`,
        config: {
          systemInstruction: SYSTEM_UNIVERSE_RULES,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              seasonHeadline: { type: Type.STRING },
              narrativeSummary: { type: Type.STRING },
              tacticalEvolution: { type: Type.STRING },
              boardVerdict: { type: Type.STRING },
              nextSeasonOutlook: { type: Type.STRING },
              shengSeasonVerdict: { type: Type.STRING },
            },
          },
        },
      });

      const text = (response.text ?? '{}').trim();
      res.json(JSON.parse(text));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate season review.';
      res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Football Mtaani server listening on http://localhost:${PORT}`);
  });
}

startServer();
