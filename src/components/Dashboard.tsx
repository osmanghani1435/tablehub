import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, ShoppingBag, MessageSquare, Settings, QrCode,
  Clock, CheckCircle, ChefHat, Trash2, Edit3, Store,
  LogOut, Download, Copy, Star
} from 'lucide-react';
import { shopStore, menuStore, orderStore, feedbackStore } from '../lib/store';
import type { Shop, Order, Feedback, MenuCategory, MenuItem } from '../lib/types';
import { Drawer, EmptyState, useToast, ConfirmDialog } from './ui';
import ShopBuilder from './ShopBuilder';

interface Props {
  shopId: string;
  onBack: () => void;
  onLogout: () => void;
}

type Tab = 'orders' | 'qr' | 'feedback' | 'settings';

export default function Dashboard({ shopId, onBack, onLogout }: Props) {
  const [tab, setTab] = useState<Tab>('orders');
  const [shop, setShop] = useState<Shop | undefined>(shopStore.getById(shopId));
  const [orders, setOrders] = useState<Order[]>(orderStore.getAll(shopId));
  const [feedbacks, setFeedbacks] = useState<Feedback[]>(feedbackStore.getAll(shopId));
  const [editMode, setEditMode] = useState(false);
  const { addToast } = useToast();

  const refresh = useCallback(() => {
    setShop(shopStore.getById(shopId));
    setOrders(orderStore.getAll(shopId));
    setFeedbacks(feedbackStore.getAll(shopId));
  }, [shopId]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2000);
    return () => clearInterval(interval);
  }, [refresh]);

  const advanceOrder = (orderId: string, newStatus: Order['status']) => {
    orderStore.updateStatus(shopId, orderId, newStatus);
    addToast(`Order marked as ${newStatus}`, 'success');
    refresh();
  };

  const deleteOrder = (orderId: string) => {
    orderStore.delete(shopId, orderId);
    addToast('Order deleted', 'info');
    refresh();
  };

  const deleteFeedback = (feedbackId: string) => {
    feedbackStore.delete(shopId, feedbackId);
    addToast('Feedback deleted', 'info');
    refresh();
  };

  if (editMode && shop) {
    return <ShopBuilder onPublished={() => { setEditMode(false); refresh(); }} onBack={() => setEditMode(false)} />;
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Shop not found</p>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'orders', label: 'Orders', icon: <ShoppingBag size={18} /> },
    { key: 'qr', label: 'QR Codes', icon: <QrCode size={18} /> },
    { key: 'feedback', label: 'Feedback', icon: <MessageSquare size={18} /> },
    { key: 'settings', label: 'Settings', icon: <Settings size={18} /> },
  ];

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const preparingOrders = orders.filter(o => o.status === 'preparing');

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-gray-100">
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              {shop.logo ? (
                <img src={shop.logo} alt="" className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                  <Store size={16} className="text-indigo-500" />
                </div>
              )}
              <h1 className="font-bold text-gray-900">{shop.name}</h1>
            </div>
          </div>
          <button onClick={onLogout} className="p-2 rounded-lg hover:bg-red-50 text-red-500">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-lg mx-auto px-2 flex">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition relative ${
                tab === t.key ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {t.icon}
              {t.label}
              {t.key === 'orders' && pendingOrders.length > 0 && (
                <span className="absolute top-2 right-1/4 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {pendingOrders.length}
                </span>
              )}
              {tab === t.key && (
                <motion.div
                  layoutId="tab-indicator"
                  className="absolute bottom-0 left-2 right-2 h-0.5 bg-indigo-500 rounded-full"
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
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {tab === 'orders' && (
              <OrdersTab
                pending={pendingOrders}
                preparing={preparingOrders}
                onAdvance={advanceOrder}
                onDelete={deleteOrder}
              />
            )}
            {tab === 'qr' && <QRTab shop={shop} />}
            {tab === 'feedback' && (
              <FeedbackTab feedbacks={feedbacks} onDelete={deleteFeedback} />
            )}
            {tab === 'settings' && (
              <SettingsTab shop={shop} onEdit={() => setEditMode(true)} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// ===== ORDERS TAB =====
function OrdersTab({ pending, preparing, onAdvance, onDelete }: {
  pending: Order[]; preparing: Order[];
  onAdvance: (id: string, status: Order['status']) => void;
  onDelete: (id: string) => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const renderOrder = (order: Order) => (
    <motion.div
      key={order.id}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="bg-white rounded-xl border border-gray-100 p-4 mb-3"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            Table {order.tableNumber}
          </span>
          <span className="text-xs text-gray-400">
            {new Date(order.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <button onClick={() => setDeleteConfirm(order.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400">
          <Trash2 size={14} />
        </button>
      </div>
      <div className="space-y-1 mb-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-gray-700">{item.quantity}× {item.name}</span>
            <span className="text-gray-500">${(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="font-semibold text-gray-900">${order.total.toFixed(2)}</span>
        <div className="flex gap-2">
          {order.status === 'pending' && (
            <button
              onClick={() => onAdvance(order.id, 'preparing')}
              className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium hover:bg-amber-100"
            >
              <ChefHat size={12} /> Prepare
            </button>
          )}
          {order.status === 'preparing' && (
            <button
              onClick={() => onAdvance(order.id, 'completed')}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100"
            >
              <CheckCircle size={12} /> Complete
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div>
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
        <Clock size={16} className="text-amber-500" /> Pending ({pending.length})
      </h3>
      <AnimatePresence>
        {pending.length === 0 ? (
          <EmptyState icon={<ShoppingBag size={24} />} title="No pending orders" description="Orders will appear here in real-time" />
        ) : (
          pending.map(renderOrder)
        )}
      </AnimatePresence>

      {preparing.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-800 mb-3 mt-6 flex items-center gap-2">
            <ChefHat size={16} className="text-indigo-500" /> Preparing ({preparing.length})
          </h3>
          <AnimatePresence>
            {preparing.map(renderOrder)}
          </AnimatePresence>
        </>
      )}

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && onDelete(deleteConfirm)}
        title="Delete Order"
        message="Are you sure you want to delete this order?"
      />
    </div>
  );
}

// ===== QR TAB =====
function QRTab({ shop }: { shop: Shop }) {
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const { addToast } = useToast();

  const tables = Array.from({ length: shop.tables }, (_, i) => i + 1);
  const baseUrl = window.location.origin;

  const copyUrl = (table: number) => {
    const url = `${baseUrl}/#/shop/${shop.slug}?table=${table}`;
    navigator.clipboard.writeText(url).then(() => {
      addToast('URL copied to clipboard!', 'success');
    });
  };

  return (
    <div>
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-2">Table QR Codes</h3>
        <p className="text-sm text-gray-500 mb-3">
          Print these QR codes and place them on each table. Customers scan to access your hub.
        </p>
        <div className="grid grid-cols-3 gap-3">
          {tables.map(table => (
            <button
              key={table}
              onClick={() => setSelectedTable(table)}
              className="aspect-square bg-gray-50 rounded-xl flex flex-col items-center justify-center p-2 hover:bg-indigo-50 hover:border-indigo-200 border border-gray-100 transition"
            >
              <QRCodeSVG
                value={`${baseUrl}/#/shop/${shop.slug}?table=${table}`}
                size={60}
                level="M"
              />
              <span className="text-[10px] font-medium text-gray-600 mt-1">Table {table}</span>
            </button>
          ))}
        </div>
      </div>

      {/* QR Detail Modal */}
      <Drawer
        isOpen={selectedTable !== null}
        onClose={() => setSelectedTable(null)}
        title={selectedTable ? `Table ${selectedTable} QR` : ''}
      >
        {selectedTable && (
          <div className="flex flex-col items-center">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-4">
              <QRCodeSVG
                value={`${baseUrl}/#/shop/${shop.slug}?table=${selectedTable}`}
                size={200}
                level="H"
              />
            </div>
            <p className="text-sm text-gray-600 mb-2 text-center">
              {baseUrl}/#/shop/{shop.slug}?table={selectedTable}
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => copyUrl(selectedTable)}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition"
              >
                <Copy size={16} /> Copy URL
              </button>
              <button
                onClick={() => {
                  const canvas = document.querySelector('.qr-detail-canvas') as HTMLCanvasElement;
                  if (canvas) {
                    const url = canvas.toDataURL();
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `table-${selectedTable}-qr.png`;
                    a.click();
                  }
                  addToast('QR code downloaded!', 'success');
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-medium hover:bg-emerald-100 transition"
              >
                <Download size={16} /> Download
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

// ===== FEEDBACK TAB =====
function FeedbackTab({ feedbacks, onDelete }: { feedbacks: Feedback[]; onDelete: (id: string) => void }) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  return (
    <div>
      <AnimatePresence>
        {feedbacks.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={24} />}
            title="No feedback yet"
            description="Customer feedback will appear here"
          />
        ) : (
          feedbacks.map(fb => (
            <motion.div
              key={fb.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-xl border border-gray-100 p-4 mb-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {fb.rating && (
                    <div className="flex gap-0.5 mb-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} size={12} className={i < fb.rating! ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                      ))}
                    </div>
                  )}
                  <p className="text-sm text-gray-700">{fb.message}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(fb.createdAt).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteConfirm(fb.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 ml-2"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              {fb.imageUrl && (
                <img src={fb.imageUrl} alt="" className="mt-2 rounded-lg w-full h-32 object-cover" />
              )}
            </motion.div>
          ))
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && onDelete(deleteConfirm)}
        title="Delete Feedback"
        message="Are you sure you want to delete this feedback?"
      />
    </div>
  );
}

// ===== SETTINGS TAB =====
function SettingsTab({ shop, onEdit }: { shop: Shop; onEdit: () => void }) {
  const categories = menuStore.getCategories(shop.id);
  const items = menuStore.getItems(shop.id);

  return (
    <div className="space-y-4">
      {/* Shop Info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-4">
          {shop.logo ? (
            <img src={shop.logo} alt="" className="w-14 h-14 rounded-xl object-cover" />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Store size={24} className="text-indigo-500" />
            </div>
          )}
          <div>
            <h3 className="font-bold text-gray-900">{shop.name}</h3>
            <p className="text-xs text-gray-500">/{shop.slug}</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition"
        >
          <Edit3 size={16} /> Edit Shop Settings
        </button>
      </div>

      {/* Menu Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Menu Summary</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{categories.length}</p>
            <p className="text-xs text-gray-500">Categories</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-indigo-600">{items.length}</p>
            <p className="text-xs text-gray-500">Items</p>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <h4 className="font-semibold text-gray-800 mb-3">Active Modules</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(shop.modulesEnabled).filter(([, v]) => v).map(([key]) => (
            <span key={key} className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
