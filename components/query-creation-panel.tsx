"use client";

import { useState, useEffect, useMemo } from "react";

type ClientOption = {
  id: number;
  client_tag: string;
};

export function QueryCreationPanel() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    total_queries: number;
    inserted_count: number;
    locations_count: number;
    categories_count: number;
  } | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/client-details");
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const list = (data.clients ?? []).map(
          (c: { id: number; client_tag: string }) => ({
            id: c.id,
            client_tag: c.client_tag ?? "",
          })
        );
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

  const canSubmit =
    selectedClient != null && region.trim() !== "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient) return;
    setError("");
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/generate-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_tag: selectedClient.client_tag,
          region: region.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || data.details || "Query creation failed");
        return;
      }
      setSuccess({
        total_queries: data.total_queries,
        inserted_count: data.inserted_count,
        locations_count: data.locations_count,
        categories_count: data.categories_count,
      });
      setRegion("");
      setSelectedClient(null);
      setSearch("");
    } catch {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 max-w-md">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
        Query creation
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
        Generate and insert client queries from business categories and client
        locations. Client tag comes from client details; enter the region.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Client (from client details) *
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
            Region *
          </label>
          <input
            type="text"
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            placeholder="e.g. us"
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {success && (
          <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-sm font-medium text-green-800 dark:text-green-200">
              Queries created successfully
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Inserted {success.inserted_count} of {success.total_queries} queries
              ({success.locations_count} locations × {success.categories_count}{" "}
              categories)
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Creating..." : "Create queries"}
        </button>
      </form>
    </div>
  );
}
