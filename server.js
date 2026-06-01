// ============================================================
//  NovelInk AI Server — Par DAVIESLAY studio
//  Déploiement : Render.com (Node.js)
//  Variables d'environnement requises :
//    ANTHROPIC_API_KEY, OPENAI_API_KEY, GEMINI_API_KEY
//    MISTRAL_API_KEY, GROK_API_KEY, DEEPSEEK_API_KEY
// ============================================================

const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors({ origin: ['https://marcelaagbassi-create.github.io', 'http://localhost:3000'] }));
app.use(express.json({ limit: '10mb' }));

// ── Sélection automatique du meilleur modèle par tâche ──────
const AI_ROUTING = {
  writing:     { provider: 'claude',   model: 'claude-sonnet-4-20250514' },
  correction:  { provider: 'gpt4',     model: 'gpt-4o-mini' },
  cover:       { provider: 'gemini',   model: 'gemini-2.0-flash-preview-image-generation' },
  suggest:     { provider: 'mistral',  model: 'mistral-large-latest' },
  chatbot:     { provider: 'claude',   model: 'claude-haiku-4-5-20251001' },
  translation: { provider: 'deepseek', model: 'deepseek-chat' },
  general:     { provider: 'grok',     model: 'grok-3-mini' }
};

// ══════════════════════════════════════════════════════════════
//  CLAUDE (Anthropic)
// ══════════════════════════════════════════════════════════════
async function callClaude(model, systemPrompt, userMessage, maxTokens = 1000) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Claude error');
  return data.content[0].text;
}

// ══════════════════════════════════════════════════════════════
//  GPT-4 (OpenAI)
// ══════════════════════════════════════════════════════════════
async function callGPT4(model, systemPrompt, userMessage, maxTokens = 1000) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'GPT-4 error');
  return data.choices[0].message.content;
}

// ══════════════════════════════════════════════════════════════
//  GEMINI (Google)
// ══════════════════════════════════════════════════════════════
async function callGemini(model, prompt, imageMode = false) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const body = imageMode
    ? { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE', 'TEXT'] } }
    : { contents: [{ parts: [{ text: prompt }] }] };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Gemini error');

  if (imageMode) {
    const imgPart = data.candidates[0]?.content?.parts?.find(p => p.inlineData);
    if (imgPart) return { type: 'image', data: imgPart.inlineData.data, mimeType: imgPart.inlineData.mimeType };
  }
  return data.candidates[0]?.content?.parts[0]?.text || '';
}

// ══════════════════════════════════════════════════════════════
//  MISTRAL
// ══════════════════════════════════════════════════════════════
async function callMistral(model, systemPrompt, userMessage, maxTokens = 1000) {
  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Mistral error');
  return data.choices[0].message.content;
}

// ══════════════════════════════════════════════════════════════
//  GROK (xAI)
// ══════════════════════════════════════════════════════════════
async function callGrok(model, systemPrompt, userMessage, maxTokens = 1000) {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROK_API_KEY}`
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Grok error');
  return data.choices[0].message.content;
}

// ══════════════════════════════════════════════════════════════
//  DEEPSEEK
// ══════════════════════════════════════════════════════════════
async function callDeepSeek(model, systemPrompt, userMessage, maxTokens = 1000) {
  const res = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'DeepSeek error');
  return data.choices[0].message.content;
}

// ══════════════════════════════════════════════════════════════
//  ROUTEUR PRINCIPAL
// ══════════════════════════════════════════════════════════════
async function routeToAI(provider, model, systemPrompt, userMessage, options = {}) {
  switch (provider) {
    case 'claude':   return await callClaude(model, systemPrompt, userMessage, options.maxTokens || 1500);
    case 'gpt4':     return await callGPT4(model, systemPrompt, userMessage, options.maxTokens || 1500);
    case 'gemini':   return await callGemini(model, userMessage, options.imageMode);
    case 'mistral':  return await callMistral(model, systemPrompt, userMessage, options.maxTokens || 1500);
    case 'grok':     return await callGrok(model, systemPrompt, userMessage, options.maxTokens || 1500);
    case 'deepseek': return await callDeepSeek(model, systemPrompt, userMessage, options.maxTokens || 1500);
    default: throw new Error('Provider inconnu : ' + provider);
  }
}

// ══════════════════════════════════════════════════════════════
//  ROUTES API
// ══════════════════════════════════════════════════════════════

// Health check
app.get('/', (req, res) => res.json({ status: 'NovelInk AI Server ✅', version: '1.0', studio: 'DAVIESLAY' }));
app.get('/health', (req, res) => res.json({ ok: true }));

// ── 1. ASSISTANT D'ÉCRITURE ──────────────────────────────────
app.post('/api/ai/write', async (req, res) => {
  const { prompt, genre, style, context, lang = 'fr' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt requis' });

  const { provider, model } = AI_ROUTING.writing;
  const system = `Tu es un assistant d'écriture créatif pour NovelInk, une plateforme littéraire francophone. Tu aides les auteurs à écrire des romans, chapitres et histoires. Tu réponds toujours en ${lang === 'fr' ? 'français' : lang}. Genre : ${genre || 'non spécifié'}. Style : ${style || 'libre'}. Sois créatif, engageant et respecte le ton de l'auteur.`;
  const message = context ? `Contexte de l'histoire :\n${context}\n\nDemande de l'auteur :\n${prompt}` : prompt;

  try {
    const text = await routeToAI(provider, model, system, message, { maxTokens: 2000 });
    res.json({ result: text, provider, model });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 2. CORRECTION / AMÉLIORATION ────────────────────────────
app.post('/api/ai/correct', async (req, res) => {
  const { text, mode = 'full', lang = 'fr' } = req.body;
  if (!text) return res.status(400).json({ error: 'text requis' });

  const { provider, model } = AI_ROUTING.correction;
  const modes = {
    ortho: 'Corrige uniquement les fautes d\'orthographe et de grammaire.',
    style: 'Améliore le style littéraire tout en gardant le sens original.',
    full: 'Corrige l\'orthographe, la grammaire et améliore le style littéraire.',
    simplify: 'Simplifie le texte pour le rendre plus lisible.',
    enrich: 'Enrichis le vocabulaire et rends le texte plus littéraire.'
  };

  const system = `Tu es un correcteur et éditeur littéraire expert en langue française pour NovelInk. ${modes[mode] || modes.full} Renvoie uniquement le texte corrigé, sans explications sauf si demandé.`;

  try {
    const result = await routeToAI(provider, model, system, text, { maxTokens: 2000 });
    res.json({ result, provider, model });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 3. GÉNÉRATION DE COUVERTURE ──────────────────────────────
app.post('/api/ai/cover', async (req, res) => {
  const { title, genre, synopsis, style } = req.body;
  if (!title) return res.status(400).json({ error: 'title requis' });

  const prompt = `Génère une couverture de roman pour "${title}". Genre: ${genre || 'fiction'}. ${synopsis ? 'Synopsis: ' + synopsis.substring(0, 200) : ''}. Style: ${style || 'cinématographique, moderne, professionnel'}. Image verticale portrait, haute qualité, digne d'une couverture de livre publiée.`;

  try {
    const result = await callGemini('gemini-2.0-flash-preview-image-generation', prompt, true);
    res.json({ result, provider: 'gemini' });
  } catch(e) {
    // Fallback : suggérer des prompts pour DALL-E ou Stable Diffusion
    res.status(500).json({ error: e.message, fallback: `Cover art for "${title}", ${genre} novel, professional book cover design` });
  }
});

// ── 4. SUGGESTIONS TITRES & RÉSUMÉS ─────────────────────────
app.post('/api/ai/suggest', async (req, res) => {
  const { type, content, genre, existing } = req.body;
  if (!content) return res.status(400).json({ error: 'content requis' });

  const { provider, model } = AI_ROUTING.suggest;
  let system, message;

  if (type === 'title') {
    system = 'Tu es un expert en titres de romans pour NovelInk. Propose des titres accrocheurs, mémorables et adaptés au genre. Réponds en JSON: {"titles": ["titre1", "titre2", "titre3", "titre4", "titre5"]}';
    message = `Genre: ${genre || 'fiction'}\nContenu: ${content.substring(0, 500)}\n${existing ? 'Titres existants à éviter: ' + existing : ''}`;
  } else {
    system = 'Tu es un expert en résumés de romans pour NovelInk. Crée des résumés accrocheurs de 2-3 phrases qui donnent envie de lire. Réponds en JSON: {"summaries": ["résumé1", "résumé2", "résumé3"]}';
    message = `Genre: ${genre || 'fiction'}\nContenu: ${content.substring(0, 800)}`;
  }

  try {
    const raw = await routeToAI(provider, model, system, message, { maxTokens: 600 });
    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { parsed = { raw }; }
    res.json({ result: parsed, provider, model });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 5. CHATBOT LECTEUR ───────────────────────────────────────
app.post('/api/ai/chat', async (req, res) => {
  const { message, bookContext, history = [] } = req.body;
  if (!message) return res.status(400).json({ error: 'message requis' });

  const { provider, model } = AI_ROUTING.chatbot;
  const system = `Tu es un assistant littéraire pour NovelInk, une plateforme de lecture et d'écriture. ${bookContext ? `Voici le contexte du roman : ${bookContext.substring(0, 1000)}` : 'Tu aides les lecteurs et auteurs avec leurs questions sur la lecture, l\'écriture et la littérature.'} Réponds en français, de façon friendly et cultivée. Sois concis (2-4 phrases max sauf si nécessaire).`;

  // Construire l'historique pour la conversation
  const messages = history.slice(-6).map(h => ({ role: h.role, content: h.content }));
  messages.push({ role: 'user', content: message });

  try {
    let result;
    if (provider === 'claude') {
      const historyStr = messages.slice(0,-1).map(m => `${m.role}: ${m.content}`).join('\n');
      const fullMsg = historyStr ? `${historyStr}\nuser: ${message}` : message;
      result = await callClaude(model, system, fullMsg, 500);
    } else {
      result = await routeToAI(provider, model, system, message, { maxTokens: 500 });
    }
    res.json({ result, provider, model });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 6. TRADUCTION ────────────────────────────────────────────
app.post('/api/ai/translate', async (req, res) => {
  const { text, from = 'fr', to } = req.body;
  if (!text || !to) return res.status(400).json({ error: 'text et to requis' });

  const { provider, model } = AI_ROUTING.translation;
  const langs = { fr:'français', en:'anglais', es:'espagnol', pt:'portugais', ar:'arabe', zh:'chinois', de:'allemand', it:'italien' };
  const system = `Tu es un traducteur littéraire expert. Traduis le texte du ${langs[from]||from} vers ${langs[to]||to} en préservant le style littéraire, les nuances et l'émotion du texte original. Retourne uniquement la traduction, sans explications.`;

  try {
    const result = await routeToAI(provider, model, system, text, { maxTokens: 2000 });
    res.json({ result, provider, model, from, to });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 7. ANALYSE STYLE ─────────────────────────────────────────
app.post('/api/ai/analyze', async (req, res) => {
  const { text, type = 'style' } = req.body;
  if (!text) return res.status(400).json({ error: 'text requis' });

  const system = `Tu es un critique littéraire expert pour NovelInk. Analyse ce texte et retourne un JSON avec: {"score": 1-10, "style": "description du style", "strengths": ["point fort 1", "point fort 2"], "improvements": ["amélioration 1", "amélioration 2"], "readability": "facile/moyen/expert", "genre_fit": "genre suggéré"}. Sois constructif et encourageant.`;

  try {
    const raw = await routeToAI('claude', 'claude-haiku-4-5-20251001', system, text.substring(0, 1000), { maxTokens: 600 });
    let parsed;
    try { parsed = JSON.parse(raw.replace(/```json|```/g, '').trim()); }
    catch { parsed = { raw }; }
    res.json({ result: parsed, provider: 'claude' });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ── 8. CONTINUER L'HISTOIRE ──────────────────────────────────
app.post('/api/ai/continue', async (req, res) => {
  const { text, words = 200, genre, style } = req.body;
  if (!text) return res.status(400).json({ error: 'text requis' });

  const system = `Tu es un écrivain créatif expert en fiction française. Continue l'histoire de façon naturelle et cohérente avec le ton existant. Genre: ${genre||'fiction'}. Style: ${style||'narratif'}. Écris environ ${words} mots. Ne répète pas le texte fourni, continue directement.`;

  try {
    const { provider, model } = AI_ROUTING.writing;
    const result = await routeToAI(provider, model, system, `Texte existant:\n${text.substring(-500)}\n\nContinue:`, { maxTokens: Math.min(words * 3, 2000) });
    res.json({ result, provider, model });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// Démarrer le serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 NovelInk AI Server démarré sur port ${PORT} — DAVIESLAY studio`));

module.exports = app;
