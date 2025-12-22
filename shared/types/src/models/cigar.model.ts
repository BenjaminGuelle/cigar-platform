/**
 * Cigar model - represents a cigar in the system
 * Matches Prisma Cigar model
 * @see prisma/schema.prisma
 */
export interface CigarModel {
  id: string;
  brand: string;
  name: string;
  origin: string | null;
  wrapper: string | null;
  createdBy: string;
  createdAt: Date;
}
