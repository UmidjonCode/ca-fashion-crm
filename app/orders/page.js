'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import { money, fmtDate, num } from '@/lib/format';

const STATUSES = ['pending', 'processing', 'shipped', 'delivered'];
const emptyForm = { order_number: '', customer_id: '', status: 'pending', items_count: '', total: '' };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch('/api/orders').then((r) => r.json()),
      fetch('/api/customers').then((r) => r.json()),
    ])
      .then(([o, c]) => {
        setOrders(Array.isArray(o) ? o : []);
        setCustomers(Array.isArray(c) ? c : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      return [o.order_number, o.customer_company, o.customer_name]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [orders, query, statusFilter]);

  const nextOrderNumber = () => {
    const max = orders.reduce((m, o) => {
      const n = parseInt(String(o.order_number).replace(/\D/g, ''), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 1000);
    return `ORD-${max + 1}`;
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, order_number: nextOrderNumber() });
    setError('');
    setFormOpen(true);
  };

  const openEdit = (o) => {
    setEditing(o);
    setForm({
      order_number: o.order_number || '',
      customer_id: o.customer_id ? String(o.customer_id) : '',
      status: o.status || 'pending',
      items_count: o.items_count ?? '',
      total: o.total ?? '',
    });
    setError('');
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.order_number.trim()) {
      setError('Order number is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        order_number: form.order_number.trim(),
        customer_id: form.customer_id ? Number(form.customer_id) : null,
        status: form.status,
        items_count: Number(form.items_count) || 0,
        total: Number(form.total) || 0,
      };
      const url = editing ? `/api/orders/${editing.id}` : '/api/orders';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Could not save order.');
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
      await fetch(`/api/orders/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Fulfilment"
        title="Orders"
        description="Track and manage wholesale orders."
        action={
          <button
            onClick={openAdd}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> New order
          </button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search order # or customer…"
            className="nexus-input pl-10"
          />
        </div>
        <div className="tab-bar">
          {['all', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`tab-item ${
                statusFilter === s ? 'tab-active' : 'tab-inactive'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="nexus-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#2a2a35] text-xs uppercase tracking-wide text-zinc-500">
                <th className="px-5 py-4 font-semibold">Order</th>
                <th className="px-5 py-4 font-semibold">Customer</th>
                <th className="px-5 py-4 font-semibold">Date</th>
                <th className="px-5 py-4 text-right font-semibold">Items</th>
                <th className="px-5 py-4 text-right font-semibold">Total</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="loading-dots">
                        <span />
                        <span />
                        <span />
                      </div>
                      <span className="text-xs font-semibold tracking-wider text-teal-500 uppercase">Loading orders…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-zinc-500">No orders found.</td>
                </tr>
              ) : (
                filtered.map((o) => (
                  <tr key={o.id} className="card-row">
                    <td className="px-5 py-4 font-semibold text-zinc-200">{o.order_number}</td>
                    <td className="px-5 py-4 text-zinc-400">{o.customer_company || o.customer_name || '—'}</td>
                    <td className="px-5 py-4 text-zinc-500">{fmtDate(o.created_at)}</td>
                    <td className="px-5 py-4 text-right text-zinc-400 tabular-nums">{num(o.items_count)}</td>
                    <td className="px-5 py-4 text-right font-semibold text-zinc-200 tabular-nums">{money(o.total)}</td>
                    <td className="px-5 py-4"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(o)} aria-label="Edit" className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-teal-500/10 hover:text-teal-400">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(o)} aria-label="Delete" className="grid h-8 w-8 place-items-center rounded-lg text-zinc-500 transition-colors hover:bg-rose-500/10 hover:text-rose-400">
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
        title={editing ? 'Edit order' : 'New order'}
        footer={
          <>
            <button type="button" onClick={() => setFormOpen(false)} disabled={saving} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" form="order-form" disabled={saving} className="btn-primary disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create order'}
            </button>
          </>
        }
      >
        <form id="order-form" onSubmit={submit} className="space-y-4">
          {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 ring-1 ring-inset ring-rose-500/20">{error}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Order number *">
              <input className="nexus-input" value={form.order_number} onChange={(e) => setForm({ ...form, order_number: e.target.value })} placeholder="ORD-1011" />
            </Field>
            <Field label="Status">
              <select className="nexus-input capitalize bg-[#15151d]" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize bg-[#1a1a23] text-zinc-200">{s}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Customer">
            <select className="nexus-input bg-[#15151d]" value={form.customer_id} onChange={(e) => setForm({ ...form, customer_id: e.target.value })}>
              <option value="" className="bg-[#1a1a23]">— No customer —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1a1a23]">{c.company ? `${c.company} (${c.name})` : c.name}</option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Items">
              <input type="number" min="0" className="nexus-input" value={form.items_count} onChange={(e) => setForm({ ...form, items_count: e.target.value })} placeholder="0" />
            </Field>
            <Field label="Total (£)">
              <input type="number" min="0" step="0.01" className="nexus-input" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} placeholder="0.00" />
            </Field>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete order"
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
          Delete order <span className="font-semibold text-zinc-200">{deleteTarget?.order_number}</span>? This can&apos;t be undone.
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
