/* eslint-disable @next/next/no-img-element */

"use client";

import { useState, useEffect } from "react";
import { Locale } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { X, Share2, Copy, Check, Link2 } from "lucide-react";

type ReceiptShareModalProps = {
  locale: Locale;
  imageUrl: string;
  onClose: () => void;
};

export default function ReceiptShareModal({ locale, imageUrl, onClose }: ReceiptShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const [shortId, setShortId] = useState<string | null>(null);

  useEffect(() => {
    const saveReceipt = async () => {
      const dataString = imageUrl.split('data=')[1] || "";
      if (!dataString) return;
      
      try {
        const dataObj = JSON.parse(decodeURIComponent(dataString));
        const { supabase } = await import("@/shared/api/supabase");
        const { data, error } = await supabase.from('shared_receipts').insert({ data: dataObj }).select('id').single();
        if (data?.id) {
          setShortId(data.id);
        }
      } catch (err) {
        console.error("Failed to generate short ID:", err);
      }
    };
    saveReceipt();
  }, [imageUrl]);

  const dataString = imageUrl.split('data=')[1] || "";
  const shareUrl = typeof window !== "undefined" 
    ? (shortId ? `${window.location.origin}/share?id=${shortId}` : `${window.location.origin}/share?data=${dataString}`)
    : "https://doppapp.com";
  const shareText = "İşte benim DoppApp sepetim! Gerçek olsaydı ilk hangi ürünü alırdım dersin? #DoppApp";

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        // We can only share the URL and text via navigator.share directly unless we fetch the blob
        // For simplicity, just share text and url
        await navigator.share({
          title: "DoppApp Sepetim",
          text: shareText,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      alert("Cihazınızda paylaşım desteklenmiyor.");
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'doppapp-sepetim.png', { type: 'image/png' });

      // Try Native Share API first (for Mobile Instagram/Stories)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "DoppApp Sepetim",
          text: shareText
        });
        return;
      }

      // Fallback: Download the file (Desktop)
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "doppapp-sepetim.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error sharing/downloading image:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-zinc-800 flex items-center gap-2"><Share2 size={20} className="text-violet-600"/> Siparişi Paylaş</h3>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200"><X size={18} /></button>
        </div>

        <div className="relative mb-6 rounded-2xl overflow-hidden border border-black/10 shadow-sm bg-zinc-50 flex items-center justify-center min-h-[300px]">
          <img src={imageUrl} alt="Receipt" className="w-full h-auto object-contain" />
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-black/5 text-black hover:bg-black/10 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            <span className="text-[10px] font-bold">X</span>
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-[#4267B2]/10 text-[#4267B2] hover:bg-[#4267B2]/20 transition-colors"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            <span className="text-[10px] font-bold">Facebook</span>
          </a>
          <button
            onClick={downloadImage}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-tr from-[#fd5949] to-[#d6249f] text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            <span className="text-[10px] font-bold">Hikayeye Ekle</span>
          </button>
          <button
            onClick={handleNativeShare}
            className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <Share2 size={24} />
            <span className="text-[10px] font-bold">Diğer</span>
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={async () => {
              try {
                const response = await fetch(imageUrl);
                const blob = await response.blob();
                await navigator.clipboard.write([
                  new ClipboardItem({
                    [blob.type]: blob
                  })
                ]);
                setCopiedImage(true);
                setTimeout(() => setCopiedImage(false), 2000);
              } catch (err) {
                console.error("Error copying image:", err);
                downloadImage(); // fallback
              }
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-bold text-white shadow-sm hover:opacity-90 transition-opacity"
          >
            {copiedImage ? <Check size={18} /> : <Copy size={18} />}
            {copiedImage ? "Kopyalandı!" : "Görseli Kopyala"}
          </button>
          <button
            onClick={handleCopyLink}
            className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-xl bg-white border-2 border-zinc-200 text-zinc-600 shadow-sm hover:bg-zinc-50 transition-colors"
            title="Bağlantıyı Kopyala"
          >
            {copied ? <Check size={20} className="text-emerald-500" /> : <Link2 size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
