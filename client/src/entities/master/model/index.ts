import { Servizi } from "@/entities/servizi/model/index";

export type PortfolioItem = {
  id: string;
  imageUrl: string;
  title: string;
}

export type MasterStats = {
  totalBookings: number;    
  rating: number;         
  activeServices: number;   
  portfolioCount: number;
}

export type MasterEarnings = {
  total: number;
}

// для добавления фото
export type CreatePortfolio = {
  imageUrl?: string;
  imageFile?: {
    name: string;
    type: string;
    data: string;
  };
  title: string;
}

// Запись к мастеру (для отображения в списке)
export type BookingToMaster = {
  id: string;
  date: string;
  startTime: number;
  client: {
    name: string;
    phone: string;
  };
  service: Servizi;
  totalPrice: number;
}

export type MasterState = {
  stats: MasterStats | null;
  earnings: MasterEarnings | null;
  services: Servizi[];
  portfolio: PortfolioItem[];
  upcomingBookings: BookingToMaster[];
  loading: boolean;
  error: string | null;
}
