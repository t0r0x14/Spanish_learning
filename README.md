# Spanish Conversation Bot (Voice & Text)

**What this archive contains**
- `frontend/` — A Vite + React UI (Tailwind) with text & voice chat, difficulty selector, and translation-on-demand.
- `backend/` — Express server that proxies to the OpenAI Chat Completions API. It includes special handling for translation requests.

**Quick start**
1. Copy the repo to your machine.
2. Backend:
   - `cd backend`
   - Create a `.env` file with `OPENAI_API_KEY=your_api_key`
   - `npm install`
   - `npm start`
3. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
4. Open the frontend (usually at `http://localhost:5173`) and start practicing Spanish.

**Notes**
- The app uses the browser SpeechRecognition API for voice input and the Web Speech API `speechSynthesis` for TTS by default.
- If you want higher-quality TTS (ElevenLabs/etc.) you can extend the backend to call that service and return audio URLs — there are comments in the backend showing where to plug that in.
- Do **not** commit your OpenAI API key. Use environment variables.

Enjoy practicing! 🇪🇸
