'use client';

import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Pencil, Trash2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Modal from '@/components/Modal';

const emptyForm = { name: '', email: '', phone: '', company: '', address: '' };

function Avatar({ name }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-teal-500 text-xs font-bold text-charcoal">
      {initials}
    </div>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    fetch('/api/customers')
      .then((r) => r.json())
      .then((d) => setCustomers(Array.isArray(d) ? d : []))
      .catch(() => setCustomers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.email, c.phone, c.company, c.address]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [customers, query]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setFormOpen(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    setForm({
      name: c.name || '',
      email: c.email || '',
      phone: c.phone || '',
      company: c.company || '',
      address: c.address || '',
    });
    setError('');
    setFormOpen(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const url = editing ? `/api/customers/${editing.id}` : '/api/customers';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Could not save customer.');
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
      await fetch(`/api/customers/${deleteTarget.id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      load();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Relationships"
        title="Customers"
        description="Manage your wholesale accounts."
        action={
          <button
            onClick={openAdd}
            className="btn-primary"
          >
            <Plus className="h-4 w-4" /> Add customer
          </button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, company…"
            className="nexus-input pl-10"
          />
        </div>
        <span className="text-sm text-zinc-600">
          {filtered.length} of {customers.length}
        </span>
      </div>

      <div className="nexus-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#2a2a35] text-[11px] uppercase tracking-wider text-zinc-600">
                <th className="px-5 py-3.5 font-semibold">Name</th>
                <th className="px-5 py-3.5 font-semibold">Email</th>
                <th className="px-5 py-3.5 font-semibold">Phone</th>
                <th className="px-5 py-3.5 font-semibold">Company</th>
                <th className="px-5 py-3.5 font-semibold">Address</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-zinc-600">
                    <div className="flex items-center justify-center gap-2">
                      <div className="loading-dots"><span /><span /><span /></div>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-zinc-600">
                    No customers found.
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="card-row">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} />
                        <span className="font-semibold text-zinc-200">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">{c.email}</td>
                    <td className="px-5 py-3.5 text-zinc-500">{c.phone || '—'}</td>
                    <td className="px-5 py-3.5 text-zinc-400">{c.company || '—'}</td>
                    <td className="max-w-xs truncate px-5 py-3.5 text-zinc-600">{c.address || '—'}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(c)}
                          aria-label="Edit"
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#2a2a35] text-zinc-500 transition-colors hover:border-teal-500/30 hover:bg-teal-500/10 hover:text-teal-400"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(c)}
                          aria-label="Delete"
                          className="grid h-8 w-8 place-items-center rounded-full border border-[#2a2a35] text-zinc-500 transition-colors hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

      {/* Add / Edit */}
      <Modal
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        title={editing ? 'Edit customer' : 'Add customer'}
        footer={
          <>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={saving}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="customer-form"
              disabled={saving}
              className="btn-primary disabled:opacity-60"
            >
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create customer'}
            </button>
          </>
        }
      >
        <form id="customer-form" onSubmit={submit} className="space-y-4">
          {error && <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-400 border border-rose-500/20">{error}</p>}
          <Field label="Name *">
            <input className="nexus-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contact name" />
          </Field>
          <Field label="Email *">
            <input type="email" className="nexus-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="name@company.com" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <input className="nexus-input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+44 …" />
            </Field>
            <Field label="Company">
              <input className="nexus-input" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company Ltd" />
            </Field>
          </div>
          <Field label="Address">
            <textarea rows={2} className="nexus-input resize-none" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street, city, postcode" />
          </Field>
        </form>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        title="Delete customer"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              disabled={deleting}
              className="btn-danger"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </>
        }
      >
        <p className="text-sm text-zinc-400">
          Delete <span className="font-semibold text-zinc-200">{deleteTarget?.name}</span>? This can&apos;t be undone.
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
