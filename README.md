# पहाड़ी रेडियो · Pahari Radio

A live, synced Himachali radio station. Five channels — Nati, Kullvi, Kangri, Chamba–Pangi,
Devbhoomi — where **everyone listening hears the same song at the same second**. It's meant to
feel like walking past a radio at a shop in the bazaar, not like opening a playlist.

## How it works

There is no backend. No server, no database, no API keys, nothing to pay for.

Playback position is a **pure function of the wall clock**. Each station's tracks form a cycle of
known length; time since the station's epoch, modulo that length, tells you which track is playing
and how far into it you are. Every listener computes it independently and they all agree — that's
agreement without coordination, and it's the whole design.

The audio comes from a hidden YouTube IFrame Player seeked to the computed offset. Nothing is
hosted, nothing is licensed, and the site is a folder of static files.

Three details make it hold up:

- **Clock skew** (`src/lib/clock.ts`) — a listener with a wrong device clock hears the wrong thing
  and has no way to notice. One `HEAD` request against our own origin reads the `Date` header and
  corrects for it. Any static host doubles as a time source.
- **Drift correction** (`src/lib/useRadio.ts`) — the player is compared to the schedule once a
  second and re-seeked if it slips more than 2.5s, with a settle window after each seek so it
  doesn't fight YouTube's buffering.
- **Deterministic shuffle** (`src/lib/scheduler.ts`) — the running order is reshuffled every lap by
  a PRNG seeded on the lap number, so it varies without diverging between listeners. Lap 0 plays
  the curated order.

## Commands

```bash
npm run dev              # dev server
npm test                 # scheduler unit tests — the sync math
npm run build            # static build into dist/
npm run build:stations   # re-verify the playlist and refresh covers
npm run check:stations   # verify only; non-zero exit if a track has gone bad
```

`dist/` deploys as-is to Vercel, Netlify, Cloudflare Pages, GitHub Pages, or any static host.
Routing is hash-based (`/#/kullvi`), so no rewrite rules are needed anywhere.

## GitHub Pages

The recommended repository name is `pahari-radio`. The deployment workflow in
`.github/workflows/deploy.yml` runs the tests, lint, and production build, then publishes `dist/`
to GitHub Pages on every push to `main`. In the repository settings, set Pages → Build and
deployment → Source to **GitHub Actions**.

For a project site the URL will be `https://USERNAME.github.io/pahari-radio/`; the Vite config
derives that base path from the repository name during the Actions build. A user site named
`USERNAME.github.io`, or a custom-domain deployment, uses `/` instead and can set `BASE_PATH=/`
if needed.

The repository contains downloaded cover images and embeds YouTube audio. Confirm that you have
the necessary rights and are comfortable with YouTube's embedded-player terms before publishing
it publicly.

## Editing the music

`scripts/seed.ts` is the only file you edit to change what plays. Add a YouTube id, optionally a
cleaned-up title and artist, and any editorial you want to write. Then:

```bash
npm run build:stations
```

That fetches each video's watch page once and reads its title, artist, duration and — the important
one — `playableInEmbed`. **A video that isn't embeddable plays as silence**, and because playback
is clock-driven the station would simply go quiet for the length of that track with no error
anywhere. So non-embeddable videos are rejected at build time, along with the 40-minute "nonstop
jukebox" compilations that are common in this repertoire and make a now-playing card meaningless.

The script also pulls cover art into `public/covers/`, so nothing is requested from a third party at
runtime. Re-run it occasionally: YouTube videos get pulled, and `--check` exits non-zero if any
track has gone bad.

### Add a song to a specific station

1. Open the YouTube video you want to add and copy its video ID. For
   `https://www.youtube.com/watch?v=ABC123xyz`, the ID is `ABC123xyz`.
2. Open `scripts/seed.ts` and find the station's `entries` list. Add the song to the matching
   station:

```ts
{
  id: 'ABC123xyz',
  title: 'Song name',
  artist: 'Artist name',
  dialect: 'Kangri',
  region: 'Kangra valley',
  occasion: 'Folk song',
},
```

Use these slugs when choosing a category:

| Slug | Add songs from |
| --- | --- |
| `nati` | Shimla-belt Nati and modern dance songs |
| `kullvi` | Kullu valley and Kullvi folk songs |
| `kangri` | Kangra and lower-Himachal Kangri songs |
| `chamba` | Chamba, Gaddi, Churahi and Pangwali songs |
| `devbhoomi` | Harul, deity songs, devotional music and Mata bhajans |

`title`, `artist`, and the editorial fields are optional. A track with only an `id` still plays,
but adding them gives the now-playing card better information. Add one video per entry rather than
using a YouTube playlist URL.

Then run the verification and production checks:

```bash
npm run build:stations
npm test
npm run lint
npm run build
```

`build:stations` checks that the video is available and embeddable, rejects short clips and long
nonstop mixes, and downloads its cover into `public/covers/`. If YouTube rejects a video, choose
another upload instead of forcing it into the generated station data. Do not hand-edit
`src/content/stations/*.json`; those files are generated.

After the checks pass, publish the update:

```bash
git add scripts/seed.ts src/content/stations public/covers
git commit -m "Add songs to a station"
git push origin main
```

The GitHub Actions workflow will build and redeploy the site automatically.

## About the song notes, not lyrics

The "about this song" panel carries dialect, region, occasion, a short original note, and a glossary
of recurring Pahari words. It deliberately does **not** reproduce lyrics — those are copyrighted,
and in any case the real gap for a listener from outside the valley isn't the words on the page but
knowing what form they're hearing, where it's from, and what *dhola* or *jatar* or *harul* means.

Editorial is optional per track. A song with none still plays; the panel just says so.

## Stations

| Slug | Station | What it is |
| --- | --- | --- |
| `nati` | नाटी घर | Shimla-belt dance nati — Kuldeep Sharma, KL Singta, Hemraj Khachi, Vicky Chauhan |
| `kullvi` | कुल्लवी | Kullu valley, slower and older — largely Inderjeet |
| `kangri` | कांगड़ी लोक | Lower Himachal, Kangra valley — largely Karnail Rana |
| `chamba` | चंबा–पांगी | Gaddi, Churahi and Pangwali from beyond the passes — Poonam Bhardwaj and others |
| `devbhoomi` | देवभूमि | Harul, dev nati and the Mata bhajans |

236 tracks currently, with 40+ tracks in every station.

## Layout

```
scripts/seed.ts               the curated playlist — edit this
scripts/build-stations.ts     verification + cover fetch
src/lib/scheduler.ts          the sync math (pure, unit tested)
src/lib/clock.ts              server-clock skew correction
src/lib/useRadio.ts           YouTube player + drift correction
src/components/scenes/        the generated mountain artwork
src/content/stations/*.json   generated — don't hand-edit
```

The backgrounds are drawn, not photographed: seeded ridgelines with per-station terrain profiles,
plus deodars, kath-kuni houses, a hill temple and prayer flags. Nothing to license, scales to any
screen, and it recomposes for portrait rather than cropping its subject off the edge.
