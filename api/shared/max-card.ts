export interface MaxCard {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  text: string;
  status: string;
  date: string;
  link?: string;
  image?: string; 
  user_id?: number;
  view_count?: number; // Общее количество просмотров карточки всеми пользователями
}

export type MaxCardInput = Omit<MaxCard, 'id' | 'date'>;
export type MaxCardCreatePayload = MaxCardInput;
