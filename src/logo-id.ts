// Unknown but well-formed filenames survive imports even if the asset is absent.
export function validLogoId(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 180 && /^[\p{L}\p{N} _().-]+\.(png|jpe?g|webp|svg)$/iu.test(value) && !value.includes('..')
}
