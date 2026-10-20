FROM node:22-bookworm-slim AS build

RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/*

RUN npm install --global npm@latest

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

FROM node:22-bookworm-slim AS runtime

RUN apt-get update \
    && apt-get upgrade -y \
    && rm -rf /var/lib/apt/lists/* \
    && rm -rf /usr/local/lib/node_modules/npm \
              /usr/local/bin/npm \
              /usr/local/bin/npx

ENV NODE_ENV=production
WORKDIR /usr/src/app

COPY --from=build /usr/src/app /usr/src/app

RUN mkdir -p /usr/src/app/uploads

EXPOSE 80 443

CMD ["node", "server.js"]
