export type BrandLogo = { id: string; name: string; src: string }
export function logoName(id: string): string {
  return id.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim()
}
// Stable relative filenames are saved in projects; Vite resolves deployment URLs.
const files = import.meta.glob('./assets/brand-logos/*.{png,jpg,jpeg,webp,svg}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
export const brandLogos: BrandLogo[] = Object.entries(files).map(([path, src]) => {
  const id = path.split('/').at(-1)!
  return { id, name: logoName(id), src }
}).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
