export type Servizi = {
      id: number;
      masterId: number,
      title: string,
      titleEn?: string | null,
      description: string,
      descriptionEn?: string | null,
      price: number,
      duration: number,
      categoryId: number,
      isActive: boolean,
    }

  export type CreateServizi = {
  title: string;
  titleEn?: string | null;
  description: string;
  descriptionEn?: string | null;
  price: number;
  duration: number;
  categoryId: number;
};

export type UpdateServiziDto = Partial<CreateServizi> & {
  id: number;
};
