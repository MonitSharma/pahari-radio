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

79 tracks, all verified embeddable at build time.

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
