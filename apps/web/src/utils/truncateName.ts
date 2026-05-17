
 export function truncateName(name: string, maxLength: number = 12): string {
  if (name.length <= maxLength) return name
  return name.substring(0, maxLength) + '...'
}