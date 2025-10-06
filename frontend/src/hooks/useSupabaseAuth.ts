import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'
import type { User } from '@supabase/supabase-js'

export function useSupabaseAuth() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    let sub: any
    ;(async () => {
      const { data } = await supabase.auth.getUser()
      setUser(data.user ?? null)
      sub = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })
    })()
    return () => sub?.subscription?.unsubscribe?.()
  }, [])

  return { user }
}
