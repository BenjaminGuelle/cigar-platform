// ============================================
// ENUMS
// ============================================

export enum ClubRole {
  Admin = 'admin',
  Member = 'member',
}

// ============================================
// USER TYPES
// ============================================

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  createdAt: Date;
}

export interface CreateUserDto {
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface UpdateUserDto {
  displayName?: string;
  avatarUrl?: string;
}

// ============================================
// CLUB TYPES
// ============================================

export interface Club {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: Date;
}

// ============================================
// CLUB MEMBER TYPES
// ============================================

export interface ClubMember {
  id: string;
  clubId: string;
  userId: string;
  role: ClubRole;
  joinedAt: Date;
}

export interface AddClubMemberDto {
  userId: string;
  role?: ClubRole;
}

export interface UpdateClubMemberDto {
  role: ClubRole;
}

// ============================================
// EVENT TYPES
// ============================================

export interface Event {
  id: string;
  clubId: string;
  cigarId?: string;
  name: string;
  description?: string;
  date: Date;
  createdBy: string;
  createdAt: Date;
}

export interface CreateEventDto {
  clubId: string;
  cigarId?: string;
  name: string;
  description?: string;
  date: Date;
}

export interface UpdateEventDto {
  cigarId?: string;
  name?: string;
  description?: string;
  date?: Date;
}

// ============================================
// CIGAR TYPES
// ============================================

export interface Cigar {
  id: string;
  brand: string;
  name: string;
  origin?: string;
  wrapper?: string;
  createdBy: string;
  createdAt: Date;
}

export interface CreateCigarDto {
  brand: string;
  name: string;
  origin?: string;
  wrapper?: string;
}

export interface UpdateCigarDto {
  origin?: string;
  wrapper?: string;
}

// ============================================
// EVALUATION TYPES
// ============================================

export interface Evaluation {
  id: string;
  userId: string;
  cigarId: string;
  eventId?: string;
  rating: number;
  photoUrl?: string;
  date: Date;
  duration?: number;
  comment?: string;
  createdAt: Date;

  // Présentation
  capeAspects: string[];
  capeColor?: string;
  touch?: string;

  // Tirage à cru
  coldTastes: string[];
  coldAromas: string[];
  coldNotes?: string;

  // 1er tiers
  firstTastes: string[];
  firstAromas: string[];
  firstStrength?: number;
  firstNotes?: string;

  // 2e tiers
  secondTastes: string[];
  secondAromas: string[];
  secondStrength?: number;
  secondNotes?: string;

  // 3e tiers
  thirdTastes: string[];
  thirdAromas: string[];
  thirdStrength?: number;
  thirdNotes?: string;

  // Bilan global
  startImpressions: string[];
  finalImpressions: string[];
  persistence?: string;
  draw?: string;
  terroir?: string;
  balance?: string;
  moment?: string;
  ashNature?: string;
  situation?: string;
}

export interface CreateEvaluationDto {
  cigarId: string;
  eventId?: string;
  rating: number;
  photoUrl?: string;
  date: Date;
  duration?: number;
  comment?: string;

  // Présentation
  capeAspects: string[];
  capeColor?: string;
  touch?: string;

  // Tirage à cru
  coldTastes: string[];
  coldAromas: string[];
  coldNotes?: string;

  // 1er tiers
  firstTastes: string[];
  firstAromas: string[];
  firstStrength?: number;
  firstNotes?: string;

  // 2e tiers
  secondTastes: string[];
  secondAromas: string[];
  secondStrength?: number;
  secondNotes?: string;

  // 3e tiers
  thirdTastes: string[];
  thirdAromas: string[];
  thirdStrength?: number;
  thirdNotes?: string;

  // Bilan global
  startImpressions: string[];
  finalImpressions: string[];
  persistence?: string;
  draw?: string;
  terroir?: string;
  balance?: string;
  moment?: string;
  ashNature?: string;
  situation?: string;
}

export interface UpdateEvaluationDto {
  rating?: number;
  photoUrl?: string;
  date?: Date;
  duration?: number;
  comment?: string;

  // Présentation
  capeAspects?: string[];
  capeColor?: string;
  touch?: string;

  // Tirage à cru
  coldTastes?: string[];
  coldAromas?: string[];
  coldNotes?: string;

  // 1er tiers
  firstTastes?: string[];
  firstAromas?: string[];
  firstStrength?: number;
  firstNotes?: string;

  // 2e tiers
  secondTastes?: string[];
  secondAromas?: string[];
  secondStrength?: number;
  secondNotes?: string;

  // 3e tiers
  thirdTastes?: string[];
  thirdAromas?: string[];
  thirdStrength?: number;
  thirdNotes?: string;

  // Bilan global
  startImpressions?: string[];
  finalImpressions?: string[];
  persistence?: string;
  draw?: string;
  terroir?: string;
  balance?: string;
  moment?: string;
  ashNature?: string;
  situation?: string;
}