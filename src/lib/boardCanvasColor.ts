/** Adapt pastel board color for dark canvas while keeping a recognizable tint. */
export function resolveBoardCanvasColor(
  color: string,
  dark: boolean,
): string {
  if (!dark) return color

  const hex = color.replace('#', '')
  if (hex.length !== 6) return '#1e293b'

  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)

  const mix = (c: number, target: number, amount: number) =>
    Math.round(c * (1 - amount) + target * amount)

  const baseR = mix(r, 30, 0.82)
  const baseG = mix(g, 41, 0.82)
  const baseB = mix(b, 59, 0.82)

  return `rgb(${baseR}, ${baseG}, ${baseB})`
}
