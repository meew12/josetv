// Tipos compartidos del frontend
export interface Content {
  id: string;
  title: string;
  description: string;
  type: "MOVIE" | "SERIES" | "YOUTUBE" | "MP4";
  url: string;
  thumbnail: string;
  banner: string;
  logo: string;
  category: string;
  genre: string;
  year: number | null;
  duration: number | null;
  rating: number;
  ageRating: string;
  isAdult: boolean;
  featured: boolean;
  trending: boolean;
  views: number;
  trailerUrl: string | null;
  createdAt: string;
}

export interface Channel {
  id: string;
  name: string;
  url: string;
  logo: string;
  category: string;
  isAdult: boolean;
  active: boolean;
  views: number;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays: number;
  description: string;
  features: string;
  quality: string;
  screens: number;
  active: boolean;
}

export interface Series {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  banner: string;
  logo: string;
  genre: string;
  year: number | null;
  ageRating: string;
  isAdult: boolean;
  featured: boolean;
  trending: boolean;
  views: number;
  episodes?: Episode[];
}

export interface Episode {
  id: string;
  seriesId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  duration: number | null;
}

export interface Payment {
  id: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  method: string;
  mercadopagoId: string | null;
  createdAt: string;
  subscription?: { plan: { name: string } } | null;
}

export interface Setting {
  key: string;
  value: string;
}
