import tshirtImg from '../assets/images/product_tshirt_paradise_1785430495718.jpg';
import shortsImg from '../assets/images/product_shorts_paradise_1785430509716.jpg';
import sneakersImg from '../assets/images/product_sneakers_arrow_1785430521825.jpg';
import toteImg from '../assets/images/product_tote_bag_1785430538736.jpg';
import femaleCampaignImg from '../assets/images/female_paradise_campaign_1786106648392.jpg';
import { Product } from '../types';

export const HERO_MALE_IMAGE = 'https://user19304.na.imgto.link/public/20260807/1000067471.avif';
export const HERO_FEMALE_IMAGE = 'https://user19304.na.imgto.link/public/20260807/1000067473.avif';
export const HERO_IMAGE = HERO_MALE_IMAGE;

const panchuTeeImg1 = 'https://user19304.na.imgto.link/public/20260807/1000067467.avif';
const panchuTeeImg2 = 'https://user19304.na.imgto.link/public/20260807/1000067466.avif';
const panchuTeeImg3 = 'https://user19304.na.imgto.link/public/20260807/1000067465.avif';

export const PRODUCTS: Product[] = [
  {
    id: 'panchu-tee',
    name: 'PANCHU',
    subtitle: '',
    price: 0,
    priceDisplay: '××',
    gender: 'male',
    description: 'PANCHU™ signature edition featuring custom artwork and premium craft finish.',
    details: [
      'Ribbed crewneck collar',
      'Dropped shoulder silhouette',
      'Panchu artistic graphic print',
      'Premium craft finish'
    ],
    composition: '',
    color: 'Cream / Multi',
    image: panchuTeeImg1,
    additionalImages: [panchuTeeImg1, panchuTeeImg2, panchuTeeImg3],
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    inStock: true
  },
  {
    id: 'panchu-female-top',
    name: 'PANCHU',
    subtitle: '',
    price: 0,
    priceDisplay: '××',
    gender: 'female',
    description: 'PANCHU™ female edition featuring signature artwork and premium craft finish.',
    details: [
      'Fitted silhouette',
      'Ribbed crewneck collar',
      'Panchu signature graphic print',
      'Premium craft finish'
    ],
    composition: '',
    color: 'Cream / Multi',
    image: 'https://user19304.na.imgto.link/public/20260807/1000067459.avif',
    additionalImages: [
      'https://user19304.na.imgto.link/public/20260807/1000067459.avif',
      'https://user19304.na.imgto.link/public/20260807/1000067460.avif'
    ],
    sizes: ['XS', 'S', 'M', 'L'],
    inStock: true
  }
];
