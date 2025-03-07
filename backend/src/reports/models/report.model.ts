export interface Report {
  id: string;
  userId: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreateReportDto = Omit<Report, 'id' | 'createdAt' | 'updatedAt' | 'read'> & {
  id?: string;
};

export type UpdateReportDto = Partial<Omit<Report, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>;
