// MatchDto
// Representa el partido y sus datos principales
export const exampleMatchDto = {
  id: "", // string o número
  homeTeam: {
    name: ""
  },
  awayTeam: {
    name: ""
  },
  tournament: {
    id: "",
    name: "",
    slug: ""
    // Pueden haber más campos según la API
  },
  status: {
    type: ""
  },
  startTimestamp: 0, // unix timestamp
  time: {
    currentPeriodStartTimestamp: 0
  }
};

// PlayerStatsDto
export const examplePlayerStatsDto = {
  player: {
    userCount: 0,
    name: "",
    jerseyNumber: "",
    position: "",
    id: 0,
    shortName: "",
    slug: ""
  },
  fouls: 0,
  totalPass: 0,
  accuratePass: 0,
  minutesPlayed: 0,
  rating: null,
  teamId: 0,
  position: "",
  totalLongBalls: 0,
  accurateLongBalls: 0,
  goalAssist: 0,
  totalCross: 0,
  aerialLost: 0,
  aerialWon: 0,
  duelLost: 0,
  duelWon: 0,
  challengeLost: 0,
  dispossessed: 0,
  bigChanceMissed: 0,
  onTargetScoringAttempt: 0,
  blockedScoringAttempt: 0,
  totalClearance: 0,
  totalTackle: 0,
  touches: 0,
  possessionLostCtrl: 0,
  keyPass: 0,
  teamFromLineup: "unknown",
  saves: 0,
  savedShotsFromInsideTheBox: 0,
  goodHighClaim: 0,
  totalKeeperSweeper: 0,
  accurateKeeperSweeper: 0
};

// ShotDto
export const exampleShotDto = {
  player: examplePlayerStatsDto.player,
  time: 0,
  teamId: 0,
  isHome: false,
  shotType: "",
  situation: "",
  bodyPart: "",
  goalType: null,
  xg: 0.0,
  x: 0.0,
  y: 0.0,
  hasAssist: false,
  assistPlayer: null,
  assistDescription: null,
  timeSeconds: 0
};

// PlayerFoulDto
export const examplePlayerFoulDto = {
  playerId: 0,
  playerName: "",
  shirtNumber: 0,
  team: "",
  time: 0,
  timeSeconds: 0,
  foulType: "",
  description: "",
  incidentId: ""
};

// PlayerSaveDto
export const examplePlayerSaveDto = {
  playerId: 0,
  playerName: "",
  shirtNumber: 0,
  team: "",
  time: 0,
  timeSeconds: 0,
  saveType: "",
  description: "",
  shotBlocked: false
};

// MatchIncidentDto
export const exampleMatchIncidentDto = {
  id: "",
  incidentType: "",
  time: 0,
  timeSeconds: 0,
  player: null, // o examplePlayerStatsDto.player
  teamSide: "",
  description: null,
  cardType: null,
  text: null,
  isHome: null
};

// MatchSummaryDto
export const exampleMatchSummaryDto = {
  shots: [exampleShotDto],
  fouls: [examplePlayerFoulDto],
  saves: [examplePlayerSaveDto]
};