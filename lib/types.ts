export type SiteRole = "admin" | "editor" | "user";
export type TeamRole = "coach" | "assistant_coach" | "captain" | "member";
export type RegistrationStatus = "pending" | "approved" | "rejected" | "waitlist";
export type SubRequestStatus = "pending" | "approved" | "denied";
export type EventFormat = "round_robin" | "single_elim" | "double_elim";
export type MatchFormat = "BO1" | "BO3" | "BO5";
export type MatchStatus = "scheduled" | "final" | "forfeit" | "postponed";
export type StatSource = "scrape" | "manual";
export type StatSyncStatus = "pending" | "synced" | "failed";
export type NewsStatus = "draft" | "published";
export type InviteStatus = "pending" | "accepted" | "revoked";
export type InviteKind = "site_role" | "team_staff";

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  playerTag: string;
  role: SiteRole;
  mfaEnabled: boolean;
}

export interface User extends PublicUser {
  discordId?: string | null;
  discordUsername?: string | null;
  discordConnectedAt?: string | null;
  suspended?: boolean;
  riotGameName?: string | null;
  riotTagLine?: string | null;
  riotConnectedAt?: string | null;
  teamMembership?: TeamMembership | null;
}

export type MembershipSlot = "staff" | "player";

export interface TeamMembership {
  id: string;
  userId: string;
  teamId: string;
  slot: MembershipSlot;
  teamRole: TeamRole;
  position?: string | null;
  team?: Team;
  user?: PublicUser;
}

export interface Team {
  id: string;
  name: string;
  tag: string;
  color?: string | null;
  game: string;
  isNrv: boolean;
  homepageEnabled: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  memberships?: TeamMembership[];
}

export interface EventTeam {
  eventId: string;
  teamId: string;
  addedAt: string;
  team?: Team;
}

export interface NrvEvent {
  id: string;
  name: string;
  game: string;
  format: EventFormat;
  startDate: string;
  endDate: string;
  regOpenDate: string;
  regCloseDate: string;
  capacity: number;
  prizeText?: string | null;
  description?: string | null;
  status?: "Upcoming" | "Active" | "Completed";
  registrationState?: "notopen" | "open" | "waitlist" | "closed";
  teams?: EventTeam[];
}

export interface MapResult {
  id: string;
  matchId: string;
  mapName: string;
  scoreA: number;
  scoreB: number;
  order: number;
}

export interface TrackerLink {
  id: string;
  matchId: string;
  url: string;
}

export interface StatSync {
  id: string;
  matchId: string;
  status: StatSyncStatus;
  lastSyncAt?: string | null;
  reason?: string | null;
  isManual: boolean;
}

export interface Match {
  id: string;
  eventId: string;
  event?: NrvEvent;
  format: MatchFormat;
  status: MatchStatus;
  teamAId: string;
  teamA?: Team;
  teamBId: string;
  teamB?: Team;
  startsAt: string;
  timezone: string;
  streamUrl?: string | null;
  forfeitWinnerId?: string | null;
  mapResults?: MapResult[];
  trackerLinks?: TrackerLink[];
  statSync?: StatSync | null;
}

export interface StatLine {
  id: string;
  matchId: string;
  teamId: string;
  userId: string;
  kills: number;
  deaths: number;
  assists: number;
  acs: number;
  adr: number;
  hsPct: number;
  kast: number;
  fk: number;
  source: StatSource;
}

export interface PlayerStatRow {
  userId: string;
  ign: string;
  name: string;
  role?: string | null;
  teamId: string;
  team?: Team;
  maps: number;
  kd: number;
  acs: number;
  adr: number;
  hsPct: number;
  kast: number;
  fk: number;
}

export interface TeamStatRow {
  teamId: string;
  team?: Team;
  maps: number;
  wins: number;
  losses: number;
  winRate: number;
  acs: number;
  kd: number;
}

export interface StandingsRow {
  rank: number;
  teamId: string;
  team?: Team;
  wins: number;
  losses: number;
  mapDiff: number;
  points: number;
}

export interface Registration {
  id: string;
  eventId: string;
  event?: NrvEvent;
  teamId: string;
  team?: Team;
  status: RegistrationStatus;
  submittedAt: string;
  decidedById?: string | null;
  decidedBy?: PublicUser | null;
  decidedAt?: string | null;
  reason?: string | null;
  contactEmail?: string | null;
  acksTos: boolean;
  acksRulebookVersion?: string | null;
  acksAt?: string | null;
  acksEmailConsent: boolean;
}

export interface SubstitutionRequest {
  id: string;
  teamId: string;
  team?: Team;
  status: SubRequestStatus;
  outUserId: string;
  outUser?: PublicUser;
  inUserId: string;
  inUser?: PublicUser;
  reason?: string | null;
  requestedById: string;
  requestedBy?: PublicUser;
  requestedAt: string;
  decidedById?: string | null;
  decidedAt?: string | null;
}

export interface NewsCategory {
  id: string;
  name: string;
  archived: boolean;
}

export interface NewsPost {
  id: string;
  title: string;
  excerpt?: string | null;
  body: string;
  authorId: string;
  author?: PublicUser;
  categoryId?: string | null;
  category?: NewsCategory | null;
  readTime?: number | null;
  coverColor?: string | null;
  status: NewsStatus;
  lastEditedById?: string | null;
  lastEditedBy?: PublicUser | null;
  lastEditedAt?: string | null;
  publishedAt?: string | null;
  createdAt: string;
}

export interface RulebookPage {
  id: string;
  sectionId: string;
  title: string;
  body: string;
  order: number;
}

export interface RulebookSection {
  id: string;
  title: string;
  order: number;
  pages: RulebookPage[];
}

export interface RulebookChangelogEntry {
  id: string;
  version: string;
  note: string;
  byId: string;
  by?: PublicUser;
  at: string;
}

export interface Rulebook {
  version: string;
  updatedAt: string;
  sections: RulebookSection[];
  changelog?: RulebookChangelogEntry[];
}

export interface Sponsor {
  id: string;
  name: string;
  tier: string;
  sortOrder: number;
}

export interface Announcement {
  id: string;
  date: string;
  title: string;
}

export interface Invite {
  id: string;
  email: string;
  kind: InviteKind;
  role?: SiteRole | null;
  teamId?: string | null;
  status: InviteStatus;
  invitedById: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorId: string;
  actor?: PublicUser;
  action: string;
  target: string;
  at: string;
}

export interface AuthResponse {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}
