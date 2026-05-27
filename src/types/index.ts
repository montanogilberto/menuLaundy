export interface Service {
  name: string;
  max: string;
  maxDescription?: string;
  price: string;
}

export interface Slide {
  type: 'service' | 'video';
  title: string;
  services?: Service[];
  note?: string;
  videoId?: string;
  videoIds?: string[];
}

export interface TicketItem {
  category: 'Lavado' | 'Secado' | 'Servicio Completo';
  serviceName: string;
  basket: string;
  price: number;
}

export interface Ticket {
  id: string;
  createdAt: string;
  items: TicketItem[];
  note?: string;
}
