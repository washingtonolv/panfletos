import data from './layout-templates.json' with { type: 'json' }
import { uid } from './block-model.ts'
import { validateProject } from './project-import.ts'
import type { Document } from './block-model.ts'

export type LayoutTemplate = { id: string; name: string; description: string; sources: string[]; document: Document }
export const templates: LayoutTemplate[] = data.map(item => ({ ...item, document: validateProject(item.document) }))
export function createFromTemplate(id: string): Document {
  const template = templates.find(item => item.id === id)
  if (!template) throw new Error('Modelo não encontrado.')
  const document = structuredClone(template.document)
  for (const block of [...document.frente, ...document.verso]) {
    block.id = uid()
    block.fields?.forEach(field => { field.key = uid() })
  }
  return document
}
