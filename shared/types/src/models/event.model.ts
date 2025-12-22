/**
 * Event model - represents a club event
 * Matches Prisma Event model
 * @see prisma/schema.prisma
 */
export interface EventModel {
  id: string;
  clubId: string;
  cigarId: string | null;
  name: string;
  description: string | null;
  date: Date;
  createdBy: string;
  createdAt: Date;
}
