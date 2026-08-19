export interface Product {
  id: string;
  productId?: string;
  name: string;
  subtitle?: string;
  price: number;
  MRP?: number;
  originalPrice?: number;
  priceDisplay?: string;
  description: string;
  category?: string;
  collection?: string;
  gender?: 'male' | 'female' | 'unisex';
  image: string;
  images?: string[];
  additionalImages?: string[];
  sizes: string[];
  stock?: Record<string, number>; // Size-specific stock e.g. { S: 5, M: 8, L: 4, XL: 2 }
  featured?: boolean;
  bestSelling?: boolean;
  badge?: string;
  active?: boolean;
  inStock: boolean;
  details?: string[];
  composition?: string;
  color?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface CartItem {
  product: Product;
  size: string;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  image: string;
  selectedSize: string;
  quantity: number;
  price: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered';

export interface Order {
  id?: string;
  orderId: string;
  customerName: string;
  customerEmail?: string;
  userId?: string;
  phone: string;
  address: string;
  location?: string;
  deliveryOption?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  createdAt?: any;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  phone?: string;
  address?: string;
  role?: 'customer' | 'admin';
  createdAt?: any;
  updatedAt?: any;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin';
  createdAt?: any;
}
