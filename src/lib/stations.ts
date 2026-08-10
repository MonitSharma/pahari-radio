import type { Station } from './types'
import nati from '../content/stations/nati.json'
import kullvi from '../content/stations/kullvi.json'
import kangri from '../content/stations/kangri.json'
import chamba from '../content/stations/chamba.json'
import devbhoomi from '../content/stations/devbhoomi.json'

export const stations: Station[] = [nati, kullvi, kangri, chamba, devbhoomi]

export const defaultStation = stations[0]

export function stationBySlug(slug: string | undefined): Station {
  return stations.find((s) => s.slug === slug) ?? defaultStation
}

/**
 * Per-station colour. Kept here rather than in the content JSON because it's
 * design, not data — the build script rewrites those files.
 */
export interface Palette {
  /** Accent, used for text and the progress bar. */
  accent: string
  /** Sky gradient, top to bottom. */
  sky: [string, string, string]
  /** Ridge layers, far to near. */
  ridges: string[]
  /** Sun/moon disc. */
  disc: string
}

export const palettes: Record<string, Palette> = {
  // Kullu shawl reds — the loudest station gets the loudest colour.
  nati: {
    accent: '#ff9d5c',
    sky: ['#2a0f14', '#7d2020', '#e2622f'],
    ridges: ['#8f3524', '#5e2019', '#3a1211', '#1d0a0b'],
    disc: '#ffcf7a',
  },
  // Kullu valley in late apple season.
  kullvi: {
    accent: '#8fd6a0',
    sky: ['#0b1f22', '#17454a', '#4f8a6a'],
    ridges: ['#356150', '#22453b', '#152b26', '#0a1614'],
    disc: '#dcf0c2',
  },
  // Kangra: wheat, terracotta, dust.
  kangri: {
    accent: '#f0c268',
    sky: ['#241608', '#6d3d16', '#d08b3c'],
    ridges: ['#8a5a2c', '#5c3a1d', '#382312', '#1c1109'],
    disc: '#ffe6a8',
  },
  // The high passes above Chamba — cold, thin light.
  chamba: {
    accent: '#a9c4f5',
    sky: ['#0a1024', '#1d2f5c', '#5f7fb5'],
    ridges: ['#4a5f8c', '#33415f', '#1f2739', '#10141f'],
    disc: '#e8f0ff',
  },
  // Brass lamps and marigold.
  devbhoomi: {
    accent: '#ffc94d',
    sky: ['#1c1206', '#5c3a0d', '#c98a1e'],
    ridges: ['#8a6320', '#5b4116', '#36270e', '#1a1307'],
    disc: '#fff0bd',
  },
}

export function paletteFor(slug: string): Palette {
  return palettes[slug] ?? palettes.nati
}
