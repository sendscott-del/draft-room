// =============================================================================
// LEGACY TYPES (single-row draft_room JSONB shape — kept for migration only)
// =============================================================================

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

/** @deprecated kept only for the one-time migration of the old `draft_room` row. */
export type Player = 'Scott' | 'Ty'

/** @deprecated legacy single-row shape; new code uses `UserAppData` (per-player). */
export interface AppData {
  fa: FAPick[]
  cy: { Scott: CYPick[]; Ty: CYPick[] }
  pu: { Scott: PUPick[]; Ty: PUPick[] }
  hr: { Scott: Record<string, HRSlot>; Ty: Record<string, HRSlot> }
  td: TDPick[]
  aw: { Scott: AwardPicks; Ty: AwardPicks }
  ou: { Scott: Record<string, OUPick>; Ty: Record<string, OUPick> }
}

// =============================================================================
// NEW TYPES (per-player, post multi-user migration)
// =============================================================================

/** A single FA pick belonging to one player (snake-draft round preserved for legacy display). */
export interface FAPickPersonal {
  round: number
  player: string
  team: string
  years: string
  newTeam: boolean
  award: boolean
  asg: boolean
  actual: string
}

/** Trade-deadline pick belonging to one player. */
export interface TDPickPersonal {
  round: number
  player: string
  team: string
  traded: boolean
  asg: boolean
  award: boolean
}

/** Postseason / playoffs picks: divisions, wild cards, pennants, World Series. */
export interface PSPicks {
  divisions?: {
    alEast?: string
    alCentral?: string
    alWest?: string
    nlEast?: string
    nlCentral?: string
    nlWest?: string
  }
  wildCards?: {
    al?: string[]   // up to 3
    nl?: string[]
  }
  pennants?: {
    al?: string
    nl?: string
  }
  ws?: string
}

/** A single player's entire game state. JSONB shape stored in `player_picks.data`. */
export interface UserAppData {
  fa: FAPickPersonal[]
  cy: CYPick[]
  pu: PUPick[]
  hr: Record<string, HRSlot>
  td: TDPickPersonal[]
  aw: AwardPicks
  ou: Record<string, OUPick>
  ps?: PSPicks
}

/** Profile row in `players` table. */
export interface PlayerProfile {
  id: string
  user_id: string | null
  display_name: string
  handle: string | null
  is_show_account: boolean
  is_public: boolean
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

/** Per-game configuration (admin-managed). */
export interface GameConfig {
  game_key: 'fa' | 'cy' | 'pu' | 'hr' | 'td' | 'aw' | 'ou' | 'ps'
  name: string
  status: 'final' | 'interim'
  source_video_ids: string[]
  comment_filter_handles: string[]
}

/** Cached YouTube comment row. */
export interface YouTubeComment {
  comment_id: string
  video_id: string
  game_key: GameConfig['game_key'] | null // includes 'ps'
  author_channel_id: string | null
  author_handle: string | null
  author_display_name: string | null
  text_plain: string | null
  text_html: string | null
  published_at: string | null
  like_count: number
}
