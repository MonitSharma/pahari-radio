export interface GlossaryEntry {
  /** The Pahari word, in Devanagari. */
  word: string
  /** Roman transliteration, for listeners who don't read Devanagari. */
  roman: string
  /** What it means in English. */
  meaning: string
}

export interface Track {
  /** YouTube video id — also the cover filename and the scheduler's identity. */
  id: string
  title: string
  artist: string
  /** Seconds. Baked in at build time by scripts/build-stations.ts. */
  duration: number

  // --- Editorial. Hand-written; everything below is optional. ---
  /** Kangri, Mandyali, Kullvi, Kinnauri, Gaddi, Sirmauri, Hindi… */
  dialect?: string
  /** Where in Himachal the song belongs. */
  region?: string
  /** The occasion it's sung at — a fair, a jatar, a wedding, a harvest. */
  occasion?: string
  /** Two or three original sentences on what the song is about. */
  note?: string
  glossary?: GlossaryEntry[]
}

export interface Station {
  /** URL segment: /nati, /kangri, … */
  slug: string
  /** Devanagari name. */
  name: string
  /** Roman name. */
  roman: string
  tagline: string
  /**
   * Fixed origin of this station's clock, as epoch ms. Every listener derives
   * playback position from this, which is what keeps them in sync without a
   * server. Changing it re-cuts the schedule for everyone, so don't.
   */
  epoch: number
  tracks: Track[]
}
