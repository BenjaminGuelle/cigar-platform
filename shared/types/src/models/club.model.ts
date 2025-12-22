/**
 * Club model - represents a club in the system
 * Matches Prisma Club model
 * @see prisma/schema.prisma
 */
export interface ClubModel {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdBy: string;
  createdAt: Date;
}
