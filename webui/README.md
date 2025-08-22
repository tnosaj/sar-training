# Dog Training Tracker — Web UI (Modularized)

This is a modularized React + Vite + Tailwind app that consumes the Go backend.

## Install & run
```bash
npm i
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Dev proxy
Requests to `/api/*` are proxied to `http://localhost:8080` via Vite's dev server. Adjust `.env.development` if needed.

## Notes
- No `package-lock.json` is included in this zip. If you want reproducible Docker builds, run:
  ```bash
  npm install --package-lock-only
  ```
  Then commit the generated lockfile.
