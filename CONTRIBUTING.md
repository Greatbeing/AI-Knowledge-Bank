# Contributing to AI Knowledge Bank

Thank you for your interest in contributing! We welcome contributions from developers, designers, AI practitioners, educators, and researchers.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Document reasoning, not just changes

## Getting Started

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a feature branch**: git checkout -b feat/your-feature-name
4. Follow the [Local Development](README_LOCAL_DEV.md) guide
5. Make your changes and test locally

## Development Guidelines

### Code Style

- 2-space indentation (see .editorconfig)
- TypeScript for all .ts/.tsx files
- ESLint config enforced via 
pm run lint
- Follow existing patterns ? check lib/ and components/ for reference

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/):

- eat: new feature
- ix: bug fix
- docs: documentation only
- 
efactor: code change that neither fixes a bug nor adds a feature
- chore: maintenance tasks

Example: eat: add leaderboard endpoint

### Pull Request Process

1. Update CHANGELOG.md with your changes under [Unreleased]
2. Ensure 
pm run lint passes with zero warnings
3. If adding a feature, mention which vault (knowledge/tool/case) it affects
4. Link any related issues
5. Describe your changes clearly ? what and why

### Adding a Knowledge Node

Seed the community with quality content:

1. Follow the [Genesis Node format](data/genesis_nodes.md) as a template
2. Include all three layers: knowledge, tool, case
3. Add i18n support for title, summary, and recommendation_reason
4. Use meaningful scenario_tags

### File Structure Reference

`
.
??? functions/api/          # Cloudflare Pages Functions backend
??? lib/                    # Shared TypeScript libraries
??? types/                  # TypeScript type definitions
??? components/             # React components (future)
??? supabase/migrations/    # Database migrations (run in order)
??? assets/                 # Static assets (CSS, images)
??? data/                   # Seed data (genesis nodes)
??? *.html                  # SPA pages
`

## Questions?

Open an issue or start a discussion. We\'re happy to help!
