import { useState } from "react";
import { Plus, Save } from "lucide-react";
import { AdminInput, AdminTextarea, AdminLangTabs } from "@/features/admin/AdminInput";
import { FALLBACK_IMAGE, ImageUploadField } from "@/features/admin/image-library/ui/ImageUploadField";
import { OptionGroupsEditor } from "@/features/admin/OptionGroupsEditor";
import type { Locale, MenuOptionGroup, Store, StoreType, StoreCategory, ProductCategory, Product } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";

interface AddItemFormProps {
  locale: Locale;
  stores: Store[];
  storeCategories: StoreCategory[];
  productCategories: ProductCategory[];
  activeTab: StoreType | "all";
  selectedStore: string;
  setSelectedStore: (id: string) => void;
  onAddItem: (storeId: string, itemData: Omit<Product, "id">) => Promise<void>;
}

export function AddItemForm({ locale, stores, storeCategories, productCategories, activeTab, selectedStore, setSelectedStore, onAddItem }: AddItemFormProps) {
  const t = dictionaries[locale];
  const [addItemLang, setAddItemLang] = useState<"tr" | "en">("tr");
  const [itemImage, setItemImage] = useState("");
  const [itemOptionGroups, setItemOptionGroups] = useState<MenuOptionGroup[] | undefined>();

  const selectedStoreObj = stores.find(s => s.id === selectedStore);

  const getValidStoreCatIds = (baseId: string) => {
    const validIds = new Set<string>();
    const traverse = (id: string) => {
      if (!validIds.has(id)) {
        validIds.add(id);
        storeCategories.filter(c => c.parent_id === id).forEach(child => traverse(child.id));
      }
    };
    traverse(baseId);
    return Array.from(validIds);
  };

  const validStoreCatIds = selectedStoreObj?.category_id ? getValidStoreCatIds(selectedStoreObj.category_id) : [];

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const itemData = {
      calories: data.get("calories") ? Number(data.get("calories")) : 0,
      name: { tr: String(data.get("name_tr")), en: String(data.get("name_en")) },
      description: { tr: String(data.get("desc_tr")), en: String(data.get("desc_en")) },
      price: Number(data.get("price") || 0),
      image: itemImage || FALLBACK_IMAGE,
      product_category_id: String(data.get("product_category_id") || ""),
      section_label_tr: data.get("section_label_tr") ? String(data.get("section_label_tr")) : null,
      section_label_en: data.get("section_label_en") ? String(data.get("section_label_en")) : null,
      section_color: data.get("section_color") ? String(data.get("section_color")) : null,
      ...(itemOptionGroups?.length ? { optionGroups: itemOptionGroups } : {})
    };
    
    await onAddItem(selectedStore, itemData);
    setItemImage("");
    setItemOptionGroups(undefined);
    event.currentTarget.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg bg-white p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 text-xl font-black"><Plus size={20} /> {t.addItem}</h2>
      <label className="mb-3 block text-sm font-bold">
        Restoran
        <select className="mt-1 w-full rounded-lg border border-black/10 p-3" value={selectedStore} onChange={(event) => setSelectedStore(event.target.value)}>
          {stores.filter(s => activeTab === "all" || s.type === activeTab).map((store) => (
            <option key={store.id} value={store.id}>{store.name.tr}</option>
          ))}
        </select>
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminLangTabs active={addItemLang} onChange={setAddItemLang} />
        
        <div className={addItemLang === "tr" ? "sm:col-span-2 space-y-4" : "hidden"}>
          <AdminInput name="name_tr" label="Ürün Adı" required={addItemLang === "tr"} />
          <AdminTextarea name="desc_tr" label="Açıklama" required={addItemLang === "tr"} />
          <AdminInput name="section_label_tr" label="Özel Başlık (Opsiyonel)" placeholder="Boş bırakılırsa kategori adı kullanılır" />
        </div>
        
        <div className={addItemLang === "en" ? "sm:col-span-2 space-y-4" : "hidden"}>
          <AdminInput name="name_en" label="Product Name" required={addItemLang === "en"} />
          <AdminTextarea name="desc_en" label="Description" required={addItemLang === "en"} />
          <AdminInput name="section_label_en" label="Custom Section Title (Optional)" placeholder="Leave empty to use category name" />
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-3 sm:col-span-2 mt-2">
          <label className="block text-sm font-bold">
            Ürün Kategorisi
            <select name="product_category_id" className="mt-1 w-full rounded-lg border border-black/10 p-3 h-[46px]" required>
              <option value="">Seçiniz</option>
              {productCategories.filter(c => !selectedStoreObj?.category_id || validStoreCatIds.includes(c.store_cat_id)).map(c => (
                <option key={c.id} value={c.id}>{c.name_tr} ({c.name_en})</option>
              ))}
            </select>
            {productCategories.filter(c => !selectedStoreObj?.category_id || validStoreCatIds.includes(c.store_cat_id)).length === 0 && (
              <p className="text-red-500 text-xs mt-1">Görünür alt kategori bulunamadı! Lütfen Kategori Yönetiminden ekleyin.</p>
            )}
          </label>
          <label className="block text-sm font-bold text-center">
            Renk
            <input type="color" name="section_color" defaultValue="#f97316" className="mt-1 block h-[46px] w-[46px] cursor-pointer rounded-full border-none p-0 overflow-hidden bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none mx-auto shadow-sm" />
          </label>
        </div>
        
        <AdminInput name="price" label="Fiyat (TL)" type="number" required />
        {selectedStoreObj?.type === "shop" ? null : (
          <AdminInput name="calories" label="Kalori" type="number" />
        )}
        <div className="sm:col-span-2">
          <ImageUploadField locale={locale} value={itemImage} onChange={setItemImage} slugName={"product"} />
        </div>
      </div>
      <OptionGroupsEditor locale={locale} value={itemOptionGroups} onChange={setItemOptionGroups} />
      <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 font-black text-white">
        <Save size={18} /> {t.saveDraft}
      </button>
    </form>
  );
}
