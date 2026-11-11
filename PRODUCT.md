# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Friends in a Thai VRChat community. Each has their own account and helps keep the data up to date: they look people up, add people, and record who is connected to whom. A super admin also manages accounts and reads the activity history. Most arrive with one question about one person: who is this person connected to?

## Product Purpose

A shared, login-only record of the people in the community and the relationships between them. Success means someone can find a person by name within seconds and immediately understand that person's relationships, and can add or correct a relationship without help.

## Positioning

Built around one community's own social map, in Thai, with a vocabulary that includes the things general social tools never model: blocked, muted, guild, ex, enemy, and dating history that ends and restarts.

## Operating Context

Used casually in a browser, often beside VRChat or Discord, on desktop and phone. The API runs on a free tier that sleeps when idle, so the first request of a session can take up to a minute.

## Capabilities and Constraints

- Every page requires login. Roles: member (read, add, edit, delete relationships) and super admin (also deletes people and relationship types, manages accounts, reads the activity log).
- Pages: dashboard, people list and profile, interactive relationship graph, data management, login.
- Graph rules from CLAUDE.md: nodes draggable, edges coloured, clicking a node opens the profile, clicking an edge opens the relationship detail, zoom, pan, minimap and background always available.
- Stack rules from CLAUDE.md: React, React Flow, shadcn/ui, TailwindCSS, no inline CSS, dark mode, responsive.
- All UI copy is Thai. Dates use the Thai locale. Twelve built-in relationship types, each with its own colour and icon; users can add more.
- Undecided: audit log retention.

## Brand Commitments

- Name: 3 ชั่วโมงไร้ค่า.
- Logo: the VR-headset meme face in `relationship-graph/frontend/src/components/layout/Logo.tsx`.

## Evidence on Hand

Local development uses generated people and relationships from `scripts/seed.py`; those are synthetic. No testimonials, usage figures, or community size claims exist and none may be invented.

## Product Principles

- Start from a person, not from a chart: the name search is the front door.
- Every page says what it is for and what to do next, in plain Thai.
- Readable first: Thai script needs more size and line height than the Latin defaults assume.
- Everyday contribution is easy for everyone; destructive actions stay with the super admin.
- The full graph is for exploring; one person's circle is what people actually read.

## Accessibility & Inclusion

No formal standard established. Body text must stay comfortably readable for Thai script, in both light and dark themes.
