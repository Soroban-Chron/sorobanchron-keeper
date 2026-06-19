FROM node:20-alpine AS builder
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
