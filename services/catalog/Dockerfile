FROM node:20-alpine

WORKDIR /app

COPY services/catalog/package*.json ./
RUN npm install

COPY services/catalog/. ./
COPY products.json ./

EXPOSE 3002

CMD ["npm", "start"]