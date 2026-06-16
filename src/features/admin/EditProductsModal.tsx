"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { AdminInput } from "@/features/admin/AdminInput";
import { AdminModal } from "@/features/admin/AdminModal";
import { FALLBACK_IMAGE, ImageUploadField } from "@/features/admin/ImageUploadField";
import { OptionGroupsEditor } from "@/features/admin/OptionGroupsEditor";
import { dictionaries } from "@/shared/i18n/dictionaries";
import type { Locale, Product, MenuOptionGroup, Store, ProductType } from "@/shared/lib/types";

type EditProductsModalProps = {
  locale: Locale;
  store: Store;
  onClose: () => void;
  onSave: (store: Store) => void;
};

export function EditProductsModal({ locale, store, onClose, onSave }: EditProductsModalProps) {
  const t = dictionaries[locale];
  const [selectedItemId, setSelectedItemId] = useState(store.menu[0]?.id ?? "");
  const selectedItem = store.menu.find((item) => item.id === selectedItemId);

  const [nameTr, setNameTr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [descriptionTr, setDescriptionTr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [price, setPrice] = useState("");
  const [calories, setCalories] = useState("");
  const [image, setImage] = useState("");
  const [productType, setProductType] = useState<Product["productType"]>();
  const [optionGroups, setOptionGroups] = useState<MenuOptionGroup[] | undefined>();

  useEffect(() => {
    if (!selectedItem) return;
    setNameTr(selectedItem.name.tr);
    setNameEn(selectedItem.name.en);
    setDescriptionTr(selectedItem.description.tr);
    setDescriptionEn(selectedItem.description.en);
    setPrice(String(selectedItem.price));
    setCalories(String(selectedItem.calories));
    setImage(selectedItem.image);
    setProductType(selectedItem.productType);
    setOptionGroups(selectedItem.optionGroups);
  }, [selectedItem]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedItem) return;

    const updatedItem: Product = {
      ...selectedItem,
      name: { tr: nameTr, en: nameEn },
      description: { tr: descriptionTr, en: descriptionEn },
      price: Number(price) || 0,
      calories: Number(calories) || 0,
      image: image || FALLBACK_IMAGE,
      ...(productType ? { productType } : {}),
      ...(optionGroups?.length ? { optionGroups } : { optionGroups: undefined })
    };

    onSave({
      ...store,
      menu: store.menu.map((item) => (item.id === selectedItem.id ? updatedItem : item))
    });
  }

  return (
    <AdminModal locale={locale} title={t.editItems} onClose={onClose}>
      {store.menu.length === 0 ? (
        <p className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-500">{t.noItems}</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label className="mb-4 block text-sm font-bold">
            {t.selectItem}
            <select
              className="mt-1 w-full rounded-lg border border-black/10 p-3 font-normal"
              value={selectedItemId}
              onChange={(event) => setSelectedItemId(event.target.value)}
            >
              {store.menu.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name[locale]}
                </option>
              ))}
            </select>
          </label>

          {selectedItem && (
            <div className="grid gap-3 sm:grid-cols-2">
              <AdminInput label="TR ürün" value={nameTr} onChange={(event) => setNameTr(event.target.value)} required />
              <AdminInput label="EN item" value={nameEn} onChange={(event) => setNameEn(event.target.value)} required />
              <AdminInput label="TR açıklama" value={descriptionTr} onChange={(event) => setDescriptionTr(event.target.value)} required />
              <AdminInput label="EN description" value={descriptionEn} onChange={(event) => setDescriptionEn(event.target.value)} required />
              <AdminInput label={locale === "tr" ? "Fiyat" : "Price"} type="number" value={price} onChange={(event) => setPrice(event.target.value)} required />
              <AdminInput label={locale === "tr" ? "Kalori" : "Calories"} type="number" value={calories} onChange={(event) => setCalories(event.target.value)} required />
              
                {store.type === "shop" && (
                  <label className="block text-sm font-bold sm:col-span-2">
                    Ürün Tipi
                    <select className="mt-1 w-full rounded-lg border border-black/10 p-3" value={productType || ""} onChange={e => setProductType(e.target.value as ProductType)}>
                      <option value="">Seçiniz</option>
                      <option value="clothing">Giyim</option>
                      <option value="electronics">Elektronik</option>
                      <option value="other">Diğer</option>
                    </select>
                  </label>
                )}
                <ImageUploadField locale={locale} value={image} onChange={setImage} />
            </div>
          )}

          {selectedItem && (
            <OptionGroupsEditor locale={locale} value={optionGroups} onChange={setOptionGroups} />
          )}

          {selectedItem && (
            <button type="submit" className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-orange-600 py-3 font-black text-white">
              <Save size={18} /> {t.saveChanges}
            </button>
          )}
        </form>
      )}
    </AdminModal>
  );
}
