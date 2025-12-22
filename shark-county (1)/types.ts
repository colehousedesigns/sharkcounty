
export enum GameType {
  EIGHT_BALL = '8-Ball',
  NINE_BALL = '9-Ball',
  TEN_BALL = '10-Ball',
  STRAIGHT_POOL = 'Straight Pool',
  ONE_POCKET = 'One Pocket'
}

export interface PlayerProfile {
  id: string;
  name: string;
  skillLevel: number;
  preferredGames: GameType[];
  location?: {
    lat: number;
    lng: number;
  };
  wins: number;
  losses: number;
  isPro: boolean; // For subscription tracking
}

export interface MatchEvent {
  id: string;
  title: string;
  type: 'Match' | 'Tournament';
  distance: number;
  locationName: string;
  startTime: string;
  gameType: GameType;
  organizer: string;
  description: string;
  isSponsored?: boolean; // For paid promotion
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}
