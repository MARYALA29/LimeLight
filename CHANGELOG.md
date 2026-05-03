# Changelog

All notable changes to this project will be documented in this file. The
format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the project is pre-1.0, **any** release may contain breaking changes.
Minor bumps (`0.x.0`) typically introduce features (and may break things);
patch bumps (`0.x.y`) carry bug fixes only.

## [0.1.0] - 2026-05-03

Initial pre-1.0 baseline. Subsequent releases will be generated automatically
by [release-please](https://github.com/googleapis/release-please) from
[Conventional Commits](https://www.conventionalcommits.org/).

### Features

- **Authentication** — JWT-based login, registration, logout, and "me"
  endpoint with HTTP-only cookies.
- **Projects** — Create, read, update, delete projects with team
  membership and role-based access.
- **Kanban board** — Drag-and-drop task management across customizable
  status columns.
- **Task detail** — Dedicated task view with edit, delete, status, and
  priority controls.
- **Profile** — View and edit the current user's profile.
- **Settings** — Account settings page wired to the profile API.
- **Change password** — Secure password update flow with current-password
  verification.
- **Vulnerabilities** — Per-project security vulnerability tracking with
  state machine (Open → In Progress → Resolved/Won't Fix).

### Continuous Integration

- GitHub Actions workflow running lint, type-check, tests, and build on
  every PR and push to `main`.
- Dependency audit job using `audit-ci` with an allowlist for tracked
  advisories.
