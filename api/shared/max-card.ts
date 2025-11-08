export interface MaxCard {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  text: string;
  status: string;
  date: string;
  link?: string;
  image?: string; // base64 строка изображения
}

export type MaxCardInput = Omit<MaxCard, 'id' | 'date'>;
export type MaxCardCreatePayload = MaxCardInput;
