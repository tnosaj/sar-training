# Dog Training Tracker — Web UI (Modularized)

This is a modularized React + Vite + Tailwind app that consumes the Go backend.

## Localization (i18n)

This app uses **i18next** + **react-i18next** with browser language detection and a Settings language selector.

- Languages provided: **English (en)** and **German (de)**.
- Auto-detects via URL query `?lang=de`, `localStorage`, or browser.
- To add more strings/languages, create/edit files under:
  - `src/i18n/locales/<lng>/common.json`
- Use in components:
  ```tsx
  import { useTranslation } from 'react-i18next'
  const { t } = useTranslation()
  <h2>{t('nav.sessions')}</h2>
  ```

## Install & run
```bash
npm i
npm run dev
```

## update package-lock.json
```
docker run -it -v `pwd`:/tmp --entrypoint=/bin/sh node:20-alpine
cd /tmp/webui
npm install --package-lock-only
npm install # this updates the node_modules dir
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
