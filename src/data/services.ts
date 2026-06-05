import { Slide, Ticket } from '../types';

// Live music videos that rotate every 20 minutes
export const liveMusicVideos = [
  'jfKfPfyJRdk', // Live music video 1
  '36YnV9STBqc', // Live music video 2
  'obJbLSDsBAY', // Live music video 3
  'kxW-HJNjs8w'  // Live music video 4
];

// Dynamic music selection system - rotates every 20 minutes
export const getCurrentMusicSelection = () => {
  const now = new Date().getTime();
  const lastUpdate = localStorage.getItem('musicLastUpdate');
  const currentVideoIndex = parseInt(localStorage.getItem('currentVideoIndex') || '0');

  // Check if 20 minutes (1200000 ms) have passed
  const shouldUpdate = !lastUpdate || (now - parseInt(lastUpdate)) > 1200000;

  let activeIndex = currentVideoIndex;

  if (shouldUpdate) {
    // Rotate to next video
    activeIndex = (currentVideoIndex + 1) % liveMusicVideos.length;

    // Update localStorage
    localStorage.setItem('currentVideoIndex', activeIndex.toString());
    localStorage.setItem('musicLastUpdate', now.toString());
  }

  return {
    title: 'MÚSICA EN VIVO',
    videoId: liveMusicVideos[activeIndex],
    note: 'Disfruta música en vivo mientras esperas.'
  };
};


export const slides: Slide[] = [
  {
    type: 'service',
    title: 'SERVICIO DE LAVADO',
    services: [
      { name: 'Básico', max: '6 Prendas Aprox', maxDescription: 'Lavado express 20 min aprox', price: '$40' },
      { name: 'Medio', max: 'Chica', maxDescription: 'Nivel de Agua Medio', price: '$50' },
      { name: 'Carga Alta', max: 'Media', maxDescription: 'Nivel de Agua Completo', price: '$70' },
      { name: 'Colchas Grandes', max: 'Variable', price: '$100' },
    ],
    note: 'Precios no incluyen producto.',
    note2: 'opcionales: Ensueño Max • Vanish • Ariel • Persil • Foca • Member’s Mark • Cloro',

  },
  {
    type: 'service',
    title: 'SERVICIO DE SECADO',
    services: [
      { name: '30 min', max: '6 prendas', price: '$60' },
      { name: '40 min', max: 'Tina Media', price: '$70' },
      { name: '50 min', max: 'Tina Completa', price: '$80' },
      { name: 'Colchas Grandes', max: 'Variable', price: '$100' },
    ],
  },
  {
    type: 'video',
    ...getCurrentMusicSelection()
  },
  {
    type: 'service',
    title: 'SERVICIO COMPLETO',
    services: [
      { name: 'Básico', max: '6 Prendas Aprox', maxDescription: 'Lavado express 20 min aprox', price: '$160' },
      { name: 'Medio', max: 'Chica', maxDescription: 'Nivel de Agua Medio', price: '$180' },
      { name: 'Carga Alta', max: 'Media', maxDescription: 'Nivel de Agua Completo', price: '$210' },
      { name: 'Colchas Grandes', max: 'Variable', price: '$260' },
    ],
    note: '<strong>Incluye:</strong> Lavado + Secado + Doblado + Jabón y Suavitel<br>🕒 Entrega: 3 horas',
  },
];

export const extras = 'Ensueño Max • Vanish • Ariel • Persil • Foca • Member\'s Mark • Cloro';

export const contactInfo = {
  phone: '+52 6626513670',
  email: 'info@gmolavanderia.com',
  address: 'Blvd. Musaro 1 B, Nuevo Hermosillo, 83296 Hermosillo, Son.',
};

export const businessHours = [
  { day: 'Lunes - Viernes', hours: '9:00 AM - 01:00 PM - 04:00 PM - 8:00 PM' },
  { day: 'Sábado', hours: '9:00 AM - 5:00 PM' },
  { day: 'Domingo', hours: 'Cerrado' },
];

export const socialLinks = [
  { name: 'Facebook', url: 'https://facebook.com/gmolavanderia', icon: 'Facebook' },
  { name: 'Instagram', url: 'https://instagram.com/gmolavanderia', icon: 'Instagram' },
  { name: 'WhatsApp', url: 'https://wa.me/525512345678', icon: 'MessageCircle' },
];

export const sampleTicket: Ticket = {
  id: 'TKT-2024-0001',
  createdAt: new Date().toISOString(),
  items: [
    { category: 'Lavado', serviceName: 'Carga Alta', basket: 'Media', price: 70 },
    { category: 'Secado', serviceName: '40 min', basket: 'Tina Media', price: 70 },
    { category: 'Servicio Completo', serviceName: 'Básico', basket: '6 Prendas Aprox', price: 160 },
  ],
  note: 'Incluye: Lavado + Secado + Doblado + Jabón y Suavitel',
};
