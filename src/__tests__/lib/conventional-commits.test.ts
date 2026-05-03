/**
 * Tests for the Conventional Commits title validator.
 *
 * The validator is shared between:
 *   - The Husky `commit-msg` hook (indirectly, via commitlint's own rules,
 *     which are kept in sync — see `commitlint.config.mjs`).
 *   - The Claude Code harness `PreToolUse` hook that intercepts
 *     `gh pr create --title ...` / `gh pr edit --title ...` invocations.
 *
 * The validator must accept every shape that release-please / commitlint
 * accept and reject everything else with a clear, actionable reason.
 *
 * Allowed types are listed in `ALLOWED_TYPES`. Subject must start with a
 * lowercase letter, optional scope `(scope)`, optional `!` to flag a
 * breaking change.
 */
import {
  validateConventionalCommitTitle,
  ALLOWED_TYPES,
  CONVENTIONAL_COMMIT_REGEX,
} from "@/lib/conventional-commits";

describe("validateConventionalCommitTitle", () => {
  describe("valid titles", () => {
    it.each(ALLOWED_TYPES)("accepts %s without scope", (type) => {
      const result = validateConventionalCommitTitle(`${type}: add a thing`);
      expect(result.ok).toBe(true);
    });

    it.each(ALLOWED_TYPES)("accepts %s with scope", (type) => {
      const result = validateConventionalCommitTitle(
        `${type}(scope): add a thing`,
      );
      expect(result.ok).toBe(true);
    });

    it.each(ALLOWED_TYPES)("accepts %s with breaking-change marker", (type) => {
      const result = validateConventionalCommitTitle(
        `${type}!: drop legacy api`,
      );
      expect(result.ok).toBe(true);
    });

    it.each(ALLOWED_TYPES)(
      "accepts %s with both scope and breaking-change marker",
      (type) => {
        const result = validateConventionalCommitTitle(
          `${type}(api)!: drop legacy field`,
        );
        expect(result.ok).toBe(true);
      },
    );

    it("accepts a long realistic title from the existing repo history", () => {
      // Pulled directly from `git log` on main.
      const result = validateConventionalCommitTitle(
        "feat(pat): add Personal Access Tokens UI in /profile and document flow",
      );
      // Subject starts with "add" (lowercase) — should pass.
      expect(result.ok).toBe(true);
    });

    it("accepts a hyphenated scope", () => {
      const result = validateConventionalCommitTitle(
        "fix(task-filters): handle empty assignee list",
      );
      expect(result.ok).toBe(true);
    });

    it("accepts a digits-and-letters scope", () => {
      const result = validateConventionalCommitTitle(
        "chore(ci2): bump runner image",
      );
      expect(result.ok).toBe(true);
    });
  });

  describe("invalid titles", () => {
    it("rejects an empty title", () => {
      const result = validateConventionalCommitTitle("");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toMatch(/empty/i);
      }
    });

    it("rejects a whitespace-only title", () => {
      const result = validateConventionalCommitTitle("   ");
      expect(result.ok).toBe(false);
    });

    it("rejects a capitalized subject", () => {
      const result = validateConventionalCommitTitle("feat: Add a thing");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toMatch(/lowercase/i);
      }
    });

    it("rejects a capitalized type", () => {
      const result = validateConventionalCommitTitle("Feat: add a thing");
      expect(result.ok).toBe(false);
    });

    it("rejects an unknown type", () => {
      const result = validateConventionalCommitTitle(
        "feature: add a thing",
      );
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toMatch(/feature/);
        // Should hint at allowed types.
        expect(result.reason).toMatch(/feat/);
      }
    });

    it("rejects a type without colon", () => {
      const result = validateConventionalCommitTitle("feat add a thing");
      expect(result.ok).toBe(false);
    });

    it("rejects a missing subject after colon", () => {
      const result = validateConventionalCommitTitle("feat:");
      expect(result.ok).toBe(false);
    });

    it("rejects a colon with only whitespace subject", () => {
      const result = validateConventionalCommitTitle("feat:   ");
      expect(result.ok).toBe(false);
    });

    it("rejects a non-string input", () => {
      // The signature accepts `unknown` so we can pass anything at runtime.
      const result = validateConventionalCommitTitle(undefined);
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.reason).toMatch(/must be a string/i);
      }
    });

    it("rejects a missing space after the colon", () => {
      // Conventional Commits spec requires a space after `:`.
      const result = validateConventionalCommitTitle("feat:add a thing");
      expect(result.ok).toBe(false);
    });

    it("rejects a scope with whitespace inside the parens", () => {
      const result = validateConventionalCommitTitle(
        "feat(my scope): add a thing",
      );
      expect(result.ok).toBe(false);
    });
  });
});

describe("CONVENTIONAL_COMMIT_REGEX", () => {
  it("is exported and is a RegExp", () => {
    expect(CONVENTIONAL_COMMIT_REGEX).toBeInstanceOf(RegExp);
  });

  it("matches a basic valid title", () => {
    expect(CONVENTIONAL_COMMIT_REGEX.test("feat: add a thing")).toBe(true);
  });

  it("does not match a title with a capitalized subject", () => {
    expect(CONVENTIONAL_COMMIT_REGEX.test("feat: Add a thing")).toBe(false);
  });
});

describe("ALLOWED_TYPES", () => {
  it("matches the commitlint config types exactly", () => {
    // Keep in sync with commitlint.config.mjs and CI workflow.
    expect([...ALLOWED_TYPES].sort()).toEqual(
      [
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
      ].sort(),
    );
  });
});
