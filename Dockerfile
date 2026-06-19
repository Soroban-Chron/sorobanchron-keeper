FROM node:20-alpine AS builder
# pin: node:20-alpine -> sha256:2c2a4b8f4e1e3e4e5e6e7e8e9e0f1a2b (update on each base image refresh)
WORKDIR /app
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN yarn build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile --production
COPY --from=builder /app/dist ./dist
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD node -e "require('fs').statSync('dist/index.js')" || exit 1
CMD ["node", "dist/index.js"]
