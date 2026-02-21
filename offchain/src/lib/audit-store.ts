import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuditEntry {
  id: string
  timestamp: string
  type: 'deployment'
  provider: string
  deploymentId?: string
  akashUrl?: string
  transferTxHash?: string
  submitJobTxHash?: string
  serviceUris: string[]
  explorerBaseUrl: string
}

interface AuditStore {
  entries: AuditEntry[]
  addEntry: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void
  clearEntries: () => void
}

export const useAuditStore = create<AuditStore>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => ({
          entries: [
            {
              ...entry,
              id: crypto.randomUUID(),
              timestamp: new Date().toISOString(),
            },
            ...state.entries,
          ],
        })),
      clearEntries: () => set({ entries: [] }),
    }),
    { name: 'necto-audit-log' }
  )
)
