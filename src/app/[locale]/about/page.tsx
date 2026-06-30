import { Locale } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, MapPin, Search, Store, Send } from "lucide-react";

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = dictionaries[locale];

  return (
    <div className="min-h-screen bg-[#fbf5f1] pt-24 pb-12 relative">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto mb-6">
          <Link href={`/${locale}`} className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-zinc-200 text-zinc-700 font-medium hover:bg-white hover:scale-105 transition-all">
            <ArrowLeft size={18} />
            <span>{t.backToApp}</span>
          </Link>
        </div>
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden">
          <div className="bg-[#fb4824] p-8 text-white flex flex-col items-center justify-center text-center">
            <Image src="/images/doppapp-logo-tek.svg" alt="DoppApp Logo" width={64} height={64} className="mb-4 brightness-0 invert" />
            <h1 className="text-4xl font-black mb-2">{t.aboutTitle}</h1>
            <p className="text-white/80 font-medium">DoppApp</p>
          </div>
          
          <div className="p-6 lg:p-12 space-y-8 text-lg text-zinc-700 leading-relaxed">
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-500 hidden md:flex items-center justify-center shrink-0 mt-1">
                <Store size={20} />
              </div>
              <div className="flex-1 space-y-8">
                <p>
                  <strong>DoppApp</strong> {t.aboutP1}
                </p>
                
                <p>
                  {t.aboutP2}
                </p>
                
                <div className="bg-zinc-50 rounded-xl p-6 border border-zinc-100">
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <MapPin size={20} className="text-[#fb4824] shrink-0 mt-1" /> 
                      <span>{t.aboutBullet1}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Search size={20} className="text-[#fb4824] shrink-0 mt-1" /> 
                      <span>{t.aboutBullet2}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Send size={20} className="text-[#fb4824] shrink-0 mt-1" /> 
                      <span>{t.aboutBullet3}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <Store size={20} className="text-[#fb4824] shrink-0 mt-1" /> 
                      <span>{t.aboutBullet4}</span>
                    </li>
                  </ul>
                </div>
                
                <p>
                  {t.aboutP3}
                </p>
              </div>
            </div>
            
            <div className="mt-8 p-6 bg-gradient-to-r from-[#fb4824] to-orange-400 text-white rounded-xl font-bold text-center shadow-md">
              {t.aboutHaveFun}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
