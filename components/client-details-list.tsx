"use client";

import { useState, useEffect, useRef } from "react";

export type ClientDetail = {
  id: number;
  client_tag: string;
  locations?: string | null; // excluded from API response
  zip_codes: string | string[] | null;
  zip_codes_format: string | string[] | null;
  drive_url: string | null;
  process_automations: boolean;
  query_created: boolean;
  total_queries?: number;
  remaining_queries?: number;
  created_at: string;
};

const emptyForm = {
  client_tag: "",
  zip_codes: "",
  zip_codes_format: "",
  drive_url: "",
  process_automations: true,
};

const ZIP_DISPLAY_MAX = 20;

/** Parse CSV with headers Format, Latitude, Longitude, Zip Code. Returns { locations, zipCodes } */
function parseLocationsFromCSV(csvText: string): {
  locations: [string, string, string][];
  zipCodes: string[];
} {
  const rows = parseCSVRows(csvText);
  if (rows.length < 2) return { locations: [], zipCodes: [] };
  const headers = rows[0];
  const formatIdx = headers.findIndex((h) => h.trim() === "Format");
  const latIdx = headers.findIndex((h) => h.trim() === "Latitude");
  const lngIdx = headers.findIndex((h) => h.trim() === "Longitude");
  const zipIdx = headers.findIndex((h) => h.trim() === "Zip Code");
  if (formatIdx === -1) return { locations: [], zipCodes: [] };
  
  const locations: [string, string, string][] = [];
  const zipCodes: string[] = [];
  
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    const format = cols[formatIdx]?.replace(/\n/g, "").trim();
    const lat = latIdx !== -1 ? (cols[latIdx]?.toString().trim() ?? "") : "";
    const lng = lngIdx !== -1 ? (cols[lngIdx]?.toString().trim() ?? "") : "";
    const zip = zipIdx !== -1 ? cols[zipIdx]?.trim() : "";
    
    if (!format) continue;
    locations.push([format, lat, lng]);
    if (zip) zipCodes.push(zip);
  }
  
  return { locations, zipCodes };
}

/** Parse entire CSV into rows, handling quoted fields with newlines */
function parseCSVRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;
  
  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
      // End of row
      if (char === '\r') i++; // skip \n in \r\n
      currentRow.push(currentField);
      if (currentRow.length > 0 && currentRow.some(f => f.trim())) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }
  
  // Handle last field and row
  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some(f => f.trim())) {
      rows.push(currentRow);
    }
  }
  
  return rows;
}


function truncateZip(zip: string | string[] | null): string {
  const str = Array.isArray(zip) ? zip.join(", ") : zip;
  if (!str) return "—";
  if (str.length <= ZIP_DISPLAY_MAX) return str;
  return str.slice(0, ZIP_DISPLAY_MAX) + "...";
}

function ViewClientModal({
  client,
  onClose,
}: {
  client: ClientDetail;
  onClose: () => void;
}) {
  const [totalQueries, setTotalQueries] = useState<number | null>(null);
  const [remainingQueries, setRemainingQueries] = useState<number | null>(null);
  const [countsLoading, setCountsLoading] = useState(true);

  useEffect(() => {
    setCountsLoading(true);
    fetch(`/api/client-queries-count?client_tag=${encodeURIComponent(client.client_tag)}`)
      .then((res) => res.json())
      .then((data) => {
        setTotalQueries(data.total_queries ?? 0);
        setRemainingQueries(data.remaining_queries ?? 0);
      })
      .catch(() => {
        setTotalQueries(0);
        setRemainingQueries(0);
      })
      .finally(() => setCountsLoading(false));
  }, [client.client_tag]);

  const zipDisplay = Array.isArray(client.zip_codes)
    ? client.zip_codes.join(", ")
    : client.zip_codes ?? "—";
  const formatDisplay = Array.isArray(client.zip_codes_format)
    ? client.zip_codes_format.join(", ")
    : client.zip_codes_format ?? "—";

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
            {client.client_tag}
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
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Queries</dt>
            <dd className="text-amber-600 dark:text-amber-400 font-medium">
              {countsLoading
                ? "Loading..."
                : `${(remainingQueries ?? 0).toLocaleString()} remaining / ${(totalQueries ?? 0).toLocaleString()} total`}
            </dd>
          </div>
          {/* <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Query created</dt>
            <dd className={client.query_created ? "text-green-600 dark:text-green-400" : "text-zinc-600 dark:text-zinc-400"}>
              {client.query_created ? "Yes" : "No"}
            </dd>
          </div> */}
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Zip codes</dt>
            <dd className="max-h-24 overflow-y-auto overflow-x-auto overscroll-contain rounded-md border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-50 break-words">
              {zipDisplay}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Zip codes format</dt>
            <dd className="max-h-24 overflow-y-auto overflow-x-auto overscroll-contain rounded-md border border-zinc-200 dark:border-zinc-600 bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 text-xs font-mono text-zinc-900 dark:text-zinc-50 break-words">
              {formatDisplay}
            </dd>
          </div>
          {client.drive_url && (
            <div>
              <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Drive URL</dt>
              <dd>
                <a
                  href={client.drive_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {client.drive_url}
                </a>
              </dd>
            </div>
          )}
        </dl>
        <div className="mt-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
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
    zip_codes: Array.isArray(client.zip_codes) ? client.zip_codes.join(", ") : (client.zip_codes ?? ""),
    zip_codes_format: Array.isArray(client.zip_codes_format) ? client.zip_codes_format.join(", ") : (client.zip_codes_format ?? ""),
    drive_url: client.drive_url ?? "",
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
          zip_codes_format: form.zip_codes_format || null,
          drive_url: form.drive_url || null,
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
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Client tag <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={form.client_tag ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, client_tag: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Zip codes</label>
            <textarea
              value={form.zip_codes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, zip_codes: e.target.value }))}
              className="w-full min-h-[4rem] max-h-24 overflow-y-auto rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-50 resize-none"
              placeholder="Comma-separated"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Zip codes format</label>
            <textarea
              value={form.zip_codes_format ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, zip_codes_format: e.target.value }))}
              className="w-full min-h-[4rem] max-h-24 overflow-y-auto rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-50 resize-none"
              placeholder="Comma-separated"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Drive URL</label>
            <input
              type="url"
              value={form.drive_url ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, drive_url: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.process_automations === true}
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
  const [addModalOpen, setAddModalOpen] = useState(false);

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
      <div className="flex items-center justify-between gap-4 mb-6">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Total Clients : {clients.length}
        </h3>
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          Add client
        </button>
      </div>
      {addModalOpen && (
        <AddClientModal
          onClose={() => setAddModalOpen(false)}
          onAdded={(client) => {
            handleAdded(client);
            setAddModalOpen(false);
          }}
        />
      )}
      <div>
        {clients.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No client details yet. Add one to get started.
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

const CSV_HEADERS = "Format, Latitude, Longitude, Zip Code";

function AddClientModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: (client: ClientDetail) => void;
}) {
  const [form, setForm] = useState(emptyForm);
  const [locations, setLocations] = useState<[string, string, string][]>([]);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [csvFormatOpen, setCsvFormatOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleCSVFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { locations: parsedLocations, zipCodes } = parseLocationsFromCSV(text);
      setLocations(parsedLocations);
      // Auto-populate zip_codes field with unique zip codes from CSV
      if (zipCodes.length > 0) {
        const uniqueZips = Array.from(new Set(zipCodes));
        setForm((f) => ({ ...f, zip_codes: uniqueZips.join(", ") }));
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError("");
    setLoading(true);
    if (locations.length === 0) {
      setSubmitError("Locations CSV is required. Please upload a CSV file.");
      setLoading(false);
      return;
    }
    try {
      const body: Record<string, unknown> = {
        client_tag: form.client_tag,
        zip_codes: form.zip_codes || null,
        zip_codes_format: form.zip_codes_format || null,
        drive_url: form.drive_url || null,
        process_automations: form.process_automations,
        locations,
      };
      const res = await fetch("/api/client-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Failed to add");
        return;
      }
      onAdded(data.client);
      setForm(emptyForm);
      setLocations([]);
    } catch {
      setSubmitError("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-6 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Add client details
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Locations (CSV, add only) <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVFile}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => setCsvFormatOpen(true)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700"
            >
              Choose file
            </button>
            {locations.length > 0 && (
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Loaded {locations.length} location(s)
                {form.zip_codes ? ` and ${form.zip_codes.split(",").length} zip code(s)` : ""} from CSV.
              </p>
            )}
            {csvFormatOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                onClick={() => setCsvFormatOpen(false)}
              >
                <div
                  className="w-full max-w-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-6"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h4 className="text-base font-medium text-zinc-900 dark:text-zinc-50 mb-2">
                    CSV header format
                  </h4>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                    Your CSV must have these column headers (exact names):
                  </p>
                  <code className="block rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 mb-4 font-mono">
                    {CSV_HEADERS}
                  </code>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                    Required columns: Format, Latitude, Longitude, Zip Code.<br />
                    Rows missing any required column are skipped.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCsvFormatOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium"
                    >
                      Choose file
                    </button>
                    <button
                      type="button"
                      onClick={() => setCsvFormatOpen(false)}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Client tag <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.client_tag ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, client_tag: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              placeholder="e.g. [Client tag]"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Zip codes format
            </label>
            <textarea
              value={form.zip_codes_format ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, zip_codes_format: e.target.value }))}
              className="w-full min-h-[4rem] max-h-24 overflow-y-auto rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-50 resize-none"
              placeholder="Comma-separated"
              rows={3}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Drive URL
            </label>
            <input
              type="url"
              value={form.drive_url ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, drive_url: e.target.value }))}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              placeholder="https://drive.google.com/..."
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.process_automations === true}
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
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Adding..." : "Add client"}
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

function ClientRow({
  client,
  onUpdated,
  onDeleted,
}: {
  client: ClientDetail;
  onUpdated: (client: ClientDetail) => void;
  onDeleted: (id: number) => void;
}) {
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
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
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
            Process automations: {client.process_automations ? "Yes" : "No"} ·{" "}
            <span className={ "text-zinc-400 dark:text-zinc-500"}>
              Query created: {client.query_created ? "Yes" : "No"}
            </span>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setViewModalOpen(true)}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            View
          </button>
          <button
            type="button"
            onClick={() => setEditModalOpen(true)}
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
      {viewModalOpen && (
        <ViewClientModal
          client={client}
          onClose={() => setViewModalOpen(false)}
        />
      )}
      {editModalOpen && (
        <EditClientModal
          client={client}
          onClose={() => setEditModalOpen(false)}
          onSaved={(updated) => {
            onUpdated(updated);
            setEditModalOpen(false);
          }}
        />
      )}
    </>
  );
}
