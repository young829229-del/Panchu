import { Product } from '../types';

export const APPROVED_MALE_BANNER_URL = 'https://i.ibb.co/XrZGLnvw/snaptik-app-7637482582606826773-slide-2.jpg';
export const APPROVED_FEMALE_BANNER_URL = 'https://i.ibb.co/7dNkX1C3/IMG-20260820-WA0001.jpg';

export const HERO_MALE_IMAGE = APPROVED_MALE_BANNER_URL;
export const HERO_FEMALE_IMAGE = APPROVED_FEMALE_BANNER_URL;
export const HERO_IMAGE = HERO_MALE_IMAGE;

// DIRECT HIGH-RESOLUTION CDN IMAGE MAPPINGS (Exact direct full-res images from ImgBB)
const IMG = {
  // Best Selling Main Product
  BEST_SELLING_1: 'https://i.ibb.co/pvDTJ7j4/snaptik-app-7647506153697447189-slide-1.jpg',
  BEST_SELLING_2: 'https://i.ibb.co/fVHmF4k2/snaptik-app-7647506153697447189-slide-2.jpg',
  BEST_SELLING_3: 'https://i.ibb.co/Z6q25HK6/snaptik-app-7647506153697447189-slide-3.jpg',
  BEST_SELLING_4: 'https://i.ibb.co/Sw5ntLWJ/snaptik-app-7647506153697447189-slide-4.jpg',

  // Xoxo Tee (Girl)
  XOXO_GIRL_1: 'https://i.ibb.co/7dPX4nfH/IMG-20260809-WA0007.jpg',
  XOXO_GIRL_2: 'https://i.ibb.co/0pxmh97j/IMG-20260809-WA0006.jpg',
  XOXO_GIRL_3: 'https://i.ibb.co/v4v3fzJz/snaptik-app-7654066108114259221-slide-1.jpg',
  XOXO_GIRL_4: 'https://i.ibb.co/hFP1TN1x/snaptik-app-7654066108114259221-slide-4.jpg',

  // Lilly Tee (Girl)
  LILLY_GIRL_1: 'https://i.ibb.co/b03c8N3/snaptik-app-7660774579245518100-slide-1.jpg',
  LILLY_GIRL_2: 'https://i.ibb.co/ynWYxV8w/IMG-20260809-151038-271-2.jpg',

  // Lilly Tee (Male)
  LILLY_MALE_1: 'https://i.ibb.co/93Gqfw13/IMG-20260809-150609-255.webp',
  LILLY_MALE_2: 'https://i.ibb.co/8nq8JcYZ/IMG-20260809-151218-537-2.jpg',
  LILLY_MALE_3: 'https://i.ibb.co/xqvy3HM9/IMG-20260809-150555-280.webp',
  LILLY_MALE_4: 'https://i.ibb.co/7wPjjG2/IMG-20260809-150600-806.webp',

  // Flora Tee (Female)
  FLORA_1: 'https://i.ibb.co/p6fz4QXN/snaptik-app-7584442845491203348-slide-2.jpg',
  FLORA_2: 'https://i.ibb.co/p6fz4QXN/snaptik-app-7584442845491203348-slide-2.jpg',
  FLORA_INSIDE: 'https://i.ibb.co/NdtPJsjY/Screenshot-20260809-211347-Photos.jpg',

  // Panchu Hood
  PANCHU_HOOD_1: 'https://i.ibb.co/rRgG3XkC/snaptik-app-7584442845491203348-slide-3.jpg',
  PANCHU_HOOD_2: 'https://i.ibb.co/63NqL7D/snaptik-app-7584442845491203348-slide-1.jpg',

  // Match Partner
  PARTNER_1: 'https://i.ibb.co/NdtPJsjY/Screenshot-20260809-211347-Photos.jpg',
  PARTNER_2: 'https://i.ibb.co/F4pp5xpg/IMG-20260809-150613-053.webp',
  PARTNER_3: 'https://i.ibb.co/tTv2GWVy/IMG-20260809-150427-604.webp',
  PARTNER_4: 'https://i.ibb.co/63NqL7D/snaptik-app-7584442845491203348-slide-1.jpg'
};

// 1. BEST SELLING — MAIN PRODUCT
export const BEST_SELLING_MAIN_PRODUCT: Product = {
  id: 'bestselling-first-main-product',
  name: 'PANCHU SIGNATURE OVERSIZED TEE',
  subtitle: 'BEST SELLING',
  price: 1850,
  gender: 'male',
  description: 'PANCHU Best Selling signature edition featuring custom heavyweight craft cotton finish and signature artwork.',
  details: [
    '240 GSM Premium Organic Cotton',
    'Ribbed crewneck collar',
    'Dropped shoulder silhouette',
    'Panchu signature graphic print',
    'Custom luxury finish'
  ],
  composition: '100% Heavyweight Cotton',
  color: 'Cream / Multi',
  image: IMG.BEST_SELLING_1,
  additionalImages: [
    IMG.BEST_SELLING_1,
    IMG.BEST_SELLING_2,
    IMG.BEST_SELLING_3,
    IMG.BEST_SELLING_4
  ],
  sizes: ['S', 'M', 'L', 'XL'],
  badge: 'BESTSELLER',
  inStock: true
};

// 2. XOXO TEE — GIRL
export const XOXO_TEE_GIRL: Product = {
  id: 'xoxo-tee-girl',
  name: 'XOXO TEE — GIRL',
  subtitle: 'FEMME COLLECTION',
  price: 1650,
  gender: 'female',
  description: 'PANCHU Xoxo edition graphic crop tee featuring fitted organic cotton weave and signature print.',
  details: [
    'Fitted modern silhouette',
    'Ribbed crewneck collar',
    'Xoxo Panchu graphic print',
    'Soft-touch organic cotton'
  ],
  composition: '95% Cotton, 5% Elastane',
  color: 'Cream / Multi',
  image: IMG.XOXO_GIRL_1,
  additionalImages: [
    IMG.XOXO_GIRL_1,
    IMG.XOXO_GIRL_2,
    IMG.XOXO_GIRL_3,
    IMG.XOXO_GIRL_4
  ],
  sizes: ['XS', 'S', 'M', 'L'],
  badge: 'XOXO TEE',
  inStock: true
};

// 3. LILLY TEE — GIRL (FEMALE)
export const LILLY_TEE_GIRL: Product = {
  id: 'lilly-tee-girl',
  name: 'LILLY TEE — GIRL',
  subtitle: 'LILLY FEMME',
  price: 1750,
  gender: 'female',
  description: 'PANCHU Lilly Girl special edition top crafted with premium soft combed cotton and artistic front graphic.',
  details: [
    'Lilly Girl graphic artwork',
    'Fitted luxury cut',
    'Pre-shrunk vintage wash',
    'Breathable organic weave'
  ],
  composition: '100% Combed Cotton',
  color: 'White / Graphic',
  image: IMG.LILLY_GIRL_1,
  additionalImages: [
    IMG.LILLY_GIRL_1,
    IMG.LILLY_GIRL_2
  ],
  sizes: ['XS', 'S', 'M', 'L'],
  badge: 'LILLY GIRL',
  inStock: true
};

// 4. LILLY TEE — MALE
export const LILLY_TEE_MALE: Product = {
  id: 'lilly-tee-male',
  name: 'LILLY TEE — MALE',
  subtitle: 'LILLY HOMME',
  price: 1950,
  gender: 'male',
  description: 'PANCHU Lilly Male special edition oversized graphic tee with heavy weight premium cotton.',
  details: [
    'Lilly Male graphic artwork',
    '240 GSM Heavy Cotton',
    'Streetwear oversized fit',
    'Pre-shrunk finish'
  ],
  composition: '100% Premium Cotton',
  color: 'Cream / Graphic',
  image: IMG.LILLY_MALE_1,
  additionalImages: [
    IMG.LILLY_MALE_1,
    IMG.LILLY_MALE_2,
    IMG.LILLY_MALE_3,
    IMG.LILLY_MALE_4
  ],
  sizes: ['S', 'M', 'L', 'XL'],
  badge: 'LILLY MALE',
  inStock: true
};

// 5. FLORA TEE (FEMALE SUMMER COLLECTION)
export const FLORA_TEE_PRODUCT: Product = {
  id: 'flora-tee-product',
  name: 'Flora Tee',
  subtitle: 'SUMMER COLLECTION',
  price: 1850,
  gender: 'female',
  description: 'PANCHU Flora Tee graphic top featuring organic cotton weave and signature front artwork.',
  details: [
    'Flora artwork print',
    'Soft organic cotton',
    'Relaxed silhouette',
    'Durable double-stitched hem'
  ],
  composition: '100% Organic Cotton',
  color: 'Sand / Multi',
  image: IMG.FLORA_1,
  additionalImages: [
    IMG.FLORA_1,
    IMG.FLORA_INSIDE
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  badge: 'FLORA TEE',
  inStock: true
};

// 6. PANCHU HOOD — MALE (WINTER COLLECTION)
export const PANCHU_HOOD_1: Product = {
  id: 'panchu-hood-1',
  name: 'Panchu Hood',
  subtitle: 'WINTER COLLECTION',
  price: 2450,
  gender: 'male',
  description: 'PANCHU Winter Edition Panchu Hood sweatshirt built with heavy fleece cotton lining.',
  details: [
    '380 GSM Heavyweight Fleece',
    'Ribbed cuffs and hem',
    'Double-lined hood',
    'Panchu front logo emblem'
  ],
  composition: '80% Cotton, 20% Polyester',
  color: 'Black / Graphic',
  image: IMG.PANCHU_HOOD_1,
  additionalImages: [
    IMG.PANCHU_HOOD_1,
    IMG.PANCHU_HOOD_2
  ],
  sizes: ['S', 'M', 'L', 'XL'],
  badge: 'WINTER HOOD',
  inStock: true
};

// 7. PANCHU HOOD — FEMALE (WINTER COLLECTION)
export const PANCHU_HOOD_2: Product = {
  id: 'panchu-hood-2',
  name: 'Panchu Hood',
  subtitle: 'WINTER COLLECTION',
  price: 2450,
  gender: 'female',
  description: 'PANCHU Winter Edition Panchu Hood sweatshirt crafted with ultra-soft fleece.',
  details: [
    '380 GSM Heavyweight Fleece',
    'Ribbed cuffs and hem',
    'Double-lined hood',
    'Panchu emblem'
  ],
  composition: '80% Cotton, 20% Polyester',
  color: 'Cream / Graphic',
  image: IMG.PANCHU_HOOD_2,
  additionalImages: [
    IMG.PANCHU_HOOD_2,
    IMG.PANCHU_HOOD_1
  ],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  badge: 'WINTER HOOD',
  inStock: true
};

// MATCH PARTNER PRODUCTS
export const MATCH_PARTNER_GRID_1: Product = {
  id: 'match-partner-grid-1',
  name: 'PANCHU PARTNER FIT I',
  subtitle: 'MATCH WITH YOUR PARTNER',
  price: 2850,
  gender: 'female',
  description: 'PANCHU Couple Matching Set - Edition I.',
  details: ['Couple matching design', 'Premium organic cotton'],
  composition: '100% Organic Cotton',
  color: 'Multi',
  image: IMG.PARTNER_1,
  additionalImages: [IMG.PARTNER_1],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  badge: 'PARTNER MATCH',
  inStock: true
};

export const MATCH_PARTNER_GRID_2: Product = {
  id: 'match-partner-grid-2',
  name: 'PANCHU PARTNER FIT II',
  subtitle: 'MATCH WITH YOUR PARTNER',
  price: 2850,
  gender: 'male',
  description: 'PANCHU Couple Matching Set - Edition II.',
  details: ['Couple matching design', 'Premium organic cotton'],
  composition: '100% Organic Cotton',
  color: 'Multi',
  image: IMG.PARTNER_2,
  additionalImages: [IMG.PARTNER_2],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  badge: 'PARTNER MATCH',
  inStock: true
};

export const MATCH_PARTNER_GRID_3: Product = {
  id: 'match-partner-grid-3',
  name: 'PANCHU PARTNER FIT III',
  subtitle: 'MATCH WITH YOUR PARTNER',
  price: 2850,
  gender: 'female',
  description: 'PANCHU Couple Matching Set - Edition III.',
  details: ['Couple matching design', 'Premium organic cotton'],
  composition: '100% Organic Cotton',
  color: 'Multi',
  image: IMG.PARTNER_3,
  additionalImages: [IMG.PARTNER_3],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  badge: 'PARTNER MATCH',
  inStock: true
};

export const MATCH_PARTNER_GRID_4: Product = {
  id: 'match-partner-grid-4',
  name: 'PANCHU PARTNER FIT IV',
  subtitle: 'MATCH WITH YOUR PARTNER',
  price: 2850,
  gender: 'male',
  description: 'PANCHU Couple Matching Set - Edition IV.',
  details: ['Couple matching design', 'Premium organic cotton'],
  composition: '100% Organic Cotton',
  color: 'Multi',
  image: IMG.PARTNER_4,
  additionalImages: [IMG.PARTNER_4],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  badge: 'PARTNER MATCH',
  inStock: true
};

export const FEMALE_PRODUCTS: Product[] = [
  XOXO_TEE_GIRL,
  LILLY_TEE_GIRL,
  FLORA_TEE_PRODUCT,
  PANCHU_HOOD_2,
  MATCH_PARTNER_GRID_1,
  MATCH_PARTNER_GRID_3
];

export const MALE_PRODUCTS: Product[] = [
  BEST_SELLING_MAIN_PRODUCT,
  LILLY_TEE_MALE,
  PANCHU_HOOD_1,
  MATCH_PARTNER_GRID_2,
  MATCH_PARTNER_GRID_4
];

export const ALL_PRODUCTS: Product[] = [
  BEST_SELLING_MAIN_PRODUCT,
  XOXO_TEE_GIRL,
  LILLY_TEE_GIRL,
  LILLY_TEE_MALE,
  FLORA_TEE_PRODUCT,
  PANCHU_HOOD_1,
  PANCHU_HOOD_2,
  MATCH_PARTNER_GRID_1,
  MATCH_PARTNER_GRID_2,
  MATCH_PARTNER_GRID_3,
  MATCH_PARTNER_GRID_4
];

export const PRODUCTS = ALL_PRODUCTS;

export const getProductsByGender = (gender: 'male' | 'female'): Product[] => {
  return gender === 'female' ? FEMALE_PRODUCTS : MALE_PRODUCTS;
};

// BEST SELLING COLLECTION
export const getBestSellingProducts = (gender: 'male' | 'female'): Product[] => {
  if (gender === 'female') {
    return [
      XOXO_TEE_GIRL,
      LILLY_TEE_GIRL,
      FLORA_TEE_PRODUCT,
      BEST_SELLING_MAIN_PRODUCT
    ];
  }
  return [
    BEST_SELLING_MAIN_PRODUCT,
    LILLY_TEE_MALE,
    PANCHU_HOOD_1
  ];
};

// SUMMER COLLECTION
export const getSummerCollection = (gender: 'male' | 'female'): Product[] => {
  if (gender === 'female') {
    return [
      LILLY_TEE_GIRL,
      FLORA_TEE_PRODUCT
    ];
  }
  return [
    LILLY_TEE_MALE,
    FLORA_TEE_PRODUCT
  ];
};

// WINTER COLLECTION
export const getWinterCollection = (gender: 'male' | 'female'): Product[] => {
  if (gender === 'female') {
    return [
      PANCHU_HOOD_2
    ];
  }
  return [
    PANCHU_HOOD_1
  ];
};

export interface PartnerPair {
  id: string;
  title: string;
  price: number;
  image: string;
  label: string;
  isCoupleImage?: boolean;
  productRef: Product;
}

// MATCH WITH YOUR PARTNER (Shown on BOTH Female and Male pages)
export const getMatchPartnerItems = (_gender: 'male' | 'female'): PartnerPair[] => {
  return [
    {
      id: 'partner-grid-1',
      title: 'PANCHU PARTNER FIT I',
      price: 2850,
      image: IMG.PARTNER_1,
      label: 'PARTNER MATCH 1',
      productRef: MATCH_PARTNER_GRID_1
    },
    {
      id: 'partner-grid-2',
      title: 'PANCHU PARTNER FIT II',
      price: 2850,
      image: IMG.PARTNER_2,
      label: 'PARTNER MATCH 2',
      productRef: MATCH_PARTNER_GRID_2
    },
    {
      id: 'partner-grid-3',
      title: 'PANCHU PARTNER FIT III',
      price: 2850,
      image: IMG.PARTNER_3,
      label: 'PARTNER MATCH 3',
      productRef: MATCH_PARTNER_GRID_3
    },
    {
      id: 'partner-grid-4',
      title: 'PANCHU HOOD',
      price: 2450,
      image: IMG.PARTNER_4,
      label: 'PARTNER MATCH 4',
      productRef: MATCH_PARTNER_GRID_4
    }
  ];
};

export const BEST_SELLING_PRODUCTS = getBestSellingProducts('male');
export const SUMMER_COLLECTION = getSummerCollection('male');
export const WINTER_COLLECTION = getWinterCollection('male');
export const MATCH_PARTNER_ITEMS = getMatchPartnerItems('male');
