export interface Club {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  createdBy: string;
  createdAt: Date;
}