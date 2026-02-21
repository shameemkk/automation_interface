"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";

type ClientOption = {
  id: number;
  client_tag: string;
};

type BatchProgress = {
  totalQueries: number;
  totalBatches: number;
  batchSize: number;
  locationsCount: number;
  categoriesCount: number;
  currentBatch: number;
  completedBatches: number;
  insertedSoFar: number;
  status: "preparing" | "running" | "done" | "error";
  errorMessage?: string;
};

export function QueryCreationPanel() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<ClientOption | null>(null);
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [progress, setProgress] = useState<BatchProgress | null>(null);
  const abortRef = useRef(false);

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

  const canSubmit = selectedClient != null && region.trim() !== "";

  const handleCancel = useCallback(() => {
    abortRef.current = true;
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClient) return;
    setError("");
    setProgress(null);
    setLoading(true);
    abortRef.current = false;

    const clientTag = selectedClient.client_tag;
    const regionVal = region.trim();

    try {
      setProgress({
        totalQueries: 0,
        totalBatches: 0,
        batchSize: 0,
        locationsCount: 0,
        categoriesCount: 0,
        currentBatch: 0,
        completedBatches: 0,
        insertedSoFar: 0,
        status: "preparing",
      });

      const infoRes = await fetch("/api/generate-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_tag: clientTag, region: regionVal }),
      });
      const infoData = await infoRes.json();
      if (!infoRes.ok) {
        setError(infoData.error || infoData.details || "Failed to get query info");
        setProgress(null);
        return;
      }

      const { total_queries, total_batches, batch_size, locations_count, categories_count } = infoData;

      setProgress({
        totalQueries: total_queries,
        totalBatches: total_batches,
        batchSize: batch_size,
        locationsCount: locations_count,
        categoriesCount: categories_count,
        currentBatch: 0,
        completedBatches: 0,
        insertedSoFar: 0,
        status: "running",
      });

      let totalInserted = 0;

      for (let i = 0; i < total_batches; i++) {
        if (abortRef.current) {
          setProgress((prev) =>
            prev ? { ...prev, status: "error", errorMessage: `Cancelled after ${i} of ${total_batches} batches` } : null
          );
          return;
        }

        setProgress((prev) =>
          prev ? { ...prev, currentBatch: i + 1 } : null
        );

        const batchRes = await fetch("/api/generate-queries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_tag: clientTag,
            region: regionVal,
            batch: i,
          }),
        });
        const batchData = await batchRes.json();

        if (!batchRes.ok) {
          setProgress((prev) =>
            prev
              ? {
                  ...prev,
                  status: "error",
                  errorMessage: `Batch ${i + 1} failed: ${batchData.error || batchData.details || "Unknown error"}`,
                }
              : null
          );
          return;
        }

        totalInserted += batchData.inserted_count ?? 0;

        setProgress((prev) =>
          prev
            ? {
                ...prev,
                completedBatches: i + 1,
                insertedSoFar: totalInserted,
              }
            : null
        );
      }

      setProgress((prev) =>
        prev ? { ...prev, status: "done" } : null
      );
      setRegion("");
      setSelectedClient(null);
      setSearch("");
    } catch {
      setError("An error occurred.");
      setProgress((prev) =>
        prev ? { ...prev, status: "error", errorMessage: "Network error" } : null
      );
    } finally {
      setLoading(false);
    }
  }

  const progressPercent = progress
    ? progress.totalBatches > 0
      ? Math.round((progress.completedBatches / progress.totalBatches) * 100)
      : 0
    : 0;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 max-w-lg">
      <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-2">
        Query creation
      </h2>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
        Generate and insert client queries from business categories and client
        locations. Queries are processed in batches of 2 lakh (200,000) to avoid
        timeouts.
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
              disabled={loading}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 disabled:opacity-50"
            />
            {dropdownOpen && !loading && (
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
            disabled={loading}
            className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50 disabled:opacity-50"
          />
        </div>

        {error && !progress && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {/* Progress Dashboard */}
        {progress && (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 space-y-3">
            {/* Status header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {progress.status === "preparing" && "Preparing..."}
                {progress.status === "running" &&
                  `Processing batch ${progress.currentBatch} of ${progress.totalBatches}`}
                {progress.status === "done" && "Completed"}
                {progress.status === "error" && "Error"}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  progress.status === "done"
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                    : progress.status === "error"
                      ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                }`}
              >
                {progress.status === "done"
                  ? "Done"
                  : progress.status === "error"
                    ? "Failed"
                    : `${progressPercent}%`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ease-out ${
                  progress.status === "done"
                    ? "bg-green-500"
                    : progress.status === "error"
                      ? "bg-red-500"
                      : "bg-blue-500"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Stats grid */}
            {progress.totalQueries > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="text-zinc-500 dark:text-zinc-400">Total queries</div>
                <div className="text-zinc-900 dark:text-zinc-50 font-medium text-right">
                  {progress.totalQueries.toLocaleString()}
                </div>

                <div className="text-zinc-500 dark:text-zinc-400">Locations x Categories</div>
                <div className="text-zinc-900 dark:text-zinc-50 font-medium text-right">
                  {progress.locationsCount.toLocaleString()} x{" "}
                  {progress.categoriesCount.toLocaleString()}
                </div>

                <div className="text-zinc-500 dark:text-zinc-400">Batch size</div>
                <div className="text-zinc-900 dark:text-zinc-50 font-medium text-right">
                  {progress.batchSize.toLocaleString()}
                </div>

                <div className="text-zinc-500 dark:text-zinc-400">Batches completed</div>
                <div className="text-zinc-900 dark:text-zinc-50 font-medium text-right">
                  {progress.completedBatches} / {progress.totalBatches}
                </div>

                <div className="text-zinc-500 dark:text-zinc-400">Inserted so far</div>
                <div className="text-zinc-900 dark:text-zinc-50 font-medium text-right">
                  {progress.insertedSoFar.toLocaleString()}
                </div>
              </div>
            )}

            {/* Error message */}
            {progress.status === "error" && progress.errorMessage && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {progress.errorMessage}
              </p>
            )}

            {/* Success message */}
            {progress.status === "done" && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  All {progress.totalBatches} batches completed successfully
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                  Inserted {progress.insertedSoFar.toLocaleString()} of{" "}
                  {progress.totalQueries.toLocaleString()} queries
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Create queries"}
          </button>

          {loading && progress?.status === "running" && (
            <button
              type="button"
              onClick={handleCancel}
              className="rounded-lg border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 px-4 py-2 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Cancel
            </button>
          )}

          {progress && !loading && (
            <button
              type="button"
              onClick={() => setProgress(null)}
              className="rounded-lg border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-400 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
