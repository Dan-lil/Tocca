export type PromotionItem = {
  id: number;
  masterId: number;
  masterRating: number;
  categoryId: number;
  discount: number;
  title: string;
  comment: string;
  image: string;
  expiresAt: string;
  expiresAtRaw: string;
  masterName: string;
  serviceTitle: string;
  services: import("@/shared/types").ServiziType[];
};
