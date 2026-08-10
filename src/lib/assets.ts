/** Resolve files from public/ correctly on both root and project GitHub Pages sites. */
export function assetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`
}
