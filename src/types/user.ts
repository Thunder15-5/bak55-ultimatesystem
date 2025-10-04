export type UserRole = 'artist' | 'brand' | 'admin' | 'user';

export interface SocialLinks {
  instagram?: string;
  twitter?: string;
  spotify?: string;
  youtube?: string;
  soundcloud?: string;
  website?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  role: UserRole;
  stageName?: string;
  bio?: string;
  location?: string;
  avatar?: string;
  socialLinks?: SocialLinks;
  createdAt: string;
  updatedAt: string;
}

export interface Artist extends User {
  role: 'artist';
  genres?: string[];
  verified: boolean;
  stats: {
    followers: number;
    totalPlays: number;
    totalCompetitions: number;
    wins: number;
  };
}
