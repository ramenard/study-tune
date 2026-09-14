# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY client/package.json client/
RUN npm ci -w api
COPY api/ api/
RUN npm run build -w api

# --- Runtime stage ---
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
COPY api/package.json api/
COPY client/package.json client/
RUN npm ci -w api --omit=dev
COPY --from=build /app/api/dist ./dist
EXPOSE 3001
CMD ["node", "dist/main"]
