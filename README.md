# Grant OS — AI Grant Intelligence Platform

Full-stack grant management SaaS built with React + TypeScript + Vite + Netlify Functions.

## Features
- **AI Grant Discovery** — finds matching grants from 47K+ sources using Claude AI
- **Pipeline Manager** — Kanban board tracking grants from Discovery → Application → Submitted → Awarded
- **Application Writer** — AI-drafts each section (Executive Summary, Program Narrative, Budget, Goals, Capacity)
- **Application Reviewer** — constructive review, red-team analysis, differentiation advisor, cohesion checker
- **Budget Assistant** — AI-generated budget justifications per line item
- **Funder Persona** — deep analysis of funder priorities and communication style
- **Success Pattern Analysis** — what types of projects this funder typically funds
- **Deadline Tracker** — checklist with due dates per grant
- **Compliance Manager** — reporting requirements and expense tracking
- **Team Hub** — multi-user collaboration
- **Intelligence Platform** — funding trends, knowledge base, lessons learned

## Stack
- React 19 + TypeScript
- Vite 6
- Netlify Functions (AI backend via Anthropic Claude)
- localStorage for client-side persistence
- Deployed to Netlify (auto-deploy from main branch)

## Deploy
1. Fork this repo
2. Connect to Netlify
3. Set `ANTHROPIC_API_KEY` in Netlify environment variables
4. Deploy

## Local Development
```bash
npm install
npm run dev
```
