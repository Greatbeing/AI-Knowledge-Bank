# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- Rate limiting to API (60 req/min/IP, Cloudflare-aware)
- GET /api/vaults/:id - single node detail endpoint
- GET /api/leaderboard - user ranking endpoint
- X-RateLimit-* headers on all responses
- Input validation for community-signals body
- .env.example template
- Enhanced .gitignore (OS files, .vite/, supabase local)

### Changed
- lib/auth.ts: fixed NEXT_PUBLIC_* env vars to VITE_*
- API jsonResponse now accepts optional extraHeaders

### To Do
- pgvector semantic search integration
- Frontend React migration from vanilla JS pages
- WebSocket for real-time community signals
- CI/CD pipeline beyond GitHub Pages deploy

## [1.0.0] - 2026-06-10

### Added
- Three-vault architecture (knowledge, tool, case)
- CAS emergence algorithm with SQL triggers
- Full user system (auth, badges, notifications, leaderboard)
- Knowledge workflow (fork, validate, merge, comments)
- Cross-vault RAG MVP via SQL function
- Cloudflare Pages Functions backend
- Particle network UI on homepage
- Liquid glass design system
- Bilingual UI (zh/en)
- GitHub Pages deploy workflow

## [0.9.0] - 2024

- Knowledge node CRUD, validation workflow
- Fork and merge system with voting
- Comments, subscriptions, evolution history

## [0.5.0] - 2024

- Evolution tree visualization
- Scoring model (Hacker News gravity variant)

## [0.1.0] - 2024

- Concept validation and first interactive demo
