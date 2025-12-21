export interface EvaluationModel {
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
