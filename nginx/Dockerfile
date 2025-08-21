# syntax=docker/dockerfile:1

# --- Build the SPA ---
FROM node:20-alpine AS build
WORKDIR /app
COPY webui/package*.json ./
RUN npm ci
COPY webui/ .
RUN npm run build

# --- Serve with Nginx ---
FROM nginx:1.27-alpine
# Copy SPA assets
COPY --from=build /app/dist /usr/share/nginx/html
# Nginx config with SPA fallback + /api proxy to backend
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
