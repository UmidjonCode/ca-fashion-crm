'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import { money, num } from '@/lib/format';

const emptyForm = { name: '', sku: '', category: '', price: '', stock: '' };

function StockBadge({ stock }) {
  let cls = 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20';
  let label = 'In stock';
  if (stock <= 0) {
    cls = 'bg-rose-500/10 text-rose-400 ring-rose-500/20';
    label = 'Out of stock';
  } else if (stock < 100) {
    cls = 'bg-amber-500/10 text-amber-400 ring-amber-500/20';
    label = 'Low stock';
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${cls}`}>
      {label}
    </span>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/products')
      .then((r) => r.json())
      .then((d) => setProducts(Array.isArray(d) ? d : []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(),
    [products]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (category !== 'all' && p.category !== category) return false;
      if (!q) return true;
      return [p.name, p.sku, p.category]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [products, query, category]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setFormOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      sku: p.sku || '',
      category: p.category || '',
      price: p.price ?? '',
      stock: p.stock ?? '',
    });
    setError('');
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.sku.trim() || !form.category.trim()) {
      setError('Name, SKU and category are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        category: form.category.trim(),
        price: Number(form.price) || 0,
        stock: Number(form.stock) || 0,
      };
      const url = editing ? `/api/products/${editing.id}` : '/api/products';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Could not save product.');
      }
      setFormOpen(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/products/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Your wholesale catalogue and stock levels."
        action={
          <button
            onClick={openAdd}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Add product
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, SKU, category…"
            className="nexus-input pl-10"
          />
        </div>
        <div className="tab-bar">
          <button
            onClick={() => setCategory('all')}
            className={`tab-item ${
              category === 'all' ? 'tab-active' : 'tab-inactive'
            }`}
          >
            All
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`tab-item ${
                category === c ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="nexus-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#2a2a35] text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-4 font-semibold">Product</th>
                <th className="px-5 py-4 font-semibold">Category</th>
                <th className="px-5 py-4 text-right font-semibold">Price</th>
                <th className="px-5 py-4 text-right font-semibold">Stock</th>
                <th className="px-5 py-4 font-semibold">Availability</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="loading-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-teal-500 uppercase">Loading products…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-zinc-500">No products found.</td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="card-row">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-zinc-200">{p.name}</div>
                      <div className="text-xs text-zinc-500">{p.sku}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-md border border-[#2a2a35] bg-[#15151d] px-2.5 py-1 text-xs font-semibold text-zinc-400">{p.category}</span>
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-zinc-200 tabular-nums">{money(p.price)}</td>
                    <td className="px-5 py-4 text-right text-zinc-400 tabular-nums">{num(p.stock)}</td>
                    <td className="px-5 py-4"><StockBadge stock={p.stock} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} aria-label="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-teal-500/10 hover:text-teal-400">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(p)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? 'Edit product' : 'Add product'}
        footer={
          <>
            <button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" form="product-form" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Add product'}
            </button>
          </>
        }
      >
        <form id="product-form" onSubmit={submit} className="space-y-4">
          {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-inset ring-rose-500/20">{error}</p>}
          <Field label="Product name *">
            <input className="nexus-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Silk Summer Dress" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="SKU *">
              <input className="nexus-input" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="DRS-SILK-01" />
            </Field>
            <Field label="Category *">
              <input className="nexus-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Dresses" />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Price (£)">
              <input type="number" min="0" step="0.01" className="nexus-input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0.00" />
            </Field>
            <Field label="Stock level">
              <input type="number" min="0" className="nexus-input" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="0" />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete product"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn-ghost">
              Cancel
            </button>
            <button onClick={confirmDelete} disabled={deleting} className="btn-danger">
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-zinc-400">
          Delete product <span className="font-semibold text-zinc-200">{deleteTarget?.name}</span>? This can&apos;t be undone.
        </p>
      </Modal>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-400">{label}</span>
      {children}
    </label>
  );
}
