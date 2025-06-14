# Explain Anything Visualizer

A full-stack Node.js+Bootstrap web app to explain any concept, molecule, formula, or technical topic using Novita AI—at three levels of detail.

## Features

- Choose explanation level: Low (simple), Medium (step-by-step), High (technical)
- Modern Bootstrap 5 UI
- Save every answer in your local "Knowledge Gallery"
- Powered by Novita AI (OpenAI API compatible)

## How to Run

1. Install Node.js (v16+ recommended)
2. `npm install express node-fetch dotenv`
3. Copy `.env.example` to `.env` and add your Novita API key
4. Run: `node server.js`
5. Open [http://localhost:3000](http://localhost:3000)

## Novita AI Integration

Backend calls Novita AI API via OpenAI-compatible endpoint `/api/explain`, passing a level-based system prompt and user question.

## Demo

![screenshot](demo_screenshot.png)