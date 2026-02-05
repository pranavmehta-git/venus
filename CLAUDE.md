# Journey Map v2: Continuous Photo Sync

## Overview

A living photo map that automatically syncs from a shared Google Photos album. Take photos → they appear on the map within 24 hours. No manual uploads, no workflow friction.

**Target users:** Pranav + Pooja (couple tracking their journey together)

**Deployment:** Vercel (Next.js + KV + Cron)

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Data Flow                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  📱 iPhones                                                   │
│     │                                                         │
│     │ (auto-backup)                                           │
│     ▼                                                         │
│  ┌─────────────────────────┐                                  │
│  │ Google Photos           │                                  │
│  │ "Our Journey" Album     │ ◄── Both add photos here         │
│  └───────────┬─────────────┘                                  │
│              │                                                │
│              │ (nightly @ 6am UTC)                            │
│              ▼                                                │
│  ┌─────────────────────────┐     ┌─────────────────────────┐ │
│  │ /api/sync               │────▶│ Vercel KV               │ │
│  │ (Vercel Cron)           │     │ - Photo metadata        │ │
│  └─────────────────────────┘     │ - Location groupings    │ │
│                                  │ - User captions         │ │
│                                  └───────────┬─────────────┘ │
│                                              │                │
│                                              ▼                │
│  ┌─────────────────────────┐     ┌─────────────────────────┐ │
│  │ Frontend                │◄────│ /api/photos             │ │
│  │ (React + Leaflet)       │     │ (fetches fresh URLs)    │ │
│  └─────────────────────────┘     └─────────────────────────┘ │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

| Decision | Rationale |
|----------|-----------|
| Google Photos as source | Zero workflow change—you already backup there |
| Shared album | Both can add photos; contributor info tracks who took what |
| Nightly cron | Balance between freshness and API quota |
| KV for metadata | Fast reads, no database overhead |
| Fresh URLs on-demand | Google Photos URLs expire after ~1hr |
| No image hosting | Link directly to Google—no storage costs |

---

## Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Hosting | Vercel |
| Database | Vercel KV (Redis) |
| Auth | Google OAuth 2.0 (service account) |
| Photos API | Google Photos Library API |
| Map | Leaflet + CartoDB dark tiles |
| Styling | Tailwind CSS |

---

## Setup Guide

### 1. Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project: "Journey Map"
3. Enable **Photos Library API**
4. Create OAuth 2.0 credentials:
   - Application type: Web application
   - Authorized redirect URI: `http://localhost:3000/api/auth/callback`
5. Note your Client ID and Client Secret

### 2. Get Refresh Token

Run the OAuth flow once to get a long-lived refresh token:

```bash
# In the project directory
npm install
npm run dev

# Visit http://localhost:3000/api/auth/login
# Complete Google sign-in
# Copy the refresh token from the callback
```

### 3. Create Shared Album

1. Open [Google Photos](https://photos.google.com)
2. Create album: "Our Journey 💕"
3. Share with Pooja
4. Copy album ID from URL: `https://photos.google.com/album/ALBUM_ID`

### 4. Vercel Setup

```bash
# Install Vercel CLI
npm i -g vercel

# Link project
vercel link

# Add KV database
vercel kv add journey-kv

# Set environment variables
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add GOOGLE_REFRESH_TOKEN
vercel env add GOOGLE_PHOTOS_ALBUM_ID
vercel env add CRON_SECRET

# Deploy
vercel --prod
```

### 5. Location Tagging

Since Google Photos API doesn't expose GPS coordinates directly, use caption conventions:

```
Cherry blossoms! [Tokyo, Japan]
```

Or hashtags:
```
Amazing view #sanfrancisco
```

The sync job parses these to group photos by location.

---

## API Reference

### `GET /api/photos`

Returns all locations with fresh photo URLs.

**Query params:**
- `year` (optional): Filter locations by year ≤ value
- `locationId` (optional): Get specific location

**Response:**
```json
{
  "locations": [
    {
      "id": "tokyo-2023",
      "name": "Tokyo, Japan",
      "coords": [35.6762, 139.6503],
      "type": "together",
      "year": 2023,
      "photos": [
        {
          "id": "ABC123",
          "url": "https://lh3.googleusercontent.com/...",
          "caption": "Cherry blossoms!",
          "takenAt": "2023-04-01T10:30:00Z"
        }
      ]
    }
  ],
  "years": [2022, 2023, 2024],
  "lastSynced": "2024-02-14T06:00:00Z"
}
```

### `POST /api/sync`

Triggers sync from Google Photos. Called by Vercel Cron.

**Headers:**
- `Authorization: Bearer ${CRON_SECRET}`

### `POST /api/captions`

Update a photo caption.

**Body:**
```json
{
  "photoId": "ABC123",
  "caption": "Our first sakura season 🌸"
}
```

---

## File Structure

```
journey-map-v2/
├── app/
│   ├── api/
│   │   ├── sync/route.ts       # Cron job endpoint
│   │   ├── photos/route.ts     # Fetch photos with fresh URLs
│   │   └── captions/route.ts   # Update captions
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── JourneyMap.tsx          # Main map component
│   └── Lightbox.tsx            # Photo viewer
├── lib/
│   ├── google-photos.ts        # Google Photos API client
│   ├── storage.ts              # Vercel KV helpers
│   └── types.ts                # TypeScript types
├── vercel.json                 # Cron configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── .env.example
├── CLAUDE.md                   # This file
└── README.md
```

---

## Implementation Tasks

### Phase 1: Core Infrastructure

- [ ] **1.1** Set up Next.js project with TypeScript
- [ ] **1.2** Configure Tailwind CSS
- [ ] **1.3** Set up Vercel KV connection
- [ ] **1.4** Implement Google Photos OAuth flow
- [ ] **1.5** Create `/api/sync` endpoint (cron job)
- [ ] **1.6** Create `/api/photos` endpoint (fetch with fresh URLs)

### Phase 2: Frontend

- [ ] **2.1** Create map component with Leaflet
- [ ] **2.2** Implement year slider with filtering
- [ ] **2.3** Build lightbox component
- [ ] **2.4** Add marker styling by type (together/solo)
- [ ] **2.5** Auto-fit map bounds to visible markers

### Phase 3: Caption System

- [ ] **3.1** Create `/api/captions` endpoint
- [ ] **3.2** Parse location from caption brackets/hashtags
- [ ] **3.3** Add editable captions in lightbox
- [ ] **3.4** Preserve user captions across syncs

### Phase 4: Deployment

- [ ] **4.1** Configure Vercel project
- [ ] **4.2** Set up Vercel KV
- [ ] **4.3** Configure cron job (vercel.json)
- [ ] **4.4** Set environment variables
- [ ] **4.5** Test full sync cycle

### Phase 5: Polish

- [ ] **5.1** Loading states and error handling
- [ ] **5.2** Mobile responsive layout
- [ ] **5.3** Keyboard navigation in lightbox
- [ ] **5.4** Image loading optimization
- [ ] **5.5** "Last synced" indicator

---

## Location Detection Strategy

Since Google Photos API doesn't expose GPS coordinates, we use a hybrid approach:

1. **Caption parsing** (primary):
   - `[City, Country]` bracket notation
   - `#cityname` hashtag notation
   - Example: `"Ramen night! [Tokyo, Japan]"`

2. **Album descriptions** (fallback):
   - Add location to album description
   - All photos in album inherit that location

3. **Manual override** (rare):
   - API endpoint to manually set coordinates
   - For photos that don't fit the pattern

**Recommendation for users:**
- When adding a photo from a new place, include `[Location]` in the first caption
- Subsequent photos at that location don't need the tag

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Google API rate limit | Retry with exponential backoff |
| Photo URL expired | Fetch fresh URL on next request |
| Album not found | Show setup instructions |
| No photos synced | Show empty state with tips |
| Network error | Show cached data with "offline" indicator |

---

## Security Considerations

- **Refresh token**: Stored in Vercel environment variables (encrypted)
- **Cron secret**: Prevents unauthorized sync triggers
- **No public write**: Only cron can modify KV data (except captions)
- **Album access**: Only album members can add photos

---

## Cost Estimate

| Resource | Free Tier | Expected Usage |
|----------|-----------|----------------|
| Vercel | Hobby (free) | Well within limits |
| Vercel KV | 30K requests/month | ~1K/month |
| Google Photos API | 10K requests/day | ~100/day |
| Bandwidth | 100GB/month | ~1GB/month |

**Total: $0/month** for a personal project.

---

## Future Enhancements (Out of Scope)

- [ ] Real-time sync via iOS Shortcut webhook
- [ ] Face detection for automatic "together" tagging
- [ ] Video support in lightbox
- [ ] Animated plane flights between locations
- [ ] Export as shareable video/GIF
- [ ] Multiple album support (e.g., different trips)

---

## Commands Reference

```bash
# Development
npm run dev

# Trigger manual sync (dev only)
curl http://localhost:3000/api/sync

# Deploy
vercel --prod

# View logs
vercel logs

# Check KV data
vercel kv get journey:locations
```

---

## Success Criteria

The project is complete when:

1. ✅ Photos sync automatically from Google Photos album
2. ✅ Map updates within 24 hours of adding new photos
3. ✅ Locations are correctly parsed from captions
4. ✅ Lightbox shows photos with editable captions
5. ✅ Works on mobile browsers
6. ✅ Zero manual intervention needed for updates
7. ✅ Pooja says "wait, it updates automatically?!" 💕
