# Dùng Node.js 18 trên Alpine Linux (nhẹ)
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file cấu hình và cài dependencies
COPY package*.json ./
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Mở cổng backend
EXPOSE 3004

# Lệnh chạy server
CMD ["npm", "start"]
