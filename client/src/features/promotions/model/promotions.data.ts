export type PromotionItem = {
  id: number;
  masterId: number;
  categoryId: number;
  title: string;
  comment: string;
  image: string;
  expiresAt: string;
  masterName: string;
  serviceTitle: string;
  services: import("@/shared/types").ServiziType[];
};
