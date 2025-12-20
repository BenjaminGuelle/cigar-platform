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