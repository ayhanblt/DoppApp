"use client";

import { Plus, Trash2 } from "lucide-react";

import type { Locale, MenuOptionGroup } from "@/shared/lib/types";
import { dictionaries } from "@/shared/i18n/dictionaries";
import { uid } from "@/shared/lib/format";

type OptionGroupsEditorProps = {
  locale: Locale;
  value: MenuOptionGroup[] | undefined;
  onChange: (groups: MenuOptionGroup[] | undefined) => void;
};

const defaultOptionGroups: MenuOptionGroup[] = [
  {
    id: "spice",
    label: { tr: "Lezzet", en: "Flavor" },
    required: true,
    options: [
      { id: "mild", label: { tr: "Sade", en: "Mild" }, priceDelta: 0 },
      { id: "normal", label: { tr: "Orta", en: "Regular" }, priceDelta: 0 },
      { id: "hot", label: { tr: "Acılı", en: "Hot" }, priceDelta: 0 }
    ]
  },
  {
    id: "size",
    label: { tr: "Boyut", en: "Size" },
    options: [
      { id: "small", label: { tr: "Küçük", en: "Small" }, priceDelta: -30 },
      { id: "regular", label: { tr: "Normal", en: "Regular" }, priceDelta: 0 },
      { id: "large", label: { tr: "Büyük", en: "Large" }, priceDelta: 45 }
    ]
  },
  {
    id: "extras",
    label: { tr: "Ek ürünler", en: "Extras" },
    multiple: true,
    options: [
      { id: "cheese", label: { tr: "Peynir sos", en: "Cheese sauce" }, priceDelta: 35 },
      { id: "drink", label: { tr: "İçecek ekle", en: "Add drink" }, priceDelta: 45 }
    ]
  }
];

function cloneDefaultGroups(): MenuOptionGroup[] {
  return defaultOptionGroups.map((group) => ({
    ...group,
    options: group.options.map((option) => ({ ...option }))
  }));
}

export function OptionGroupsEditor({ locale, value, onChange }: OptionGroupsEditorProps) {
  const enabled = Boolean(value?.length);
  const t = dictionaries[locale];
  const groups = value ?? [];

  function updateGroups(next: MenuOptionGroup[]) {
    onChange(next.length ? next : undefined);
  }

  function addGroup() {
    updateGroups([
      ...groups,
      {
        id: uid("group"),
        label: { tr: "", en: "" },
        options: [{ id: uid("option"), label: { tr: "", en: "" }, priceDelta: 0 }]
      }
    ]);
  }

  function updateGroup(index: number, patch: Partial<MenuOptionGroup>) {
    updateGroups(groups.map((group, groupIndex) => (groupIndex === index ? { ...group, ...patch } : group)));
  }

  function removeGroup(index: number) {
    updateGroups(groups.filter((_, groupIndex) => groupIndex !== index));
  }

  function addOption(groupIndex: number) {
    updateGroup(groupIndex, {
      options: [
        ...groups[groupIndex].options,
        { id: uid("option"), label: { tr: "", en: "" }, priceDelta: 0 }
      ]
    });
  }

  function updateOption(groupIndex: number, optionIndex: number, patch: Partial<MenuOptionGroup["options"][number]>) {
    const nextOptions = groups[groupIndex].options.map((option, currentIndex) =>
      currentIndex === optionIndex ? { ...option, ...patch } : option
    );
    updateGroup(groupIndex, { options: nextOptions });
  }

  function removeOption(groupIndex: number, optionIndex: number) {
    const nextOptions = groups[groupIndex].options.filter((_, currentIndex) => currentIndex !== optionIndex);
    if (!nextOptions.length) return;
    updateGroup(groupIndex, { options: nextOptions });
  }

  return (
    <div className="mt-4 rounded-lg border border-black/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-bold">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onChange(event.target.checked ? cloneDefaultGroups() : undefined)}
          />
          {t.addOptionGroups}
        </label>
        {enabled && (
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold"
              onClick={() => onChange(cloneDefaultGroups())}
            >
              {t.defaultTemplate}
            </button>
            <button
              type="button"
              className="flex items-center gap-1 rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold"
              onClick={addGroup}
            >
              <Plus size={14} /> {t.addGroup}
            </button>
          </div>
        )}
      </div>

      {enabled && (
        <div className="mt-4 space-y-4">
          {groups.map((group, groupIndex) => (
            <div key={group.id} className="rounded-lg bg-zinc-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="text-sm font-black">
                  {t.groupIndex(groupIndex + 1)}
                </p>
                <button
                  type="button"
                  className="text-zinc-400"
                  onClick={() => removeGroup(groupIndex)}
                  aria-label={t.removeGroup}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid gap-2">
                <input className="w-full rounded border p-2 text-sm" value={group.label.tr} onChange={(e) => updateGroup(groupIndex, { label: { ...group.label, tr: e.target.value } })} placeholder="Opsiyon grubu adı (örn: İçecek Seçimi)" />
                <input className="w-full rounded border p-2 text-sm" value={group.label.en} onChange={(e) => updateGroup(groupIndex, { label: { ...group.label, en: e.target.value } })} placeholder="Option group name (e.g. Choose Drink)" />
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <label className="flex items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    checked={Boolean(group.required)}
                    onChange={(event) => updateGroup(groupIndex, { required: event.target.checked || undefined })}
                  />
                  {t.required}
                </label>
                <label className="flex items-center gap-2 font-bold">
                  <input
                    type="checkbox"
                    checked={Boolean(group.multiple)}
                    onChange={(event) => updateGroup(groupIndex, { multiple: event.target.checked || undefined })}
                  />
                  {t.multipleSelection}
                </label>
              </div>
              <div className="mt-3 space-y-2">
                {group.options.map((option, optionIndex) => (
                  <div key={option.id} className="grid gap-2 rounded-lg border border-black/10 bg-white p-2 sm:grid-cols-[1fr_120px_auto]">
                    <div className="grid gap-2">
                      <input className="w-full rounded border p-2 text-sm" value={option.label.tr} onChange={(e) => updateOption(groupIndex, optionIndex, { label: { ...option.label, tr: e.target.value } })} placeholder="Opsiyon adı (örn: Kola)" />
                      <input className="w-full rounded border p-2 text-sm" value={option.label.en} onChange={(e) => updateOption(groupIndex, optionIndex, { label: { ...option.label, en: e.target.value } })} placeholder="Option name (e.g. Cola)" />
                    </div>
                    <Field
                      label={t.priceDelta}
                      type="number"
                      value={String(option.priceDelta)}
                      onChange={(next) =>
                        updateOption(groupIndex, optionIndex, { priceDelta: Number(next) || 0 })
                      }
                    />
                    <button
                      type="button"
                      className="self-end text-zinc-400"
                      onClick={() => removeOption(groupIndex, optionIndex)}
                      aria-label={t.removeOption}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-bold text-orange-600"
                  onClick={() => addOption(groupIndex)}
                >
                  <Plus size={14} /> {t.addOption}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="block text-xs font-bold">
      {label}
      <input
        className="mt-1 w-full rounded-lg border border-black/10 p-2 font-normal"
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
