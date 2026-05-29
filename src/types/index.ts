export type EntityType = 'email' | 'phone' | 'username' | 'fullname' | 'social' | 'domain' | 'ip';

export interface SeedInput {
  id: string;
  value: string;
  type: EntityType;
  timestamp: Date;
}

export interface TaskStatus {
  id: string;
  module: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  message: string;
  progress: number;
  timestamp: Date;
}

export interface GraphNode {
  id: string;
  type: 'seed' | 'email' | 'phone' | 'social' | 'domain' | 'person' | 'location' | 'credential' | 'image';
  label: string;
  data: Record<string, unknown>;
  confidence?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
}

export interface TargetProfile {
  id: string;
  primaryName: string;
  aliases: string[];
  emails: string[];
  phones: string[];
  socialProfiles: SocialProfile[];
  locations: Location[];
  credentials: Credential[];
  images: ProfileImage[];
  demographics: Demographics;
}

export interface SocialProfile {
  platform: string;
  username: string;
  url: string;
  lastActive?: string;
  followers?: number;
  connections?: number;
  friends?: number;
}

export interface Location {
  city: string;
  country: string;
  coordinates: { lat: number; lng: number };
  type: 'current' | 'previous' | 'work';
  confidence: number;
}

export interface Credential {
  email: string;
  password: string;
  breach: string;
  date: string;
}

export interface ProfileImage {
  url: string;
  source: string;
  confidence: number;
  isPrimary?: boolean;
}

export interface Demographics {
  age?: number;
  gender?: string;
  nationality?: string;
  occupation?: string;
  education?: string;
}
