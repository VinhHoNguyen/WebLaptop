FROM node:20-alpine

WORKDIR /app

RUN npm install -g npm@latest

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3004

CMD ["npm", "start"]