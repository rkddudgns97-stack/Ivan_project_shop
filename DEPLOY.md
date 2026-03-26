# Welfare Mall Deployment Guide

## Recommended stack

- Frontend: Vercel
- Backend API: Railway
- Database: Railway PostgreSQL
- Image storage: Cloudinary or S3-compatible storage

## Before deploying

The current local project was built with SQLite for development convenience.
For production, switch the backend to PostgreSQL and use a hosted image storage service.

## 1. Frontend deployment on Vercel

### Build settings

- Root directory: project root
- Build command: `npm run build`
- Output directory: `dist`

### Frontend environment variables

- `VITE_API_BASE_URL=https://your-api-domain.example.com`

### Notes

- `vercel.json` is already added for SPA rewrites.
- Vercel should serve all React routes through `index.html`.

## 2. Backend deployment on Railway

### Service root

- Deploy the `backend` folder as the Railway service root, or configure Railway to run commands from `backend`.

### Build and start commands

- Install: `npm install`
- Build: `npm run build`
- Start: `npm run start`

### Backend environment variables

- `DATABASE_URL=postgresql://...`
- `PORT=4100`
- `CORS_ORIGIN=https://your-frontend-domain.vercel.app`
- `CLOUDINARY_CLOUD_NAME=...`
- `CLOUDINARY_API_KEY=...`
- `CLOUDINARY_API_SECRET=...`
- `CLOUDINARY_FOLDER=welfare-mall`

### Health check

- `GET /api/v1/health`

## 3. PostgreSQL switch

`backend/prisma/schema.prisma` is still the local SQLite schema.
For production, use the PostgreSQL schema file:

- `backend/prisma/schema.postgres.prisma`

Recommended command order:

1. `npm run db:generate:postgres`
2. `npm run db:push:postgres`
3. `npm run db:seed:postgres`

## 4. Image uploads

The admin upload flow now goes through the backend and uploads images to Cloudinary.
Only the returned image URL is stored in the database.

## 5. Release checklist

- Frontend API URL points to production backend
- Backend CORS includes frontend domain
- PostgreSQL is connected and seeded
- `/api/v1/health` responds successfully
- Admin login works
- Product detail images render correctly
- Cart and checkout flows are tested on the production database

## Recommended production rollout

1. Deploy backend to Railway
2. Connect PostgreSQL
3. Run Prisma push + seed
4. Verify `/api/v1/health`
5. Deploy frontend to Vercel
6. Set custom domains
7. Do staging QA
8. Open to users
