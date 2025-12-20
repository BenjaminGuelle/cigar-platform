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