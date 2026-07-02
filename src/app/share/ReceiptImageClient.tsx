"use client";

import { useState } from "react";

export default function ReceiptImageClient({ imageUrl }: { imageUrl: string }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative rounded-3xl overflow-hidden shadow-2xl mb-8 max-w-md w-full border border-black/5 bg-zinc-50 min-h-[400px] flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 z-10 bg-zinc-200 animate-pulse" />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt="DoppApp Sepetim"
        className={`w-full h-auto object-contain transition-opacity duration-500 relative z-20 ${loading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
