"use client";

import { useState, useEffect } from "react";
import { sendPushNotificationAction, getPushNotificationLogsAction } from "./actions";
import { Send, Loader2, History, CheckCircle2, XCircle } from "lucide-react";
import type { PushLog } from "@/shared/lib/types";

export function PushNotificationManager() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const [logs, setLogs] = useState<PushLog[]>([]);

  const [form, setForm] = useState({
    title_tr: "",
    message_tr: "",
    title_en: "",
    message_en: "",
    route: ""
  });

  const fetchLogs = async () => {
    const data = await getPushNotificationLogsAction();
    setLogs(data || []);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title_tr || !form.message_tr) {
      setMessage({ text: "Lütfen en azından Türkçe başlık ve mesajı doldurun.", type: 'error' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const finalForm = {
        ...form,
        title_en: form.title_en.trim() || form.title_tr,
        message_en: form.message_en.trim() || form.message_tr,
      };

      const res = await sendPushNotificationAction(finalForm);
      if (res.success) {
        setMessage({ text: `Bildirimler başarıyla gönderildi. (Başarılı: ${res.data?.success || 0}, Hatalı: ${res.data?.failed || 0})`, type: 'success' });
        setForm({ title_tr: "", message_tr: "", title_en: "", message_en: "", route: "" });
        fetchLogs();
      } else {
        setMessage({ text: `Gönderim hatası: ${res.error}`, type: 'error' });
      }
    } catch {
      setMessage({ text: "Beklenmeyen bir hata oluştu.", type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-black/10 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          <Send size={20} strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="text-xl font-black text-zinc-900">Push Bildirimleri Gönder</h2>
          <p className="text-sm text-zinc-500">Tüm cihazlara Türkçe ve İngilizce bildirim yollayın.</p>
        </div>
      </div>

      <form onSubmit={handleSend} className="space-y-6">
        {message && (
          <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
            {message.text}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Türkçe */}
          <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
            <h3 className="font-black text-zinc-900 flex items-center gap-2">
              <span className="text-lg">🇹🇷</span> Türkçe Bildirim
            </h3>
            
            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-500 uppercase tracking-wider">Başlık (title_tr)</label>
              <input
                type="text"
                value={form.title_tr}
                onChange={e => setForm(prev => ({ ...prev, title_tr: e.target.value }))}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                placeholder="Örn: Hafta Sonu Fırsatı!"
              />
            </div>
            
            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-500 uppercase tracking-wider">Mesaj (message_tr)</label>
              <textarea
                value={form.message_tr}
                onChange={e => setForm(prev => ({ ...prev, message_tr: e.target.value }))}
                className="w-full min-h-[100px] rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 resize-none"
                placeholder="Örn: Tüm ürünlerde %20 indirim başladı..."
              />
            </div>
          </div>

          {/* English */}
          <div className="space-y-4 rounded-xl border border-zinc-100 bg-zinc-50/50 p-4">
            <h3 className="font-black text-zinc-900 flex items-center gap-2">
              <span className="text-lg">🇬🇧</span> English Push
            </h3>
            
            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-500 uppercase tracking-wider">Title (title_en)</label>
              <input
                type="text"
                value={form.title_en}
                onChange={e => setForm(prev => ({ ...prev, title_en: e.target.value }))}
                className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                placeholder="e.g. Weekend Special!"
              />
            </div>
            
            <div>
              <label className="mb-1 block text-xs font-bold text-zinc-500 uppercase tracking-wider">Message (message_en)</label>
              <textarea
                value={form.message_en}
                onChange={e => setForm(prev => ({ ...prev, message_en: e.target.value }))}
                className="w-full min-h-[100px] rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 resize-none"
                placeholder="e.g. 20% discount on all items starts now..."
              />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-100">
          <label className="mb-1 block text-xs font-bold text-zinc-500 uppercase tracking-wider">Yönlendirme (Route - İsteğe Bağlı)</label>
          <input
            type="text"
            value={form.route}
            onChange={e => setForm(prev => ({ ...prev, route: e.target.value }))}
            className="w-full md:w-1/2 rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-medium focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
            placeholder="Örn: /store/burger-king"
          />
          <p className="mt-1 text-xs text-zinc-400">Kullanıcı bildirime tıkladığında açılacak ekran.</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Gönderiliyor...
            </>
          ) : (
            <>
              <Send size={18} />
              Bildirim Gönder
            </>
          )}
        </button>
      </form>

      {/* History */}
      <div className="mt-12">
        <div className="flex items-center gap-2 mb-6">
          <History className="text-zinc-400" size={20} />
          <h3 className="font-bold text-lg text-zinc-900">Geçmiş Bildirimler</h3>
        </div>
        
        {logs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-8 text-center text-zinc-500">
            Henüz bildirim geçmişi yok.
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => (
              <div key={log.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-zinc-900">{log.title_tr}</h4>
                  <p className="text-sm text-zinc-500 mt-1">{log.message_tr}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-400 font-medium">
                    <span>{new Date(log.created_at).toLocaleString('tr-TR')}</span>
                    {log.route && <span>• Route: {log.route}</span>}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 shrink-0 bg-white border border-zinc-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-sm">
                    <CheckCircle2 size={16} />
                    <span>{log.success_count}</span>
                  </div>
                  <div className="w-px h-4 bg-zinc-200"></div>
                  <div className="flex items-center gap-1.5 text-red-600 font-bold text-sm">
                    <XCircle size={16} />
                    <span>{log.error_count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
