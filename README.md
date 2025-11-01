# Palestine Solidarity Fundraiser

This project is a Next.js App Router site (Next 16 / React 19) that showcases themed team fundraisers and supports Square-powered donations.

## Prerequisites

- Node.js 18.18+ or 20+
- npm 9+

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Copy the example file and populate the required values:

```bash
cp .env.example .env.local
```

Then edit `.env.local`:

```ini
SQUARE_ACCESS_TOKEN=your-square-access-token
SQUARE_LOCATION_ID=your-square-location-id
```

### Where to find these values

1. Sign in to your Square Developer Dashboard.
2. Create (or open) an application and choose the **Sandbox** or **Production** tab depending on your environment.
3. Copy the **Access token** for that environment and paste it into `SQUARE_ACCESS_TOKEN`.
4. In the same tab, open **Locations** and copy the desired **Location ID** into `SQUARE_LOCATION_ID`.

> **Tip:** The sandbox and production credentials are different. Keep separate `.env.local` files per deployment target.

## 3. Run the development server

```bash
npm run dev
```

Visit [http://localhost:3000/teams](http://localhost:3000/teams) to explore the themed team index, or go directly to a detail page such as [http://localhost:3000/teams/team-falcon](http://localhost:3000/teams/team-falcon).

## 4. Run checks

```bash
npm run lint
npm run build
```

> `npm run build` may fail locally if the `next/font` Geist download is blocked by your network proxy or TLS interception. Deploy builds (e.g., on Vercel) are not affected.

## Deployment

Follow the official [Next.js deployment guide](https://nextjs.org/docs/app/building-your-application/deploying). Remember to add `SQUARE_ACCESS_TOKEN` and `SQUARE_LOCATION_ID` to your hosting provider's environment variable settings.
