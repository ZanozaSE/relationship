import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { clearTokens, getAccessToken, getCurrentUser } from '../api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    async function restoreSession() {
      if (!getAccessToken()) {
        if (isMounted) {
          setIsLoading(false)
        }
        return
      }

      const currentUser = await getCurrentUser()

      if (!isMounted) {
        return
      }

      if (currentUser) {
        setUser(currentUser)
      } else {
        clearTokens()
      }

      setIsLoading(false)
    }

    restoreSession()

    return () => {
      isMounted = false
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      setUser,
      logout() {
        clearTokens()
        setUser(null)
      },
    }),
    [user, isLoading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider')
  }

  return context
}
