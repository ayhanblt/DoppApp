export function AdminInput({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input className="mt-1 w-full rounded-lg border border-black/10 p-3 font-normal" {...props} />
    </label>
  );
}

export function AdminTextarea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <textarea className="mt-1 w-full rounded-lg border border-black/10 p-3 font-normal min-h-[100px]" {...props} />
    </label>
  );
}

export function AdminLangTabs({ active, onChange }: { active: "tr" | "en", onChange: (lang: "tr" | "en") => void }) {
  return (
    <div className="mb-4 flex gap-2 border-b border-black/10 pb-2 sm:col-span-2">
      <button type="button" className={`px-4 py-2 font-bold text-sm ${active === "tr" ? "border-b-2 border-orange-600 text-orange-600" : "text-zinc-500"}`} onClick={() => onChange("tr")}>🇹🇷 Türkçe</button>
      <button type="button" className={`px-4 py-2 font-bold text-sm ${active === "en" ? "border-b-2 border-orange-600 text-orange-600" : "text-zinc-500"}`} onClick={() => onChange("en")}>🇬🇧 English</button>
    </div>
  );
}
