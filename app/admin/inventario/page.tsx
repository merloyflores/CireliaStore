'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/app/providers';
import {
  Plus, Search, Edit3, Trash2, Loader2, PackageX, Star, ChevronLeft, ChevronRight,
  MessageSquare, ThumbsUp, Layers, X,
} from 'lucide-react';
import ProductFormModal, { EditableProduct } from '@/components/ProductFormModal';
import FeedbackPanel from '@/components/FeedbackPanel';

const PAGE_SIZE = 15;

function money(amount: number) {
  return new Intl.NumberFormat('es-CR', { style: 'currency', currency: 'CRC', maximumFractionDigits: 0 }).format(amount);
}

type ProductRow = {
  id: string;
  name: string;
  price: number;
  sale_price: number | null;
  is_on_sale: boolean;
  stock: number;
  sku: string | null;
  is_active: boolean;
  is_featured: boolean;
  description: string | null;
  category_id: string | null;
  product_type_id: string | null;
  attributes: Record<string, any>;
  categories: { name: string } | null;
  product_media: { url: string; position: number }[];
  product_variants: { id: string }[];
};

export default function InventarioPage() {
  const supabase = createClient();
  const { profile } = useAuth();
  const tenantId = profile?.tenant_id;

  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; parent_id: string | null }[]>([]);
  const [productTypes, setProductTypes] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [onlyFeatured, setOnlyFeatured] = useState(false);
  const [page, setPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<EditableProduct | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const loadLookups = useCallback(async () => {
    if (!tenantId) return;
    const [{ data: cats }, { data: types }] = await Promise.all([
      supabase.from('categories').select('id, name, parent_id').eq('tenant_id', tenantId).order('name'),
      supabase.from('product_types').select('id, name').eq('tenant_id', tenantId).order('name'),
    ]);
    setCategories(cats ?? []);
    setProductTypes(types ?? []);
  }, [tenantId]);

  const loadProducts = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    let query = supabase
      .from('products')
      .select('id, name, price, sale_price, is_on_sale, stock, sku, is_active, is_featured, description, category_id, product_type_id, attributes, categories(name), product_media(url, position), product_variants(id)', {
        count: 'exact',
      })
      .eq('tenant_id', tenantId)
      .order('name')
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

    if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
    if (categoryFilter) query = query.eq('category_id', categoryFilter);
    if (onlyFeatured) query = query.eq('is_featured', true);

    const { data, count } = await query;
    setProducts((data as any) ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [tenantId, page, search, categoryFilter, onlyFeatured]);

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (p: ProductRow) => {
    setEditing({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      sale_price: p.sale_price,
      is_on_sale: p.is_on_sale,
      stock: p.stock,
      sku: p.sku,
      category_id: p.category_id,
      product_type_id: p.product_type_id,
      attributes: p.attributes ?? {},
      is_active: p.is_active,
      is_featured: p.is_featured,
    });
    setModalOpen(true);
  };

  const handleSaved = () => {
    setModalOpen(false);
    setEditing(null);
    loadProducts();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este producto? Esta acción no se puede deshacer.')) return;
    setDeletingId(id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    setDeletingId(null);
    if (error) {
      alert('No se pudo eliminar: ' + error.message);
      return;
    }
    loadProducts();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-ink-950 tracking-tight">Panel de Control</h1>
          <p className="text-ink-500">Gestiona el inventario · {totalCount} {totalCount === 1 ? 'producto' : 'productos'}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/mensajes"
            className="flex items-center gap-2 bg-white border border-ink-200 text-ink-600 h-11 px-4 rounded-xl font-bold text-sm hover:border-gold-400 hover:text-ink-900 transition-colors"
          >
            <MessageSquare size={16} /> Chats
          </Link>
          <button
            onClick={() => setFeedbackOpen(true)}
            className="flex items-center gap-2 bg-white border border-ink-200 text-ink-600 h-11 px-4 rounded-xl font-bold text-sm hover:border-gold-400 hover:text-ink-900 transition-colors"
          >
            <ThumbsUp size={16} /> Feedback
          </button>
          <button
            onClick={() => {
              setPage(0);
              setOnlyFeatured((v) => !v);
            }}
            className={`flex items-center gap-2 h-11 px-4 rounded-xl font-bold text-sm transition-colors ${
              onlyFeatured ? 'bg-gold-600 text-cream-50' : 'bg-white border border-ink-200 text-ink-600 hover:border-gold-400 hover:text-ink-900'
            }`}
          >
            <Star size={16} className={onlyFeatured ? 'fill-cream-50' : ''} /> Destacados
          </button>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-ink-950 text-cream-50 h-11 px-6 rounded-xl font-bold hover:bg-gold-600 transition-colors"
          >
            <Plus size={18} /> Añadir Producto
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" />
          <input
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
            placeholder="Buscar producto por nombre..."
            className="w-full h-11 pl-11 pr-4 bg-white border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => {
            setPage(0);
            setCategoryFilter(e.target.value);
          }}
          className="h-11 px-4 bg-white border border-ink-200 rounded-xl text-sm focus:outline-none focus:border-gold-500"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {onlyFeatured && (
        <div className="flex items-center gap-2 bg-gold-50 border border-gold-200 text-gold-800 text-xs font-bold px-4 py-2.5 rounded-xl w-fit">
          <Star size={13} className="fill-gold-600 text-gold-600" /> Mostrando solo productos destacados
          <button onClick={() => setOnlyFeatured(false)} className="ml-1 hover:text-gold-950">
            <X size={13} />
          </button>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-ink-100 flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-ink-400" />
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-ink-100 flex flex-col items-center justify-center py-20 text-center px-4">
          <PackageX size={40} className="text-ink-300 mb-4" />
          <p className="text-ink-500 font-medium">No hay productos que coincidan.</p>
        </div>
      ) : (
        <>
          {/* Tarjetas — móvil / tablet angosto */}
          <div className="grid sm:hidden gap-3">
            {products.map((p) => {
              const cover = [...(p.product_media ?? [])].sort((a, b) => a.position - b.position)[0]?.url;
              const variantCount = p.product_variants?.length ?? 0;
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-ink-100 p-4 flex gap-3">
                  <div className="w-16 h-16 rounded-xl bg-cream-100 border border-ink-100 overflow-hidden shrink-0 relative">
                    {cover ? (
                      <Image src={cover} alt={p.name} fill className="object-cover" sizes="64px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-lg">{p.name.charAt(0)}</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-ink-900 text-sm truncate flex items-center gap-1.5">
                        {p.name}
                        {p.is_featured && <Star size={12} className="text-gold-500 fill-gold-500 shrink-0" />}
                      </p>
                      <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}>
                        {p.is_active ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>
                    <p className="text-xs text-ink-500">{p.categories?.name ?? 'Sin categoría'}</p>
                    <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-xs">
                      {p.is_on_sale && p.sale_price ? (
                        <span>
                          <span className="font-bold text-gold-700">{money(p.sale_price)}</span>{' '}
                          <span className="text-ink-400 line-through">{money(p.price)}</span>
                        </span>
                      ) : (
                        <span className="font-bold text-ink-900">{money(p.price)}</span>
                      )}
                      <span className={`font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-600' : 'text-ink-600'}`}>
                        Stock: {p.stock}
                      </span>
                      <span className="flex items-center gap-1 text-ink-400">
                        <Layers size={11} /> {variantCount > 0 ? `${variantCount} variantes` : 'Sin variantes'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button onClick={() => openEdit(p)} className="flex items-center gap-1 text-xs font-bold text-ink-600 bg-ink-50 px-3 py-1.5 rounded-lg">
                        <Edit3 size={12} /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        disabled={deletingId === p.id}
                        className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg"
                      >
                        {deletingId === p.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabla — sm+ */}
          <div className="hidden sm:block bg-white rounded-2xl border border-ink-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-100 text-left text-[10px] font-black text-ink-400 uppercase tracking-widest">
                    <th className="px-5 py-4">Producto</th>
                    <th className="px-5 py-4">Categoría</th>
                    <th className="px-5 py-4">Variantes</th>
                    <th className="px-5 py-4">Precio</th>
                    <th className="px-5 py-4">Stock</th>
                    <th className="px-5 py-4">Estado</th>
                    <th className="px-5 py-4">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const cover = [...(p.product_media ?? [])].sort((a, b) => a.position - b.position)[0]?.url;
                    const variantCount = p.product_variants?.length ?? 0;
                    return (
                      <tr key={p.id} className="border-b border-ink-50 last:border-0 hover:bg-cream-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-lg bg-cream-100 border border-ink-100 overflow-hidden shrink-0 relative">
                              {cover ? (
                                <Image src={cover} alt={p.name} fill className="object-cover" sizes="44px" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-ink-300 font-serif text-sm">
                                  {p.name.charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-ink-900 truncate flex items-center gap-1.5">
                                {p.name}
                                {p.is_featured && <Star size={12} className="text-gold-500 fill-gold-500 shrink-0" />}
                              </p>
                              {p.sku && <p className="text-xs text-ink-400">{p.sku}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-ink-600">{p.categories?.name ?? '—'}</td>
                        <td className="px-5 py-4">
                          {variantCount > 0 ? (
                            <button
                              onClick={() => openEdit(p)}
                              className="flex items-center gap-1 text-xs font-bold text-gold-700 hover:text-gold-800"
                            >
                              <Layers size={12} /> {variantCount}
                            </button>
                          ) : (
                            <span className="text-ink-300 text-xs italic">Sin variantes</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          {p.is_on_sale && p.sale_price ? (
                            <div>
                              <span className="font-bold text-gold-700">{money(p.sale_price)}</span>{' '}
                              <span className="text-ink-400 line-through text-xs">{money(p.price)}</span>
                            </div>
                          ) : (
                            <span className="font-semibold text-ink-900">{money(p.price)}</span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className={`font-semibold ${p.stock === 0 ? 'text-red-500' : p.stock <= 5 ? 'text-amber-600' : 'text-ink-700'}`}>
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${p.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-ink-100 text-ink-500'}`}>
                            {p.is_active ? 'ACTIVO' : 'INACTIVO'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => openEdit(p)} className="p-2 text-ink-500 hover:bg-ink-100 rounded-lg transition-colors">
                              <Edit3 size={15} />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              disabled={deletingId === p.id}
                              className="p-2 text-ink-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                            >
                              {deletingId === p.id ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-2 border border-ink-200 rounded-lg disabled:opacity-40 hover:bg-ink-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-ink-500 font-medium">Página {page + 1} de {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-2 border border-ink-200 rounded-lg disabled:opacity-40 hover:bg-ink-50 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {modalOpen && tenantId && (
        <ProductFormModal
          tenantId={tenantId}
          categories={categories}
          productTypes={productTypes}
          initial={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={handleSaved}
        />
      )}

      {feedbackOpen && tenantId && <FeedbackPanel tenantId={tenantId} onClose={() => setFeedbackOpen(false)} />}
    </div>
  );
}
