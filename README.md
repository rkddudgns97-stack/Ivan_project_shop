# Welfare Mall Frontend + Nest Backend

This project now includes:
- React/Vite frontend
- email verification based auth flow
- NestJS + Prisma backend for welfare mall development
- legacy mock backend for fallback testing

The original Figma Make source project is available at:
https://www.figma.com/design/Nn12AegCvrPXq91zMDiDbp/Frontend-Development-Requirements

## Install

Run:

`npm i`

## Run frontend

Run:

`npm run dev`

Frontend dev server uses Vite proxy and forwards `/api` requests to `http://localhost:4100`.

## Run Nest backend API

Run:

`npm run dev:api`

Or one-time start:

`npm run start:api`

## First-time backend setup

Run:

`cd backend`

`npm i`

`npm run db:generate`

`npm run db:init`

`npm run db:seed`

## Run legacy mock backend

`npm run dev:api:mock`

Or:

`npm run start:api:mock`

## Email auth

- Authentication codes are sent by email
- Configure Gmail SMTP in the backend environment
- Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

## Deployment

Deployment guide:

- [DEPLOY.md](./DEPLOY.md)

Production notes:

- Frontend is intended for Vercel
- Backend is intended for Railway
- Production DB should use PostgreSQL, not local SQLite
- Backend health check is available at `GET /api/v1/health`

## Main API groups

- `POST /api/v1/auth/email-code`
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `GET /api/v1/me`
- `GET /api/v1/products`
- `GET /api/v1/cart`
- `POST /api/v1/orders/checkout`
- `GET /api/v1/admin/dashboard`
