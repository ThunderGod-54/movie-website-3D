# Goodshow frontend

React, TypeScript, Vite and Three.js cinema frontend connected to the Express API in `../backend`.

## Run locally

Start the API in one terminal:

```sh
cd backend
npm install
# If .env does not exist, copy .env.example to .env and configure it.
npm run dev
```

MongoDB must be a replica set (Atlas supports this) because booking operations use transactions. Keep MongoDB credentials and JWT_SECRET exclusively in the backend environment.

Start the frontend in another terminal, from the repository root:

```sh
cd movie-hub
npm install
npm run dev
```

Open the URL printed by Vite. `/api` requests are proxied to `http://localhost:5000`. If your backend uses a different port, change the proxy target in `vite.config.ts` or set `VITE_API_URL=http://localhost:YOUR_PORT/api` in `.env.local`, then restart Vite.

For production, configure a reverse proxy for `/api` or set `VITE_API_URL` to the public backend URL **before building**. Configure the static host to serve `index.html` for frontend routes such as `/lobby` and `/book/:movieId/:showtimeId`. Vite's development proxy is not included in the built files. Only public configuration belongs in `VITE_*` variables.

## Connected flows

| UI | Backend |
| --- | --- |
| Register, sign in, restore session | `POST /auth/register`, `POST /auth/login`, `GET /auth/me` |
| Lobby list, 3D poster wall, film selection | `GET /movies?status=NOW_SHOWING` |
| Upcoming shows, city/date filtering | `GET /shows?movie=<id>&upcoming=true` |
| Per-show seats, categories and prices | `GET /shows/:id/seats` |
| Reserve seats / create Razorpay order | `POST /payments/orders` with `showId`, `seatIds`, UUID `requestId` |
| Verify checkout and recover payment status | `POST /payments/verify`, `POST /payments/:id/reconcile` |
| QR ticket / downloadable PDF | `GET /tickets/:bookingId`, `GET /tickets/:bookingId/pdf` |
| Admin ticket validation / check-in | `POST /tickets/validate`, `POST /tickets/check-in` |
| History and cancellation | `GET /bookings`, `DELETE /bookings/:id` |

All paths above use the `/api` prefix. List loading follows pagination so later movies, shows and bookings remain accessible. Show dates and times use the browser's local timezone. “Remember my seat” stores the JWT in localStorage; unchecked uses sessionStorage. A 401 clears the session and allows signing in again. Sign out clears the browser session; the API does not provide server-side token revocation.

Bookings use at most 10 seats. The server calculates the final amount and prevents double booking. A conflict refreshes availability. A network/server error during confirmation asks the customer to check history before retrying, because the response may have been lost after a successful booking. Tickets use the persisted booking reference, seats, amount and show details.

## Catalogue setup

There are no fabricated bookable movies or shows. An empty database displays an empty catalogue. Use `backend`'s `npm run create-admin -- ...` and the existing admin API/Postman requests to create:

1. A movie with `status: NOW_SHOWING`.
2. An active theatre and a screen with a seat layout.
3. A future show on that screen with category prices.

The original Postman collection is a **legacy test suite**, not a seed script: its later requests cancel bookings/shows and exercise deletion. Its old direct-booking requests now return 402 because payment is required. Use the seed collection for catalogue data and the browser for checkout. The backend Jest tests cover the updated payment flow.

To add durable development data from Postman, import `../postman/movie-booking-dummy-data.postman_collection.json` and `../postman/movie-booking-dummy-data.postman_environment.json`, select the environment, and run the collection in order. It creates a unique now-showing movie, theatre, 26-seat screen, show for tomorrow evening, and demo customer. The environment defaults to `admin@example.com` / `StrongPass123`; create that admin once with `npm run create-admin -- admin@example.com "StrongPass123" "Administrator"` from `backend`, then start the API before running Postman. The collection saves generated IDs automatically and ends with a seat-availability check. Run it again to create another isolated demo set.

The landing page's background posters are decorative artwork. The lobby and booking catalogue use API records. Food Court remains a sample menu preview because no food-order endpoints exist. Social login/password recovery are not available.

### Movie images and trailers

Movie admins can upload poster images and trailer videos directly from Admin → Movies. Create a free Cloudinary account, then copy these values into `backend/.env`:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=goodshow/movies
```

Restart the backend after changing `.env`. In the movie editor, either paste a public HTTPS URL or choose a file under the matching Cloudinary upload control:

- Posters: JPEG, PNG, or WebP, up to 10 MB.
- Trailers: MP4, WebM, or QuickTime video, up to 200 MB.

The backend signs uploads only for authenticated admins. The browser sends the media directly to Cloudinary, and only the resulting `secure_url` is saved with the movie. Never expose `CLOUDINARY_API_SECRET` in the frontend or commit it to source control. The lobby 3D poster wall uses `posterUrl`; the booking movie picker displays the poster and plays Cloudinary trailers.

## Payments, tickets and admin

Set `RAZORPAY_TEST_API_KEY` and `RAZORPAY_TEST_API_SECRET` in **backend/.env**, then restart the backend. These are test-mode keys only; the secret never goes to the frontend. Choose seats, sign in and click Pay. Razorpay's hosted checkout collects payment details; the server verifies the signature, order, INR amount and captured status before issuing a ticket. Test mode is shown on checkout and tickets, and charges no real money. Use Razorpay's documented test payment methods in its checkout.

Real UPI QR scanning is not supported in Razorpay Test Mode. Scanning the checkout QR with Google Pay, PhonePe, Paytm, or another real UPI app will report an invalid QR because no real bank transaction is created. This app hides the unsupported UPI QR/intent option in test checkout; use card/netbanking test details instead. If you specifically need to simulate UPI, enable the UPI method in your own checkout configuration and enter Razorpay's test VPA `success@razorpay` (or `failure@razorpay` for a failed payment) in the UPI collect field—do not scan a QR.

Seats are held for up to ten minutes. Closing checkout does not confirm a booking. Go to **My bookings → Payment activity → Resume payment** to resume an active order, or **Check status** if checkout completed but confirmation was interrupted. Orders use a UUID request ID to avoid duplicate creation on retries. The backend also reconciles pending payments and refunds every minute while running. Late payments after reservation expiry trigger a full test refund instead of taking another customer's seats.

Confirmed paid bookings provide a QR code and a PDF download in both the confirmation screen and My bookings. Existing bookings created before payment integration remain in history but do not receive a paid QR ticket. Cancellations before the show and before check-in queue a full refund. Refund status is shown separately from booking status; provider failures leave a durable queue that can be retried from Admin → Payments. A provider-reported failed refund needs investigation in the Razorpay test dashboard.

Open **http://localhost:5173/admin** (or your Vite URL + `/admin`) and sign in with an ADMIN account. Add/edit movies, theatres, screens with seat layouts, and future shows. The admin area also lists bookings, payments and refunds. Deletions retain the backend's referential-integrity checks. Shows with payment attempts cannot be rescheduled: cancel and create a new show instead. Show cancellation invalidates its tickets and queues refunds.

Scanning a QR code opens `/admin/check-in?ticket=...`. An admin can validate the signed ticket and admit its entire group once. Check-in opens two hours before the show and closes at its end; cancelled, refunded, expired and previously used tickets cannot be admitted again. Set `PUBLIC_APP_URL` in backend/.env to the actual frontend URL. `localhost` links only work on the same machine; phone scans require a reachable LAN address or hosted HTTPS URL.

For payment recovery when the browser closes, you can also configure a Razorpay test webhook at `https://YOUR_API_HOST/api/payments/webhook` and set the same `RAZORPAY_WEBHOOK_SECRET` in backend/.env. Subscribe to `payment.captured`, `order.paid`, `refund.processed` and `refund.failed`. Localhost needs a public tunnel for Razorpay to reach it. Webhooks validate the raw-body signature, and duplicate callbacks are safe. Without a webhook, local recovery uses the reconciliation worker and Check status.

Integration references: [Razorpay Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/), [idempotent refunds](https://github.com/razorpay/markdown-docs/blob/master/api/refunds/normal-refunds-idempotent.md).

## Validation

```sh
npm run lint
npm run build
npm test --prefix ../backend
```

An additional real-browser smoke test lives at `../backend/scripts/test-frontend.cjs`. It creates an isolated temporary MongoDB replica set, runs Express and Vite on temporary local ports, and checks registration, login, restoration, checkout, QR/PDF tickets, refunds, conflicts, mobile layout, admin catalogue forms and check-in. Both Jest and browser tests use a **test-only payment-provider double**; they exercise the real server verification and database flow without making provider calls. They do not use your configured application database or real Razorpay credentials.

The backend declares Playwright as a dev dependency, so from `../backend` run:

```sh
npm run test:frontend
```

Set `CHROME_PATH` if Chrome is not at `/usr/bin/google-chrome`. The `PLAYWRIGHT_MODULE` override remains available for alternate tooling setups.
