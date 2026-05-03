"use client";

/**
 * Renders the LimeLight OpenAPI spec via Swagger UI.
 *
 * Scope: public (intentionally not under `(dashboard)`). The spec at
 * `/api/openapi.json` is itself public so anyone with the URL can already
 * fetch it; gating the human-readable view behind auth would just hurt
 * discoverability without adding any real protection.
 *
 * We render Swagger UI client-side only — `swagger-ui-react` reaches into
 * `window` during initialisation, which crashes server components.
 */
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react"), {
  ssr: false,
  loading: () => (
    <p className="p-8 text-text-secondary">Loading API documentation…</p>
  ),
});

interface OpenApiDoc {
  openapi: string;
  info: { title: string; version: string };
  [key: string]: unknown;
}

export default function DocsPage() {
  const [spec, setSpec] = useState<OpenApiDoc | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/openapi.json")
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Failed to load spec (${res.status})`);
        }
        return res.json() as Promise<OpenApiDoc>;
      })
      .then((doc) => {
        if (!cancelled) setSpec(doc);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unknown error");
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="min-h-screen bg-white text-text-primary dark:bg-dark-background dark:text-dark-text-primary">
      <header className="border-b border-border px-6 py-4 dark:border-dark-border">
        <h1 className="text-2xl font-semibold">LimeLight API</h1>
        <p className="text-sm text-text-secondary">
          Interactive REST documentation. Authenticate with a session cookie
          or a Personal Access Token (
          <code className="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-dark-surface">
            Authorization: Bearer ll_pat_…
          </code>
          ).
        </p>
      </header>

      {error ? (
        <div role="alert" className="p-8 text-red-600">
          Could not load API documentation: {error}
        </div>
      ) : spec ? (
        <SwaggerUI spec={spec} />
      ) : (
        <p className="p-8 text-text-secondary">Loading API documentation…</p>
      )}
    </main>
  );
}
