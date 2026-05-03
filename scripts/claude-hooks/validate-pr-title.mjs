#!/usr/bin/env node
/**
 * Claude Code PreToolUse hook — Conventional Commits gate for PR titles.
 *
 * Wired in `.claude/settings.json` as a `PreToolUse` hook on the `Bash`
 * tool. Reads the tool-call payload from stdin (Claude Code hook contract):
 *
 *   {
 *     "session_id": "...",
 *     "tool_name": "Bash",
 *     "tool_input": { "command": "gh pr create --title '...' ..." }
 *   }
 *
 * Behaviour:
 *   - If the command is not a `gh pr create` / `gh pr edit` invocation that
 *     sets a title, exit 0 (let it pass).
 *   - If a `--title` value can be extracted and it matches the Conventional
 *     Commits regex, exit 0.
 *   - Otherwise, print a clear, multi-line error to stderr and exit non-zero
 *     so Claude Code blocks the tool call. The error names the offending
 *     title, the violated rule, and lists allowed types + examples.
 *
 * The validation rules are kept in `src/lib/conventional-commits.ts` so the
 * Jest test suite (`src/__tests__/lib/conventional-commits.test.ts`) covers
 * them. This file is the thin shell-glue layer — it parses the gh CLI args
 * and re-implements the regex inline so the hook has zero runtime deps and
 * doesn't need the project's `node_modules` to be installed.
 *
 * Keep ALLOWED_TYPES / CONVENTIONAL_COMMIT_REGEX in lock-step with:
 *   - src/lib/conventional-commits.ts
 *   - commitlint.config.mjs
 *   - .github/workflows/commitlint.yml
 */

// ---- Validation rules (mirror of src/lib/conventional-commits.ts) -----------

const ALLOWED_TYPES = [
  "feat",
  "fix",
  "chore",
  "docs",
  "refactor",
  "test",
  "ci",
  "perf",
  "style",
  "build",
];

const CONVENTIONAL_COMMIT_REGEX = new RegExp(
  `^(${ALLOWED_TYPES.join("|")})(\\([^()\\s]+\\))?!?: [a-z].*$`,
);

function validate(title) {
  if (typeof title !== "string" || title.trim().length === 0) {
    return { ok: false, reason: "Title is empty." };
  }
  if (CONVENTIONAL_COMMIT_REGEX.test(title)) {
    return { ok: true };
  }
  return {
    ok: false,
    reason: "Title does not match the Conventional Commits format.",
  };
}

// ---- gh CLI argument parser -------------------------------------------------

/**
 * Tokenise a shell-ish command line into argv. Handles single quotes, double
 * quotes, and backslash-escapes. Good enough for the way Claude Code emits
 * `gh pr create --title '...'` invocations; not a full POSIX parser.
 */
function tokenize(command) {
  const out = [];
  let buf = "";
  let quote = null; // "'" | '"' | null
  let escaped = false;

  for (const ch of command) {
    if (escaped) {
      buf += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\" && quote !== "'") {
      escaped = true;
      continue;
    }
    if (quote) {
      if (ch === quote) {
        quote = null;
        continue;
      }
      buf += ch;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (/\s/.test(ch)) {
      if (buf.length > 0) {
        out.push(buf);
        buf = "";
      }
      continue;
    }
    buf += ch;
  }
  if (buf.length > 0) out.push(buf);
  return out;
}

/**
 * Decide whether this Bash invocation is a `gh pr create` or `gh pr edit`
 * (or `gh pr update`). If so, return the `--title` value (or signal "skip"
 * if no title flag is present — the issue is specifically about
 * non-conforming titles, not omitted ones).
 *
 * Returns:
 *   { kind: "skip" }              – not a gh-pr-title-setting command
 *   { kind: "title", title: ... } – a title to validate
 */
function extractPrTitle(command) {
  if (typeof command !== "string") return { kind: "skip" };

  // Cheap pre-filter so we don't tokenise every Bash command.
  if (!/\bgh\s+pr\s+(create|edit|update)\b/.test(command)) {
    return { kind: "skip" };
  }

  // Handle compound commands like `cd foo && gh pr create ...` by splitting
  // on `&&`, `||`, and `;` and inspecting each segment that starts with `gh`.
  const segments = command.split(/(?:&&|\|\||;)/);
  for (const segment of segments) {
    const tokens = tokenize(segment.trim());
    if (tokens.length < 3) continue;
    if (tokens[0] !== "gh") continue;
    if (tokens[1] !== "pr") continue;
    if (!["create", "edit", "update"].includes(tokens[2])) continue;

    // Walk argv looking for --title <value> or --title=<value>.
    for (let i = 3; i < tokens.length; i++) {
      const tok = tokens[i];
      if (tok === "--title" || tok === "-t") {
        const next = tokens[i + 1];
        if (next === undefined) {
          return {
            kind: "title",
            title: "",
            reason: "Saw `--title` with no value.",
          };
        }
        return { kind: "title", title: next };
      }
      if (tok.startsWith("--title=")) {
        return { kind: "title", title: tok.slice("--title=".length) };
      }
    }
  }

  // No --title flag found — let the call through. (`gh pr create` without
  // --title opens an editor, which the harness shouldn't be doing anyway,
  // but that's a separate concern.)
  return { kind: "skip" };
}

// ---- Hook entrypoint --------------------------------------------------------

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (chunk) => (data += chunk));
    process.stdin.on("end", () => resolve(data));
    process.stdin.on("error", reject);
  });
}

function fail(title, reason) {
  const examples = [
    "  feat: add login form",
    "  fix(auth): handle expired tokens",
    "  feat(api)!: drop legacy /v1 endpoints",
    "  chore: bump dependencies",
  ];
  const lines = [
    "[validate-pr-title] Blocked: PR title is not a Conventional Commit.",
    "",
    `Title:  ${JSON.stringify(title)}`,
    `Reason: ${reason}`,
    "",
    `Allowed types: ${ALLOWED_TYPES.join(", ")}.`,
    "Format: type(scope)?!?: subject  (subject must start with a lowercase letter)",
    "",
    "Examples:",
    ...examples,
    "",
    "If you intended to set a different field, double-check the gh flag.",
    "Hook source: scripts/claude-hooks/validate-pr-title.mjs",
  ];
  process.stderr.write(lines.join("\n") + "\n");
  process.exit(2); // non-zero blocks the tool call.
}

async function main() {
  let payload;
  try {
    const raw = await readStdin();
    payload = raw.trim().length === 0 ? {} : JSON.parse(raw);
  } catch {
    // Malformed payload — don't get in the user's way.
    process.exit(0);
  }

  const toolName = payload.tool_name;
  const command = payload.tool_input && payload.tool_input.command;

  if (toolName !== "Bash" || typeof command !== "string") {
    process.exit(0);
  }

  const result = extractPrTitle(command);
  if (result.kind === "skip") {
    process.exit(0);
  }

  const verdict = validate(result.title);
  if (verdict.ok) {
    process.exit(0);
  }

  fail(result.title, result.reason || verdict.reason);
}

// Only run when invoked directly (not when imported by tests).
const isMain =
  import.meta.url === `file://${process.argv[1]}` ||
  import.meta.url.endsWith(process.argv[1] || "");
if (isMain) {
  main().catch((err) => {
    // If the hook itself crashes, log to stderr but don't block the user.
    process.stderr.write(
      `[validate-pr-title] hook crashed: ${err && err.message ? err.message : err}\n`,
    );
    process.exit(0);
  });
}

// Export for unit tests.
export { ALLOWED_TYPES, CONVENTIONAL_COMMIT_REGEX, validate, tokenize, extractPrTitle };
