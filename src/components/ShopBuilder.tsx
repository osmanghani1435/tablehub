import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Wifi, Star, ShoppingBag, Gift, MessageSquare,
  Gamepad2, ChevronRight, Plus, Edit3, Trash2, Check,
  ArrowLeft, Upload, Globe, Hash, Phone
} from 'lucide-react';
import { draftStore, shopStore, menuStore, generateId, slugify } from '../lib/store';
import type { Shop, MenuCategory, MenuItem, ModulesConfig } from '../lib/types';
import { Drawer, Toggle, EmptyState, useToast, AuthModal, useAuth } from './ui';

type Step = 'profile' | 'modules' | 'menu' | 'review';

interface Props {
  onPublished: (shopId: string) => void;
  onBack?: () => void;
}

export default function ShopBuilder({ onPublished, onBack }: Props) {
  const [step, setStep] = useState<Step>('profile');
  const [draft, setDraft] = useState(draftStore.get());
  const [authOpen, setAuthOpen] = useState(false);
  const { user } = useAuth();
  const { addToast } = useToast();

  // Persist draft changes
  useEffect(() => {
    draftStore.set(draft);
  }, [draft]);

  const updateShop = (partial: Partial<Shop>) => {
    setDraft(prev => ({ ...prev, shop: { ...prev.shop, ...partial } }));
  };

  const handlePublish = () => {
    if (!draft.shop.name) {
      addToast('Please enter a shop name', 'error');
      setStep('profile');
      return;
    }
    if (!user) {
      setAuthOpen(true);
      return;
    }
    publishShop();
  };

  const publishShop = () => {
    const shopId = generateId();
    const slug = slugify(draft.shop.name || 'shop') + '-' + shopId.slice(0, 4);
    
    const shop: Shop = {
      id: shopId,
      name: draft.shop.name || 'My Shop',
      slug,
      logo: draft.shop.logo || '',
      tagline: draft.shop.tagline || '',
      socialLinks: draft.shop.socialLinks || {},
      modulesEnabled: draft.shop.modulesEnabled || {
        googleReview: true, digitalMenu: true, orderMode: true,
        tables: true, loyalty: true, wifi: true, feedback: true, sudoku: false,
      },
      orderMode: draft.shop.orderMode || 'whatsapp',
      waNumber: draft.shop.waNumber || '',
      wifiSSID: draft.shop.wifiSSID || '',
      wifiPass: draft.shop.wifiPass || '',
      googleReviewUrl: draft.shop.googleReviewUrl || '',
      loyaltyConfig: draft.shop.loyaltyConfig || {
        stampsPerVisit: 1, stampsForReward: 10,
        rewardDescription: 'Free Coffee', postReviewOffer: false, postReviewOfferId: '',
      },
      tables: draft.shop.tables || 10,
      createdAt: new Date().toISOString(),
    };

    shopStore.save(shop);
    menuStore.saveCategories(shopId, draft.categories);
    menuStore.saveItems(shopId, draft.items);
    draftStore.clear();
    addToast('Shop published successfully! 🎉', 'success');
    onPublished(shopId);
  };

  const steps: { key: Step; label: string }[] = [
    { key: 'profile', label: 'Profile' },
    { key: 'modules', label: 'Modules' },
    { key: 'menu', label: 'Menu' },
    { key: 'review', label: 'Review' },
  ];

  const currentIdx = steps.findIndex(s => s.key === step);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100">
                <ArrowLeft size={20} />
              </button>
            )}
            <h1 className="font-bold text-gray-900">Create Your Hub</h1>
          </div>
          <span className="text-xs font-medium text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
            Step {currentIdx + 1}/4
          </span>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <motion.div
            className="h-full bg-indigo-500"
            animate={{ width: `${((currentIdx + 1) / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {step === 'profile' && (
              <ProfileStep draft={draft} updateShop={updateShop} />
            )}
            {step === 'modules' && (
              <ModulesStep draft={draft} updateShop={updateShop} />
            )}
            {step === 'menu' && (
              <MenuStep draft={draft} setDraft={setDraft} />
            )}
            {step === 'review' && (
              <ReviewStep draft={draft} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {currentIdx > 0 && (
            <button
              onClick={() => setStep(steps[currentIdx - 1].key)}
              className="flex-1 py-3 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              Back
            </button>
          )}
          {currentIdx < 3 ? (
            <button
              onClick={() => setStep(steps[currentIdx + 1].key)}
              className="flex-1 py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition flex items-center justify-center gap-2"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handlePublish}
              className="flex-1 py-3 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition flex items-center justify-center gap-2"
            >
              <Check size={18} /> Publish Shop
            </button>
          )}
        </div>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={publishShop}
        mode="register"
      />
    </div>
  );
}

// ===== PROFILE STEP =====
function ProfileStep({ draft, updateShop }: { draft: any; updateShop: (p: Partial<Shop>) => void }) {
  const [logoPreview, setLogoPreview] = useState(draft.shop.logo || '');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result as string;
        setLogoPreview(result);
        updateShop({ logo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Shop Profile</h2>
        <p className="text-sm text-gray-500 mt-1">Tell us about your business</p>
      </div>

      {/* Logo Upload */}
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden mb-2">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <Upload size={24} className="text-gray-400" />
          )}
        </div>
        <label className="text-sm text-indigo-500 font-medium cursor-pointer hover:underline">
          Upload Logo
          <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Shop Name *</label>
        <div className="relative">
          <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={draft.shop.name || ''}
            onChange={e => updateShop({ name: e.target.value })}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
            placeholder="e.g., The Coffee House"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
        <input
          type="text"
          value={draft.shop.tagline || ''}
          onChange={e => updateShop({ tagline: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="Best coffee in town ☕"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <Globe size={14} className="inline mr-1" /> Instagram
        </label>
        <input
          type="text"
          value={draft.shop.socialLinks?.instagram || ''}
          onChange={e => updateShop({ socialLinks: { ...draft.shop.socialLinks, instagram: e.target.value } })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="@yourshop"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <Wifi size={14} className="inline mr-1" /> Wi-Fi SSID
        </label>
        <input
          type="text"
          value={draft.shop.wifiSSID || ''}
          onChange={e => updateShop({ wifiSSID: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="Shop_WiFi_Name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Wi-Fi Password</label>
        <input
          type="text"
          value={draft.shop.wifiPass || ''}
          onChange={e => updateShop({ wifiPass: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="WiFi password"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <Phone size={14} className="inline mr-1" /> WhatsApp Number (for orders)
        </label>
        <input
          type="tel"
          value={draft.shop.waNumber || ''}
          onChange={e => updateShop({ waNumber: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="+1234567890"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <Star size={14} className="inline mr-1" /> Google Review URL
        </label>
        <input
          type="url"
          value={draft.shop.googleReviewUrl || ''}
          onChange={e => updateShop({ googleReviewUrl: e.target.value })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
          placeholder="https://g.page/review/..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          <Hash size={14} className="inline mr-1" /> Number of Tables
        </label>
        <input
          type="number"
          min={1}
          max={100}
          value={draft.shop.tables || 10}
          onChange={e => updateShop({ tables: parseInt(e.target.value) || 10 })}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition"
        />
      </div>
    </div>
  );
}

// ===== MODULES STEP =====
function ModulesStep({ draft, updateShop }: { draft: any; updateShop: (p: Partial<Shop>) => void }) {
  const modules = draft.shop.modulesEnabled || {};

  const updateModule = (key: keyof ModulesConfig, value: boolean) => {
    updateShop({ modulesEnabled: { ...modules, [key]: value } });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Enable Modules</h2>
        <p className="text-sm text-gray-500 mt-1">Choose features for your hub</p>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-1">
        <Toggle
          enabled={modules.digitalMenu ?? true}
          onChange={v => updateModule('digitalMenu', v)}
          label="Digital Menu"
          description="Let customers browse your menu digitally"
        />
        <Toggle
          enabled={modules.orderMode ?? true}
          onChange={v => updateModule('orderMode', v)}
          label="Order Mode"
          description="Accept orders via WhatsApp or portal"
        />
        <Toggle
          enabled={modules.wifi ?? true}
          onChange={v => updateModule('wifi', v)}
          label="Wi-Fi Access"
          description="Share Wi-Fi credentials with customers"
        />
        <Toggle
          enabled={modules.googleReview ?? true}
          onChange={v => updateModule('googleReview', v)}
          label="Google Reviews"
          description="Encourage customers to leave reviews"
        />
        <Toggle
          enabled={modules.loyalty ?? true}
          onChange={v => updateModule('loyalty', v)}
          label="Loyalty Program"
          description="Digital stamp cards for repeat customers"
        />
        <Toggle
          enabled={modules.feedback ?? true}
          onChange={v => updateModule('feedback', v)}
          label="Feedback"
          description="Collect anonymous customer feedback"
        />
        <Toggle
          enabled={modules.sudoku ?? false}
          onChange={v => updateModule('sudoku', v)}
          label="Sudoku Game"
          description="Fun puzzle game to keep customers engaged"
        />
      </div>

      {/* Order Mode Selection */}
      {modules.orderMode && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <p className="font-medium text-gray-800 mb-3">Order Mode</p>
          <div className="grid grid-cols-3 gap-2">
            {(['whatsapp', 'portal', 'both'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => updateShop({ orderMode: mode })}
                className={`py-2.5 rounded-xl text-sm font-medium transition ${
                  draft.shop.orderMode === mode
                    ? 'bg-indigo-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mode === 'whatsapp' ? 'WhatsApp' : mode === 'portal' ? 'Portal' : 'Both'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loyalty Config */}
      {modules.loyalty && (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 space-y-3">
          <p className="font-medium text-gray-800">Loyalty Settings</p>
          <div>
            <label className="text-xs text-gray-500">Stamps for reward</label>
            <input
              type="number"
              min={1}
              value={draft.shop.loyaltyConfig?.stampsForReward || 10}
              onChange={e => updateShop({ loyaltyConfig: { ...draft.shop.loyaltyConfig, stampsForReward: parseInt(e.target.value) || 10 } })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Reward description</label>
            <input
              type="text"
              value={draft.shop.loyaltyConfig?.rewardDescription || ''}
              onChange={e => updateShop({ loyaltyConfig: { ...draft.shop.loyaltyConfig, rewardDescription: e.target.value } })}
              className="w-full mt-1 px-3 py-2 rounded-lg border border-gray-200 text-sm"
              placeholder="e.g., Free Coffee"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ===== MENU STEP =====
function MenuStep({ draft, setDraft }: { draft: any; setDraft: React.Dispatch<React.SetStateAction<any>> }) {
  const [catDrawerOpen, setCatDrawerOpen] = useState(false);
  const [itemDrawerOpen, setItemDrawerOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<MenuCategory | null>(null);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemDesc, setItemDesc] = useState('');
  const { addToast } = useToast();

  const categories: MenuCategory[] = draft.categories || [];
  const items: MenuItem[] = draft.items || [];

  const addCategory = () => {
    if (!catName.trim()) { addToast('Enter a category name', 'error'); return; }
    if (editingCat) {
      setDraft((prev: any) => ({
        ...prev,
        categories: prev.categories.map((c: MenuCategory) => c.id === editingCat.id ? { ...c, name: catName } : c),
      }));
      addToast('Category updated', 'success');
    } else {
      const newCat: MenuCategory = { id: generateId(), name: catName, order: categories.length };
      setDraft((prev: any) => ({ ...prev, categories: [...prev.categories, newCat] }));
      addToast('Category added', 'success');
    }
    setCatName('');
    setEditingCat(null);
    setCatDrawerOpen(false);
  };

  const deleteCategory = (id: string) => {
    setDraft((prev: any) => ({
      ...prev,
      categories: prev.categories.filter((c: MenuCategory) => c.id !== id),
      items: prev.items.filter((i: MenuItem) => i.categoryId !== id),
    }));
    addToast('Category deleted', 'info');
  };

  const addItem = () => {
    if (!itemName.trim() || !itemPrice) { addToast('Fill in name and price', 'error'); return; }
    if (!selectedCatId) { addToast('Select a category first', 'error'); return; }
    
    if (editingItem) {
      setDraft((prev: any) => ({
        ...prev,
        items: prev.items.map((i: MenuItem) => i.id === editingItem.id ? {
          ...i, name: itemName, price: parseFloat(itemPrice), description: itemDesc
        } : i),
      }));
      addToast('Item updated', 'success');
    } else {
      const newItem: MenuItem = {
        id: generateId(),
        name: itemName,
        price: parseFloat(itemPrice),
        description: itemDesc,
        categoryId: selectedCatId,
        isAvailable: true,
      };
      setDraft((prev: any) => ({ ...prev, items: [...prev.items, newItem] }));
      addToast('Item added', 'success');
    }
    setItemName(''); setItemPrice(''); setItemDesc('');
    setEditingItem(null);
    setItemDrawerOpen(false);
  };

  const deleteItem = (id: string) => {
    setDraft((prev: any) => ({
      ...prev,
      items: prev.items.filter((i: MenuItem) => i.id !== id),
    }));
    addToast('Item deleted', 'info');
  };

  const openEditCat = (cat: MenuCategory) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDrawerOpen(true);
  };

  const openEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemDesc(item.description);
    setSelectedCatId(item.categoryId);
    setItemDrawerOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Build Your Menu</h2>
        <p className="text-sm text-gray-500 mt-1">Add categories and items</p>
      </div>

      {/* Categories */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h3 className="font-semibold text-gray-800 text-sm">Categories</h3>
          <button
            onClick={() => { setEditingCat(null); setCatName(''); setCatDrawerOpen(true); }}
            className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {categories.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={24} />}
            title="No categories yet"
            description="Add your first menu category"
            actionLabel="Add Category"
            onAction={() => setCatDrawerOpen(true)}
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {categories.map(cat => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between px-4 py-3"
              >
                <span className="text-sm font-medium text-gray-700">{cat.name}</span>
                <div className="flex gap-1">
                  <button onClick={() => openEditCat(cat)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => deleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h3 className="font-semibold text-gray-800 text-sm">Menu Items</h3>
          <button
            onClick={() => {
              if (categories.length === 0) { addToast('Add a category first', 'error'); return; }
              setEditingItem(null); setItemName(''); setItemPrice(''); setItemDesc('');
              setSelectedCatId(categories[0].id);
              setItemDrawerOpen(true);
            }}
            className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-700"
          >
            <Plus size={14} /> Add
          </button>
        </div>
        {items.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag size={24} />}
            title="No menu items yet"
            description="Add your first menu item"
            actionLabel="Add Item"
            onAction={() => {
              if (categories.length === 0) { addToast('Add a category first', 'error'); return; }
              setItemDrawerOpen(true);
            }}
          />
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-gray-700">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    ${item.price.toFixed(2)} · {categories.find(c => c.id === item.categoryId)?.name}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => openEditItem(item)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Category Drawer */}
      <Drawer isOpen={catDrawerOpen} onClose={() => setCatDrawerOpen(false)} title={editingCat ? 'Edit Category' : 'New Category'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
            <input
              type="text"
              value={catName}
              onChange={e => setCatName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="e.g., Starters, Main Course"
              autoFocus
            />
          </div>
          <button
            onClick={addCategory}
            className="w-full py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition"
          >
            {editingCat ? 'Update Category' : 'Add Category'}
          </button>
        </div>
      </Drawer>

      {/* Item Drawer */}
      <Drawer isOpen={itemDrawerOpen} onClose={() => setItemDrawerOpen(false)} title={editingItem ? 'Edit Item' : 'New Item'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              value={selectedCatId || ''}
              onChange={e => setSelectedCatId(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 outline-none"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input
              type="text"
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="e.g., Cappuccino"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={itemPrice}
              onChange={e => setItemPrice(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="4.99"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={itemDesc}
              onChange={e => setItemDesc(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none"
              placeholder="Brief description..."
            />
          </div>
          <button
            onClick={addItem}
            className="w-full py-3 bg-indigo-500 text-white rounded-xl font-semibold hover:bg-indigo-600 transition"
          >
            {editingItem ? 'Update Item' : 'Add Item'}
          </button>
        </div>
      </Drawer>
    </div>
  );
}

// ===== REVIEW STEP =====
function ReviewStep({ draft }: { draft: any }) {
  const modules = draft.shop.modulesEnabled || {};
  
  const enabledModules = [
    modules.digitalMenu && { icon: <ShoppingBag size={16} />, label: 'Digital Menu' },
    modules.orderMode && { icon: <ShoppingBag size={16} />, label: `Orders (${draft.shop.orderMode})` },
    modules.wifi && { icon: <Wifi size={16} />, label: 'Wi-Fi' },
    modules.googleReview && { icon: <Star size={16} />, label: 'Google Reviews' },
    modules.loyalty && { icon: <Gift size={16} />, label: 'Loyalty Program' },
    modules.feedback && { icon: <MessageSquare size={16} />, label: 'Feedback' },
    modules.sudoku && { icon: <Gamepad2 size={16} />, label: 'Sudoku Game' },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];

  return (
    <div className="space-y-5">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Review & Publish</h2>
        <p className="text-sm text-gray-500 mt-1">Everything looks good?</p>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          {draft.shop.logo ? (
            <img src={draft.shop.logo} alt="" className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Store size={24} className="text-indigo-500" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900">{draft.shop.name || 'Unnamed Shop'}</h3>
            <p className="text-sm text-gray-500">{draft.shop.tagline || 'No tagline'}</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          {draft.shop.wifiSSID && (
            <p className="text-gray-600">📶 Wi-Fi: {draft.shop.wifiSSID}</p>
          )}
          {draft.shop.waNumber && (
            <p className="text-gray-600">📱 WhatsApp: {draft.shop.waNumber}</p>
          )}
          <p className="text-gray-600">🪑 Tables: {draft.shop.tables || 10}</p>
          <p className="text-gray-600">🍽️ Menu Items: {draft.items?.length || 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <h4 className="font-semibold text-gray-800 mb-3">Enabled Modules</h4>
        <div className="flex flex-wrap gap-2">
          {enabledModules.map((m, i) => (
            <span key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-medium">
              {m.icon} {m.label}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <p className="text-sm text-amber-800">
          💡 After publishing, you'll get unique QR codes for each table. Customers can scan to access your digital hub instantly.
        </p>
      </div>
    </div>
  );
}
