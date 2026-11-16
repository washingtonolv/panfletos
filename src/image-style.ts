import type { CSSProperties } from 'react'
import type { ImageAdjustment } from './block-model'

export function imageStyle(a?: ImageAdjustment): CSSProperties { return { transform: `translate(${a?.x || 0}%, ${a?.y || 0}%) scale(${a?.scale || 1})`, transformOrigin: 'center' } }
