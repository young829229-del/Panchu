export interface Product {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  priceDisplay?: string;
  gender?: 'male' | 'female' | 'unisex';
  originalPrice?: number;
  description: string;
  details: string[];
  composition: string;
  color: string;
  image: string;
  additionalImages?: string[];
  sizes: string[];
  badge?: string;
  inStock: boolean;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}
