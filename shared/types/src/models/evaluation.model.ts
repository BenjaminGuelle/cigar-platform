/**
 * Evaluation model - represents a cigar evaluation
 * Matches Prisma Evaluation model
 * @see prisma/schema.prisma
 */
export interface EvaluationModel {
  id: string;
  userId: string;
  cigarId: string;
  eventId: string | null;
  rating: number;
  photoUrl: string | null;
  date: Date;
  duration: number | null;
  comment: string | null;
  createdAt: Date;

  // Présentation
  capeAspects: string[];
  capeColor: string | null;
  touch: string | null;

  // Tirage à cru
  coldTastes: string[];
  coldAromas: string[];
  coldNotes: string | null;

  // 1er tiers
  firstTastes: string[];
  firstAromas: string[];
  firstStrength: number | null;
  firstNotes: string | null;

  // 2e tiers
  secondTastes: string[];
  secondAromas: string[];
  secondStrength: number | null;
  secondNotes: string | null;

  // 3e tiers
  thirdTastes: string[];
  thirdAromas: string[];
  thirdStrength: number | null;
  thirdNotes: string | null;

  // Bilan global
  startImpressions: string[];
  finalImpressions: string[];
  persistence: string | null;
  draw: string | null;
  terroir: string | null;
  balance: string | null;
  moment: string | null;
  ashNature: string | null;
  situation: string | null;
}
