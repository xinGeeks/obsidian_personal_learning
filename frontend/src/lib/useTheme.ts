import { useCallback, useEffect, useRef, useState } from 'react'

type Theme = 'light' | 'dark'

function getInitial(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitial)
  const switching = useRef(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggle = useCallback(() => {
    if (switching.current) return
    switching.current = true

    const next = theme === 'dark' ? 'light' : 'dark'

    if ('startViewTransition' in document) {
      const vt = document.startViewTransition(() => {
        document.documentElement.classList.toggle('dark', next === 'dark')
        localStorage.setItem('theme', next)
        setTheme(next)
      })
      vt.finished.then(() => { switching.current = false })
    } else {
      setTheme(next)
      switching.current = false
    }
  }, [theme])

  return { theme, toggle } as const
}
