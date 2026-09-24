'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Loader2, Image as ImageIcon, Trash2, Plus, Layers } from 'lucide-react';

type Category = { id: string; name: string; parent_id: string | null };
type ProductType = { id: string; name: string };
type ProductTypeAttribute = {
  id: string;
  key: string;
  label: string;
  data_type: string; // text | number | boolean | select
  unit: string | null;
  options: string[] | null;
  is_required: boolean;
  display_order: number;
};

type ProductMedia = { id: string; url: string; position: number };
type Variant = { id: string; title: string; sku: string | null; stock: number; price_override: number | null };
const BLANK_VARIANT: Omit<Variant, 'id'> = { title: '', sku: '', stock: 0, price_override: null };

export type EditableProduct = {
  id?: string;
  name: string;
  description: string | null;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  stock: number;
  sku: string | null;
  category_id: string | null;
  product_type_id: string | null;
  attributes: Record<string, any>;
  is_active: boolean;
  is_featured: boolean;
};

const BLANK: EditableProduct = {
  name: '',
  description: '',
  price: 0,
  sale_price: null,
  is_on_sale: false,
  stock: 0,
  sku: '',
  category_id: null,
  product_type_id: null,
  attributes: {},
  is_active: true,
  is_featured: false,
};

export default function ProductFormModal({
  tenantId,
  categories,
  productTypes,
  initial,
  onClose,
  onSaved,
}: {
  tenantId: string;
  categories: Category[];
  productTypes: ProductType[];
  initial: EditableProduct | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState<EditableProduct>(initial ?? BLANK);
  const [typeAttrs, setTypeAttrs] = useState<ProductTypeAttribute[]>([]);
  const [media, setMedia] = useState<ProductMedia[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [newVariant, setNewVariant] = useState<Omit<Variant, 'id'> | null>(null);
  const [savingVariant, setSavingVariant] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEditing = Boolean(initial?.id);

  useEffect(() => {
    async function loadAttrs() {
      if (!form.product_type_id) {
        setTypeAttrs([]);
        return;
      }
      const { data } = await supabase
        .from('product_type_attributes')
        .select('*')
        .eq('product_type_id', form.product_type_id)
        .order('display_order');
      setTypeAttrs(data ?? []);
    }
    loadAttrs();
  }, [form.product_type_id]);

  useEffect(() => {
    async function loadMedia() {
      if (!initial?.id) return;
      const { data } = await supabase
        .from('product_media')
        .select('id, url, position')
        .eq('product_id', initial.id)
        .order('position');
      setMedia(data ?? []);
    }
    loadMedia();
  }, [initial?.id]);

  const loadVariants = async () => {
    if (!initial?.id) return;
    const { data } = await supabase
      .from('product_variants')
      .select('id, title, sku, stock, price_override')
      .eq('product_id', initial.id)
      .order('created_at');
    setVariants(data ?? []);
  };

  useEffect(() => {
    loadVariants();
  }, [initial?.id]);

  const addVariant = async () => {
    if (!newVariant || !initial?.id || !newVariant.title.trim()) return;
    setSavingVariant(true);
    const { data, error } = await supabase
      .from('product_variants')
      .insert({ product_id: initial.id, ...newVariant, sku: newVariant.sku || null })
      .select('id, title, sku, stock, price_override')
      .single();
    setSavingVariant(false);
    if (error) {
      setErrorMsg('No se pudo crear la variante: ' + error.message);
      return;
    }
    setVariants((v) => [...v, data]);
    setNewVariant(null);
  };

  const updateVariant = async (variant: Variant) => {
    const { error } = await supabase
      .from('product_variants')
      .update({ title: variant.title, sku: variant.sku || null, stock: variant.stock, price_override: variant.price_override })
      .eq('id', variant.id);
    if (error) setErrorMsg('No se pudo actualizar la variante: ' + error.message);
  };

  const deleteVariant = async (id: string) => {
    if (!confirm('¿Eliminar esta variante?')) return;
    const { error } = await supabase.from('product_variants').delete().eq('id', id);
    if (error) {
      setErrorMsg('No se pudo eliminar la variante: ' + error.message);
      return;
    }
    setVariants((v) => v.filter((x) => x.id !== id));
  };

  const setField = (key: keyof EditableProduct, value: any) => setForm((f) => ({ ...f, [key]: value }));
  const setAttr = (key: string, value: any) => setForm((f) => ({ ...f, attributes: { ...f.attributes, [key]: value } }));

  const handleUpload = async (file: File) => {
    setUploading(true);
    setErrorMsg(null);
    try {
      const ext = file.name.split('.').pop();
      const path = `${tenantId}/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('products').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: pub } = supabase.storage.from('products').getPublicUrl(path);

      if (isEditing && initial?.id) {
        const { data: row, error } = await supabase
          .from('product_media')
          .insert({ product_id: initial.id, url: pub.publicUrl, position: media.length })
          .select('id, url, position')
          .single();
        if (error) throw error;
        setMedia((m) => [...m, row]);
      } else {
        // Producto aún no existe: guardamos la URL temporalmente y la
        // insertamos en product_media justo después de crear el producto.
        setMedia((m) => [...m, { id: `pending-${Date.now()}`, url: pub.publicUrl, position: m.length }]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo subir la imagen.');
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = async (item: ProductMedia) => {
    if (!item.id.startsWith('pending-')) {
      await supabase.from('product_media').delete().eq('id', item.id);
    }
    setMedia((m) => m.filter((x) => x.id !== item.id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);
    try {
      const payload = {
        tenant_id: tenantId,
        name: form.name,
        description: form.description || null,
        price: Number(form.price),
        sale_price: form.is_on_sale ? Number(form.sale_price ?? 0) : null,
        is_on_sale: form.is_on_sale,
        stock: Number(form.stock),
        sku: form.sku || null,
        category_id: form.category_id || null,
        product_type_id: form.product_type_id || null,
        attributes: form.attributes ?? {},
        is_active: form.is_active,
        is_featured: form.is_featured,
      };

      let productId = initial?.id;

      if (isEditing && productId) {
        const { error } = await supabase.from('products').update(payload).eq('id', productId);
        if (error) throw error;
      } else {
        const { data: created, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = created.id;

        // Adjuntamos las imágenes que se subieron antes de guardar el producto.
        const pendingMedia = media.filter((m) => m.id.startsWith('pending-'));
        if (pendingMedia.length > 0) {
          await supabase.from('product_media').insert(
            pendingMedia.map((m, i) => ({ product_id: productId, url: m.url, position: i }))
          );
        }
      }

      onSaved();
    } catch (err: any) {
      setErrorMsg(err.message || 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between rounded-t-3xl">
          <h2 className="font-serif text-xl text-ink-900">{isEditing ? 'Editar producto' : 'Nuevo producto'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-ink-50 rounded-full text-ink-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && <div className="bg-red-50 border border-red-200 text-red-600 text-xs font-bold p-3 rounded-xl">{errorMsg}</div>}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Nombre</label>
            <input
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Descripción</label>
            <textarea
              rows={3}
              value={form.description ?? ''}
              onChange={(e) => setField('description', e.target.value)}
              className="w-full px-4 py-3 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Precio</label>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(e) => setField('price', e.target.value)}
                className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Stock</label>
              <input
                required
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setField('stock', e.target.value)}
                className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="is_on_sale"
              type="checkbox"
              checked={form.is_on_sale}
              onChange={(e) => setField('is_on_sale', e.target.checked)}
              className="w-4 h-4 accent-gold-600"
            />
            <label htmlFor="is_on_sale" className="text-sm font-medium text-ink-700">En oferta</label>
            {form.is_on_sale && (
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Precio de oferta"
                value={form.sale_price ?? ''}
                onChange={(e) => setField('sale_price', e.target.value)}
                className="h-9 px-3 bg-cream-50 border border-ink-200 rounded-lg text-sm flex-1 focus:outline-none focus:border-gold-500"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Categoría</label>
              <select
                value={form.category_id ?? ''}
                onChange={(e) => setField('category_id', e.target.value || null)}
                className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Tipo de producto</label>
              <select
                value={form.product_type_id ?? ''}
                onChange={(e) => setField('product_type_id', e.target.value || null)}
                className="w-full h-11 px-4 bg-cream-50 border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
              >
                <option value="">Sin tipo</option>
                {productTypes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {typeAttrs.length > 0 && (
            <div className="bg-cream-50 border border-ink-100 rounded-2xl p-4 space-y-3">
              <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest">Atributos de {productTypes.find((t) => t.id === form.product_type_id)?.name}</p>
              {typeAttrs.map((attr) => (
                <div key={attr.id} className="space-y-1">
                  <label className="text-xs font-semibold text-ink-600">
                    {attr.label}{attr.unit ? ` (${attr.unit})` : ''}{attr.is_required && <span className="text-red-500"> *</span>}
                  </label>
                  {attr.data_type === 'boolean' ? (
                    <input
                      type="checkbox"
                      checked={Boolean(form.attributes[attr.key])}
                      onChange={(e) => setAttr(attr.key, e.target.checked)}
                      className="w-4 h-4 accent-gold-600 block"
                    />
                  ) : attr.data_type === 'select' && attr.options ? (
                    <select
                      required={attr.is_required}
                      value={form.attributes[attr.key] ?? ''}
                      onChange={(e) => setAttr(attr.key, e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                    >
                      <option value="">Seleccionar...</option>
                      {attr.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : attr.data_type === 'color' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={form.attributes[attr.key] || '#000000'}
                        onChange={(e) => setAttr(attr.key, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-ink-200 cursor-pointer shrink-0"
                      />
                      <input
                        required={attr.is_required}
                        value={form.attributes[attr.key] ?? ''}
                        onChange={(e) => setAttr(attr.key, e.target.value)}
                        placeholder="Nombre del color (ej. Azul marino)"
                        className="w-full h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                      />
                    </div>
                  ) : (
                    <input
                      required={attr.is_required}
                      type={attr.data_type === 'number' ? 'number' : 'text'}
                      value={form.attributes[attr.key] ?? ''}
                      onChange={(e) => setAttr(attr.key, attr.data_type === 'number' ? e.target.value : e.target.value)}
                      className="w-full h-10 px-3 bg-white border border-ink-200 rounded-lg text-sm focus:outline-none focus:border-gold-500"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {isEditing && (
            <div className="bg-cream-50 border border-ink-100 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold text-ink-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Layers size={12} /> Variantes
                </p>
                {!newVariant && (
                  <button
                    type="button"
                    onClick={() => setNewVariant(BLANK_VARIANT)}
                    className="flex items-center gap-1 text-[11px] font-bold text-gold-700 hover:text-gold-800"
                  >
                    <Plus size={13} /> Añadir variante
                  </button>
                )}
              </div>

              {variants.length === 0 && !newVariant && (
                <p className="text-xs text-ink-400">Sin variantes. Usalas para tallas, colores u otras opciones con su propio stock.</p>
              )}

              {variants.map((v) => (
                <div key={v.id} className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center">
                  <input
                    value={v.title}
                    onChange={(e) => setVariants((vs) => vs.map((x) => (x.id === v.id ? { ...x, title: e.target.value } : x)))}
                    onBlur={() => updateVariant(v)}
                    placeholder="Título (ej. Talla M)"
                    className="h-9 px-3 bg-white border border-ink-200 rounded-lg text-sm min-w-0"
                  />
                  <input
                    value={v.sku ?? ''}
                    onChange={(e) => setVariants((vs) => vs.map((x) => (x.id === v.id ? { ...x, sku: e.target.value } : x)))}
                    onBlur={() => updateVariant(v)}
                    placeholder="SKU"
                    className="h-9 px-2 w-24 bg-white border border-ink-200 rounded-lg text-xs"
                  />
                  <input
                    type="number"
                    min="0"
                    value={v.stock}
                    onChange={(e) => setVariants((vs) => vs.map((x) => (x.id === v.id ? { ...x, stock: Number(e.target.value) } : x)))}
                    onBlur={() => updateVariant(v)}
                    placeholder="Stock"
                    className="h-9 px-2 w-16 bg-white border border-ink-200 rounded-lg text-xs"
                  />
                  <button type="button" onClick={() => deleteVariant(v.id)} className="p-2 text-ink-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}

              {newVariant && (
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center bg-gold-50 border border-gold-200 rounded-lg p-2">
                  <input
                    autoFocus
                    value={newVariant.title}
                    onChange={(e) => setNewVariant({ ...newVariant, title: e.target.value })}
                    placeholder="Título (ej. Talla M)"
                    className="h-9 px-3 bg-white border border-ink-200 rounded-lg text-sm min-w-0"
                  />
                  <input
                    value={newVariant.sku ?? ''}
                    onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                    placeholder="SKU"
                    className="h-9 px-2 w-24 bg-white border border-ink-200 rounded-lg text-xs"
                  />
                  <input
                    type="number"
                    min="0"
                    value={newVariant.stock}
                    onChange={(e) => setNewVariant({ ...newVariant, stock: Number(e.target.value) })}
                    placeholder="Stock"
                    className="h-9 px-2 w-16 bg-white border border-ink-200 rounded-lg text-xs"
                  />
                  <div className="flex gap-1">
                    <button type="button" onClick={addVariant} disabled={savingVariant} className="p-2 text-emerald-600 disabled:opacity-40">
                      {savingVariant ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    </button>
                    <button type="button" onClick={() => setNewVariant(null)} className="p-2 text-ink-400">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-ink-400 uppercase tracking-widest pl-1">Imágenes</label>
            <div className="flex flex-wrap gap-3">
              {media.map((m) => (
                <div key={m.id} className="relative w-20 h-20 rounded-xl overflow-hidden border border-ink-200 group">
                  <img src={m.url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeMedia(m)}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                  >
                    <Trash2 size={16} className="text-white" />
                  </button>
                </div>
              ))}
              <label className="w-20 h-20 rounded-xl border-2 border-dashed border-ink-200 flex items-center justify-center cursor-pointer hover:border-gold-400 transition-colors">
                {uploading ? <Loader2 size={18} className="animate-spin text-ink-400" /> : <ImageIcon size={18} className="text-ink-400" />}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploading}
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </label>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} className="w-4 h-4 accent-gold-600" />
              Activo
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-ink-700">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => setField('is_featured', e.target.checked)} className="w-4 h-4 accent-gold-600" />
              Destacado
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 h-12 border border-ink-200 rounded-xl font-bold text-ink-600 hover:bg-ink-50 transition-colors">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 h-12 bg-ink-900 text-cream-50 rounded-xl font-bold hover:bg-gold-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : null}
              {isEditing ? 'Guardar cambios' : 'Crear producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
