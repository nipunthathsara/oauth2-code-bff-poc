# ── Stage 1: Build the React app with Vite ───────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for layer caching
COPY package.json ./

# Install all dependencies (including devDependencies needed for build)
RUN npm install

# Copy source code (index.html at root is required by Vite)
COPY index.html ./
COPY vite.config.js ./
COPY src/ ./src/

# Build for production — output goes to /app/build
RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config
COPY nginx/nginx.conf /etc/nginx/conf.d/app.conf

# Copy built React app (Vite outputs to build/ as configured in vite.config.js)
COPY --from=builder /app/build /usr/share/nginx/html

# Copy and set up entrypoint
COPY nginx/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/entrypoint.sh"]
