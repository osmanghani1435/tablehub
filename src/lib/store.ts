import { v4 as uuidv4 } from 'uuid';
import type { Shop, MenuCategory, MenuItem, Order, Feedback, Customer, MerchantDraft, CartItem } from './types';

// ===== LOCAL STORAGE KEYS =====
const DRAFT_KEY = 'tablehub_merchant_draft';
const CART_PREFIX = 'tablehub_cart_';
const SHOPS_KEY = 'tablehub_shops';
const ORDERS_PREFIX = 'tablehub_orders_';
const FEEDBACK_PREFIX = 'tablehub_feedback_';
const CUSTOMERS_PREFIX = 'tablehub_customers_';
const AUTH_KEY = 'tablehub_auth';

// ===== MERCHANT DRAFT STORE =====
export const draftStore = {
  get(): MerchantDraft {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) return JSON.parse(raw);
    return {
      shop: {
        name: '',
        slug: '',
        logo: '',
        tagline: '',
        socialLinks: {},
        modulesEnabled: {
          googleReview: true,
          digitalMenu: true,
          orderMode: true,
          tables: true,
          loyalty: true,
          wifi: true,
          feedback: true,
          sudoku: false,
        },
        orderMode: 'whatsapp',
        waNumber: '',
        wifiSSID: '',
        wifiPass: '',
        googleReviewUrl: '',
        loyaltyConfig: {
          stampsPerVisit: 1,
          stampsForReward: 10,
          rewardDescription: 'Free Coffee',
          postReviewOffer: false,
          postReviewOfferId: '',
        },
        tables: 10,
      },
      categories: [],
      items: [],
    };
  },
  set(draft: MerchantDraft) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  },
  clear() {
    localStorage.removeItem(DRAFT_KEY);
  },
};

// ===== CART STORE =====
export const cartStore = {
  get(shopId: string): CartItem[] {
    const raw = localStorage.getItem(CART_PREFIX + shopId);
    return raw ? JSON.parse(raw) : [];
  },
  set(shopId: string, items: CartItem[]) {
    localStorage.setItem(CART_PREFIX + shopId, JSON.stringify(items));
  },
  clear(shopId: string) {
    localStorage.removeItem(CART_PREFIX + shopId);
  },
};

// ===== SHOP STORE (DEMO MODE) =====
export const shopStore = {
  getAll(): Shop[] {
    const raw = localStorage.getItem(SHOPS_KEY);
    return raw ? JSON.parse(raw) : [];
  },
  getById(shopId: string): Shop | undefined {
    return this.getAll().find(s => s.id === shopId);
  },
  getBySlug(slug: string): Shop | undefined {
    return this.getAll().find(s => s.slug === slug);
  },
  save(shop: Shop) {
    const shops = this.getAll();
    const idx = shops.findIndex(s => s.id === shop.id);
    if (idx >= 0) shops[idx] = shop;
    else shops.push(shop);
    localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
  },
  delete(shopId: string) {
    const shops = this.getAll().filter(s => s.id !== shopId);
    localStorage.setItem(SHOPS_KEY, JSON.stringify(shops));
  },
};

// ===== MENU STORE =====
const MENU_CAT_PREFIX = 'tablehub_menucat_';
const MENU_ITEM_PREFIX = 'tablehub_menuitem_';

export const menuStore = {
  getCategories(shopId: string): MenuCategory[] {
    const raw = localStorage.getItem(MENU_CAT_PREFIX + shopId);
    return raw ? JSON.parse(raw) : [];
  },
  saveCategories(shopId: string, cats: MenuCategory[]) {
    localStorage.setItem(MENU_CAT_PREFIX + shopId, JSON.stringify(cats));
  },
  getItems(shopId: string): MenuItem[] {
    const raw = localStorage.getItem(MENU_ITEM_PREFIX + shopId);
    return raw ? JSON.parse(raw) : [];
  },
  saveItems(shopId: string, items: MenuItem[]) {
    localStorage.setItem(MENU_ITEM_PREFIX + shopId, JSON.stringify(items));
  },
};

// ===== ORDER STORE =====
export const orderStore = {
  getAll(shopId: string): Order[] {
    const raw = localStorage.getItem(ORDERS_PREFIX + shopId);
    return raw ? JSON.parse(raw) : [];
  },
  add(shopId: string, order: Order) {
    const orders = this.getAll(shopId);
    orders.unshift(order);
    localStorage.setItem(ORDERS_PREFIX + shopId, JSON.stringify(orders));
  },
  updateStatus(shopId: string, orderId: string, status: Order['status']) {
    const orders = this.getAll(shopId);
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      orders[idx].status = status;
      localStorage.setItem(ORDERS_PREFIX + shopId, JSON.stringify(orders));
    }
  },
  delete(shopId: string, orderId: string) {
    const orders = this.getAll(shopId).filter(o => o.id !== orderId);
    localStorage.setItem(ORDERS_PREFIX + shopId, JSON.stringify(orders));
  },
};

// ===== FEEDBACK STORE =====
export const feedbackStore = {
  getAll(shopId: string): Feedback[] {
    const raw = localStorage.getItem(FEEDBACK_PREFIX + shopId);
    return raw ? JSON.parse(raw) : [];
  },
  add(shopId: string, feedback: Feedback) {
    const items = this.getAll(shopId);
    items.unshift(feedback);
    localStorage.setItem(FEEDBACK_PREFIX + shopId, JSON.stringify(items));
  },
  delete(shopId: string, feedbackId: string) {
    const items = this.getAll(shopId).filter(f => f.id !== feedbackId);
    localStorage.setItem(FEEDBACK_PREFIX + shopId, JSON.stringify(items));
  },
};

// ===== CUSTOMER STORE =====
export const customerStore = {
  get(shopId: string, uid: string): Customer | undefined {
    const raw = localStorage.getItem(CUSTOMERS_PREFIX + shopId);
    if (!raw) return undefined;
    const customers: Customer[] = JSON.parse(raw);
    return customers.find(c => c.uid === uid);
  },
  save(shopId: string, customer: Customer) {
    const raw = localStorage.getItem(CUSTOMERS_PREFIX + shopId);
    const customers: Customer[] = raw ? JSON.parse(raw) : [];
    const idx = customers.findIndex(c => c.uid === customer.uid);
    if (idx >= 0) customers[idx] = customer;
    else customers.push(customer);
    localStorage.setItem(CUSTOMERS_PREFIX + shopId, JSON.stringify(customers));
  },
};

// ===== AUTH STORE (DEMO) =====
export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
}

export const authStore = {
  get(): AuthUser | null {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  },
  set(user: AuthUser) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem(AUTH_KEY);
  },
};

// ===== HELPER =====
export function generateId(): string {
  return uuidv4().slice(0, 12);
}

export function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
