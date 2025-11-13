# Multi-stage Dockerfile for Strapi v5 (no VOLUME instruction)
# Build deps and app
FROM node:20-alpine AS builder
WORKDIR /app
# System deps for native modules (e.g., better-sqlite3)
RUN apk add --no-cache libc6-compat python3 make g++
# Use Yarn via Corepack (respects yarn.lock)
RUN corepack enable && corepack yarn set version stable
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
ENV NODE_ENV=production
# Build the Strapi admin panel and server dist
RUN yarn build

# Runtime image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Keep the image minimal
RUN corepack enable && corepack yarn set version stable
# Copy the built app (including node_modules and dist)
COPY --from=builder /app /app
# If running as non-root, ensure write access to .tmp and public/uploads
RUN mkdir -p /app/.tmp /app/public/uploads && chown -R node:node /app
USER node
EXPOSE 1337
CMD ["yarn", "start"]
