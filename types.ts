
export enum PaymentStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID'
}

export interface Qisst {
  id: string;
  name: string;
  startDate: string; // ISO format
  dailyAmount: number;
  totalTarget?: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  joiningDate: string; // ISO format
  qisstId: string;
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  customerId: string;
  qisstId: string;
  status: PaymentStatus;
  amountPaid: number;
}

export interface QisstDraw {
  id: string;
  qisstId: string;
  customerId: string;
  month: string; // e.g., "January 2024"
  amountGiven: number;
  dateCreated: string;
}

export interface AppData {
  qissts: Qisst[];
  customers: Customer[];
  attendance: AttendanceRecord[];
  draws: QisstDraw[];
}
