import React from 'react';
import { dictionaries } from '@/shared/i18n/dictionaries';
import type { Locale } from '@/shared/lib/types';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function FAQPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = dictionaries[locale];

  return (
    <div className="min-h-screen bg-zinc-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-3xl mx-auto mb-6">
        <Link href={`/${locale}`} className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-zinc-200 text-zinc-700 font-medium hover:bg-white hover:scale-105 transition-all">
          <ArrowLeft size={18} />
          <span>{t.backToApp}</span>
        </Link>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-sm border border-zinc-100 overflow-hidden">
        <div className="bg-[var(--accent)] px-8 py-10 text-white flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm">
            <HelpCircle size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black">{t.faqTitle}</h1>
        </div>
        
        <div className="p-8 sm:p-12 divide-y divide-zinc-100">
          {t.faqList.map((item, index) => (
            <div key={index} className={index === 0 ? "pb-6" : "py-6"}>
              <h3 className="font-bold text-zinc-900 text-lg mb-2">{item.q}</h3>
              <p className="text-zinc-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
