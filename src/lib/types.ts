// ===== CORE TYPES =====

export interface Shop {
  id: string;
  name: string;
  slug: string;
  logo: string;
  tagline: string;
  socialLinks: { instagram?: string; facebook?: string; twitter?: string };
  modulesEnabled: ModulesConfig;
  orderMode: 'whatsapp' | 'portal' | 'both';
  waNumber: string;
  wifiSSID: string;
  wifiPass: string;
  googleReviewUrl: string;
  loyaltyConfig: LoyaltyConfig;
  tables: number;
  createdAt: string;
}

export interface ModulesConfig {
  googleReview: boolean;
  digitalMenu: boolean;
  orderMode: boolean;
  tables: boolean;
  loyalty: boolean;
  wifi: boolean;
  feedback: boolean;
  sudoku: boolean;
}

export interface LoyaltyConfig {
  stampsPerVisit: number;
  stampsForReward: number;
  rewardDescription: string;
  postReviewOffer: boolean;
  postReviewOfferId: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  categoryId: string;
  isAvailable: boolean;
  image?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  shopId: string;
  tableNumber: number;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: 'pending' | 'preparing' | 'completed';
  createdAt: string;
  customerPhone?: string;
}

export interface Customer {
  uid: string;
  shopId: string;
  stamps: number;
  claimedOffers: string[];
}

export interface Feedback {
  id: string;
  shopId: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
  isRead: boolean;
  rating?: number;
}

// ===== DRAFT STATE =====

export interface MerchantDraft {
  shop: Partial<Shop>;
  categories: MenuCategory[];
  items: MenuItem[];
}

// ===== TOAST =====

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// ===== SUDOKU =====

export type SudokuBoard = (number | null)[][];
export type SudokuDifficulty = 'easy' | 'medium' | 'hard';
