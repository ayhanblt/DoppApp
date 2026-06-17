import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { AdminInput, AdminTextarea, AdminLangTabs } from "@/features/admin/AdminInput";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import type { Locale, Store, StoreType, StoreCategory } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";

interface AddStoreFormProps {
  locale: Locale;
  storeCategories: StoreCategory[];
  onAddStore: (storeData: Omit<Store, "id" | "menu">) => Promise<void>;
}

export function AddStoreForm({ locale, storeCategories, onAddStore }: AddStoreFormProps) {
  const t = dictionaries[locale];
  const [newStoreType, setNewStoreType] = useState<StoreType>("food");
  const [addStoreLang, setAddStoreLang] = useState<"tr" | "en">("tr");
  const [newStoreLogo, setNewStoreLogo] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const catId = String(data.get("categoryId"));

    const store: Omit<Store, "id" | "menu"> = {
      type: newStoreType,
      name: { tr: String(data.get("name_tr")), en: String(data.get("name_en")) },
      description: { tr: String(data.get("desc_tr")), en: String(data.get("desc_en")) },
      category_id: catId,
      logo: newStoreLogo || "https://placehold.co/100x100.webp?text=Logo",
      badge: data.get("badge_tr") ? { tr: String(data.get("badge_tr")), en: String(data.get("badge_en")) } : undefined,
      rating: Number(data.get("rating") || 4.7),
      reviews: Number(data.get("reviews") || 100),
      eta: String(data.get("eta") || "20-30"),
      deliveryFee: Number(data.get("deliveryFee") || 60),
      coordinate: [Number(data.get("lat") || 41.037), Number(data.get("lng") || 28.985)],
    };
    await onAddStore(store);
    setNewStoreLogo("");
    event.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><Plus size={20} /> {t.addStore}</h2>
      <div className="grid gap-3 sm:grid-cols-2">

        <label className="block text-sm font-bold sm:col-span-2">
          Mağaza Tipi
          <select name="type" className="mt-1 w-full rounded-lg border border-black/10 p-3" value={newStoreType} onChange={(e) => setNewStoreType(e.target.value as StoreType)}>
            <option value="shop">Shop (Giyim, Elektronik vs.)</option>
            <option value="food">Food (Yemek)</option>
            <option value="market">Market</option>
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2 sm:col-span-2">
          <AdminLangTabs active={addStoreLang} onChange={setAddStoreLang} />
          
          <div className={addStoreLang === "tr" ? "sm:col-span-2 space-y-4" : "hidden"}>
            <AdminInput name="name_tr" label="İsim" required={addStoreLang === "tr"} />
            <AdminTextarea name="desc_tr" label="Açıklama" />
            <AdminInput name="badge_tr" label="Rozet" />
          </div>
          
          <div className={addStoreLang === "en" ? "sm:col-span-2 space-y-4" : "hidden"}>
            <AdminInput name="name_en" label="Name" required={addStoreLang === "en"} />
            <AdminTextarea name="desc_en" label="Description" />
            <AdminInput name="badge_en" label="Badge" />
          </div>

          <label className="block text-sm font-bold sm:col-span-2 mt-2">
            Kategori
            <select name="categoryId" className="mt-1 w-full rounded-lg border border-black/10 p-3 h-[46px]" required>
              <option value="">Seçiniz</option>
              {storeCategories.filter(c => c.type === newStoreType).map(c => <option key={c.id} value={c.id}>{c.name_tr} ({c.name_en})</option>)}
            </select>
          </label>
        </div>

        <div className="sm:col-span-2">
          <input type="hidden" name="logo" value={newStoreLogo} />
          <ImageUploadField locale={locale} value={newStoreLogo} onChange={setNewStoreLogo} />
        </div>

        <AdminInput name="rating" label="Puan" type="number" step="0.1" />
        <AdminInput name="reviews" label="Yorum sayısı" type="number" />
        <AdminInput name="eta" label="ETA dk" />
        <AdminInput name="deliveryFee" label="Teslimat ücreti" type="number" />
        <AdminInput name="lat" label="Latitude" type="number" step="0.0001" />
        <AdminInput name="lng" label="Longitude" type="number" step="0.0001" />
      </div>
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 font-black text-white">
        <Save size={18} /> {t.saveDraft}
      </button>
    </form>
  );
}
