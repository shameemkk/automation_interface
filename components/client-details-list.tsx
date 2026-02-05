"use client";

import { useState, useEffect } from "react";

export type ClientDetail = {
  id: number;
  client_tag: string;
  locations: string | null;
  zip_codes: string | null;
  drive_url: string | null;
  automation_mode: "fully_auto" | "semi_auto";
  process_automations: boolean;
  created_at: string;
  updated_at: string;
};

const emptyForm = {
  client_tag: "",
  zip_codes: "",
  drive_url: "",
  automation_mode: "fully_auto" as "fully_auto" | "semi_auto",
  process_automations: false,
};

const ZIP_DISPLAY_MAX = 20;

function truncateZip(zip: string | null): string {
  if (!zip) return "—";
  if (zip.length <= ZIP_DISPLAY_MAX) return zip;
  return zip.slice(0, ZIP_DISPLAY_MAX) + "...";
}

function EditClientModal({
  client,
  onClose,
  onSaved,
}: {
  client: ClientDetail;
  onClose: () => void;
  onSaved: (client: ClientDetail) => void;
}) {
  const [form, setForm] = useState({
    client_tag: client.client_tag,
    zip_codes: client.zip_codes ?? "",
    drive_url: client.drive_url ?? "",
    automation_mode: client.automation_mode,
    process_automations: client.process_automations,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/client-details/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_tag: form.client_tag,
          zip_codes: form.zip_codes || null,
          drive_url: form.drive_url || null,
          automation_mode: form.automation_mode,
          process_automations: form.process_automations,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
        return;
      }
      onSaved(data.client);
    } catch {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Edit client details
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <span className="sr-only">Close</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Client tag *</label>
            <input
              type="text"
              value={form.client_tag}
              onChange={(e) => setForm((f) => ({ ...f, client_tag: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Zip codes</label>
            <input
              type="text"
              value={form.zip_codes}
              onChange={(e) => setForm((f) => ({ ...f, zip_codes: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Drive URL</label>
            <input
              type="url"
              value={form.drive_url}
              onChange={(e) => setForm((f) => ({ ...f, drive_url: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Automation mode *</label>
            <select
              value={form.automation_mode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  automation_mode: e.target.value as "fully_auto" | "semi_auto",
                }))
              }
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
            >
              <option value="fully_auto">Fully auto</option>
              <option value="semi_auto">Semi auto</option>
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.process_automations}
              onChange={(e) =>
                setForm((f) => ({ ...f, process_automations: e.target.checked }))
              }
              className="rounded border-zinc-300 dark:border-zinc-600"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">Process automations</span>
          </label>
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ClientDetailsList() {
  const [clients, setClients] = useState<ClientDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchClients() {
    try {
      const res = await fetch("/api/client-details");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setClients(data.clients ?? []);
      setError("");
    } catch {
      setError("Failed to load client details.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
  }, []);

  function handleAdded(client: ClientDetail) {
    setClients((prev) => [client, ...prev]);
  }

  function handleUpdated(client: ClientDetail) {
    setClients((prev) =>
      prev.map((c) => (c.id === client.id ? client : c))
    );
  }

  function handleDeleted(id: number) {
    setClients((prev) => prev.filter((c) => c.id !== id));
  }

  if (loading) {
    return (
      <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading...</p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
    );
  }

  return (
    <>
      <AddClientForm onAdded={handleAdded} />
      <div className="mt-8">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          Client details ({clients.length})
        </h3>
        {clients.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No client details yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {clients.map((client) => (
              <ClientRow
                key={client.id}
                client={client}
                onUpdated={handleUpdated}
                onDeleted={handleDeleted}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function AddClientForm({ onAdded }: { onAdded: (client: ClientDetail) => void }) {
  const [form, setForm] = useState(emptyForm);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setLoading(true);
    try {
      const res = await fetch("/api/client-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_tag: form.client_tag,
          zip_codes: form.zip_codes || null,
          drive_url: form.drive_url || null,
          automation_mode: form.automation_mode,
          process_automations: form.process_automations,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Failed to add");
        return;
      }
      onAdded(data.client);
      setForm(emptyForm);
    } catch {
      setSubmitError("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-6">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
        Add client details
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Client tag *
            </label>
            <input
              type="text"
              value={form.client_tag}
              onChange={(e) => setForm((f) => ({ ...f, client_tag: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              placeholder="e.g. ACME-01"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Zip codes
            </label>
            <input
              type="text"
              value={form.zip_codes}
              onChange={(e) => setForm((f) => ({ ...f, zip_codes: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              placeholder="e.g. 10001, 10002"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Drive URL
            </label>
            <input
              type="url"
              value={form.drive_url}
              onChange={(e) => setForm((f) => ({ ...f, drive_url: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Automation mode *
            </label>
            <select
              value={form.automation_mode}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  automation_mode: e.target.value as "fully_auto" | "semi_auto",
                }))
              }
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              required
            >
              <option value="fully_auto">Fully auto</option>
              <option value="semi_auto">Semi auto</option>
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.process_automations}
                onChange={(e) =>
                  setForm((f) => ({ ...f, process_automations: e.target.checked }))
                }
                className="rounded border-zinc-300 dark:border-zinc-600"
              />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                Process automations
              </span>
            </label>
          </div>
        </div>
        {submitError && (
          <p className="text-sm text-red-600 dark:text-red-400">{submitError}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add client details"}
        </button>
      </form>
    </div>
  );
}

function ClientRow({
  client,
  onUpdated,
  onDeleted,
}: {
  client: ClientDetail;
  onUpdated: (client: ClientDetail) => void;
  onDeleted: (id: number) => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    if (!confirm("Delete this client detail?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/client-details/${client.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      onDeleted(client.id);
    } catch {
      setError("Failed to delete.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <li className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white dark:bg-zinc-800/50">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">
            {client.client_tag}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-xs" title={client.zip_codes ?? undefined}>
            {truncateZip(client.zip_codes)}
          </p>
        {client.drive_url && (
          <a
            href={client.drive_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate block"
          >
            Drive link
          </a>
        )}
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
          {client.automation_mode.replace("_", " ")} · Process automations:{" "}
          {client.process_automations ? "Yes" : "No"}
        </p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={loading}
          className="rounded-lg px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </li>
    {modalOpen && (
      <EditClientModal
        client={client}
        onClose={() => setModalOpen(false)}
        onSaved={(updated) => {
          onUpdated(updated);
          setModalOpen(false);
        }}
      />
    )}
    </>
  );
}
