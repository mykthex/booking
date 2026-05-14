FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci


FROM deps AS build
COPY . .
ARG PUBLIC_API_BASE_URL=http://localhost:8080
ARG PUBLIC_INTERNAL_API_BASE_URL=http://server:8080
ENV PUBLIC_API_BASE_URL=${PUBLIC_API_BASE_URL}
ENV PUBLIC_INTERNAL_API_BASE_URL=${PUBLIC_INTERNAL_API_BASE_URL}
RUN npm run build


FROM node:22-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321
ENV PUBLIC_API_BASE_URL=${PUBLIC_API_BASE_URL}
ENV PUBLIC_INTERNAL_API_BASE_URL=${PUBLIC_INTERNAL_API_BASE_URL}
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
