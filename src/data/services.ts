import { Slide } from '../types';

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
    title: 'TOP MÚSICA',
    videoId: 'vp2ZoXIFJfw',
    note: 'Disfruta música mientras esperas.',
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
