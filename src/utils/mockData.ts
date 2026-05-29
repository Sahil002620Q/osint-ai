import { TaskStatus, GraphNode, GraphEdge, TargetProfile } from '../types';

export const ENTITY_COLORS: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  email: { bg: 'bg-cyan-500/20', border: 'border-cyan-400', text: 'text-cyan-400', glow: 'shadow-cyan-500/50' },
  phone: { bg: 'bg-emerald-500/20', border: 'border-emerald-400', text: 'text-emerald-400', glow: 'shadow-emerald-500/50' },
  social: { bg: 'bg-rose-500/20', border: 'border-rose-400', text: 'text-rose-400', glow: 'shadow-rose-500/50' },
  username: { bg: 'bg-amber-500/20', border: 'border-amber-400', text: 'text-amber-400', glow: 'shadow-amber-500/50' },
  fullname: { bg: 'bg-blue-500/20', border: 'border-blue-400', text: 'text-blue-400', glow: 'shadow-blue-500/50' },
  domain: { bg: 'bg-purple-500/20', border: 'border-purple-400', text: 'text-purple-400', glow: 'shadow-purple-500/50' },
  ip: { bg: 'bg-orange-500/20', border: 'border-orange-400', text: 'text-orange-400', glow: 'shadow-orange-500/50' },
  person: { bg: 'bg-violet-500/20', border: 'border-violet-400', text: 'text-violet-400', glow: 'shadow-violet-500/50' },
  location: { bg: 'bg-teal-500/20', border: 'border-teal-400', text: 'text-teal-400', glow: 'shadow-teal-500/50' },
  credential: { bg: 'bg-red-500/20', border: 'border-red-400', text: 'text-red-400', glow: 'shadow-red-500/50' },
  image: { bg: 'bg-pink-500/20', border: 'border-pink-400', text: 'text-pink-400', glow: 'shadow-pink-500/50' },
  seed: { bg: 'bg-white/20', border: 'border-white', text: 'text-white', glow: 'shadow-white/50' },
};

export const mockTaskSequence: Omit<TaskStatus, 'id' | 'timestamp'>[] = [
  { module: 'Email Breach Aggregator', status: 'queued', message: 'Initializing...', progress: 0 },
  { module: 'Instagram Scraper Module', status: 'queued', message: 'Simulating session...', progress: 0 },
  { module: 'Phone Number OSINT Lookup', status: 'queued', message: 'Querying databases...', progress: 0 },
  { module: 'Social Username Enumerator', status: 'queued', message: 'Scanning platforms...', progress: 0 },
  { module: 'Facial Recognition Matcher', status: 'queued', message: 'Loading FaceNet model...', progress: 0 },
  { module: 'Domain WHOIS Analyzer', status: 'queued', message: 'Fetching records...', progress: 0 },
  { module: 'Public Records Crawler', status: 'queued', message: 'Accessing databases...', progress: 0 },
  { module: 'Cross-Reference Correlator', status: 'queued', message: 'Building entity graph...', progress: 0 },
];

export const generateMockNodes = (seedCount: number): GraphNode[] => {
  const nodes: GraphNode[] = [];

  for (let i = 0; i < seedCount; i++) {
    nodes.push({
      id: `seed-${i}`,
      type: 'seed',
      label: 'Input Seed',
      data: {},
    });
  }

  nodes.push(
    { id: 'email-1', type: 'email', label: 'john.smith@gmail.com', data: { breaches: 3, verified: true } },
    { id: 'email-2', type: 'email', label: 'jsmith@company.io', data: { breaches: 1, verified: true } },
    { id: 'phone-1', type: 'phone', label: '+1 (555) 234-5678', data: { carrier: 'Verizon', type: 'mobile' } },
    { id: 'social-1', type: 'social', label: '@johnsmith_official', data: { platform: 'Instagram', followers: 12500 } },
    { id: 'social-2', type: 'social', label: '@johndsmith', data: { platform: 'Twitter', followers: 3400 } },
    { id: 'social-3', type: 'social', label: 'linkedin.com/in/johnsmith', data: { platform: 'LinkedIn', connections: 487 } },
    { id: 'person-1', type: 'person', label: 'John David Smith', data: { age: 34, gender: 'Male' } },
    { id: 'location-1', type: 'location', label: 'San Francisco, CA', data: { type: 'current', confidence: 0.92 } },
    { id: 'location-2', type: 'location', label: 'Austin, TX', data: { type: 'previous', confidence: 0.78 } },
    { id: 'credential-1', type: 'credential', label: 'Breach: LinkedIn 2021', data: { breach: 'LinkedIn', date: '2021-06-22' } },
    { id: 'credential-2', type: 'credential', label: 'Breach: Dropbox 2016', data: { breach: 'Dropbox', date: '2016-08-31' } },
    { id: 'image-1', type: 'image', label: 'Profile Photo', data: { confidence: 0.94, source: 'Instagram' } },
  );

  return nodes;
};

export const generateMockEdges = (): GraphEdge[] => [
  { id: 'e1', source: 'seed-0', target: 'email-1', label: 'PROCESSED_TO', type: 'derived' },
  { id: 'e2', source: 'seed-0', target: 'email-2', label: 'VALIDATED', type: 'derived' },
  { id: 'e3', source: 'email-1', target: 'person-1', label: 'REGISTERED_TO', type: 'relation' },
  { id: 'e4', source: 'email-1', target: 'social-1', label: 'LINKED_TO', type: 'relation' },
  { id: 'e5', source: 'email-1', target: 'credential-1', label: 'COMPROMISED_IN', type: 'warning' },
  { id: 'e6', source: 'phone-1', target: 'person-1', label: 'OWNED_BY', type: 'relation' },
  { id: 'e7', source: 'social-1', target: 'image-1', label: 'HAS_IMAGE', type: 'relation' },
  { id: 'e8', source: 'social-1', target: 'location-1', label: 'LOCATED_AT', type: 'relation' },
  { id: 'e9', source: 'person-1', target: 'location-1', label: 'RESIDES_IN', type: 'primary' },
  { id: 'e10', source: 'person-1', target: 'location-2', label: 'PREVIOUS_RESIDENCE', type: 'secondary' },
  { id: 'e11', source: 'social-2', target: 'person-1', label: 'ACCOUNT_OF', type: 'relation' },
  { id: 'e12', source: 'social-3', target: 'person-1', label: 'PROFILE_FOR', type: 'relation' },
  { id: 'e13', source: 'email-2', target: 'credential-2', label: 'COMPROMISED_IN', type: 'warning' },
];

export const generateMockProfile = (): TargetProfile => ({
  id: 'target-001',
  primaryName: 'John David Smith',
  aliases: ['J. Smith', 'John Smith', 'Johnny S'],
  emails: ['john.smith@gmail.com', 'jsmith@company.io', 'j.smith@outlook.com'],
  phones: ['+1 (555) 234-5678', '+1 (555) 876-5432'],
  socialProfiles: [
    { platform: 'Instagram', username: 'johnsmith_official', url: 'https://instagram.com/johnsmith_official', followers: 12500, lastActive: '2024-01-15' },
    { platform: 'Twitter', username: 'johndsmith', url: 'https://twitter.com/johndsmith', followers: 3400, lastActive: '2024-01-18' },
    { platform: 'LinkedIn', username: 'johnsmith', url: 'https://linkedin.com/in/johnsmith', connections: 487 },
    { platform: 'Facebook', username: 'john.smith.52', url: 'https://facebook.com/john.smith.52', friends: 834 },
  ],
  locations: [
    { city: 'San Francisco', country: 'USA', coordinates: { lat: 37.7749, lng: -122.4194 }, type: 'current', confidence: 0.92 },
    { city: 'Austin', country: 'USA', coordinates: { lat: 30.2672, lng: -97.7431 }, type: 'previous', confidence: 0.78 },
    { city: 'Seattle', country: 'USA', coordinates: { lat: 47.6062, lng: -122.3321 }, type: 'work', confidence: 0.65 },
  ],
  credentials: [
    { email: 'john.smith@gmail.com', password: '*******', breach: 'LinkedIn 2021', date: '2021-06-22' },
    { email: 'jsmith@company.io', password: '*******', breach: 'Dropbox 2016', date: '2016-08-31' },
  ],
  images: [
    { url: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150', source: 'Instagram', confidence: 0.94, isPrimary: true },
    { url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150', source: 'LinkedIn', confidence: 0.91 },
  ],
  demographics: {
    age: 34,
    gender: 'Male',
    nationality: 'American',
    occupation: 'Software Engineer',
    education: 'BS Computer Science, Stanford University',
  },
});

export const generateId = (): string => Math.random().toString(36).substring(2, 11);
