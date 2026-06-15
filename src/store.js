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
  return useLocalStorage('rp_assignments', [])
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}
