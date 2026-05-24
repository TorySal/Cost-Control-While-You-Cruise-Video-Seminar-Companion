# Cost Control Video Seminar — Bosun AI Co-Pilot

An interactive full-stack learning platform designed around Lin Pardey's masterclass video seminar, **"Cost Control While You Cruise"**. Harnessing the power of the server-side Gemini API paired with rich search, automated transcription syncing, audio synthesis, and offline-first capabilities, this application transforms a traditional video lecture into a dynamic, voice-enabled study environment.

---

## ⚓ Key Features

### 🔍 Intelligent Global Search
A centralized query system spanning all tabs in the app:
* **Alternative Keyword Mapping (Synonyms)**: Looking for terms like *"sailing with other boats"* successfully retrieves paragraphs about *"cruising in company"*, *"buddy boating"*, and *"flotilla"* setups.
* **Aggregated Search Streams**: Queries are run simultaneously across your **Personal Notes**, the **AI Conversation Logs** (Logbook), and the complete **Seminar Transcript**.
* **Seek-To-Time**: Video transcript search hits include quick-seek tags to immediately position the video and play.

### 📄 Live Transcript Panel & Export
Toggle a real-time transcript sidebar accompanying the main screen:
* **Staggered Auto-Scrolling**: The transcript scrolls dynamically with the active voice track.
* **Direct Seeking**: Click any segment to immediately seek the video playback.
* **Txt Export**: Download the current chapter's transcript text as a local `.txt` file populated with well-formatted time segments via the **Export** button.

### ⌨️ Dedicated Keyboard Shortcuts
Full desktop handoff with custom shortcuts for uninterrupted navigation:
* `Space` — Play / Pause the video
* `←` / `→` — Step backward / forward (5-second seek)
* `↑` / `↓` — Fine volume adjustments (5% steps)
* `M` — Mute or unmute volume
* `F` — Toggle Fullscreen mode
* `C` — Toggle Captions (CC) visibility

### 🤖 The Bosun AI Voice Assistant
Get instant advice about sailing maintenance, provisioning, and seamanship:
* **Jump to Video**: Answers reference exact timestamps, letting you jump directly into the relevant video segment.
* **Listening & Speaking Nodes**: Talk directly to the Bosun via microphone recording with full text-to-speech voice playback.

---

## 🛠️ System Overview

1. **Local Media Architecture**: Protects bandwidth and privacy by linking local video files directly through standard browser handles. No visual data is streamed or processed client-side.
2. **Persistent Notes Node**: Take notes alongside your lecture; notes stay saved on your device using browser `localStorage` integration.
3. **Advanced AI Integrations**: Communicates with Google's Gemini models to extract structured insights and answer cruise-planning questions contextually.
