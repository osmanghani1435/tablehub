import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HashRouter, Routes, Route, useNavigate, useSearchParams, useLocation, useParams as useRouterParams
} from 'react-router-dom';
import {
  Store, QrCode, ShoppingBag, Sparkles,
  ChevronRight, Globe, Zap, Shield
} from 'lucide-react';
import { ToastProvider, AuthProvider, useAuth } from './components/ui';
import ShopBuilder from './components/ShopBuilder';
import Dashboard from './components/Dashboard';
import CustomerHub from './components/CustomerHub';
import { shopStore, menuStore } from './lib/store';
import type { Shop, MenuCategory, MenuItem } from './lib/types';

// Seed demo data on first load
function seedDemoData() {
  if (shopStore.getAll().length > 0) return;
  
  const shopId = 'demo-shop-001';
  const shop: Shop = {
    id: shopId,
    name: 'The Golden Bean',
    slug: 'the-golden-bean-demo',
    logo: '',
    tagline: 'Artisan Coffee & Pastries ☕',
    socialLinks: { instagram: '@goldenbean' },
    modulesEnabled: {
      googleReview: true, digitalMenu: true, orderMode: true,
      tables: true, loyalty: true, wifi: true, feedback: true, sudoku: true,
    },
    orderMode: 'both',
    waNumber: '+1234567890',
    wifiSSID: 'GoldenBean_Guest',
    wifiPass: 'coffee2024',
    googleReviewUrl: 'https://g.page/the-golden-bean/review',
    loyaltyConfig: {
      stampsPerVisit: 1, stampsForReward: 8,
      rewardDescription: 'Free Latte', postReviewOffer: true, postReviewOfferId: 'review-reward-1',
    },
    tables: 8,
    createdAt: new Date().toISOString(),
  };
  shopStore.save(shop);

  const categories: MenuCategory[] = [
    { id: 'cat-coffee', name: '☕ Coffee', order: 0 },
    { id: 'cat-tea', name: '🍵 Tea', order: 1 },
    { id: 'cat-pastry', name: '🥐 Pastries', order: 2 },
    { id: 'cat-food', name: '🥪 Food', order: 3 },
  ];
  menuStore.saveCategories(shopId, categories);

  const items: MenuItem[] = [
    { id: 'item-1', name: 'Espresso', price: 3.50, description: 'Rich and bold single shot', categoryId: 'cat-coffee', isAvailable: true },
    { id: 'item-2', name: 'Cappuccino', price: 4.50, description: 'Espresso with steamed milk foam', categoryId: 'cat-coffee', isAvailable: true },
    { id: 'item-3', name: 'Latte', price: 5.00, description: 'Smooth espresso with creamy milk', categoryId: 'cat-coffee', isAvailable: true },
    { id: 'item-4', name: 'Cold Brew', price: 5.50, description: 'Slow-steeped for 20 hours', categoryId: 'cat-coffee', isAvailable: true },
    { id: 'item-5', name: 'Matcha Latte', price: 5.50, description: 'Premium Japanese matcha', categoryId: 'cat-tea', isAvailable: true },
    { id: 'item-6', name: 'Chai Latte', price: 4.50, description: 'Spiced Indian tea with milk', categoryId: 'cat-tea', isAvailable: true },
    { id: 'item-7', name: 'Earl Grey', price: 3.50, description: 'Classic bergamot black tea', categoryId: 'cat-tea', isAvailable: true },
    { id: 'item-8', name: 'Croissant', price: 3.50, description: 'Buttery, flaky French pastry', categoryId: 'cat-pastry', isAvailable: true },
    { id: 'item-9', name: 'Blueberry Muffin', price: 4.00, description: 'Fresh blueberries in every bite', categoryId: 'cat-pastry', isAvailable: true },
    { id: 'item-10', name: 'Cinnamon Roll', price: 4.50, description: 'Warm with cream cheese icing', categoryId: 'cat-pastry', isAvailable: true },
    { id: 'item-11', name: 'Avocado Toast', price: 8.50, description: 'Sourdough, avocado, cherry tomatoes', categoryId: 'cat-food', isAvailable: true },
    { id: 'item-12', name: 'Club Sandwich', price: 9.50, description: 'Triple-decker with chicken & bacon', categoryId: 'cat-food', isAvailable: true },
    { id: 'item-13', name: 'Caesar Salad', price: 7.50, description: 'Romaine, parmesan, croutons', categoryId: 'cat-food', isAvailable: true },
  ];
  menuStore.saveItems(shopId, items);
}

seedDemoData();

function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/merchant/dashboard" element={<MerchantDashboardPage />} />
        <Route path="/shop/:slug" element={<CustomerHubPage />} />
      </Routes>
    </AnimatePresence>
  );
}

// ===== HOME PAGE =====
function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shops] = useState(shopStore.getAll());

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-white"
    >
      {/* Hero */}
      <div className="max-w-lg mx-auto px-4 pt-12 pb-8">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-200">
            <QrCode size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            Table<span className="text-indigo-500">Hub</span>
          </h1>
          <p className="text-gray-500 text-base leading-relaxed max-w-sm mx-auto">
            Smart NFC/QR platform for restaurants. Digital menus, ordering, Wi-Fi, loyalty & more — all from a single scan.
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-10"
        >
          <button
            onClick={() => navigate('/create')}
            className="w-full py-4 bg-indigo-500 text-white rounded-2xl font-semibold text-base hover:bg-indigo-600 transition shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
          >
            <Sparkles size={20} /> Create Your Shop Hub
          </button>
          
          {user && shops.length > 0 && (
            <button
              onClick={() => navigate('/merchant/dashboard')}
              className="w-full py-4 bg-white border-2 border-gray-200 text-gray-800 rounded-2xl font-semibold text-base hover:border-indigo-300 transition flex items-center justify-center gap-2"
            >
              <Store size={20} className="text-indigo-500" /> Go to Dashboard
            </button>
          )}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 mb-10"
        >
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-center">Features</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: <ShoppingBag size={20} />, title: 'Digital Menu', desc: 'Beautiful menu with categories' },
              { icon: <QrCode size={20} />, title: 'QR Ordering', desc: 'Scan & order instantly' },
              { icon: <Globe size={20} />, title: 'Wi-Fi Share', desc: 'One-tap Wi-Fi access' },
              { icon: <Zap size={20} />, title: 'Loyalty', desc: 'Digital stamp cards' },
              { icon: <Shield size={20} />, title: 'Feedback', desc: 'Anonymous reviews' },
              { icon: <Sparkles size={20} />, title: 'Zero Login', desc: 'No app download needed' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-3.5 hover:border-indigo-200 transition">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 mb-2">
                  {f.icon}
                </div>
                <p className="font-semibold text-gray-800 text-sm">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Existing Shops */}
        {shops.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider text-center mb-3">
              Demo Shops
            </h3>
            <div className="space-y-2">
              {shops.map(shop => (
                <button
                  key={shop.id}
                  onClick={() => navigate(`/shop/${shop.slug}?table=1`)}
                  className="w-full flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-4 hover:border-indigo-200 transition text-left"
                >
                  {shop.logo ? (
                    <img src={shop.logo} alt="" className="w-12 h-12 rounded-xl object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
                      <Store size={22} className="text-indigo-500" />
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{shop.name}</p>
                    <p className="text-xs text-gray-500">{shop.tagline || 'Tap to explore'}</p>
                  </div>
                  <ChevronRight size={18} className="text-gray-400" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

// ===== CREATE PAGE =====
function CreatePage() {
  const navigate = useNavigate();

  return (
    <ShopBuilder
      onPublished={(shopId) => {
        navigate('/merchant/dashboard');
      }}
      onBack={() => navigate('/')}
    />
  );
}

// ===== MERCHANT DASHBOARD PAGE =====
function MerchantDashboardPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const shops = shopStore.getAll();
  const [shopId, setShopId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }
    if (shops.length > 0 && !shopId) {
      setShopId(shops[shops.length - 1].id);
    }
  }, [user, shops, shopId, navigate]);

  if (!user) return null;

  if (!shopId && shops.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Store size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">No Shop Yet</h2>
        <p className="text-gray-500 mb-4">Create your first shop hub to get started.</p>
        <button
          onClick={() => navigate('/create')}
          className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition"
        >
          Create Shop
        </button>
      </div>
    );
  }

  if (!shopId) return null;

  return (
    <Dashboard
      shopId={shopId}
      onBack={() => navigate('/')}
      onLogout={() => {
        logout();
        navigate('/');
      }}
    />
  );
}

// ===== CUSTOMER HUB PAGE =====
function CustomerHubPage() {
  const navigate = useNavigate();
  const params = useRouterParams();
  const slug = params.slug || '';
  const [searchParams] = useSearchParams();
  const table = parseInt(searchParams.get('table') || '1');

  if (!slug) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Invalid shop link</p>
      </div>
    );
  }

  return (
    <CustomerHub
      shopSlug={slug}
      tableNumber={table}
      onBack={() => navigate('/')}
    />
  );
}

export default App;
