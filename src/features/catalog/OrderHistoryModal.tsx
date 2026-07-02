"use client";
import React, { useEffect, useState } from 'react';
import { History, X, FileText } from 'lucide-react';
import { dictionaries } from '@/shared/i18n/dictionaries';
import { Locale, Order } from '@/shared/lib/types';
import { supabase } from '@/shared/api/supabase';

type OrderHistoryModalProps = {
  locale: Locale;
  isOpen: boolean;
  onClose: () => void;
  onViewReceipt: (orderId: string) => void;
};

export function OrderHistoryModal({ locale, isOpen, onClose, onViewReceipt }: OrderHistoryModalProps) {
  const t = dictionaries[locale];
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const stored = localStorage.getItem("doppapp_orders");
        const localIds = stored ? JSON.parse(stored) : [];

        if (localIds.length > 0) {
          const { data, error } = await supabase
            .from('orders')
            .select('*')
            .in('id', localIds)
            .order('created_at', { ascending: false });

          if (!error && data && isMounted) {
            setOrders(data);
          }
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error("Error fetching orders:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchOrders();
    return () => { isMounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatter = new Intl.NumberFormat(locale === "tr" ? "tr-TR" : "en-US", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4 border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--accent)]/10 rounded-full flex items-center justify-center text-[var(--accent)]">
              <History size={20} />
            </div>
            <h3 className="text-xl font-black text-zinc-900">{t.orderHistory}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center hover:bg-zinc-200 transition-colors"
          >
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <History size={48} className="text-zinc-200 mb-4" />
              <p className="text-zinc-500 font-medium">{t.noPastOrders}</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm hover:border-[var(--accent)]/50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-xs text-zinc-500 font-semibold uppercase tracking-wider mb-1">
                      {t.orderDate}
                    </p>
                    <p className="text-zinc-900 font-bold">
                      {new Date(order.created_at).toLocaleDateString(locale === "tr" ? "tr-TR" : "en-US", {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="bg-green-100 px-3 py-1 rounded-full">
                    <span className="text-green-700 font-bold text-xs capitalize">{order.status}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-2 pt-3 border-t border-zinc-100">
                  <span className="text-lg font-black text-[var(--accent)]">{formatter.format(order.total)}</span>

                  <button
                    type="button"
                    onClick={() => onViewReceipt(order.id)}
                    className="flex items-center bg-zinc-100 px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors group"
                  >
                    <FileText size={16} className="text-zinc-600 mr-2 group-hover:text-zinc-900 transition-colors" />
                    <span className="text-zinc-700 font-bold group-hover:text-zinc-900 transition-colors">{t.viewOrder}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
