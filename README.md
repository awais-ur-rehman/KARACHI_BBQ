# Karachi B.B.Q POS

Restaurant Inventory & Sales Management System — single restaurant, single PC, offline-first. Three roles (Super Admin, Inventory Manager, Sales Manager), bilingual EN/UR with RTL, PKR. Runs via Docker Compose with PostgreSQL 16, NestJS backend, React+Vite frontend, nginx reverse proxy, and nightly `pg_dump` backups to a mounted volume.

## Working in this repo

Read **[`CLAUDE.md`](./CLAUDE.md)** first — that file is the permanent project memory: tech stack, invariants, RBAC matrix, billing model, schema primitives, phase plan, and working rules.

Then **[`files/plan.md`](./files/plan.md)** for the per-phase task list and acceptance criteria.

Planning docs (canonical specs) live under `files/01-PRD.md` → `files/06-Implementation.md`. UI prototype reference: `karachi-b-b-q/project/`.

## Quick start (after Phase 0)

```bash
cp infra/.env.example infra/.env   # edit secrets
docker compose -f infra/docker-compose.yml up -d
# open http://localhost — first-run wizard appears
```
