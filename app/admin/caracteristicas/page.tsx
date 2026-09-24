'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import {
  SlidersHorizontal, Search, Plus, Trash2, Loader2, ChevronLeft, ChevronUp, ChevronDown,
  Tag, X, Check, Pencil, ListPlus, AlertTriangle,
} from 'lucide-react';

type ProductType = {
  id: string;
  name: string;
  created_by_admin: boolean;
};

type DataType = 'text' | 'number' | 'boolean' | 'select' | 'color';

type Attribute = {
  id: string;
  product_type_id: string;
  key: string;
  label: string;
  data_type: DataType;
  unit: string | null;
  options: string[] | null;
  is_variant: boolean;
  is_required: boolean;
  display_order: number;
};

const DATA_TYPE_LABELS: Record<DataType, string> = {
  text: 'Texto',
  number: 'Número',
  boolean: 'Sí / No',
  select: 'Opciones (lista)',
  color: 'Color',
};

function slugify(label: string) {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

const BLANK_ATTR_DRAFT = { label: '', data_type: 'text' as DataType, unit: '', options: [] as string[], is_variant: false, is_required: false };

export default function CaracteristicasPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const [types, setTypes] = useState<ProductType[]>([]);
  const [attrCounts, setAttrCounts] = useState<Record<string, number>>({});
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [loadingAttrs, setLoadingAttrs] = useState(false);

  const [creatingType, setCreatingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [savingType, setSavingType] = useState(false);

  const [renamingType, setRenamingType] = useState(false);
  const [typeNameDraft, setTypeNameDraft] = useState('');
  const [deletingType, setDeletingType] = useState(false);

  const [addingAttr, setAddingAttr] = useState(false);
  const [attrDraft, setAttrDraft] = useState(BLANK_ATTR_DRAFT);
  const [optionDraft, setOptionDraft] = useState('');
  const [savingAttr, setSavingAttr] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadTypes = useCallback(async () => {
    if (!tenantId) return;
    setLoadingTypes(true);
    const [{ data: typesData }, { data: attrsData }, { data: productsData }] = await Promise.all([
      supabase.from('product_types').select('id, name, created_by_admin').eq('tenant_id', tenantId).order('name'),
      supabase.from('product_type_attributes').select('product_type_id'),
      supabase.from('products').select('product_type_id').eq('tenant_id', tenantId).not('product_type_id', 'is', null),
    ]);
    setTypes(typesData ?? []);
    const counts: Record<string, number> = {};
    (attrsData ?? []).forEach((a: any) => {
      counts[a.product_type_id] = (counts[a.product_type_id] ?? 0) + 1;
    });
    setAttrCounts(counts);
    const pCounts: Record<string, number> = {};
    (productsData ?? []).forEach((p: any) => {
      pCounts[p.product_type_id] = (pCounts[p.product_type_id] ?? 0) + 1;
    });
    setProductCounts(pCounts);
    setLoadingTypes(false);
  }, [tenantId]);

  useEffect(() => {
    loadTypes();
  }, [loadTypes]);

  const loadAttributes = useCallback(async (typeId: string) => {
    setLoadingAttrs(true);
    const { data } = await supabase
      .from('product_type_attributes')
      .select('*')
      .eq('product_type_id', typeId)
      .order('display_order');
    setAttributes((data as any) ?? []);
    setLoadingAttrs(false);
  }, []);

  useEffect(() => {
    if (selectedId) loadAttributes(selectedId);
    setRenamingType(false);
    setAddingAttr(false);
    setErrorMsg(null);
  }, [selectedId, loadAttributes]);

  const filteredTypes = useMemo(
    () => types.filter((t) => t.name.toLowerCase().includes(search.toLowerCase())),
    [types, search]
  );
  const selectedType = types.find((t) => t.id === selectedId) ?? null;

  // ---------- Tipos ----------

  const createType = async () => {
    if (!newTypeName.trim() || !tenantId) return;
    setSavingType(true);
    const { data, error } = await supabase
      .from('product_types')
      .insert({ tenant_id: tenantId, name: newTypeName.trim(), created_by_admin: true })
      .select('id, name, created_by_admin')
      .single();
    setSavingType(false);
    if (error) {
      setErrorMsg('No se pudo crear el tipo: ' + error.message);
      return;
    }
    setTypes((ts) => [...ts, data].sort((a, b) => a.name.localeCompare(b.name)));
    setNewTypeName('');
    setCreatingType(false);
    setSelectedId(data.id);
  };

  const saveTypeName = async () => {
    if (!selectedType || !typeNameDraft.trim()) {
      setRenamingType(false);
      return;
    }
    const name = typeNameDraft.trim();
    setTypes((ts) => ts.map((t) => (t.id === selectedType.id ? { ...t, name } : t)));
    setRenamingType(false);
    const { error } = await supabase.from('product_types').update({ name }).eq('id', selectedType.id);
    if (error) setErrorMsg('No se pudo renombrar: ' + error.message);
  };

  const deleteType = async () => {
    if (!selectedType) return;
    const inUse = productCounts[selectedType.id] ?? 0;
    if (inUse > 0) {
      setErrorMsg(`No se puede eliminar "${selectedType.name}": hay ${inUse} producto(s) usando este tipo. Cambiá su tipo desde Inventario primero.`);
      return;
    }
    if (!confirm(`¿Eliminar el tipo "${selectedType.name}" y sus ${attrCounts[selectedType.id] ?? 0} características? Esta acción no se puede deshacer.`)) return;
    setDeletingType(true);
    const { error } = await supabase.from('product_types').delete().eq('id', selectedType.id);
    setDeletingType(false);
    if (error) {
      setErrorMsg('No se pudo eliminar: ' + error.message);
      return;
    }
    setTypes((ts) => ts.filter((t) => t.id !== selectedType.id));
    setSelectedId(null);
  };

  // ---------- Características ----------

  const addAttribute = async () => {
    if (!selectedType || !attrDraft.label.trim()) return;
    setSavingAttr(true);
    setErrorMsg(null);
    const key = slugify(attrDraft.label);
    const { data, error } = await supabase
      .from('product_type_attributes')
      .insert({
        product_type_id: selectedType.id,
        key,
        label: attrDraft.label.trim(),
        data_type: attrDraft.data_type,
        unit: attrDraft.unit.trim() || null,
        options: attrDraft.data_type === 'select' ? attrDraft.options : null,
        is_variant: attrDraft.is_variant,
        is_required: attrDraft.is_required,
        display_order: attributes.length,
      })
      .select('*')
      .single();
    setSavingAttr(false);
    if (error) {
      setErrorMsg('No se pudo crear la característica: ' + error.message);
      return;
    }
    setAttributes((a) => [...a, data]);
    setAttrCounts((c) => ({ ...c, [selectedType.id]: (c[selectedType.id] ?? 0) + 1 }));
    setAttrDraft(BLANK_ATTR_DRAFT);
    setOptionDraft('');
    setAddingAttr(false);
  };

  const updateAttribute = async (attr: Attribute, patch: Partial<Attribute>) => {
    const updated = { ...attr, ...patch };
    setAttributes((a) => a.map((x) => (x.id === attr.id ? updated : x)));
    const { error } = await supabase
      .from('product_type_attributes')
      .update({
        label: updated.label,
        data_type: updated.data_type,
        unit: updated.unit,
        options: updated.data_type === 'select' ? updated.options : null,
        is_variant: updated.is_variant,
        is_required: updated.is_required,
      })
      .eq('id', attr.id);
    if (error) setErrorMsg('No se pudo actualizar: ' + error.message);
  };

  const deleteAttribute = async (attr: Attribute) => {
    if (!confirm(`¿Eliminar la característica "${attr.label}"?`)) return;
    setAttributes((a) => a.filter((x) => x.id !== attr.id));
    if (selectedType) setAttrCounts((c) => ({ ...c, [selectedType.id]: Math.max(0, (c[selectedType.id] ?? 1) - 1) }));
    const { error } = await supabase.from('product_type_attributes').delete().eq('id', attr.id);
    if (error) setErrorMsg('No se pudo eliminar: ' + error.message);
  };

  const moveAttribute = async (attr: Attribute, direction: -1 | 1) => {
    const idx = attributes.findIndex((a) => a.id === attr.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= attributes.length) return;
    const swapWith = attributes[swapIdx];

    const reordered = [...attributes];
    reordered[idx] = { ...swapWith, display_order: attr.display_order };
    reordered[swapIdx] = { ...attr, display_order: swapWith.display_order };
    reordered.sort((a, b) => a.display_order - b.display_order);
    setAttributes(reordered);

    await Promise.all([
      supabase.from('product_type_attributes').update({ display_order: swapWith.display_order }).eq('id', attr.id),
      supabase.from('product_type_attributes').update({ display_order: attr.display_order }).eq('id', swapWith.id),
    ]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-ink-950 tracking-tight">Características</h1>
        <p className="text-ink-500">Definí los tipos de producto y los campos dinámicos que aparecen al crear cada producto.</p>
      </div>

      {loadingTypes ? (
        <div className="bg-white rounded-2xl border border-ink-100 flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-ink-400" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden grid md:grid-cols-[320px_1fr] h-[75vh] min-h-[560px]">
          {/* LISTA DE TIPOS */}
          <div className={`border-r border-ink-100 flex flex-col min-h-0 ${selectedId ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-ink-100 shrink-0 space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar tipo..."
                  className="w-full h-10 pl-9 pr-3 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
                />
              </div>

              {creatingType ? (
                <div className="flex items-center gap-1.5">
                  <input
                    autoFocus
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && createType()}
                    placeholder="Nombre del tipo..."
                    className="flex-1 h-9 px-3 bg-gold-50 border border-gold-300 rounded-lg text-sm focus:outline-none min-w-0"
                  />
                  <button
                    onClick={createType}
                    disabled={savingType || !newTypeName.trim()}
                    className="p-2 bg-ink-900 text-cream-50 rounded-lg disabled:opacity-40 shrink-0"
                  >
                    {savingType ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  </button>
                  <button
                    onClick={() => {
                      setCreatingType(false);
                      setNewTypeName('');
                    }}
                    className="p-2 text-ink-400 shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setCreatingType(true)}
                  className="w-full flex items-center justify-center gap-2 h-10 bg-ink-950 text-cream-50 rounded-xl font-bold text-xs hover:bg-gold-600 transition-colors"
                >
                  <Plus size={15} /> Nuevo tipo
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {filteredTypes.length === 0 ? (
                <p className="text-center text-xs text-ink-400 py-10 px-4">
                  {types.length === 0 ? 'Todavía no hay tipos de producto.' : 'Sin resultados.'}
                </p>
              ) : (
                filteredTypes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left px-4 py-3.5 border-b border-ink-50 hover:bg-cream-50 transition-colors flex items-center justify-between gap-2 ${
                      selectedId === t.id ? 'bg-gold-50' : ''
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-900 text-sm truncate">{t.name}</p>
                      <p className="text-[11px] text-ink-400">
                        {attrCounts[t.id] ?? 0} {attrCounts[t.id] === 1 ? 'característica' : 'características'}
                      </p>
                    </div>
                    <SlidersHorizontal size={14} className="text-ink-300 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* DETALLE DEL TIPO */}
          <div className={`flex-col min-h-0 ${selectedId ? 'flex' : 'hidden md:flex'}`}>
            {!selectedType ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
                <SlidersHorizontal size={32} className="text-ink-200 mb-3" />
                <p className="text-ink-400 text-sm font-medium">Selecciona un tipo para ver sus características</p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-ink-100 flex items-center gap-3 shrink-0">
                  <button onClick={() => setSelectedId(null)} className="md:hidden p-1.5 text-ink-500 hover:bg-ink-100 rounded-lg shrink-0">
                    <ChevronLeft size={18} />
                  </button>

                  <div className="min-w-0 flex-1">
                    {renamingType ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          autoFocus
                          value={typeNameDraft}
                          onChange={(e) => setTypeNameDraft(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveTypeName()}
                          onBlur={saveTypeName}
                          className="h-9 px-3 bg-cream-50 border border-gold-400 rounded-lg text-sm font-bold w-full max-w-xs focus:outline-none"
                        />
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setTypeNameDraft(selectedType.name);
                          setRenamingType(true);
                        }}
                        className="group flex items-center gap-2 min-w-0"
                      >
                        <p className="font-semibold text-ink-900 text-sm truncate">{selectedType.name}</p>
                        <Pencil size={12} className="text-ink-300 group-hover:text-ink-600 shrink-0" />
                      </button>
                    )}
                    <p className="text-[11px] text-ink-400 mt-0.5">
                      {attributes.length} {attributes.length === 1 ? 'característica' : 'características'} ·{' '}
                      {productCounts[selectedType.id] ?? 0} producto(s) usándolo
                    </p>
                  </div>

                  <button
                    onClick={deleteType}
                    disabled={deletingType}
                    className="p-2 text-ink-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors shrink-0"
                    title="Eliminar tipo"
                  >
                    {deletingType ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-5 space-y-3">
                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-xl flex items-start gap-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                      <button onClick={() => setErrorMsg(null)} className="ml-auto shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {loadingAttrs ? (
                    <div className="flex items-center justify-center py-16">
                      <Loader2 size={20} className="animate-spin text-ink-400" />
                    </div>
                  ) : (
                    <>
                      {attributes.length === 0 && !addingAttr && (
                        <div className="text-center py-10 border border-dashed border-ink-200 rounded-2xl">
                          <p className="text-sm text-ink-400 font-medium">Este tipo todavía no tiene características.</p>
                        </div>
                      )}

                      {attributes.map((attr, i) => (
                        <div key={attr.id} className="bg-cream-50 border border-ink-100 rounded-2xl p-4 space-y-3">
                          <div className="flex items-start gap-2">
                            <div className="flex flex-col shrink-0 -mt-0.5">
                              <button
                                onClick={() => moveAttribute(attr, -1)}
                                disabled={i === 0}
                                className="p-0.5 text-ink-300 hover:text-ink-700 disabled:opacity-20"
                              >
                                <ChevronUp size={14} />
                              </button>
                              <button
                                onClick={() => moveAttribute(attr, 1)}
                                disabled={i === attributes.length - 1}
                                className="p-0.5 text-ink-300 hover:text-ink-700 disabled:opacity-20"
                              >
                                <ChevronDown size={14} />
                              </button>
                            </div>

                            <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                              <input
                                value={attr.label}
                                onChange={(e) => setAttributes((a) => a.map((x) => (x.id === attr.id ? { ...x, label: e.target.value } : x)))}
                                onBlur={() => updateAttribute(attr, { label: attr.label })}
                                className="h-9 px-3 bg-white border border-ink-200 rounded-lg text-sm font-semibold min-w-0"
                              />
                              <select
                                value={attr.data_type}
                                onChange={(e) => updateAttribute(attr, { data_type: e.target.value as DataType })}
                                className="h-9 px-2 bg-white border border-ink-200 rounded-lg text-xs font-semibold sm:w-40"
                              >
                                {Object.entries(DATA_TYPE_LABELS).map(([v, l]) => (
                                  <option key={v} value={v}>{l}</option>
                                ))}
                              </select>
                            </div>

                            <button onClick={() => deleteAttribute(attr)} className="p-2 text-ink-300 hover:text-red-500 shrink-0">
                              <Trash2 size={14} />
                            </button>
                          </div>

                          <div className="pl-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
                            <span className="text-ink-400 font-mono">clave: {attr.key}</span>
                            {attr.data_type === 'number' && (
                              <label className="flex items-center gap-1.5 text-ink-600">
                                Unidad
                                <input
                                  value={attr.unit ?? ''}
                                  onChange={(e) => setAttributes((a) => a.map((x) => (x.id === attr.id ? { ...x, unit: e.target.value } : x)))}
                                  onBlur={() => updateAttribute(attr, { unit: attr.unit })}
                                  placeholder="kg, cm..."
                                  className="h-7 w-20 px-2 bg-white border border-ink-200 rounded-md text-xs"
                                />
                              </label>
                            )}
                            <label className="flex items-center gap-1.5 text-ink-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={attr.is_required}
                                onChange={(e) => updateAttribute(attr, { is_required: e.target.checked })}
                                className="w-3.5 h-3.5 accent-gold-600"
                              />
                              Obligatoria
                            </label>
                            <label className="flex items-center gap-1.5 text-ink-600 cursor-pointer" title="Genera variantes de producto (ej. talla, color)">
                              <input
                                type="checkbox"
                                checked={attr.is_variant}
                                onChange={(e) => updateAttribute(attr, { is_variant: e.target.checked })}
                                className="w-3.5 h-3.5 accent-gold-600"
                              />
                              Genera variantes
                            </label>
                          </div>

                          {attr.data_type === 'select' && (
                            <div className="pl-6 space-y-1.5">
                              <div className="flex flex-wrap gap-1.5">
                                {(attr.options ?? []).map((opt) => (
                                  <span key={opt} className="flex items-center gap-1 bg-white border border-ink-200 rounded-full pl-2.5 pr-1.5 py-1 text-xs text-ink-700">
                                    {opt}
                                    <button
                                      onClick={() => updateAttribute(attr, { options: (attr.options ?? []).filter((o) => o !== opt) })}
                                      className="text-ink-300 hover:text-red-500"
                                    >
                                      <X size={11} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <AddOptionInput
                                onAdd={(val) => updateAttribute(attr, { options: [...(attr.options ?? []), val] })}
                              />
                            </div>
                          )}
                        </div>
                      ))}

                      {addingAttr ? (
                        <div className="bg-gold-50 border border-gold-200 rounded-2xl p-4 space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
                            <input
                              autoFocus
                              value={attrDraft.label}
                              onChange={(e) => setAttrDraft({ ...attrDraft, label: e.target.value })}
                              placeholder="Nombre (ej. Material, Voltaje, Talla...)"
                              className="h-9 px-3 bg-white border border-ink-200 rounded-lg text-sm min-w-0"
                            />
                            <select
                              value={attrDraft.data_type}
                              onChange={(e) => setAttrDraft({ ...attrDraft, data_type: e.target.value as DataType })}
                              className="h-9 px-2 bg-white border border-ink-200 rounded-lg text-xs font-semibold sm:w-40"
                            >
                              {Object.entries(DATA_TYPE_LABELS).map(([v, l]) => (
                                <option key={v} value={v}>{l}</option>
                              ))}
                            </select>
                          </div>

                          {attrDraft.data_type === 'select' && (
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap gap-1.5">
                                {attrDraft.options.map((opt) => (
                                  <span key={opt} className="flex items-center gap-1 bg-white border border-ink-200 rounded-full pl-2.5 pr-1.5 py-1 text-xs text-ink-700">
                                    {opt}
                                    <button
                                      onClick={() => setAttrDraft({ ...attrDraft, options: attrDraft.options.filter((o) => o !== opt) })}
                                      className="text-ink-300 hover:text-red-500"
                                    >
                                      <X size={11} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                              <AddOptionInput onAdd={(val) => setAttrDraft((d) => ({ ...d, options: [...d.options, val] }))} />
                            </div>
                          )}

                          <div className="flex items-center gap-5 text-xs">
                            <label className="flex items-center gap-1.5 text-ink-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={attrDraft.is_required}
                                onChange={(e) => setAttrDraft({ ...attrDraft, is_required: e.target.checked })}
                                className="w-3.5 h-3.5 accent-gold-600"
                              />
                              Obligatoria
                            </label>
                            <label className="flex items-center gap-1.5 text-ink-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={attrDraft.is_variant}
                                onChange={(e) => setAttrDraft({ ...attrDraft, is_variant: e.target.checked })}
                                className="w-3.5 h-3.5 accent-gold-600"
                              />
                              Genera variantes
                            </label>
                          </div>

                          <div className="flex gap-2 justify-end pt-1">
                            <button
                              onClick={() => {
                                setAddingAttr(false);
                                setAttrDraft(BLANK_ATTR_DRAFT);
                              }}
                              className="text-xs font-bold text-ink-500 px-3 py-2"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={addAttribute}
                              disabled={savingAttr || !attrDraft.label.trim()}
                              className="flex items-center gap-1.5 text-xs font-bold text-cream-50 bg-ink-900 disabled:opacity-40 px-4 py-2 rounded-lg hover:bg-gold-600 transition-colors"
                            >
                              {savingAttr ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                              Agregar característica
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingAttr(true)}
                          className="w-full flex items-center justify-center gap-2 h-11 border-2 border-dashed border-ink-200 rounded-2xl text-ink-500 text-sm font-bold hover:border-gold-400 hover:text-gold-700 transition-colors"
                        >
                          <ListPlus size={16} /> Agregar característica
                        </button>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function AddOptionInput({ onAdd }: { onAdd: (value: string) => void }) {
  const [value, setValue] = useState('');
  const commit = () => {
    const v = value.trim();
    if (!v) return;
    onAdd(v);
    setValue('');
  };
  return (
    <div className="flex items-center gap-1.5">
      <Tag size={12} className="text-ink-300 shrink-0" />
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          }
        }}
        placeholder="Escribí una opción y Enter..."
        className="flex-1 h-8 px-2.5 bg-white border border-ink-200 rounded-lg text-xs focus:outline-none focus:border-gold-500 min-w-0"
      />
      <button onClick={commit} type="button" className="text-[10px] font-black text-gold-700 uppercase px-2 shrink-0">
        Añadir
      </button>
    </div>
  );
}
