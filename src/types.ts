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
  name?: string;
  image: string;
  productImage?: string;
  size: string;
  selectedSize?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Collected' | 'Cancelled';

export interface Order {
  id?: string;
  orderId: string;
  userId?: string | null;
  customerName: string;
  customerEmail?: string;
  phone: string;
  shippingAddress: string;
  address?: string;
  location?: string;
  deliveryOption?: string;
  items: OrderItem[];
  subtotal?: number;
  deliveryFee?: number;
  totalAmount: number;
  total?: number;
  paymentMethod: string;
  paymentScreenshotUrl?: string | null;
  orderStatus: OrderStatus;
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

export interface BannerDoc {
  id: string; // 'male' | 'female'
  gender: 'male' | 'female';
  imageUrl: string;
  storagePath?: string;
  fileName?: string;
  fileSize?: number;
  originalUrl?: string;
  title?: string;
  active?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface AdminUser {
  uid: string;
  email: string;
  role: 'admin';
  createdAt?: any;
}

export interface PaymentSettings {
  qrEnabled: boolean;
  qrImageUrl?: string | null;
  screenshotEnabled: boolean;
  paymentMethods: string[];
}
