# Changelog

All notable changes to this project will be documented in this file. The
format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

While the project is pre-1.0, **any** release may contain breaking changes.
Minor bumps (`0.x.0`) typically introduce features (and may break things);
patch bumps (`0.x.y`) carry bug fixes only.

## [0.2.0](https://github.com/MARYALA29/LimeLight/compare/limelight-v0.1.0...limelight-v0.2.0) (2026-05-03)


### Features

* add dark theme as user preference ([#19](https://github.com/MARYALA29/LimeLight/issues/19)) ([61bc771](https://github.com/MARYALA29/LimeLight/commit/61bc771bf8acf5048a78833214f5793e477aa158))
* add task filtering on the project board ([#18](https://github.com/MARYALA29/LimeLight/issues/18)) ([ae69da4](https://github.com/MARYALA29/LimeLight/commit/ae69da47c494a14d63170cb9e838f6e690d11ca4))

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
