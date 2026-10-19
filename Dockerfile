# Stage 1: Install production dependencies
FROM node:22-bookworm-slim AS dependencies

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force

# Stage 2: Minimal runtime image
FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
ENV PORT=80
WORKDIR /usr/src/app

COPY --from=dependencies --chown=node:node \
    /usr/src/app/node_modules ./node_modules

COPY --chown=node:node package.json ./
COPY --chown=node:node app.js server.js ./
COPY --chown=node:node config/ ./config/
COPY --chown=node:node controllers/ ./controllers/
COPY --chown=node:node middleware/ ./middleware/
COPY --chown=node:node models/ ./models/
COPY --chown=node:node routes/ ./routes/
COPY --chown=node:node build/ ./build/

RUN mkdir -p uploads \
    && chown node:node uploads

USER node

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 80) + '/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
