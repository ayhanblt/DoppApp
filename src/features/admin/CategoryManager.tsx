import { useState } from "react";
import { DndContext, DragEndEvent, useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { StoreCategory, ProductCategory, StoreType } from "@/shared/lib/types";
import { addStoreCategoryAction, deleteStoreCategoryAction, addProductCategoryAction, deleteProductCategoryAction, updateStoreCategoryAction, updateProductCategoryAction } from "@/features/admin/actions";
import { GripVertical, Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface CategoryManagerProps {
  storeCategories: StoreCategory[];
  productCategories: ProductCategory[];
  onRefresh: () => Promise<void>;
}

export function CategoryManager({ storeCategories, productCategories, onRefresh }: CategoryManagerProps) {
  const [activeTab, setActiveTab] = useState<StoreType>("shop");

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    
    const draggedId = String(active.id);
    const targetId = String(over.id);

    if (draggedId === targetId) return;

    // Check if dropping a store category onto another store category
    const draggedCat = storeCategories.find(c => c.id === draggedId);
    if (draggedCat) {
      // Prevent circular dependency (very basic check)
      if (draggedCat.parent_id === targetId) return; // already a child
      
      const targetCat = storeCategories.find(c => c.id === targetId);
      if (targetCat || targetId === "root") {
        await updateStoreCategoryAction(draggedId, { parent_id: targetId === "root" ? null : targetId });
        await onRefresh();
      }
    }
  };

  const handleDeleteStoreCat = async (id: string) => {
    if (!confirm("Bu kategoriyi silmek istiyor musunuz? Alt kategoriler ve mağazalar etkilenebilir.")) return;
    const ok = await deleteStoreCategoryAction(id);
    if (!ok) alert("Hata! Kategoriye bağlı mağaza, ürün veya alt kategori bulunuyor.");
    else await onRefresh();
  };

  const handleEditStoreCat = async (id: string, name_tr: string, name_en: string) => {
    await updateStoreCategoryAction(id, { name_tr, name_en });
    await onRefresh();
  };

  const handleAddStoreCat = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = String(formData.get("id"));
    const name_tr = String(formData.get("name_tr"));
    const name_en = String(formData.get("name_en"));
    const parent_id = String(formData.get("parent_id")) || null;
    
    if (!id || !name_tr || !name_en) return;
    if (storeCategories.find(c => c.id === id)) {
      alert("Bu ID zaten var!");
      return;
    }

    await addStoreCategoryAction({ id, type: activeTab, name_tr, name_en, parent_id, sort_order: storeCategories.length } as StoreCategory);
    await onRefresh();
    (e.target as HTMLFormElement).reset();
  };

  const handleDeleteProductCat = async (id: string) => {
    if (!confirm("Bu ürün kategorisini silmek istiyor musunuz?")) return;
    const ok = await deleteProductCategoryAction(id);
    if (!ok) alert("Hata! Bu kategoriye bağlı ürünler bulunuyor.");
    else await onRefresh();
  };

  const handleEditProductCat = async (id: string, name_tr: string, name_en: string) => {
    await updateProductCategoryAction(id, { name_tr, name_en });
    await onRefresh();
  };

  const handleAddProductCat = async (e: React.FormEvent<HTMLFormElement>, storeCatId: string) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const id = String(formData.get("id"));
    const name_tr = String(formData.get("name_tr"));
    const name_en = String(formData.get("name_en"));
    
    if (!id || !name_tr || !name_en) return;
    if (productCategories.find(c => c.id === id)) {
      alert("Bu ID zaten var!");
      return;
    }

    await addProductCategoryAction({ id, store_cat_id: storeCatId, name_tr, name_en, sort_order: productCategories.length } as ProductCategory);
    await onRefresh();
    (e.target as HTMLFormElement).reset();
  };

  // Build tree
  const categoriesForTab = storeCategories.filter(c => c.type === activeTab);
  const rootCategories = categoriesForTab.filter(c => !c.parent_id);

  return (
    <div className="mt-6 rounded-lg bg-white p-5 shadow-sm">
      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div>
          <h2 className="text-xl font-black">Kategori Yönetimi (Ağaç Yapısı)</h2>
          <p className="text-sm text-zinc-600 mt-1">Sürükle bırak ile kategorileri iç içe alabilirsiniz.</p>
        </div>
        <div className="flex gap-2 bg-zinc-100 p-1 rounded-lg">
          {(["shop", "food", "market"] as StoreType[]).map(tab => (
            <button 
              key={tab} 
              className={`px-4 py-1.5 text-sm font-bold rounded-md transition-colors ${activeTab === tab ? 'bg-white shadow-sm text-orange-600' : 'text-zinc-500 hover:text-zinc-700'}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <DndContext onDragEnd={handleDragEnd}>
        <div className="grid gap-8 lg:grid-cols-3">
          
          <div className="lg:col-span-2">
            <RootDroppableZone activeTab={activeTab} />
            <div className="mt-4 flex flex-col gap-2">
              {rootCategories.map(cat => (
                <CategoryNode 
                  key={cat.id} 
                  category={cat} 
                  allStoreCategories={categoriesForTab} 
                  allProductCategories={productCategories}
                  onDeleteStoreCat={handleDeleteStoreCat}
                  onEditStoreCat={handleEditStoreCat}
                  onDeleteProductCat={handleDeleteProductCat}
                  onEditProductCat={handleEditProductCat}
                  onAddProductCat={handleAddProductCat}
                />
              ))}
              {rootCategories.length === 0 && <p className="text-sm text-zinc-500 italic">Henüz kategori eklenmemiş.</p>}
            </div>
          </div>

          {/* Add New Category Form */}
          <div className="rounded-lg border border-black/10 bg-zinc-50 p-4 h-fit sticky top-4">
            <h3 className="font-black mb-4">Yeni Ana Kategori Ekle ({activeTab})</h3>
            <form className="flex flex-col gap-3" onSubmit={handleAddStoreCat}>
              <label className="text-sm font-bold">
                ID (URL Slug)
                <input name="id" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" placeholder="örn: electronics" required />
              </label>
              <label className="text-sm font-bold">
                Türkçe İsim
                <input name="name_tr" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" placeholder="Elektronik" required />
              </label>
              <label className="text-sm font-bold">
                İngilizce İsim
                <input name="name_en" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" placeholder="Electronics" required />
              </label>
              <label className="text-sm font-bold">
                Ebeveyn Kategori (Opsiyonel)
                <select name="parent_id" className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm">
                  <option value="">Yok (Ana Kategori)</option>
                  {categoriesForTab.map(c => <option key={c.id} value={c.id}>{c.name_tr}</option>)}
                </select>
              </label>
              <button className="mt-2 bg-orange-600 text-white w-full py-2 rounded-lg font-black text-sm hover:bg-orange-700">
                Kategori Oluştur
              </button>
            </form>
          </div>

        </div>
      </DndContext>
    </div>
  );
}

// Invisible drop zone to move items back to root
function RootDroppableZone({ activeTab }: { activeTab: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: "root" });
  return (
    <div ref={setNodeRef} className={`p-4 border-2 border-dashed rounded-lg text-center text-sm font-bold transition-colors ${isOver ? 'bg-orange-50 border-orange-400 text-orange-600' : 'border-black/10 text-zinc-400'}`}>
      En üste (Ana kategori olarak) taşımak için buraya bırakın
    </div>
  );
}

interface CategoryNodeProps {
  category: StoreCategory;
  allStoreCategories: StoreCategory[];
  allProductCategories: ProductCategory[];
  onDeleteStoreCat: (id: string) => void;
  onEditStoreCat: (id: string, tr: string, en: string) => void;
  onDeleteProductCat: (id: string) => void;
  onEditProductCat: (id: string, tr: string, en: string) => void;
  onAddProductCat: (e: React.FormEvent<HTMLFormElement>, storeCatId: string) => void;
  depth?: number;
}

function CategoryNode({ category, allStoreCategories, allProductCategories, onDeleteStoreCat, onEditStoreCat, onDeleteProductCat, onEditProductCat, onAddProductCat, depth = 0 }: CategoryNodeProps) {
  const children = allStoreCategories.filter(c => c.parent_id === category.id);
  const products = allProductCategories.filter(c => c.store_cat_id === category.id);
  const [expanded, setExpanded] = useState(true);
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editNameTr, setEditNameTr] = useState(category.name_tr);
  const [editNameEn, setEditNameEn] = useState(category.name_en);
  
  const [editingProductCat, setEditingProductCat] = useState<string | null>(null);
  const [editProductNameTr, setEditProductNameTr] = useState("");
  const [editProductNameEn, setEditProductNameEn] = useState("");

  const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
    id: category.id,
    data: category
  });

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: category.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    marginLeft: `${depth * 24}px`
  };

  return (
    <div style={style} className="flex flex-col gap-2">
      {/* Droppable wrapper */}
      <div 
        ref={setDroppableRef}
        className={`flex flex-col rounded-lg border transition-colors ${isOver ? 'border-orange-400 bg-orange-50' : 'border-black/10 bg-white'}`}
      >
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-3">
            <div ref={setDraggableRef} {...listeners} {...attributes} className="cursor-grab text-zinc-400 hover:text-black">
              <GripVertical size={16} />
            </div>
            <div>
              {isEditing ? (
                <div className="flex gap-2 items-center">
                  <input className="text-sm border rounded px-2 py-1" value={editNameTr} onChange={e => setEditNameTr(e.target.value)} placeholder="TR İsim" />
                  <input className="text-sm border rounded px-2 py-1" value={editNameEn} onChange={e => setEditNameEn(e.target.value)} placeholder="EN İsim" />
                  <button className="text-green-600 hover:bg-green-50 p-1 rounded" onClick={() => { onEditStoreCat(category.id, editNameTr, editNameEn); setIsEditing(false); }}><Check size={14} /></button>
                  <button className="text-zinc-500 hover:bg-zinc-100 p-1 rounded" onClick={() => setIsEditing(false)}><X size={14} /></button>
                </div>
              ) : (
                <p className="font-bold flex items-center gap-2">
                  {category.name_tr} <span className="text-xs font-normal text-zinc-400">#{category.id}</span>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing && <button className="text-zinc-500 hover:bg-zinc-50 p-1 rounded" onClick={() => setIsEditing(true)}><Pencil size={14} /></button>}
            <button className="text-xs font-bold text-[var(--accent)] hover:underline" onClick={() => setShowAddProduct(!showAddProduct)}>+ Ürün Kat.</button>
            <button className="text-xs font-bold text-zinc-500 hover:underline" onClick={() => setExpanded(!expanded)}>{expanded ? 'Gizle' : 'Göster'}</button>
            <button className="text-red-500 hover:bg-red-50 p-1 rounded" onClick={() => onDeleteStoreCat(category.id)}><Trash2 size={14} /></button>
          </div>
        </div>

        {/* Product Categories (Leaf nodes) */}
        {expanded && products.length > 0 && (
          <div className="bg-zinc-50 border-t border-black/5 px-4 py-2 flex flex-col gap-1">
            <p className="text-xs font-bold text-zinc-400 mb-1">BU MAĞAZAYA BAĞLI ÜRÜN KATEGORİLERİ</p>
            {products.map(pCat => (
              <div key={pCat.id} className="flex items-center justify-between bg-white border border-black/5 rounded px-3 py-1.5 text-sm">
                {editingProductCat === pCat.id ? (
                  <div className="flex flex-1 gap-2 items-center">
                    <input className="text-sm border rounded px-2 py-1 flex-1" value={editProductNameTr} onChange={e => setEditProductNameTr(e.target.value)} placeholder="TR İsim" />
                    <input className="text-sm border rounded px-2 py-1 flex-1" value={editProductNameEn} onChange={e => setEditProductNameEn(e.target.value)} placeholder="EN İsim" />
                    <button className="text-green-600 hover:bg-green-50 p-1 rounded" onClick={() => { onEditProductCat(pCat.id, editProductNameTr, editProductNameEn); setEditingProductCat(null); }}><Check size={14} /></button>
                    <button className="text-zinc-500 hover:bg-zinc-100 p-1 rounded" onClick={() => setEditingProductCat(null)}><X size={14} /></button>
                  </div>
                ) : (
                  <>
                    <span>{pCat.name_tr} <span className="text-xs text-zinc-400">#{pCat.id}</span></span>
                    <div className="flex gap-1">
                      <button className="text-zinc-500 hover:bg-zinc-100 p-1 rounded" onClick={() => { setEditingProductCat(pCat.id); setEditProductNameTr(pCat.name_tr); setEditProductNameEn(pCat.name_en); }}><Pencil size={12} /></button>
                      <button className="text-red-500 hover:bg-red-50 p-1 rounded" onClick={() => onDeleteProductCat(pCat.id)}><Trash2 size={12} /></button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Add Product Category Form */}
        {showAddProduct && (
          <form className="bg-orange-50/50 border-t border-orange-100 p-3 flex gap-2" onSubmit={(e) => { onAddProductCat(e, category.id); setShowAddProduct(false); }}>
            <input name="id" placeholder="ID (örn: tatlilar)" className="flex-1 text-sm px-2 py-1.5 border rounded" required />
            <input name="name_tr" placeholder="TR İsim" className="flex-1 text-sm px-2 py-1.5 border rounded" required />
            <input name="name_en" placeholder="EN İsim" className="flex-1 text-sm px-2 py-1.5 border rounded" required />
            <button className="bg-orange-600 text-white px-3 text-sm font-bold rounded">Ekle</button>
          </form>
        )}
      </div>

      {/* Children */}
      {expanded && children.map(child => (
        <CategoryNode 
          key={child.id}
          category={child}
          allStoreCategories={allStoreCategories}
          allProductCategories={allProductCategories}
          onDeleteStoreCat={onDeleteStoreCat}
          onEditStoreCat={onEditStoreCat}
          onDeleteProductCat={onDeleteProductCat}
          onEditProductCat={onEditProductCat}
          onAddProductCat={onAddProductCat}
          depth={depth + 1}
        />
      ))}
    </div>
  );
}
