"use client";

import type { Locale } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";

type AdminModalProps = {
  locale: Locale;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
};

export function AdminModal({ locale, title, children, onClose }: AdminModalProps) {
  const t = dictionaries[locale];

  return (
    <div className="fixed inset-0 z-50 bg-black/35 p-4">
      <div className="mx-auto max-h-[92vh] max-w-2xl overflow-auto rounded-lg bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xl font-black">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-zinc-100 font-bold"
            aria-label={t.close}
          >
            ×
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
