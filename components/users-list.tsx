"use client";

import { useState } from "react";

type User = {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
};

export function UsersList({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers);

  function handleUserAdded(user: User) {
    setUsers((prev) => [user, ...prev]);
  }

  return (
    <>
      <AddUserForm onUserAdded={handleUserAdded} />
      <div className="mt-8">
        <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-3">
          Users ({users.length})
        </h3>
        {users.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            No users yet. Add one above.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-700 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
            {users.map((user) => (
              <li
                key={user.id}
                className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-800/50"
              >
                <div>
                  <p className="font-medium text-zinc-900 dark:text-zinc-50">
                    {user.name}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {user.email}
                  </p>
                </div>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {user.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function AddUserForm({
  onUserAdded,
}: {
  onUserAdded: (user: User) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to add user");
        return;
      }

      onUserAdded(data.user);
      setEmail("");
      setName("");
      setPassword("");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-4 mb-6">
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-4">
        Add User
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              placeholder="user@example.com"
              required
            />
          </div>
          <div>
            <label
              htmlFor="name"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              placeholder="Full name"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-50"
              placeholder="Min 6 characters"
              required
              minLength={6}
            />
          </div>
        </div>
        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 px-4 py-2 text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add User"}
        </button>
      </form>
    </div>
  );
}
