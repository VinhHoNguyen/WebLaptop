# Cart Service - Kubernetes Deployment Guide

## 📋 Yêu cầu

- Kubernetes cluster (v1.19+)
- kubectl được cấu hình
- Cart service image đã build

## 📁 Cấu trúc Files

```
k8s/
├── deployment.yaml       # Deployment manifest
├── service.yaml          # Service manifest
├── configmap.yaml        # ConfigMap (public config)
├── secret-template.yaml  # Secret template (cần update giá trị)
├── all-in-one.yaml       # Tất cả resources (dễ deploy)
└── README.md             # Hướng dẫn này
```

## 🚀 Hướng dẫn Deploy

### Option 1: Deploy từng file riêng

```bash
# 1. Tạo ConfigMap
kubectl apply -f k8s/configmap.yaml

# 2. Tạo Secret (⚠️ cập nhật giá trị trước)
kubectl apply -f k8s/secret-template.yaml

# 3. Tạo Service
kubectl apply -f k8s/service.yaml

# 4. Tạo Deployment
kubectl apply -f k8s/deployment.yaml
```

### Option 2: Deploy tất cả cùng lúc (Recommended)

```bash
# ⚠️ Cập nhật all-in-one.yaml với giá trị thực
kubectl apply -f k8s/all-in-one.yaml
```

## 🔒 Cấu hình Secrets

Trước khi deploy, cập nhật `secret-template.yaml` hoặc `all-in-one.yaml` với giá trị thực:

```yaml
stringData:
  mongo-uri: "mongodb+srv://USER:PASSWORD@cluster.mongodb.net/cart_db"
  access-token: "YOUR_JWT_SECRET"
```

Hoặc tạo Secret từ command line:

```bash
kubectl create secret generic cart-secrets \
  --from-literal=mongo-uri="mongodb+srv://user:pass@cluster.mongodb.net/cart_db" \
  --from-literal=access-token="your_secret_key" \
  -n default
```

## 📊 Kiểm tra Deployment

```bash
# Xem Deployment status
kubectl get deployments -l app=cart

# Xem Pods
kubectl get pods -l app=cart

# Xem logs từ Pod
kubectl logs -l app=cart -f

# Xem chi tiết Pod
kubectl describe pod <POD_NAME>

# Xem Service
kubectl get svc cart-service
```

## 🔗 Truy cập Service

Từ bên trong cluster:
```
http://cart-service:3002
```

Từ Pod khác:
```
http://cart-service.default.svc.cluster.local:3002
```

## 📈 Scaling

```bash
# Scale deployment lên 3 replicas
kubectl scale deployment cart-service --replicas=3
```

## 🧪 Test Health Check

```bash
# Port forward để test local
kubectl port-forward svc/cart-service 3002:3002

# Test health check
curl http://localhost:3002/cart
```

## 🗑️ Delete Deployment

```bash
# Xóa toàn bộ resources
kubectl delete deployment,svc,configmap,secret -l app=cart
```

## 🔧 Troubleshooting

### Pod constantly restarting?
```bash
kubectl logs <POD_NAME> --previous
```

### Can't connect to Product service?
- Kiểm tra Product service đã deploy chưa
- Verify `PRODUCT_SERVICE_URL` trong ConfigMap
- Check network policy không block traffic

### Memory/CPU issues?
- Xem Pod resource usage: `kubectl top pod`
- Tăng `resources.limits` trong deployment.yaml

## 📝 Notes

- **Replicas**: Hiện set 2, có thể tăng để HA
- **Health checks**: Liveness + Readiness probe để tự động recovery
- **Security**: Chạy non-root user, read-only filesystem
- **Rolling update**: maxSurge=1, maxUnavailable=0 để zero-downtime deploy
