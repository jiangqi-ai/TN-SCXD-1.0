import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DatabaseConfig {
  databaseUrl: string
  directUrl: string
  isConfigured: boolean
}

interface DatabaseStore extends DatabaseConfig {
  setDatabaseConfig: (config: Partial<DatabaseConfig>) => void
  clearConfig: () => void
}

const initialState: DatabaseConfig = {
  databaseUrl: '',
  directUrl: '',
  isConfigured: false
}

export const useDatabaseStore = create<DatabaseStore>()(
  persist(
    (set) => ({
      ...initialState,
      setDatabaseConfig: (config) => 
        set((state) => ({ 
          ...state, 
          ...config,
          isConfigured: true 
        })),
      clearConfig: () => set(initialState)
    }),
    {
      name: 'database-config'
    }
  )
) 