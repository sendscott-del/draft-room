export interface FAPick {
  round: number
  owner: 'Scott' | 'Ty'
  player: string
  team: string
  years: string
  newTeam: boolean
  award: boolean
  asg: boolean
  actual: string
}

export interface CYPick {
  round: number
  pitcher: string
  lg: 'AL' | 'NL'
  odds: string
  liveOdds?: string
  rookie: boolean
  votes: number
  stats?: { era: string; w: number; l: number; k: number; ip: string }
}

export interface PUPick {
  r: number
  team: string
  unit: 'INF+C' | 'OF' | 'SP' | 'RP'
  war: number
}

export interface HRSlot {
  p: string
  t: string
  hr: number
}

export interface TDPick {
  round: number
  owner: 'Scott' | 'Ty'
  player: string
  team: string
  traded: boolean
  asg: boolean
  award: boolean
}

export type AwardResult = 'none' | 'winner' | 'finalist' | 'top10'

export interface AwardPicks {
  alMVP: string; nlMVP: string; alROY: string; nlROY: string
  alCY: string;  nlCY: string;  alMGR: string; nlMGR: string
  alMVPR: AwardResult; nlMVPR: AwardResult
  alROYR: AwardResult; nlROYR: AwardResult
  alCYR: AwardResult;  nlCYR: AwardResult
  alMGRR: AwardResult; nlMGRR: AwardResult
}

export interface OUPick {
  pick: 'over' | 'under' | ''
  actual: string
  projected?: number
}

export type Player = 'Scott' | 'Ty'

export interface AppData {
  fa: FAPick[]
  cy: { Scott: CYPick[]; Ty: CYPick[] }
  pu: { Scott: PUPick[]; Ty: PUPick[] }
  hr: { Scott: Record<string, HRSlot>; Ty: Record<string, HRSlot> }
  td: TDPick[]
  aw: { Scott: AwardPicks; Ty: AwardPicks }
  ou: { Scott: Record<string, OUPick>; Ty: Record<string, OUPick> }
}
