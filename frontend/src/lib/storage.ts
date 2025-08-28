export const storage = {
  get(key: string) {
    try { return JSON.parse(localStorage.getItem(key) || 'null') } catch { return null }
  },
  set(key: string, val: any) {
    localStorage.setItem(key, JSON.stringify(val))
  },
  remove(key: string) { localStorage.removeItem(key) }
}
