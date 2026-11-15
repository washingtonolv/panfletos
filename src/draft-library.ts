import { normalize, STORAGE, uid } from './block-model.ts'
import type { Document, DraftStorage } from './block-model.ts'

export const SAVED_PREFIX = 'panfletos:saved:'
export type SavedDraft = { version: 1; key: string; name: string; createdAt: string; document: Document }
type LibraryStorage = DraftStorage & Pick<Storage, 'length' | 'key'>

// Keep an exact snapshot before replacing the active draft. setItem is atomic:
// if quota rejects the new active draft, the old value remains and the copy stays.
export function replaceDraft(current: Document, next: Document, expectedRaw: string | null, storage: DraftStorage = localStorage): SavedDraft {
  if (storage.getItem(STORAGE) !== expectedRaw) throw new Error('O rascunho mudou em outra aba. Baixe seu projeto e recarregue antes de continuar.')
  const saved: SavedDraft = { version: 1, key: SAVED_PREFIX + uid(), name: current.layout?.name || 'Rascunho anterior', createdAt: new Date().toISOString(), document: structuredClone(current) }
  const raw = JSON.stringify(saved)
  storage.setItem(saved.key, raw)
  if (storage.getItem(saved.key) !== raw) throw new Error('Não foi possível verificar a cópia do rascunho.')
  if (storage.getItem(STORAGE) !== expectedRaw) throw new Error('O rascunho mudou em outra aba. A troca foi cancelada.')
  storage.setItem(STORAGE, JSON.stringify(next))
  return saved
}
export function listSavedDrafts(storage: LibraryStorage = localStorage): { drafts: SavedDraft[]; unreadable: number } {
  const drafts: SavedDraft[] = []; let unreadable = 0
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i)
    if (!key?.startsWith(SAVED_PREFIX)) continue
    try {
      const data = JSON.parse(storage.getItem(key) || '')
      if (data.version !== 1 || typeof data.name !== 'string' || typeof data.createdAt !== 'string' || !Number.isFinite(Date.parse(data.createdAt))) throw new Error('Cópia inválida')
      drafts.push({ version: 1, key, name: data.name, createdAt: data.createdAt, document: normalize(data.document) })
    } catch { unreadable++ }
  }
  return { drafts: drafts.sort((a, b) => b.createdAt.localeCompare(a.createdAt)), unreadable }
}
