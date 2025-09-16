
export interface Farmer {
  id: string;
  name: string; // This might be farm name or primary contact for mockFarmers
  location: string; // Retained for original mockFarmers structure, new users will use detailed address
  phoneNumber: string;
  profilePictureUrl?: string;
  bio?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Price per unit
  unit: string; // e.g., "kg", "dozen", "bundle"
  quantityAvailable: number; // Number of units available
  imageUrl: string;
  category: string; // Crop type, e.g., "Vegetable", "Fruit", "Grain", "Dairy"
  farmerId: string;
  dateListed: string; // ISO date string
}

export type UserRole = 'farmer' | 'buyer' | null;
export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say' | '';

export interface User {
  id:string;
  phoneNumber: string; // Primary identifier

  firstName?: string;
  lastName?: string;
  farmName?: string; // For farmers

  role: UserRole;
  
  gender?: Gender;
  dateOfBirth?: string; // Store as ISO string (e.g., from date picker)
  
  alternatePhoneNumber?: string;
  fullAddress?: string;
  pincode?: string;
  stateAndDistrict?: string;

  profilePictureUrl?: string;

  // Deprecated, use new address fields instead
  location?: string; 
}

export type PaymentMethod = 'Cash on Delivery' | 'UPI' | 'Card' | 'Internet Banking';
export type OrderStatus = 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';

export interface Order {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string; // Optional: for display in order list
  productPrice: number;
  productUnit: string;
  buyerId: string;
  buyerName: string;
  buyerPhoneNumber: string;
  farmerId: string;
  orderDate: string; // ISO date string
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  quantityOrdered: number; // Assuming a quantity of 1 for now, can be expanded
}
