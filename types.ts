
export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  status: 'pending' | 'completed';
  timestamp: number;
  customer: {
    name: string;
    email: string;
  };
}

export type ImageSize = '1K' | '2K' | '4K';

export enum AppView {
  STOREFRONT = 'STOREFRONT',
  CHECKOUT = 'CHECKOUT',
  ORDERS = 'ORDERS',
  WISHLIST = 'WISHLIST',
  DESIGN_STUDIO = 'DESIGN_STUDIO'
}
