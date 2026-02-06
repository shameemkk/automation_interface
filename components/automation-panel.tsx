"use client";

import { useState, useEffect, useMemo } from "react";

type AutomationLog = {
  id: number;
  client_tag: string | null;
  processing_ids: number[] | null;
  pending_ids: number[] | null;
  status: string | null;
  created_at: string;
  drive_file: string | null;
};

type ClientOption = {
  id: number;
  client_tag: string;
};

export function AutomationPanel() {
  const [logs, setLogs] = useState<AutomationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/automation-logs");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLogs(data.logs ?? []);
      setError("");
    } catch {
      setError("Failed to load automation history.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-zinc-600 dark:text-zinc-400">
          View automation run history and trigger manual runs.
        </p>
        <button
          type="button"
          onClick={() => setTriggerModalOpen(true)}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200"
        >
          Manual automation trigger
        </button>
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          Automation history
        </h3>
        {loading ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading...</p>
        ) : error ? (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        ) : logs.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No automation runs yet.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Client tag</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Drive file</th>
                  <th className="px-4 py-3 font-medium">Total / Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-700">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="bg-white dark:bg-zinc-800/30 text-zinc-900 dark:text-zinc-50"
                  >
                    <td className="px-4 py-3">{log.id}</td>
                    <td className="px-4 py-3">{log.client_tag ?? "—"}</td>
                    <td className="px-4 py-3">{log.status ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString("en-IN", {
                            timeZone: "UTC",
                            dateStyle: "short",
                            timeStyle: "medium",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 max-w-[200px] truncate">
                      {log.drive_file ? (
                        <a
                          href={log.drive_file}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Link
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                      {log.processing_ids?.length ?? 0} /{" "}
                      {log.pending_ids?.length ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {triggerModalOpen && (
        <ManualTriggerModal
          onClose={() => {
            setTriggerModalOpen(false);
            setConfirmOpen(false);
          }}
          onConfirmOpen={() => setConfirmOpen(true)}
          onSuccess={() => {
            setTriggerModalOpen(false);
            setConfirmOpen(false);
            fetchLogs();
          }}
          confirmOpen={confirmOpen}
        />
      )}
    </div>
  );
}

function ManualTriggerModal({
  onClose,
  onConfirmOpen,
  onSuccess,
  confirmOpen,
}: {
  onClose: () => void;
  onConfirmOpen: () => void;
  onSuccess: () => void;
  confirmOpen: boolean;
}) {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [batchSize, setBatchSize] = useState("10");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/client-details");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const list = (data.clients ?? []).map((c: { id: number; client_tag: string }) => ({
          id: c.id,
          client_tag: c.client_tag ?? "",
        }));
        setClients(list);
      } catch {
        setError("Failed to load clients.");
      }
    }
    load();
  }, []);

  const filteredClients = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      (c.client_tag ?? "").toLowerCase().includes(q)
    );
  }, [clients, search]);

  const canContinue =
    selectedClient != null &&
    batchSize.trim() !== "" &&
    Number(batchSize) >= 1;

  function handleContinue() {
    if (!canContinue) return;
    onConfirmOpen();
  }

  async function handleConfirmYes() {
    if (!selectedClient) return;
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/automation-trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_tag: selectedClient.client_tag,
          batch_size: Number(batchSize),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Trigger failed");
        return;
      }
      onSuccess();
    } catch {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  if (confirmOpen) {
    return (
      <div
        className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <div
          className="w-full max-w-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="text-base font-medium text-zinc-900 dark:text-zinc-50 mb-2">
            Confirm manual trigger
          </h4>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            Start automation for client <strong>{selectedClient?.client_tag}</strong> with
            batch size <strong>{batchSize}</strong>?
          </p>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmYes}
              disabled={loading}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
            >
              {loading ? "Starting..." : "Yes"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              No
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Manual automation trigger
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Client (search by client tag) *
            </label>
            <div className="relative">
              <input
                type="text"
                value={search || (selectedClient?.client_tag ?? "")}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setDropdownOpen(true);
                  setSelectedClient(null);
                }}
                onFocus={() => setDropdownOpen(true)}
                placeholder="Type to search client tag..."
                className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              />
              {dropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setDropdownOpen(false)}
                  />
                  <ul className="absolute z-20 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg py-1">
                    {filteredClients.length === 0 ? (
                      <li className="px-3 py-2 text-sm text-zinc-500">
                        No clients match
                      </li>
                    ) : (
                      filteredClients.map((c) => (
                        <li
                          key={c.id}
                          className="px-3 py-2 text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-zinc-50"
                          onClick={() => {
                            setSelectedClient(c);
                            setSearch("");
                            setDropdownOpen(false);
                          }}
                        >
                          {c.client_tag}
                        </li>
                      ))
                    )}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              Batch size *
            </label>
            <input
              type="number"
              min={1}
              value={batchSize}
              onChange={(e) => setBatchSize(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
            />
          </div>

          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue}
              className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-4 py-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
