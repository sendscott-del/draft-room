import { createContext, useContext, type ReactNode } from 'react'

/**
 * Display labels for the two "slots" in the synthesized AppData.
 * "Scott" slot = current user. "Ty" slot = currently-selected comparison player.
 *
 * The legacy game components key data by 'Scott'/'Ty' literals; this context
 * lets them render the actual display name instead of the literal slot name.
 */
type Labels = { Scott: string; Ty: string }

const LabelsContext = createContext<Labels>({ Scott: 'You', Ty: 'Compare' })

export function LabelsProvider({ left, right, children }: { left: string; right: string; children: ReactNode }) {
  return <LabelsContext.Provider value={{ Scott: left, Ty: right }}>{children}</LabelsContext.Provider>
}

export function useLabels(): Labels {
  return useContext(LabelsContext)
}
