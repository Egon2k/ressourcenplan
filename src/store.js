import { useState, useEffect } from 'react'

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initial
    } catch {
      return initial
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

export function useEmployees() {
  return useLocalStorage('rp_employees', [])
}

export function useProjects() {
  return useLocalStorage('rp_projects', [])
}

export function useAssignments() {
  const [assignments, setAssignments] = useLocalStorage('rp_assignments', [])

  // Migration: convert old { percentage } format to { months: { "YYYY-MM": pct } }
  useEffect(() => {
    const needsMigration = assignments.some(a => 'percentage' in a && !('months' in a))
    if (needsMigration) {
      const now = new Date()
      const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      setAssignments(prev => prev.map(a => {
        if ('percentage' in a && !('months' in a)) {
          const { percentage, ...rest } = a
          return { ...rest, months: { [currentYM]: percentage } }
        }
        return a
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [assignments, setAssignments]
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
