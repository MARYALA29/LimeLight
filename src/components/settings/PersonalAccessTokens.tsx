"use client";

import { useEffect, useState } from "react";
import { Button, Input, Modal } from "@/components/ui";
import { formatDate, formatRelativeTime } from "@/lib/utils";

/**
 * UI placement note: rendered inside `/profile`. We chose to extend the
 * existing profile/settings page rather than introducing a new
 * `/settings/tokens` route — there is no separate settings hub today and
 * adding one for a single section would be premature. If the user has more
 * personal-account settings later, this whole panel can move with no API
 * changes.
 */

interface PersonalAccessToken {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt: string | null;
}

interface CreateResponse {
  token: string;
  personalAccessToken: PersonalAccessToken;
}

export function PersonalAccessTokens() {
  const [tokens, setTokens] = useState<PersonalAccessToken[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [revealedToken, setRevealedToken] = useState<{
    token: string;
    name: string;
  } | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const refresh = async () => {
    try {
      const res = await fetch("/api/users/me/tokens");
      if (!res.ok) {
        setLoadError("Unable to load personal access tokens");
        return;
      }
      const data = await res.json();
      setTokens(data.personalAccessTokens ?? []);
      setLoadError("");
    } catch {
      setLoadError("Unable to load personal access tokens");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const openCreate = () => {
    setCreateName("");
    setCreateError("");
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setCreateName("");
    setCreateError("");
  };

  const closeReveal = () => {
    setRevealedToken(null);
    setCopyState("idle");
  };

  const handleCreate = async () => {
    const trimmed = createName.trim();
    if (!trimmed) {
      setCreateError("Name is required");
      return;
    }
    setIsCreating(true);
    setCreateError("");
    try {
      const res = await fetch("/api/users/me/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      const data = (await res.json()) as CreateResponse | { error: string };
      if (!res.ok || !("token" in data)) {
        setCreateError(
          ("error" in data && data.error) || "Failed to create token"
        );
        return;
      }
      setIsCreateOpen(false);
      setCreateName("");
      setRevealedToken({ token: data.token, name: data.personalAccessToken.name });
      await refresh();
    } catch {
      setCreateError("An error occurred. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (token: PersonalAccessToken) => {
    const confirmed = window.confirm(
      `Revoke "${token.name}"? Any clients using this token will stop working immediately.`
    );
    if (!confirmed) return;

    setRevokingId(token.id);
    try {
      const res = await fetch(`/api/users/me/tokens/${token.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setLoadError("Failed to revoke token");
        return;
      }
      await refresh();
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopy = async () => {
    if (!revealedToken) return;
    try {
      await navigator.clipboard.writeText(revealedToken.token);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      // Browsers may block clipboard access — fall back to selecting the text.
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-orange-100 shadow-sm">
      <div className="border-b border-orange-100 px-8 py-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Personal Access Tokens
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Use tokens to authenticate against the LimeLight API. Treat them
            like passwords — anyone with a token can act as you.
          </p>
        </div>
        <Button onClick={openCreate}>Create token</Button>
      </div>

      <div className="p-8">
        {loadError && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600 mb-4">
            {loadError}
          </div>
        )}

        {tokens === null ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500" />
          </div>
        ) : tokens.length === 0 ? (
          <div className="rounded-xl border border-dashed border-orange-200 bg-orange-50/40 p-8 text-center">
            <p className="text-sm text-gray-600 mb-4">
              You haven&apos;t created any personal access tokens yet.
            </p>
            <Button onClick={openCreate}>Create your first token</Button>
          </div>
        ) : (
          <ul className="divide-y divide-orange-100">
            {tokens.map((token) => (
              <li
                key={token.id}
                className="flex items-center justify-between py-4"
              >
                <div className="min-w-0 flex-1 pr-4">
                  <div className="font-semibold text-gray-900">
                    {token.name}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <code className="rounded bg-orange-50 px-2 py-0.5 font-mono text-orange-700">
                      ll_pat_{token.prefix}…
                    </code>
                    <span>Created {formatDate(token.createdAt)}</span>
                    <span>
                      {token.lastUsedAt
                        ? `Last used ${formatRelativeTime(token.lastUsedAt)}`
                        : "Never used"}
                    </span>
                  </div>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRevoke(token)}
                  isLoading={revokingId === token.id}
                >
                  Revoke
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Creation modal */}
      <Modal isOpen={isCreateOpen} onClose={closeCreate} title="Create token">
        <div className="space-y-4">
          {createError && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
              {createError}
            </div>
          )}
          <Input
            id="pat-name"
            label="Token name"
            placeholder="e.g. ci-deploy"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={closeCreate}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isCreating}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* One-time reveal modal */}
      <Modal
        isOpen={revealedToken !== null}
        onClose={closeReveal}
        title="Token created"
      >
        {revealedToken && (
          <div className="space-y-4">
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
              Copy now — you won&apos;t see this again. Store it somewhere
              safe.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {revealedToken.name}
              </label>
              <div className="flex gap-2">
                <code className="flex-1 break-all rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800">
                  {revealedToken.token}
                </code>
                <Button onClick={handleCopy} variant="outline" size="sm">
                  {copyState === "copied" ? "Copied!" : "Copy"}
                </Button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={closeReveal}>Done</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
