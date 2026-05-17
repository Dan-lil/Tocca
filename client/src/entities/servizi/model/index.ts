export type Servizi = {
      id: number;
      masterId: number,
      title: string,
      description: string,
      price: number,
      duration: number,
      categoryId: number,
      isActive: boolean,
    }

  export type CreateServizi = {
  title: string;
  description: string;
  price: number;
  duration: number;
  categoryId: number;
};

export type UpdateServiziDto = Partial<CreateServizi> & {
  id: number;
};