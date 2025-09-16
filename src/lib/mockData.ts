
import type { Farmer, Product, Order } from '@/types';

// Augment the global scope to declare our global variables for HMR persistence in dev
declare global {
  // eslint-disable-next-line no-var
  var __mockFarmersFarmConnect__: Farmer[] | undefined;
  // eslint-disable-next-line no-var
  var __mockProductsFarmConnect__: Product[] | undefined;
  // eslint-disable-next-line no-var
  var __mockOrdersFarmConnect__: Order[] | undefined;
}

let farmersStore: Farmer[];
let productsStore: Product[];
let ordersStore: Order[];

const initialFarmersData: Farmer[] = [
  {
    id: 'farmer1',
    name: 'Green Acres Farm',
    location: 'Willow Creek, CA',
    phoneNumber: '555-0101',
    profilePictureUrl: 'https://placehold.co/100x100.png" data-ai-hint="farmer portrait',
    bio: 'We specialize in organic vegetables and free-range eggs. Committed to sustainable farming practices.'
  },
  {
    id: 'farmer2',
    name: 'Sunny Orchard',
    location: 'Sunshine Valley, FL',
    phoneNumber: '555-0102',
    profilePictureUrl: 'https://placehold.co/100x100.png" data-ai-hint="farmer portrait',
    bio: 'Fresh, juicy fruits picked daily from our sun-kissed orchards. Taste the difference!'
  },
  {
    id: 'farmer3',
    name: 'Golden Grain Fields',
    location: 'Harvest Plains, KS',
    phoneNumber: '555-0103',
    profilePictureUrl: 'https://placehold.co/100x100.png" data-ai-hint="farmer portrait',
    bio: 'High-quality grains including wheat, corn, and barley. Perfect for baking or animal feed.'
  },
];

if (process.env.NODE_ENV === 'production') {
  // In production, always initialize with fresh data
  farmersStore = initialFarmersData;
  productsStore = []; 
  ordersStore = [];
} else {
  // In development, try to reuse data from globalThis to survive HMR
  if (!globalThis.__mockFarmersFarmConnect__) {
    globalThis.__mockFarmersFarmConnect__ = initialFarmersData;
  }
  if (!globalThis.__mockProductsFarmConnect__) {
    globalThis.__mockProductsFarmConnect__ = []; 
  }
  if (!globalThis.__mockOrdersFarmConnect__) {
    globalThis.__mockOrdersFarmConnect__ = [];
  }
  farmersStore = globalThis.__mockFarmersFarmConnect__;
  productsStore = globalThis.__mockProductsFarmConnect__;
  ordersStore = globalThis.__mockOrdersFarmConnect__;
}

// Export references to the stored arrays
export let mockFarmers: Farmer[] = farmersStore;
export let mockProducts: Product[] = productsStore;
export let mockOrders: Order[] = ordersStore;


// Post-initialization processing
mockFarmers.forEach(farmer => {
  if (farmer.profilePictureUrl && farmer.profilePictureUrl.startsWith('https://placehold.co') && !farmer.profilePictureUrl.includes('data-ai-hint')) {
    farmer.profilePictureUrl = `${farmer.profilePictureUrl.split('?')[0]}" data-ai-hint="farmer portrait`;
  } else if (!farmer.profilePictureUrl) {
    farmer.profilePictureUrl = 'https://placehold.co/100x100.png" data-ai-hint="farmer portrait';
  }
});
