export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

export interface SingleResponse<T> {
  success: boolean;
  data: T;
}

export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
  patientCount: number;
  createdAt: string;
}

export interface Patient {
  _id: string;
  doctorId: string | { _id: string; name: string; specialization: string; hospital: string };
  name: string;
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  condition: string;
  notes?: string;
  createdAt: string;
}

export interface FilterMeta {
  specializations: string[];
  hospitals: string[];
  conditions: string[];
  doctors: { _id: string; name: string; specialization: string }[];
}
