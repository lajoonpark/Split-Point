# SplitPoint

A structured debate platform where discussions branch like a tree.

## Features
- **Trunk posts** ("Prove Me Wrong" hot takes)
- **Branching arguments** – reply to any node, infinite depth
- **Voting** – upvote/downvote, toggle support
- **Best Path** – highlights the highest-scored branch top-to-leaf
- **Moderation levels** – G / PG / M with keyword filtering
- **NSFW blur** – click-to-reveal for logged-in users only
- **Dark mode** UI

## Tech Stack
- Next.js 15 (App Router, TypeScript)
- Tailwind CSS
- Prisma ORM + PostgreSQL
- NextAuth (email + password)

## Quick Start
1. Copy `.env.example` to `.env.local` and fill in your database URL and NextAuth secret
2. Run `npx prisma db push` to create the DB schema
3. Run `npm run dev` to start

## Deployment
Vercel-ready. Set the environment variables in Vercel dashboard.
