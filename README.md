# 🌱 BloomMind AI

> A calm, empathetic AI companion for mental wellness and emotional support.

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)]()

**BloomMind AI** is a minimalist, privacy-focused mental wellness chatbot. Built with vanilla JavaScript and Google Gemini, it offers a safe space for reflection, breathing exercises, and mood tracking—all 100% client-side with no servers or accounts.

---

## Features

- **Intelligent Companion**: Context-aware conversations with empathetic, non-judgmental responses (powered by Gemini 1.5 Flash).
- **Mood Tracking**: Log your emotions (Amazing, Happy, Okay, Sad, Anxious) and view your history.
- **Wellness Tools**: 4-4-4 Box Breathing exercise with calming audio, daily reflections, and quick-action prompts.
- **Privacy First**: No login required. All data stays in your browser's `localStorage`.
- **Calm Design**: Glassmorphism UI, dark/light modes, and "Calm Mode" for zero distractions.
- **Accessible**: Voice input (Web Speech API) and Text-to-Speech support.

---

## Tech Stack

- **Core**: HTML5, CSS3, Vanilla JavaScript (ES6+).
- **API**: Google Gemini API (AI), Web Audio API (Soundscapes), Web Speech API.
- **Data**: LocalStorage (Privacy-focused).

---

## Quick Start

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/RishiBuilds/bloommind-ai.git
    cd bloommind-ai
    ```

2.  **Add API Key** (Optional):
    Open `script.js`, find `const API_KEY = "YOUR_API_KEY_HERE";` (line ~220), and paste your [Google AI Studio key](https://makersuite.google.com/app/apikey).

3.  **Run**:
    Simply open `index.html` in your browser.
    *Recommended:* Use a local server (e.g., `npx serve .` or Python `http.server`).

---

## Usage

- **Chat**: Type or speak to start. The bot remembers context.
- **Moods**: Click **😊** to log feelings.
- **Breathing**: Click **🧘‍♀️** for a guided exercise.
- **Settings**: Toggle themes, sounds, or clear history via the settings menu.

---

## Contributing

Contributions are welcome!
1. Fork & Branch (`feature/NewThing`)
2. Keep it vanilla (no frameworks)
3. Submit a PR

---

## Disclaimer

**BloomMind AI is NOT professional mental health care.** Do not use for crisis intervention or medical diagnosis.

**Crisis Resources:**
- **iCall (India)**: +91-9152987821
- **AASRA**: +91-9820466726
- **Global**: [findahelpline.com](https://findahelpline.com)

---

<div align="center">

**Built with 💚 by [Rishi](https://github.com/RishiBuilds)**

</div>