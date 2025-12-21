export interface EventModel {
  id: string;
  clubId: string;
  cigarId?: string;
  name: string;
  description?: string;
  date: Date;
  createdBy: string;
  createdAt: Date;
}
