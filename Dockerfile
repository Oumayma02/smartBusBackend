FROM node:22-bookworm-slim

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN mkdir -p /usr/src/app/uploads

EXPOSE 80

CMD ["node", "server.js"]
