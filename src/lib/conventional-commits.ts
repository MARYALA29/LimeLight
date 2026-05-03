/**
 * Conventional Commits validator.
 *
 * Shared between the Husky `commit-msg` hook (indirectly — commitlint
 * enforces the same rules via `commitlint.config.mjs`) and the Claude Code
 * harness `PreToolUse` hook in `.claude/hooks/validate-pr-title.mjs`, which
 * intercepts `gh pr create --title ...` invocations before they leave the
 * agent.
 *
 * Spec: https://www.conventionalcommits.org/en/v1.0.0/
 *
 * Rules enforced here:
 *   1. Type must be one of {@link ALLOWED_TYPES}.
 *   2. Optional scope in parens (no whitespace inside).
 *   3. Optional `!` to flag a breaking change.
 *   4. A literal `: ` separator (note the required space).
 *   5. Subject must start with a lowercase letter (matches the
 *      `subjectPattern` used by `amannn/action-semantic-pull-request`
 *      in `.github/workflows/commitlint.yml`).
 *
 * Keep the type list in sync with:
 *   - `commitlint.config.mjs`
 *   - `.github/workflows/commitlint.yml`
 *   - the docs in `CLAUDE.md`
 */

export const ALLOWED_TYPES = [
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
] as const;

export type AllowedType = (typeof ALLOWED_TYPES)[number];

/**
 * The full regex used by both the harness hook and the unit tests.
 *
 * Breakdown:
 *   ^(feat|fix|...)        – allowed type
 *   (\([^()\s]+\))?        – optional scope, no whitespace, no nested parens
 *   !?                     – optional breaking-change marker
 *   :\s                    – literal colon + single space (Conventional spec)
 *   [a-z]                  – first char of subject must be lowercase
 *   .*$                    – the rest of the subject
 */
export const CONVENTIONAL_COMMIT_REGEX = new RegExp(
  `^(${ALLOWED_TYPES.join("|")})(\\([^()\\s]+\\))?!?: [a-z].*$`,
);

export type ValidationResult =
  | { ok: true }
  | { ok: false; reason: string };

/**
 * Validate a Conventional Commit title (PR title or commit subject).
 *
 * Returns a discriminated union so callers can either ignore the reason
 * (e.g. CI gate) or surface it to the user (e.g. the harness hook prints
 * `result.reason` to stderr).
 */
export function validateConventionalCommitTitle(
  title: unknown,
): ValidationResult {
  if (typeof title !== "string") {
    return {
      ok: false,
      reason: `Title must be a string, got ${typeof title}.`,
    };
  }

  if (title.trim().length === 0) {
    return { ok: false, reason: "Title is empty." };
  }

  if (CONVENTIONAL_COMMIT_REGEX.test(title)) {
    return { ok: true };
  }

  // Build a helpful, specific reason. We re-parse with a looser regex so
  // we can point at the most likely problem rather than just "no match".
  const looseMatch = title.match(
    /^([A-Za-z]+)(\([^()]*\))?(!)?(:)?\s*(.*)$/,
  );

  if (!looseMatch) {
    return {
      ok: false,
      reason: buildReason(
        "Title does not look like a Conventional Commit.",
        title,
      ),
    };
  }

  const [, rawType, rawScope, , colon, subject] = looseMatch;

  if (rawType && rawType !== rawType.toLowerCase()) {
    return {
      ok: false,
      reason: buildReason(
        `Type "${rawType}" must be lowercase.`,
        title,
      ),
    };
  }

  if (
    rawType &&
    !(ALLOWED_TYPES as readonly string[]).includes(rawType.toLowerCase())
  ) {
    return {
      ok: false,
      reason: buildReason(
        `Unknown type "${rawType}". Allowed types: ${ALLOWED_TYPES.join(", ")}.`,
        title,
      ),
    };
  }

  if (!colon) {
    return {
      ok: false,
      reason: buildReason(
        "Missing ':' after the type/scope. Format is `type(scope)?: subject`.",
        title,
      ),
    };
  }

  if (rawScope && /\s/.test(rawScope)) {
    return {
      ok: false,
      reason: buildReason(
        `Scope "${rawScope}" must not contain whitespace.`,
        title,
      ),
    };
  }

  if (!subject || subject.trim().length === 0) {
    return {
      ok: false,
      reason: buildReason("Subject is empty.", title),
    };
  }

  // The Conventional Commits spec requires exactly one space between the
  // colon and the subject. `feat:add a thing` is rejected.
  if (!/: /.test(title)) {
    return {
      ok: false,
      reason: buildReason(
        "Missing space after ':'. Format is `type: subject` (note the space).",
        title,
      ),
    };
  }

  if (!/^[a-z]/.test(subject)) {
    return {
      ok: false,
      reason: buildReason(
        `Subject "${subject}" must start with a lowercase letter.`,
        title,
      ),
    };
  }

  // Fallthrough: regex failed but specific reason wasn't found. Give a
  // generic, actionable message.
  return {
    ok: false,
    reason: buildReason(
      "Title does not match the Conventional Commits format.",
      title,
    ),
  };
}

function buildReason(message: string, title: string): string {
  return [
    message,
    "",
    `Got: "${title}"`,
    "",
    `Allowed types: ${ALLOWED_TYPES.join(", ")}.`,
    "Format: type(scope)?!?: subject (subject starts with a lowercase letter).",
    "Examples:",
    "  feat: add login form",
    "  fix(auth): handle expired tokens",
    "  feat(api)!: drop legacy /v1 endpoints",
  ].join("\n");
}
