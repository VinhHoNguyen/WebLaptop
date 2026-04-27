FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3003

CMD ["node", "server.js"]