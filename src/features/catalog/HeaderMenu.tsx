"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Info, MessageSquare, BookOpen as AboutIcon, Globe, Shield, HelpCircle } from "lucide-react";
import { Locale } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";

type HeaderMenuProps = {
  locale: Locale;
  onOpenInfo: () => void;
  onOpenFeedback: () => void;
};

export function HeaderMenu({ locale, onOpenInfo, onOpenFeedback }: HeaderMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const t = dictionaries[locale];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const toggleLangUrl = pathname ? pathname.replace(`/${locale}`, `/${locale === "tr" ? "en" : "tr"}`) : `/${locale === "tr" ? "en" : "tr"}`;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/18 text-white transition-colors hover:bg-white/30"
        aria-label="Menu"
      >
        <Menu size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-zinc-200 bg-white shadow-xl py-2 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          <Link
            href={toggleLangUrl}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Globe size={18} className="text-zinc-400" />
            {locale === "tr" ? t.langEn : t.langTr}
          </Link>



          <Link
            href={`/${locale}/about`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <AboutIcon size={18} className="text-zinc-400" />
            {t.about}
          </Link>

          <Link
            href={`/${locale}/faq`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <HelpCircle size={18} className="text-zinc-400" />
            {t.faq}
          </Link>

          <Link
            href={`/${locale}/privacy-policy`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <Shield size={18} className="text-zinc-400" />
            {t.privacyPolicy}
          </Link>

          <div className="mx-4 my-1 h-px bg-zinc-100" />

          <button
            onClick={() => { setIsOpen(false); onOpenFeedback(); }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <MessageSquare size={18} className="text-zinc-400" />
            {t.sendFeedback}
          </button>

        </div>
      )}
    </div>
  );
}
