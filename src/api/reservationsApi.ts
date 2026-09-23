import { post } from './client';
import { COMPANY_ID } from './rewards';

export type ServiceType = 'lavado' | 'secado';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Reservation {
  reservationId: number;
  companyId: number;
  clientName: string;
  phone: string;
  email?: string;
  serviceType: ServiceType;
  serviceDetail?: string;
  reservationDate: string;
  timeSlot: string;
  notes?: string;
  status: ReservationStatus;
  confirmedByUserId?: number;
  confirmedAt?: string;
  created_At: string;
}

function rows(data: any): Reservation[] {
  return data?.result?.[0]?.reservations ?? [];
}

export async function createReservation(params: {
  clientName: string;
  phone: string;
  email?: string;
  serviceType: ServiceType;
  serviceDetail?: string;
  reservationDate: string;
  timeSlot: string;
  notes?: string;
}): Promise<{ reservation?: Reservation; error?: string; message?: string }> {
  const data: any = await post('/reservations', {
    reservations: [{ action: 1, companyId: COMPANY_ID, ...params }],
  });
  const error = data?.error;
  if (error) return { error, message: data.message };
  const list = rows(data);
  return { reservation: list[0] };
}

export async function listReservations(filters?: {
  date?: string;
  status?: ReservationStatus;
}): Promise<Reservation[]> {
  const data: any = await post('/reservations', {
    reservations: [{ action: 0, companyId: COMPANY_ID, ...filters }],
  });
  return rows(data);
}

export async function getPOSQueue(): Promise<Reservation[]> {
  const data: any = await post('/reservations', {
    reservations: [{ action: 5, companyId: COMPANY_ID }],
  });
  return rows(data);
}
