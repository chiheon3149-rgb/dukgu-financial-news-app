import { useState, useCallback } from "react"

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(key) ?? "[]") } catch { return [] }
}

function write<T>(key: string, items: T[]) {
  try { localStorage.setItem(key, JSON.stringify(items)) } catch {}
}

export function useLocalItems<T extends { id: string }>(storageKey: string) {
  const [items, setItems] = useState<T[]>(() => read<T>(storageKey))

  const addItem = useCallback((item: T) => {
    setItems(prev => {
      const next = [...prev, item]
      write(storageKey, next)
      return next
    })
  }, [storageKey])

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.id !== id)
      write(storageKey, next)
      return next
    })
  }, [storageKey])

  return { items, addItem, removeItem }
}
