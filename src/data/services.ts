import { Slide } from '../types';

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
      { name: 'Básico', max: '08 kg', price: '$40' },
      { name: 'Medio', max: '10 kg', price: '$50' },
      { name: 'Carga Alta', max: '12 kg', price: '$60' },
      { name: 'Colchas Grandes', max: '18 kg', price: '$100' },
    ],
    note: 'Precios no incluyen producto.',
  },
  {
    type: 'service',
    title: 'SERVICIO DE SECADO',
    services: [
      { name: '40 min', max: '08 kg', price: '$60' },
      { name: '50 min', max: '10 kg', price: '$65' },
      { name: '60 min', max: '12 kg', price: '$70' },
      { name: 'Colchas Grandes', max: '18 kg', price: '$100' },
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
      { name: 'Básico', max: '08 kg', price: '$160' },
      { name: 'Medio', max: '10 kg', price: '$175' },
      { name: 'Carga Alta', max: '12 kg', price: '$190' },
      { name: 'Colchas Grandes', max: '18 kg', price: '$260' },
    ],
    note: '<strong>Incluye:</strong> Lavado + Secado + Doblado + Jabón y Suavitel<br>🕒 Entrega: 3 horas',
  },
];

export const extras = 'Ensueño Max • Vanish • Ariel • Persil • Foca • Member\'s Mark • Cloro';

export const contactInfo = {
  phone: '+52 55 1234 5678',
  email: 'info@gmolavanderia.com',
  address: 'Av. Principal 123, Ciudad de México, CDMX',
};

export const businessHours = [
  { day: 'Lunes - Viernes', hours: '8:00 AM - 8:00 PM' },
  { day: 'Sábado', hours: '9:00 AM - 6:00 PM' },
  { day: 'Domingo', hours: 'Cerrado' },
];

export const socialLinks = [
  { name: 'Facebook', url: 'https://facebook.com/gmolavanderia', icon: 'Facebook' },
  { name: 'Instagram', url: 'https://instagram.com/gmolavanderia', icon: 'Instagram' },
  { name: 'WhatsApp', url: 'https://wa.me/525512345678', icon: 'MessageCircle' },
];
