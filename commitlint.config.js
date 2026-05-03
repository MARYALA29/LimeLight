/**
 * commitlint configuration. Validates commit messages (locally via the
 * husky commit-msg hook) and PR commits (via the GitHub Action) against
 * the Conventional Commits specification.
 *
 * Allowed types are kept in sync with the release-please configuration
 * and the PR-title lint job in .github/workflows/commitlint.yml.
 */
module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
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
      ],
    ],
  },
};
