export interface Service {
  name: string;
  max: string;
  maxDescription?: string;
  price: string;
}

export interface RewardsTier {
  label: string;
  pointsRequired: number;
  benefit: string;
  icon: string;
}

export interface Slide {
  type: 'service' | 'video' | 'rewards';
  title: string;
  services?: Service[];
  note?: string;
  note2?: string;
  videoId?: string;
  videoIds?: string[];
  rewardsTiers?: RewardsTier[];
  rewardsNote?: string;
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
