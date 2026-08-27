// MODO PLANTILLA - Sin base de datos
// Login: admin@josedemo.com / admin123

const mockUsers = [
  {
    id: 'admin-001',
    email: 'admin@josedemo.com',
    name: 'Administrador',
    passwordHash: 'admin123',
    role: 'ADMIN',
    avatar: null,
    banned: false,
    adultVerified: true,
    token: 'JD-ADMIN-2025',
    createdAt: new Date(),
    updatedAt: new Date(),
    subscription: null,
  },
  {
    id: 'demo-001',
    email: 'demo@josedemo.com',
    name: 'Usuario Demo',
    passwordHash: 'demo123',
    role: 'USER',
    avatar: null,
    banned: false,
    adultVerified: true,
    token: 'JD-DEMO-2025',
    createdAt: new Date(),
    updatedAt: new Date(),
    subscription: null,
  },
];

const mockContent = [
  {
    id: 'c1',
    title: 'Interestelar',
    description: 'Un grupo de exploradores viaja a través de un agujero de gusano en busca de un nuevo hogar para la humanidad.',
    type: 'MP4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    banner: 'https://image.tmdb.org/t/p/original/xJHokMbljvjADYdit5fcZEEK4Uo.jpg',
    logo: '',
    category: 'Ciencia Ficción',
    genre: 'Ciencia Ficción',
    year: 2014,
    duration: 169,
    rating: 8.7,
    ageRating: '+13',
    isAdult: false,
    featured: true,
    trending: true,
    views: 1500,
    trailerUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    episodes: [],
  },
  {
    id: 'c2',
    title: 'El Padrino',
    description: 'El patriarca de una dinastía del crimen organizado transfiere el control de su imperio clandestino a su hijo reacio.',
    type: 'MP4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnail: 'https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg',
    banner: 'https://image.tmdb.org/t/p/original/tmU7GeKVybMWFButWEGl2M4GeiP.jpg',
    logo: '',
    category: 'Drama',
    genre: 'Drama',
    year: 1972,
    duration: 175,
    rating: 9.2,
    ageRating: '+16',
    isAdult: false,
    featured: true,
    trending: true,
    views: 2000,
    trailerUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    episodes: [],
  },
  {
    id: 'c3',
    title: 'Joker',
    description: 'En Gotham City, el comediante mentalmente perturbado Arthur Fleck es ignorado y maltratado por la sociedad.',
    type: 'MP4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnail: 'https://image.tmdb.org/t/p/w500/udDclJoHjfjb8Ekgsd4FDfEzMUI.jpg',
    banner: 'https://image.tmdb.org/t/p/original/n6bUvigpRFqSwmPp1m2YADdbRBc.jpg',
    logo: '',
    category: 'Drama',
    genre: 'Drama',
    year: 2019,
    duration: 122,
    rating: 8.4,
    ageRating: '+18',
    isAdult: false,
    featured: true,
    trending: true,
    views: 1800,
    trailerUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    episodes: [],
  },
  {
    id: 'c4',
    title: 'Matrix',
    description: 'Un hacker descubre que la realidad es una simulación creada por máquinas y se une a la resistencia.',
    type: 'MP4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    thumbnail: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkJPOhBxNXvq.jpg',
    banner: 'https://image.tmdb.org/t/p/original/fNG7i7RqMErkcqhohV2a6cV1Ehy.jpg',
    logo: '',
    category: 'Ciencia Ficción',
    genre: 'Ciencia Ficción',
    year: 1999,
    duration: 136,
    rating: 8.7,
    ageRating: '+16',
    isAdult: false,
    featured: false,
    trending: true,
    views: 1700,
    trailerUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    episodes: [],
  },
  {
    id: 'c5',
    title: 'Dune',
    description: 'Paul Atreides debe viajar al planeta más peligroso del universo para asegurar el futuro de su familia.',
    type: 'MP4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    thumbnail: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyIYkgVzXaoTI3IjA.jpg',
    banner: 'https://image.tmdb.org/t/p/original/jYEW5xZkZk2IZc4uL3U2Z5Z3m5t.jpg',
    logo: '',
    category: 'Ciencia Ficción',
    genre: 'Ciencia Ficción',
    year: 2021,
    duration: 155,
    rating: 8.0,
    ageRating: '+13',
    isAdult: false,
    featured: true,
    trending: true,
    views: 1600,
    trailerUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    episodes: [],
  },
  {
    id: 'c6',
    title: 'Coco',
    description: 'Un niño que sueña con ser músico entra al Land of the Dead para encontrar a su tatarabuelo.',
    type: 'MP4',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    thumbnail: 'https://image.tmdb.org/t/p/w500/gGEsBPAijhLVUFpk7py1e9Ud6W9.jpg',
    banner: 'https://image.tmdb.org/t/p/original/eKiLGtgheRs3t5p0wKjBA2f6sM5.jpg',
    logo: '',
    category: 'Animación',
    genre: 'Animación',
    year: 2017,
    duration: 105,
    rating: 8.4,
    ageRating: 'ATP',
    isAdult: false,
    featured: false,
    trending: false,
    views: 1200,
    trailerUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    episodes: [],
  },
];

const mockChannels = [
  { id: 'ch1', name: 'ESPN Argentina', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', logo: 'https://icon.horse/icon/espn.com', category: 'Deportes', isAdult: false, epgId: null, active: true, views: 500, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ch2', name: 'TyC Sports', url: 'https://test-streams.mux.dev/test_001/stream.m3u8', logo: 'https://icon.horse/icon/tycsports.com', category: 'Deportes', isAdult: false, epgId: null, active: true, views: 450, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ch3', name: 'TN Todo Noticias', url: 'https://stream.mux.com/v69RSHhFelSm4701snP22dYz2j1y4lICRmRdVgQT8g83100.m3u8', logo: 'https://icon.horse/icon/tn.com.ar', category: 'Noticias', isAdult: false, epgId: null, active: true, views: 400, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ch4', name: 'HBO', url: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8', logo: 'https://icon.horse/icon/hbo.com', category: 'Películas', isAdult: false, epgId: null, active: true, views: 600, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ch5', name: 'Cartoon Network', url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', logo: 'https://icon.horse/icon/cartoonnetwork.com', category: 'Infantil', isAdult: false, epgId: null, active: true, views: 350, createdAt: new Date(), updatedAt: new Date() },
  { id: 'ch6', name: 'MTV', url: 'https://test-streams.mux.dev/test_001/stream.m3u8', logo: 'https://icon.horse/icon/mtv.com', category: 'Música', isAdult: false, epgId: null, active: true, views: 300, createdAt: new Date(), updatedAt: new Date() },
];

const mockPlans = [
  { id: 'p1', name: 'Básico', price: 2500, currency: 'ARS', durationDays: 30, description: 'Calidad HD, 1 pantalla', features: '["Calidad HD","1 pantalla"]', quality: 'HD', screens: 1, active: true, createdAt: new Date(), updatedAt: new Date(), subscriptions: [] },
  { id: 'p2', name: 'Estándar', price: 4500, currency: 'ARS', durationDays: 30, description: 'Calidad Full HD, 2 pantallas', features: '["Calidad Full HD","2 pantallas"]', quality: 'Full HD', screens: 2, active: true, createdAt: new Date(), updatedAt: new Date(), subscriptions: [] },
  { id: 'p3', name: 'Premium', price: 7000, currency: 'ARS', durationDays: 30, description: 'Calidad 4K, 4 pantallas', features: '["Calidad 4K","4 pantallas"]', quality: '4K', screens: 4, active: true, createdAt: new Date(), updatedAt: new Date(), subscriptions: [] },
];

const mockSettings: Record<string, string> = {
  heroTitle: 'JOSE DEMO',
  heroSubtitle: 'Stream sin límites. Películas, series y canales en vivo.',
  footerText: '© 2025 JOSE DEMO. Todos los derechos reservados.',
  announcement: '¡Bienvenido a JOSE DEMO!',
  primaryColor: '#E50914',
};

// Mock DB que simula Prisma
function createMockModel(data: any[]) {
  return {
    findUnique: async ({ where }: any) => {
      if (where.email) return data.find((d: any) => d.email === where.email) || null;
      if (where.id) return data.find((d: any) => d.id === where.id) || null;
      if (where.token) return data.find((d: any) => d.token === where.token) || null;
      if (where.key) return { key: where.key, value: mockSettings[where.key] || '' };
      return null;
    },
    findFirst: async ({ where }: any = {}) => {
      if (!where) return data[0] || null;
      let result = data;
      if (where.title) result = data.filter((d: any) => d.title === where.title);
      if (where.name) result = data.filter((d: any) => d.name === where.name);
      return result[0] || null;
    },
    findMany: async ({ where, orderBy, take, skip, include }: any = {}) => {
      let result = [...data];
      if (where) {
        if (where.type) result = result.filter((d: any) => d.type === where.type);
        if (where.category) result = result.filter((d: any) => d.category === where.category);
        if (where.featured === true) result = result.filter((d: any) => d.featured === true);
        if (where.trending === true) result = result.filter((d: any) => d.trending === true);
        if (where.isAdult === false) result = result.filter((d: any) => d.isAdult === false);
        if (where.active === true) result = result.filter((d: any) => d.active === true);
        if (where.ageRating && where.ageRating.in) result = result.filter((d: any) => where.ageRating.in.includes(d.ageRating));
        if (where.userId) result = result.filter((d: any) => d.userId === where.userId);
      }
      if (skip) result = result.slice(skip);
      if (take) result = result.slice(0, take);
      return result;
    },
    create: async ({ data: newData }: any) => {
      const item = { id: 'mock-' + Date.now(), ...newData, createdAt: new Date(), updatedAt: new Date() };
      data.push(item);
      return item;
    },
    update: async ({ where, data: updateData }: any) => {
      const idx = data.findIndex((d: any) => 
        (where.id && d.id === where.id) || 
        (where.key && d.key === where.key)
      );
      if (idx >= 0) {
        data[idx] = { ...data[idx], ...updateData };
        return data[idx];
      }
      return null;
    },
    upsert: async ({ where, create: createData, update: updateData }: any) => {
      const idx = data.findIndex((d: any) => 
        (where.email && d.email === where.email) ||
        (where.id && d.id === where.id) ||
        (where.key && d.key === where.key) ||
        (where.userId_contentId && d.userId === where.userId_contentId.userId && d.contentId === where.userId_contentId.contentId)
      );
      if (idx >= 0) {
        data[idx] = { ...data[idx], ...updateData };
        return data[idx];
      }
      const item = { id: 'mock-' + Date.now(), ...createData, createdAt: new Date(), updatedAt: new Date() };
      data.push(item);
      return item;
    },
    delete: async ({ where }: any) => {
      const idx = data.findIndex((d: any) => 
        (where.id && d.id === where.id) || 
        (where.key && d.key === where.key)
      );
      if (idx >= 0) {
        const deleted = data[idx];
        data.splice(idx, 1);
        return deleted;
      }
      return null;
    },
    deleteMany: async () => {
      const count = data.length;
      data.length = 0;
      return { count };
    },
    count: async () => data.length,
    aggregate: async () => ({ _sum: { amount: 0 } }),
    groupBy: async () => [],
  };
}

export const db = {
  user: createMockModel(mockUsers),
  content: createMockModel(mockContent),
  channel: createMockModel(mockChannels),
  plan: createMockModel(mockPlans),
  payment: createMockModel([]),
  subscription: createMockModel([]),
  watchlist: createMockModel([]),
  watchHistory: createMockModel([]),
  review: createMockModel([]),
  reaction: createMockModel([]),
  profile: createMockModel([]),
  setting: createMockModel(Object.entries(mockSettings).map(([key, value]) => ({ id: key, key, value, updatedAt: new Date() }))),
  category: createMockModel([]),
  $disconnect: async () => {},
};
