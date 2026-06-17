"use client";

import { useState, useEffect } from "react";
import { Pencil, Trash2, Save, Plus } from "lucide-react";
import { AdminInput, AdminTextarea, AdminLangTabs } from "@/features/admin/AdminInput";
import { AdminModal } from "@/features/admin/AdminModal";
import { FALLBACK_IMAGE, ImageUploadField } from "@/features/admin/ImageUploadField";
import { OptionGroupsEditor } from "@/features/admin/OptionGroupsEditor";
import { deleteProductFromSupabase } from "@/features/catalog/data";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { formatMoney } from "@/shared/lib/format";
import type { Locale, Product, MenuOptionGroup, Store, ProductCategory } from "@/shared/lib/types";
import Image from "next/image";

type EditProductsModalProps = {
  locale: Locale;
  store: Store;
  productCategories: ProductCategory[];
  onClose: () => void;
  onSave: (store: Store) => void;
};

export function EditProductsModal({ locale, store, productCategories, onClose, onSave }: EditProductsModalProps) {
  const t = dictionaries[locale];
  
  // Sort products alphabetically
  const sortedMenu = [...store.menu].sort((a, b) => a.name.tr.localeCompare(b.name.tr));
  
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [nameTr, setNameTr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descTr, setDescTr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [lang, setLang] = useState<"tr" | "en">("tr");
  const [price, setPrice] = useState("");
  const [calories, setCalories] = useState("");
  const [image, setImage] = useState("");
  const [optionGroups, setOptionGroups] = useState<MenuOptionGroup[] | undefined>();
  const [productCategoryId, setProductCategoryId] = useState("");
  const [sectionLabelTr, setSectionLabelTr] = useState("");
  const [sectionLabelEn, setSectionLabelEn] = useState("");
  const [sectionColor, setSectionColor] = useState("#f97316");

  useEffect(() => {
    if (editingProduct) {
      setNameTr(editingProduct.name.tr);
      setNameEn(editingProduct.name.en);
      setDescTr(editingProduct.description.tr);
      setDescEn(editingProduct.description.en);
      setPrice(String(editingProduct.price));
      setCalories(String(editingProduct.calories));
      setImage(editingProduct.image);
      setOptionGroups(editingProduct.optionGroups);
      setProductCategoryId(editingProduct.product_category_id || "");
      setSectionLabelTr(editingProduct.section_label_tr || "");
      setSectionLabelEn(editingProduct.section_label_en || "");
      setSectionColor(editingProduct.section_color || "#f97316");
    }
  }, [editingProduct]);

  function startEditing(product: Product) {
    setEditingProduct(product);
  }

  async function handleDelete(product: Product) {
    if (!confirm(`"${product.name.tr}" ürününü silmek istediğinize emin misiniz?`)) return;
    
    // Call Supabase delete
    await deleteProductFromSupabase(product.id);
    
    // Update local store state
    onSave({
      ...store,
      menu: store.menu.filter((p) => p.id !== product.id)
    });
  }

  function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingProduct) return;

    const updatedItem: Product = {
      ...editingProduct,
      name: { tr: nameTr, en: nameEn },
      description: { tr: descTr, en: descEn },
      price: Number(price) || 0,
      calories: Number(calories) || 0,
      image: image || FALLBACK_IMAGE,
      product_category_id: productCategoryId,
      section_label_tr: sectionLabelTr || null,
      section_label_en: sectionLabelEn || null,
      section_color: sectionColor,
      ...(optionGroups?.length ? { optionGroups } : { optionGroups: undefined })
    };

    onSave({
      ...store,
      menu: store.menu.map((item) => (item.id === editingProduct.id ? updatedItem : item))
    });
    
    setEditingProduct(null); // Return to list view
  }

  if (editingProduct) {
    return (
      <AdminModal locale={locale} title={`Düzenle: ${editingProduct.name.tr}`} onClose={() => setEditingProduct(null)}>
        <form onSubmit={handleSave}>
          <div className="grid gap-3">
            <AdminLangTabs active={lang} onChange={setLang} />
            
            <div className={lang === "tr" ? "sm:col-span-2 space-y-4" : "hidden"}>
              <AdminInput label="Ürün Adı" value={nameTr} onChange={(e) => setNameTr(e.target.value)} required={lang === "tr"} />
              <AdminTextarea label="Açıklama" value={descTr} onChange={(e) => setDescTr(e.target.value)} required={lang === "tr"} />
              <AdminInput label="Özel Başlık (Opsiyonel)" placeholder="Boş bırakılırsa kategori adı kullanılır" value={sectionLabelTr} onChange={(e) => setSectionLabelTr(e.target.value)} />
            </div>
            <div className={lang === "en" ? "sm:col-span-2 space-y-4" : "hidden"}>
              <AdminInput label="Product Name" value={nameEn} onChange={(e) => setNameEn(e.target.value)} required={lang === "en"} />
              <AdminTextarea label="Description" value={descEn} onChange={(e) => setDescEn(e.target.value)} required={lang === "en"} />
              <AdminInput label="Custom Section Title (Optional)" placeholder="Leave empty to use category name" value={sectionLabelEn} onChange={(e) => setSectionLabelEn(e.target.value)} />
            </div>

            <div className="grid grid-cols-[1fr_auto] gap-3 sm:col-span-2 mt-2">
              <label className="block text-sm font-bold">
                Ürün Kategorisi
                <select className="mt-1 w-full rounded-lg border border-black/10 p-3 h-[46px]" value={productCategoryId} onChange={(e) => setProductCategoryId(e.target.value)} required>
                  <option value="">Seçiniz</option>
                  {productCategories.filter(c => !store.category_id || c.store_cat_id === store.category_id).map(c => (
                    <option key={c.id} value={c.id}>{c.name_tr} ({c.name_en})</option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-bold text-center">
                Renk
                <input type="color" value={sectionColor} onChange={(e) => setSectionColor(e.target.value)} className="mt-1 block h-[46px] w-[46px] cursor-pointer rounded-full border-none p-0 overflow-hidden bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none mx-auto shadow-sm" />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <AdminInput label={t.price} type="number" value={price} onChange={(event) => setPrice(event.target.value)} required />
              {store.type !== "shop" && (
                <AdminInput label={t.calories} type="number" value={calories} onChange={(event) => setCalories(event.target.value)} />
              )}
            </div>
            
            <ImageUploadField locale={locale} value={image} onChange={setImage} />
          </div>

          <OptionGroupsEditor locale={locale} value={optionGroups} onChange={setOptionGroups} />

          <div className="mt-6 flex gap-3">
            <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 rounded-lg border border-black/10 py-3 font-bold text-zinc-600">İptal</button>
            <button type="submit" className="flex flex-[2] items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 font-black text-white">
              <Save size={18} /> {t.saveChanges}
            </button>
          </div>
        </form>
      </AdminModal>
    );
  }

  return (
    <AdminModal locale={locale} title={`${store.name.tr} Ürünleri`} onClose={onClose}>
      {sortedMenu.length === 0 ? (
        <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">{t.noItems}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {sortedMenu.map((product) => (
            <div key={product.id} className="flex items-center justify-between gap-4 rounded-lg border border-black/10 p-3">
              <div className="flex items-center gap-3">
                <Image width={64} height={64} className="h-12 w-12 rounded-lg object-cover" src={product.image} alt="" />
                <div>
                  <h4 className="font-bold">{product.name.tr}</h4>
                  <p className="text-sm font-bold text-[var(--accent)]">{formatMoney(product.price, locale)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEditing(product)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 hover:bg-zinc-200">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(product)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminModal>
  );
}
