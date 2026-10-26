import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Minus, Trash2, ShoppingBag, Wifi, Star,
  Gift, MessageSquare, Gamepad2, Send, Copy, Check,
  Store, X, ArrowLeft
} from 'lucide-react';
import { shopStore, menuStore, cartStore, orderStore, feedbackStore, customerStore, authStore, generateId } from '../lib/store';
import type { Shop, MenuItem, CartItem, MenuCategory } from '../lib/types';
import { Drawer, EmptyState, useToast, AuthModal } from './ui';
import SudokuGame from './Sudoku';

interface Props {
  shopSlug: string;
  tableNumber?: number;
  onBack: () => void;
}

type Tab = 'menu' | 'wifi' | 'review' | 'loyalty' | 'play' | 'feedback';

export default function CustomerHub({ shopSlug, tableNumber = 1, onBack }: Props) {
  const [shop, setShop] = useState<Shop | undefined>();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('menu');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authCallback, setAuthCallback] = useState<(() => void) | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const s = shopStore.getBySlug(shopSlug);
    if (s) {
      setShop(s);
      setCategories(menuStore.getCategories(s.id));
      setItems(menuStore.getItems(s.id));
      setCart(cartStore.get(s.id));
    }
  }, [shopSlug]);

  const updateCart = (newCart: CartItem[]) => {
    setCart(newCart);
    if (shop) cartStore.set(shop.id, newCart);
  };

  const addToCart = (item: MenuItem) => {
    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      updateCart(cart.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      updateCart([...cart, { ...item, quantity: 1 }]);
    }
    addToast(`${item.name} added to cart`, 'success');
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const updated = cart.map(c => {
      if (c.id === itemId) return { ...c, quantity: Math.max(0, c.quantity + delta) };
      return c;
    }).filter(c => c.quantity > 0);
    updateCart(updated);
  };

  const removeFromCart = (itemId: string) => {
    updateCart(cart.filter(c => c.id !== itemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const filteredItems = useMemo(() => {
    let result = items.filter(i => i.isAvailable);
    if (selectedCat) result = result.filter(i => i.categoryId === selectedCat);
    if (searchQuery) result = result.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [items, selectedCat, searchQuery]);

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
          <Store size={32} className="text-gray-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Shop Not Found</h2>
        <p className="text-gray-500 mb-4">This shop doesn't exist or the link is invalid.</p>
        <button onClick={onBack} className="px-5 py-2.5 bg-indigo-500 text-white rounded-xl font-medium">
          Go Home
        </button>
      </div>
    );
  }

  const availableTabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    shop.modulesEnabled.digitalMenu && { key: 'menu' as Tab, label: 'Menu', icon: <ShoppingBag size={18} /> },
    shop.modulesEnabled.wifi && { key: 'wifi' as Tab, label: 'Wi-Fi', icon: <Wifi size={18} /> },
    shop.modulesEnabled.googleReview && { key: 'review' as Tab, label: 'Review', icon: <Star size={18} /> },
    shop.modulesEnabled.loyalty && { key: 'loyalty' as Tab, label: 'Loyalty', icon: <Gift size={18} /> },
    shop.modulesEnabled.sudoku && { key: 'play' as Tab, label: 'Play', icon: <Gamepad2 size={18} /> },
    shop.modulesEnabled.feedback && { key: 'feedback' as Tab, label: 'Feedback', icon: <MessageSquare size={18} /> },
  ].filter(Boolean) as { key: Tab; label: string; icon: React.ReactNode }[];

  const handleCheckout = () => {
    if (cart.length === 0) { addToast('Cart is empty', 'error'); return; }

    if (shop.orderMode === 'whatsapp' || shop.orderMode === 'both') {
      const receipt = cart.map(i => `${i.quantity}× ${i.name} ($${(i.price * i.quantity).toFixed(2)})`).join('\n');
      const msg = `🛒 *New Order - Table ${tableNumber}*\n\n${receipt}\n\n*Total: $${cartTotal.toFixed(2)}*`;
      const url = `https://wa.me/${shop.waNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      if (shop.orderMode === 'whatsapp') {
        cartStore.clear(shop.id);
        setCart([]);
        addToast('Order sent via WhatsApp!', 'success');
      }
    }

    if (shop.orderMode === 'portal' || shop.orderMode === 'both') {
      const order = {
        id: generateId(),
        shopId: shop.id,
        tableNumber,
        items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
        total: cartTotal,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };
      orderStore.add(shop.id, order);
      cartStore.clear(shop.id);
      setCart([]);
      addToast('Order placed successfully! 🎉', 'success');
    }
    setCartOpen(false);
  };

  const requireAuth = (callback: () => void) => {
    const user = authStore.get();
    if (user) {
      callback();
    } else {
      setAuthCallback(() => callback);
      setAuthOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ArrowLeft size={20} />
            </button>
            {shop.logo ? (
              <img src={shop.logo} alt="" className="w-10 h-10 rounded-xl object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <Store size={20} className="text-indigo-500" />
              </div>
            )}
            <div>
              <h1 className="font-bold text-gray-900 text-sm">{shop.name}</h1>
              <p className="text-xs text-gray-500">{shop.tagline}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full">
            Table {tableNumber}
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-[60px] z-20">
        <div className="max-w-lg mx-auto px-2 flex overflow-x-auto scrollbar-hide">
          {availableTabs.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap transition relative ${
                activeTab === t.key ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.icon}
              {t.label}
              {activeTab === t.key && (
                <motion.div
                  layoutId="customer-tab"
                  className="absolute bottom-0 left-1 right-1 h-0.5 bg-indigo-500 rounded-full"
                />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {activeTab === 'menu' && (
              <MenuTab
                categories={categories}
                items={filteredItems}
                selectedCat={selectedCat}
                setSelectedCat={setSelectedCat}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                onAddToCart={addToCart}
                cart={cart}
              />
            )}
            {activeTab === 'wifi' && <WifiTab shop={shop} />}
            {activeTab === 'review' && <ReviewTab shop={shop} requireAuth={requireAuth} />}
            {activeTab === 'loyalty' && <LoyaltyTab shop={shop} requireAuth={requireAuth} />}
            {activeTab === 'play' && <SudokuGame />}
            {activeTab === 'feedback' && <FeedbackTab shop={shop} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Cart FAB */}
      {activeTab === 'menu' && cartCount > 0 && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition"
        >
          <ShoppingBag size={20} />
          <span className="font-semibold">{cartCount} items</span>
          <span className="w-px h-5 bg-indigo-400" />
          <span className="font-bold">${cartTotal.toFixed(2)}</span>
        </motion.button>
      )}

      {/* Cart Drawer */}
      <Drawer isOpen={cartOpen} onClose={() => setCartOpen(false)} title="Your Cart">
        {cart.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={24} />}
            title="Cart is empty"
            description="Add items from the menu"
          />
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {cart.map(item => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center gap-3 bg-gray-50 rounded-xl p-3"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                    <p className="text-xs text-gray-500">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-semibold text-sm">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-7 h-7 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 ml-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-gray-800">Total</span>
                <span className="text-xl font-bold text-indigo-600">${cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {shop.orderMode === 'whatsapp' ? 'Order via WhatsApp' :
                 shop.orderMode === 'portal' ? 'Place Order' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          if (authCallback) authCallback();
          setAuthCallback(null);
        }}
      />
    </div>
  );
}

// ===== MENU TAB =====
function MenuTab({ categories, items, selectedCat, setSelectedCat, searchQuery, setSearchQuery, onAddToCart, cart }: {
  categories: MenuCategory[];
  items: MenuItem[];
  selectedCat: string | null;
  setSelectedCat: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onAddToCart: (item: MenuItem) => void;
  cart: CartItem[];
}) {
  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search menu..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition text-sm"
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
        <button
          onClick={() => setSelectedCat(null)}
          className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${
            !selectedCat ? 'bg-indigo-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          All
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition ${
              selectedCat === cat.id ? 'bg-indigo-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag size={24} />}
          title="No items found"
          description={searchQuery ? 'Try a different search term' : 'Menu is empty'}
        />
      ) : (
        <div className="space-y-3">
          {items.map(item => {
            const inCart = cart.find(c => c.id === item.id);
            return (
              <motion.div
                key={item.id}
                layout
                className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3"
              >
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 text-sm">{item.name}</h4>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                  <p className="text-indigo-600 font-bold text-sm mt-1">${item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => onAddToCart(item)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                    inCart
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-indigo-500 text-white hover:bg-indigo-600'
                  }`}
                >
                  {inCart ? <span className="text-xs font-bold">{inCart.quantity}</span> : <Plus size={20} />}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ===== WIFI TAB =====
function WifiTab({ shop }: { shop: Shop }) {
  const [copied, setCopied] = useState<'ssid' | 'pass' | null>(null);
  const { addToast } = useToast();

  const copy = (text: string, type: 'ssid' | 'pass') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      addToast(`${type === 'ssid' ? 'SSID' : 'Password'} copied!`, 'success');
      setTimeout(() => setCopied(null), 2000);
    });
  };

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-20 h-20 rounded-2xl bg-indigo-50 flex items-center justify-center mb-6">
        <Wifi size={36} className="text-indigo-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Free Wi-Fi</h2>
      <p className="text-sm text-gray-500 mb-8">Connect to our network</p>

      <div className="w-full space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Network Name (SSID)</p>
          <div className="flex items-center justify-between">
            <p className="font-mono font-semibold text-gray-800">{shop.wifiSSID || 'Not set'}</p>
            <button
              onClick={() => copy(shop.wifiSSID, 'ssid')}
              className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-500"
            >
              {copied === 'ssid' ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 mb-1">Password</p>
          <div className="flex items-center justify-between">
            <p className="font-mono font-semibold text-gray-800">{shop.wifiPass || 'Not set'}</p>
            <button
              onClick={() => copy(shop.wifiPass, 'pass')}
              className="p-2 rounded-lg hover:bg-indigo-50 text-indigo-500"
            >
              {copied === 'pass' ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== REVIEW TAB =====
function ReviewTab({ shop, requireAuth }: { shop: Shop; requireAuth: (cb: () => void) => void }) {
  const [claimed, setClaimed] = useState(false);
  const { addToast } = useToast();

  const handleClaim = () => {
    requireAuth(() => {
      setClaimed(true);
      addToast('Reward claimed! 🎉', 'success');
    });
  };

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-20 h-20 rounded-2xl bg-amber-50 flex items-center justify-center mb-6">
        <Star size={36} className="text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Love our service?</h2>
      <p className="text-sm text-gray-500 mb-8 text-center">
        Leave us a Google review and help others discover us!
      </p>

      <a
        href={shop.googleReviewUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-3.5 bg-white border-2 border-gray-200 rounded-xl font-semibold text-gray-800 hover:border-indigo-300 transition flex items-center justify-center gap-2 mb-4"
      >
        <Star size={18} className="text-amber-500" /> Write a Review
      </a>

      {shop.loyaltyConfig.postReviewOffer && !claimed && (
        <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 text-center">
          <p className="text-sm font-medium text-amber-800 mb-2">🎁 Post-Review Reward!</p>
          <p className="text-xs text-amber-600 mb-3">Get a special offer after leaving a review</p>
          <button
            onClick={handleClaim}
            className="px-6 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-semibold hover:bg-amber-600 transition"
          >
            Claim Reward
          </button>
        </div>
      )}

      {claimed && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center"
        >
          <p className="text-emerald-700 font-semibold">✅ Reward Claimed!</p>
          <p className="text-sm text-emerald-600 mt-1">Show this to your server</p>
        </motion.div>
      )}
    </div>
  );
}

// ===== LOYALTY TAB =====
function LoyaltyTab({ shop, requireAuth }: { shop: Shop; requireAuth: (cb: () => void) => void }) {
  const [stamps, setStamps] = useState(0);
  const { addToast } = useToast();
  const target = shop.loyaltyConfig.stampsForReward || 10;

  const handleClaimStamp = () => {
    requireAuth(() => {
      if (stamps < target) {
        setStamps(prev => prev + 1);
        addToast('Stamp collected! 🎉', 'success');
      }
    });
  };

  return (
    <div className="flex flex-col items-center py-8">
      <div className="w-20 h-20 rounded-2xl bg-purple-50 flex items-center justify-center mb-6">
        <Gift size={36} className="text-purple-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Loyalty Card</h2>
      <p className="text-sm text-gray-500 mb-2">
        Collect {target} stamps for {shop.loyaltyConfig.rewardDescription || 'a reward'}!
      </p>
      <p className="text-xs text-gray-400 mb-8">{stamps}/{target} stamps collected</p>

      {/* Stamp Card */}
      <div className="grid grid-cols-5 gap-3 mb-8 w-full max-w-xs">
        {Array.from({ length: target }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className={`aspect-square rounded-xl flex items-center justify-center text-lg ${
              i < stamps
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200'
                : 'bg-gray-100 text-gray-300'
            }`}
          >
            {i < stamps ? '★' : '○'}
          </motion.div>
        ))}
      </div>

      {stamps >= target ? (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-full bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center"
        >
          <p className="text-emerald-700 font-bold text-lg">🎉 Reward Unlocked!</p>
          <p className="text-sm text-emerald-600 mt-1">{shop.loyaltyConfig.rewardDescription}</p>
        </motion.div>
      ) : (
        <button
          onClick={handleClaimStamp}
          className="w-full py-3.5 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition"
        >
          Claim Stamp
        </button>
      )}
    </div>
  );
}

// ===== FEEDBACK TAB =====
function FeedbackTab({ shop }: { shop: Shop }) {
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) { addToast('Please write a message', 'error'); return; }

    const feedback = {
      id: generateId(),
      shopId: shop.id,
      message,
      createdAt: new Date().toISOString(),
      isRead: false,
      rating: rating || undefined,
    };
    feedbackStore.add(shop.id, feedback);
    setMessage('');
    setRating(0);
    setSubmitted(true);
    addToast('Feedback sent! Thank you 🙏', 'success');
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="py-4">
      <div className="text-center mb-6">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
          <MessageSquare size={28} className="text-emerald-500" />
        </div>
        <h2 className="text-lg font-bold text-gray-900">We'd love your feedback</h2>
        <p className="text-sm text-gray-500 mt-1">Help us improve your experience</p>
      </div>

      {submitted ? (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center"
        >
          <p className="text-4xl mb-3">🙏</p>
          <p className="font-semibold text-emerald-700">Thank you!</p>
          <p className="text-sm text-emerald-600 mt-1">Your feedback means a lot to us</p>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Rating */}
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(i => (
              <button
                key={i}
                type="button"
                onClick={() => setRating(i)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={28}
                  className={i <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'}
                />
              </button>
            ))}
          </div>

          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none text-sm"
            placeholder="Tell us what you think..."
          />

          <button
            type="submit"
            className="w-full py-3.5 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition flex items-center justify-center gap-2"
          >
            <Send size={18} /> Send Feedback
          </button>
        </form>
      )}
    </div>
  );
}
