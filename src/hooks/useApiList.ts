import { useEffect, useState } from 'react'
import { errorMessage, listAll } from '../lib/api'

export function useApiList<T>(path: string) {
  const [state, setState] = useState<{ items: T[]; loading: boolean; error: string }>({ items: [], loading: true, error: '' })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    listAll<T>(path, controller.signal).then(items => {
      if (!controller.signal.aborted) setState({ items, loading: false, error: '' })
    }).catch(error => {
      if (!controller.signal.aborted) setState({ items: [], loading: false, error: errorMessage(error) })
    })
    return () => controller.abort()
  }, [path, version])
  return { ...state, reload: () => { setState(s => ({ ...s, loading: true, error: '' })); setVersion(v => v + 1) } }
}
