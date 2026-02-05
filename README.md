# 💕 Our Journey Together (v2 - Auto-Sync)

A living map of your memories that syncs automatically from Google Photos.

**Take photos → They appear on the map within 24 hours.**

![Demo](demo.gif)

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/journey-map
cd journey-map
npm install
```

### 2. Set Up Google Cloud

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create project → Enable **Photos Library API**
3. Create OAuth credentials (Web application)
4. Copy Client ID and Secret

### 3. Get Refresh Token

```bash
cp .env.example .env.local
# Fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET

npm run dev
# Visit http://localhost:3000/api/auth/login
# Complete OAuth, copy refresh token
```

### 4. Create Shared Album

1. Open [Google Photos](https://photos.google.com)
2. Create album: **"Our Journey 💕"**
3. Share with your partner
4. Copy album ID from URL

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel link
vercel kv add journey-kv
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_REFRESH_TOKEN
vercel env add GOOGLE_PHOTOS_ALBUM_ID
vercel env add CRON_SECRET  # openssl rand -hex 32
vercel --prod
```

---

## How It Works

1. **You take photos** with your iPhones (both of you)
2. **Photos auto-backup** to Google Photos
3. **Add to shared album** (or auto-add via Google Photos settings)
4. **Nightly sync** pulls new photos at 6am UTC
5. **Map updates** with new locations and memories

---

## Tagging Locations

Add location in your photo captions:

```
Cherry blossoms! [Tokyo, Japan]
```

Or use hashtags:

```
Amazing ramen #tokyo
```

The sync job parses these to group photos by location.

---

## Customization

### Change Names

Edit `components/JourneyMap.tsx`:

```tsx
<h1>Your Name <span>♥</span> Their Name</h1>
```

### Change Colors

Edit `app/globals.css` or the Tailwind classes in components.

### Change Sync Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/sync",
      "schedule": "0 */6 * * *"  // Every 6 hours
    }
  ]
}
```

---

## Development

```bash
# Start dev server
npm run dev

# Trigger manual sync
curl -X POST http://localhost:3000/api/sync \
  -H "Authorization: Bearer your-cron-secret"

# View data
curl http://localhost:3000/api/photos
```

---

## Tech Stack

- **Next.js 14** - React framework
- **Vercel** - Hosting + Cron + KV
- **Google Photos API** - Photo source
- **Leaflet** - Maps
- **Tailwind CSS** - Styling

---

## Troubleshooting

### Photos not syncing?

1. Check album ID is correct
2. Verify refresh token hasn't expired
3. Check Vercel logs: `vercel logs`

### Locations not grouping?

Make sure captions include `[City, Country]` or `#cityname`

### Map not loading?

Check browser console for errors. Leaflet requires client-side rendering.

---

## License

MIT - Made with 💕

---

*For detailed implementation notes, see [CLAUDE.md](./CLAUDE.md)*
