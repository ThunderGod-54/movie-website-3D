# Goodshow

Goodshow is a cinema discovery and ticket-booking frontend built around an interactive 3D theatre lobby. Browse currently showing films, explore showtimes, choose seats, and manage bookings in a cinematic interface.

> This repository contains the frontend only. Booking, account, catalogue, ticket, and payment data require a compatible backend API.

## Features

- Interactive 3D theatre lobby and animated landing page
- Movie catalogue, search, showtime filtering by city and date, posters, and trailers
- Account registration, sign-in, and session restoration
- Seat selection and checkout through the backend's Razorpay integration
- Booking history, payment recovery, QR tickets, and PDF ticket downloads
- Admin tools for managing movies, theatres, screens, showtimes, payments, and check-in
- Responsive interface with reduced-motion support

The Food Court is a menu preview only; it does not submit food orders.

## Tech stack

- React 19 and TypeScript
- Vite
- Three.js with React Three Fiber and Drei
- Framer Motion
- React Router and Zustand

## Getting started

Install dependencies from this project directory:

```sh
npm install
```

Create a local environment file from `.env.example` to configure the API URL. The deployed backend is:

```env
VITE_API_URL=https://movie-booking-platform-woad.vercel.app/api
```

Start the development server:

```sh
npm run dev
```

Open the local URL printed by Vite. In development and preview, the Vite proxy forwards `/api` requests to `http://localhost:5000` when `VITE_API_URL` is unset or set to `/api`. To use the deployed backend, set the value above in `.env.local`; to use another API, set its public base URL, including `/api`:

```env
VITE_API_URL=https://your-backend.example.com/api
```

Restart Vite after changing environment variables. Only public configuration belongs in `VITE_*` variables; never put credentials or private API keys in frontend environment files.

## Backend requirements

The frontend expects a backend that provides the Goodshow API for authentication, movies, theatres, screens, shows, seat availability, bookings, payments, tickets, and admin operations. The deployed API is [https://movie-booking-platform-woad.vercel.app/api](https://movie-booking-platform-woad.vercel.app/api). Its source code is in the [Movie-Booking-Platform backend repository](https://github.com/ArnavKala/Movie-Booking-Platform); backend credentials are not included here.

Booking and payment flows depend on backend validation and persistence. The server must handle seat holds, payment verification, and ticket issuance. A compatible MongoDB-backed service may require MongoDB transactions; follow the backend project's setup instructions.

## Build and checks

```sh
npm run lint
npm run build
npm run preview
```

`npm run build` type-checks the app and creates the production bundle in `dist/`.

## Deployment

This project includes a Vercel configuration for the frontend and its client-side routes. Set `VITE_API_URL=https://movie-booking-platform-woad.vercel.app/api` in the frontend deployment environment before building, unless your deployment explicitly proxies `/api` to the backend. Configure the backend to allow requests from the deployed frontend origin.

## Routes

| Path | Description |
| --- | --- |
| `/` | Landing page |
| `/lobby` | Interactive cinema lobby and movie catalogue |
| `/book/:movieId/:showtimeId` | Booking flow for a selected movie and show |
| `/admin` | Admin dashboard (requires an admin account) |

## Project structure

```text
src/
  components/     Shared UI, booking and account modals, 3D scenes
  hooks/          Reusable data-fetching hooks
  lib/            API, authentication, and payment clients
  pages/          Landing, lobby, booking, and admin screens
  assets/         Frontend assets
```
