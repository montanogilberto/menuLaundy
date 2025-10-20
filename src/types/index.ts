export interface Service {
  name: string;
  max: string;
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
