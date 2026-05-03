/**
 * Tests for the harness hook's gh-CLI argument parser. The validator
 * itself is tested in `conventional-commits.test.ts`; here we verify
 * the hook only fires for the right gh subcommands and pulls the
 * `--title` value out correctly.
 *
 * The hook script is an ESM module under `scripts/claude-hooks/` so
 * Claude Code can `node`-execute it without a build step. We import
 * it via a dynamic import + path so Jest (which is CommonJS-flavoured
 * here) plays nicely.
 */

import path from "node:path";

// Resolved at test time, after Jest's module loader is up.
const HOOK_PATH = path.resolve(
  __dirname,
  "..",
  "..",
  "..",
  "scripts",
  "claude-hooks",
  "validate-pr-title.mjs",
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mod: any;

beforeAll(async () => {
  mod = await import(HOOK_PATH);
});

describe("extractPrTitle", () => {
  it("ignores non-gh commands", () => {
    expect(mod.extractPrTitle("ls -la").kind).toBe("skip");
    expect(mod.extractPrTitle("git status").kind).toBe("skip");
    expect(mod.extractPrTitle("npm test").kind).toBe("skip");
  });

  it("ignores gh subcommands that don't take a PR title", () => {
    expect(mod.extractPrTitle("gh pr list").kind).toBe("skip");
    expect(mod.extractPrTitle("gh pr view 123").kind).toBe("skip");
    expect(mod.extractPrTitle("gh issue create --title foo").kind).toBe(
      "skip",
    );
    expect(mod.extractPrTitle("gh repo create x").kind).toBe("skip");
  });

  it("ignores gh pr create when no --title is given", () => {
    // Without --title, gh opens an editor; we don't intervene.
    expect(mod.extractPrTitle("gh pr create --body 'foo'").kind).toBe("skip");
  });

  it("extracts the title from `gh pr create --title 'feat: x'`", () => {
    const result = mod.extractPrTitle(
      "gh pr create --title 'feat: add a thing' --body 'body'",
    );
    expect(result).toEqual({ kind: "title", title: "feat: add a thing" });
  });

  it("extracts the title with double quotes", () => {
    const result = mod.extractPrTitle(
      'gh pr create --title "feat: add a thing"',
    );
    expect(result).toEqual({ kind: "title", title: "feat: add a thing" });
  });

  it("extracts the title with --title=value form", () => {
    const result = mod.extractPrTitle(
      "gh pr create --title=feat:add-a-thing",
    );
    expect(result).toEqual({ kind: "title", title: "feat:add-a-thing" });
  });

  it("extracts the title via the -t shorthand", () => {
    const result = mod.extractPrTitle("gh pr create -t 'fix: a bug'");
    expect(result).toEqual({ kind: "title", title: "fix: a bug" });
  });

  it("extracts the title from `gh pr edit`", () => {
    const result = mod.extractPrTitle(
      "gh pr edit 42 --title 'chore: bump deps'",
    );
    expect(result).toEqual({ kind: "title", title: "chore: bump deps" });
  });

  it("works inside a compound command (cd && gh pr create)", () => {
    const result = mod.extractPrTitle(
      "cd /tmp && gh pr create --title 'feat: x'",
    );
    expect(result).toEqual({ kind: "title", title: "feat: x" });
  });

  it("captures non-conforming titles for the validator to reject", () => {
    const result = mod.extractPrTitle(
      "gh pr create --title 'Feature: Add login'",
    );
    expect(result).toEqual({ kind: "title", title: "Feature: Add login" });
  });
});

describe("validate (hook copy)", () => {
  it("accepts a conforming title", () => {
    expect(mod.validate("feat: add a thing").ok).toBe(true);
  });

  it("rejects a non-conforming title", () => {
    expect(mod.validate("Feature: add a thing").ok).toBe(false);
  });

  it("rejects an empty title", () => {
    expect(mod.validate("").ok).toBe(false);
  });
});

describe("ALLOWED_TYPES (hook copy)", () => {
  it("matches the canonical list", () => {
    expect([...mod.ALLOWED_TYPES].sort()).toEqual(
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
