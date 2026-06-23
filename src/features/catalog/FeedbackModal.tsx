"use client";

import { useState, useEffect } from "react";
import { Locale } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { X, Send } from "lucide-react";
import toast from "react-hot-toast";

type FeedbackModalProps = {
  locale: Locale;
  isOpen: boolean;
  onClose: () => void;
};

export function FeedbackModal({ locale, isOpen, onClose }: FeedbackModalProps) {
  const t = dictionaries[locale];
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      title: formData.get("title") as string,
      message_type: formData.get("message_type") as string,
      message: formData.get("message") as string,
    };

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        toast.success(t.feedbackSuccess);
        onClose();
      } else {
        throw new Error("Failed to send");
      }
    } catch (err) {
      toast.error(t.feedbackError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black">{t.sendFeedback}</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-zinc-100 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">{t.nameSurnameOptional}</label>
            <input name="name" type="text" className="w-full rounded-xl border border-zinc-300 p-3 text-sm outline-none focus:border-[var(--accent)]" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">{t.emailLabel}</label>
            <input name="email" type="email" required className="w-full rounded-xl border border-zinc-300 p-3 text-sm outline-none focus:border-[var(--accent)]" />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">{t.titleLabel}</label>
            <input name="title" type="text" required className="w-full rounded-xl border border-zinc-300 p-3 text-sm outline-none focus:border-[var(--accent)]" />
          </div>

          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">{t.feedbackType}</label>
            <select name="message_type" required className="w-full rounded-xl border border-zinc-300 p-3 text-sm outline-none focus:border-[var(--accent)] bg-white appearance-none">
              <option value="">{t.selectOption}</option>
              <option value="istek">{t.typeRequest}</option>
              <option value="urun_ekleme">{t.typeProductRequest}</option>
              <option value="sikayet">{t.typeComplaint}</option>
              <option value="tesekkur">{t.typeThanks}</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-zinc-700 mb-1">{t.messageLabel}</label>
            <textarea name="message" required rows={4} className="w-full rounded-xl border border-zinc-300 p-3 text-sm outline-none focus:border-[var(--accent)] resize-none" />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-black text-white shadow-md transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:hover:scale-100"
            style={{ backgroundColor: 'var(--accent)' }}
          >
            {loading ? t.sending : (
              <>
                <Send size={18} />
                {t.send}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
