const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 5178;
if (!OPENAI_API_KEY) {
  console.warn("Warning: OPENAI_API_KEY not set. Set it in .env or environment before running.");
}

// Helper to call OpenAI Chat Completions
async function callOpenAI(messages, opts = {}) {
  const model = opts.model || 'gpt-4o-mini'; // change if you prefer another model
  try {
    const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
      model,
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 500
    }, {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const choice = resp.data.choices && resp.data.choices[0];
    return choice ? choice.message.content : '';
  } catch (err) {
    console.error("OpenAI error:", err.response ? err.response.data : err.message);
    throw err;
  }
}

// System prompt for regular conversation. The assistant should speak Spanish only unless asked to translate.
function baseSystemPrompt(difficulty = 'intermediate') {
  return `Eres un tutor conversacional en ESPAÑOL. Habla **solo en español** excepto cuando el usuario diga "I don't understand" o "no entiendo" (en ese caso proporciona una traducción al inglés). 
Corrige los errores del usuario con amabilidad, explica brevemente la corrección y luego continúa la conversación de forma natural.
Ajusta el vocabulario y la complejidad al nivel del usuario: ${difficulty}.
Sé breve (3–5 frases) y útil.`;
}

app.post('/api/chat', async (req, res) => {
  const { messages = [], difficulty = 'intermediate', action = 'chat', lastAssistantMessage = '' } = req.body;

  try {
    if (action === 'translate') {
      // Translate the assistant's last message into English and provide a simplified Spanish rephrasing.
      const system = {
        role: 'system',
        content: 'Eres un traductor y re-expresor. Recibe un texto en español y devuelve: 1) una traducción al INGLÉS clara y concisa, y 2) una reformulación en español más simple. Responde en el siguiente formato EXACTO:\nTRANSLATION:\n<english translation>\n---\nSIMPLIFIED_SPANISH:\n<simple spanish>'
      };
      const userPrompt = { role: 'user', content: lastAssistantMessage || messages.slice(-1)[0]?.content || '' };
      const aiResponse = await callOpenAI([system, userPrompt], { temperature: 0.2 });
      // Try to split into two parts
      const parts = aiResponse.split('---');
      const translationPart = parts[0] ? parts[0].replace(/^TRANSLATION:\s*/i, '').trim() : '';
      const simplePart = parts[1] ? parts[1].replace(/^SIMPLIFIED_SPANISH:\s*/i, '').trim() : '';
      return res.json({ translation: translationPart, simplified: simplePart, raw: aiResponse });
    } else {
      // Normal chat: prepend system prompt and pass conversation through
      const systemMsg = { role: 'system', content: baseSystemPrompt(difficulty) };
      // Map incoming messages to the OpenAI format (assumes frontend sent {role, content})
      const convo = [systemMsg, ...messages];
      const aiResponse = await callOpenAI(convo, { temperature: 0.7, max_tokens: 700 });
      return res.json({ reply: aiResponse });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: err.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`Spanish bot backend listening on http://localhost:${PORT}`);
});
