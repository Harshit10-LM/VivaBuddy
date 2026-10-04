# VivaBuddy

VivaBuddy is a small, AI-powered viva practice partner built for a friend who needed a patient way to rehearse oral-exam questions when another person was not available.

## The Problem

Preparing for a viva is difficult to do alone. A friend, classmate, or teacher may not be available to ask questions, listen to answers, and give useful feedback at the moment a student needs practice.

## The Solution

VivaBuddy turns a syllabus into a focused practice session:

```text
Setup → AI question → student answer → AI evaluation → beginner explanation
      → next question → final score
```

Choose a subject, topics, difficulty, and question count. VivaBuddy asks realistic questions, evaluates each answer, explains confusing ideas simply, and summarizes the session at the end.

## Features

- AI-generated viva questions that avoid exact repeats
- Answer scores out of 10 with strengths, improvements, and a better answer
- A short “Explain Like I’m a Beginner” follow-up
- Gentle next-question adaptation based on previous scores
- Skip questions without treating them as scored answers
- Final score, topic summaries, and question-by-question breakdown
- Responsive Flask and vanilla-JavaScript interface

## Tech Stack

- Python
- Flask
- HTML, CSS, and vanilla JavaScript
- Groq API
- `openai/gpt-oss-20b`
- Gunicorn
- Render

## AI Architecture

```text
Browser
  ↓
Flask
  ↓
Groq
  ↓
openai/gpt-oss-20b
  ↓
Flask
  ↓
Browser
```

The browser calls the Flask API only. Flask calls Groq using the server-side `GROQ_API_KEY`, so the key is never sent to the browser, HTML, or frontend JavaScript.

## Why Open-Weight AI?

VivaBuddy uses the open-weight GPT-OSS model through Groq. The model is selected with `GROQ_MODEL`, which keeps the application configurable without rebuilding it. VivaBuddy uses Groq’s hosted API; it does not claim to run inference locally or work offline.

## Local Setup

On macOS or Linux, open a terminal in the project folder and run:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env` and replace `PASTE_YOUR_COPIED_KEY_HERE` with your own Groq API key. Then start the app:

```bash
python app.py
```

Open `http://127.0.0.1:5000` in your browser.

## Environment Variables

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Groq API key used only by Flask on the server. |
| `GROQ_MODEL` | Model identifier; defaults to `openai/gpt-oss-20b`. |

Never commit `.env`. The included `.env.example` is safe to commit and contains a placeholder only.

## Render Deployment

VivaBuddy is prepared for a future Render Web Service deployment through `render.yaml`. Render installs dependencies with `pip install -r requirements.txt` and starts the service with `gunicorn app:app`. When deploying later, configure `GROQ_API_KEY` in Render’s environment-variable settings; do not place it in the repository or `render.yaml`.

## Future Improvements

- Voice-based viva practice
- Subject-specific question banks
- Local-model support
- Optional session history
