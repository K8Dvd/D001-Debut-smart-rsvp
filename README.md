# The Debut Issue — digital debut invitation

React + TypeScript + Vite. **Everything you edit lives in `src/data.ts`** (names, date, venue, photos, entourage, gifts, guests, colors, music).

## Run
```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in /dist
```

## Where the files go (all inside `public/`, names must match exactly)
| Folder | File | What it is |
|---|---|---|
| `public/photos/` | `photo-01.jpg` … `photo-20.jpg` | 20 photos. 01 = cover, 02 = envelope background, 03 = scratch card, 20 = closing. Shown whole (not cropped). |
| `public/videos/` | `couple-video.mp4` | Optional film (set `MEDIA.video` to `""` to hide) |
| `public/audio/` | `theme.mp3` | Optional: only if you set `MUSIC.localFile` |
| `public/elements/` | `seal.png` | Round monogram seal on the envelope |
| | `corner-flower-left.png`, `corner-flower-right.png` | Square flower corners (Canva PNG, transparent) |
| | `envelope-flower-left.png`, `envelope-flower-right.png` | Flowers tucked under the envelope |
| | `ornament-line.png` | Thin divider (about 4:1) |
| | `attire-sponsors-men.png`, `attire-sponsors-women.png` | Attire guide (3:5 portrait PNG) |
| | `attire-court-men.png`, `attire-court-women.png` | |
| | `attire-guests-men.png`, `attire-guests-women.png` | |
| | `qr-gcash.png`, `qr-maya.png`, `qr-bank.png` | Gift QR codes (square) |

While `SHOW_PLACEHOLDERS = true` in `data.ts`, any missing file shows a dashed box with its filename. Set it to `false` before sending to guests.

## Google Sheets (RSVP + seat finder + admin)
1. Make a Sheet with tabs **Guests** (`id | fullName | aliases | hint | table | seat | rsvp | partySize`) and **Replies** (`submittedAt | guestId | name | status`).
2. Extensions → Apps Script → paste `google-sheets/apps-script.gs`, set your own `PIN`, Deploy → Web app → *Anyone*.
3. Paste the web-app URL into `API.endpoint` in `src/data.ts`.
4. Admin page: `your-site/#admin` (uses the PIN from the script).

## Put it on GitHub
```bash
git init
git add .
git commit -m "Debut invitation"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```
Tip: make the repo **private**. Keep the Apps Script PIN only inside the script, never in the repo.

## Link preview (picture when you send the link)
Open `index.html`, replace every `https://YOUR-SITE.com` with your real site link. The preview uses `photo-01.jpg` (or add a 1200x630 `public/photos/og-image.jpg` and point the image lines to it). Messenger/Viber cache previews, so test with a fresh link or the Facebook Sharing Debugger.

## Petals & admin paging
`PETALS` in `data.ts` sets petal colors/count (set `enabled: false` to hide). `ADMIN_PAGE_SIZE` sets guests per page in `#admin` (10 default, try 12).
