# E-Commerce Web Application using MERN Stack and Microservices Architecture

## Description
This is a web application for an e-commerce store that sells laptop. It uses a microservices architecture with separate Node.js services for identity, catalog, and checkout. Cart functionality is handled inside Checkout in the v2 stack.

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install dependencies.

```bash
npm install
```

## Usage

1. Create a `.env` file in the root directory and add the following environment variables (replace all #### with your own values):
```bash
MONGO_USERNAME=####
MONGO_PASSWORD=####
MONGO_CLUSTER=####
MONGO_DBNAME=####
ACCESS_TOKEN=####
VITE_USER_API_URL=http://localhost:3001
VITE_PRODUCT_API_URL=http://localhost:3002
VITE_CHECKOUT_API_URL=http://localhost:3004
VITE_CART_API_URL=http://localhost:3004
VITE_PAYMENT_API_URL=http://localhost:3004
VITE_SOCKET_URL=http://localhost:3004
VITE_N8N_CHAT_WEBHOOK_URL=http://localhost:5678/webhook/laptop-chat
```
2. Start the v2 full stack with one command:
```bash
npm run docker:v2:up
```
3. Open the application in your browser:
- Front-end: http://localhost:5173
- Admin portal: http://localhost:5174
- Identity service: http://localhost:3001
- Catalog service: http://localhost:3002
- Checkout service: http://localhost:3004

4. To stop the stack:
```bash
npm run docker:down
```
5. If you want to see logs:
```bash
npm run docker:logs
```
6. Docker Compose is configured with `restart: unless-stopped`, so the stack will come back automatically after reboot once Docker Desktop starts.

If you need the production images on a server, use:
```bash
npm run docker:prod:up
```

## V2 topology (Identity + Catalog + Checkout)

The repository now uses the v2 stack by default. Checkout serves cart, payment, and socket endpoints, and stores data in MySQL.

Useful commands:

```bash
npm run docker:v2:logs
npm run docker:v2:down
```

Notes:
- Cart is no longer a standalone service.
- `VITE_CHECKOUT_API_URL` is the canonical base URL for cart, payment, and socket traffic.
- `VITE_CART_API_URL`, `VITE_PAYMENT_API_URL`, and `VITE_SOCKET_URL` are kept as compatibility aliases.
- k3d manifests for this migration are in `k8s-v2/`.

## CI/CD

This repository now includes a GitHub Actions pipeline in [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml).

- On pull requests and pushes, it validates all backend services with `npm ci` and syntax checks, then builds the front-end with Vite.
- On pushes to `main`, it builds and publishes Docker images for `identity`, `catalog`, `checkout`, `front-end`, and `admin-portal` to GitHub Container Registry.
- The v2 local compose file is [`docker-compose.v2.yml`](docker-compose.v2.yml). Set `ACCESS_TOKEN` and the MoMo variables before running it.

The front-end build reads these optional Vite variables:

- `VITE_USER_API_URL`
- `VITE_PRODUCT_API_URL`
- `VITE_CHECKOUT_API_URL`

If they are not set, the build falls back to the local development ports.

## Products json file
- [Products json file](https://github.com/Andrewaziz99/E-Commerce_Web_Application/blob/main/products.json)

## Technologies
- [React vite](https://vitejs.dev/)
- [Node.js](https://nodejs.org/en/)
- [Express](https://expressjs.com/)
- [MongoDB](https://www.mongodb.com/)
- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Microservices Architecture]()

## Contributers 
QuangVinh
QuangMinh
QuocBao
ThanhPhong
