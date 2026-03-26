// ──────────────────────────────────────────────────────────
//  SmartLivestock – Shared TypeScript Types
// ──────────────────────────────────────────────────────────

export type Species = 'Sheep' | 'Cow' | string;
export type Gender  = 'Male' | 'Female';
export type Status  = 'ACTIVE' | 'SOLD' | 'DECEASED' | 'QUARANTINE';

export interface Livestock {
  id:                number;
  species:           Species;
  tagNumber:         string;
  gender:            Gender;
  birthDate:         string | null;
  pregnancyDate:     string | null;
  expectedBirthDate: string | null;
  status:            Status;
  isDraft:           boolean;
  parentId:          number | null;
  age:               string | null;
}

export interface LivestockDTO {
  species:       Species;
  tagNumber:     string;
  gender:        Gender;
  birthDate:     string | null;
  pregnancyDate: string | null;
  status:        Status;
  isDraft:       boolean;
}

export interface StatsDTO {
  totalAnimals:  number;
  pregnant:      number;
  drafts:        number;
  males:         number;
  females:       number;
  activeAnimals: number;
  avgAgeMonths:  number;
}

export type SortField = keyof Livestock;
export type SortDir   = 'asc' | 'desc';

// Auth
export interface RegisterRequest { fullName: string; email: string; password: string; }
export interface LoginRequest    { email: string; password: string; }
export interface AuthResponse    { token: string; email: string; fullName: string; role: string; }

// Groups
export interface AnimalGroup    { id: number; name: string; description: string | null; animals: Livestock[]; }
export interface AnimalGroupDTO { name: string; description: string | null; animalIds: number[]; }

// Notifications
export interface Notification {
  id:          number;
  message:     string;
  type:        'BIRTH' | 'PREGNANCY_REMINDER' | 'SYSTEM';
  livestockId: number | null;
  tagNumber:   string | null;
  createdAt:   string;
  isRead:      boolean;
}
