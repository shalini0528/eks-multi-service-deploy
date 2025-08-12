# EC2 + EKS (Amazon Elastic Kubernetes Service) – Multi-Service Deployment

This guide walks you through setting up an **EKS cluster** from an **EC2 instance**, building & pushing Docker images, deploying multiple services, and installing **Prometheus + Grafana** for monitoring.

> **Tested with**: EKS 1.28 (managed nodes), Amazon Linux 2023/2 AMI on EC2, `eu-north-1`.  
> Replace placeholders like `<USERNAME>`, `<URL>`, `<EXTERNAL-IP>`, and `DOCKER_USERNAME` with your own values.

---

## 📌 Table of Contents
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [1) Install tooling on EC2](#1-install-tooling-on-ec2)
- [2) Configure AWS credentials](#2-configure-aws-credentials)
- [3) Create the EKS cluster](#3-create-the-eks-cluster)
- [4) Login to Docker Hub](#4-login-to-docker-hub)
- [5) Install NGINX Ingress Controller](#5-install-nginx-ingress-controller)
- [6) Clone the repository](#6-clone-the-repository)
- [7) Build & push Docker images](#7-build--push-docker-images)
- [8) Deploy to EKS](#8-deploy-to-eks)
- [9) Get service & ingress endpoints](#9-get-service--ingress-endpoints)
- [10) Database access from pods](#10-database-access-from-pods)
- [11) Monitoring: Prometheus + Grafana](#11-monitoring-prometheus--grafana)
- [Troubleshooting](#troubleshooting)
- [Cleanup](#cleanup)
- [Costs](#costs)
- [Notes & Best Practices](#notes--best-practices)

---

## 🏗 Architecture

```
EC2 (bastion / admin box)
  ├── docker, git, awscli v2, kubectl, eksctl, helm
  └── builds & pushes images -> Docker Hub

EKS (managed)
  ├── Namespaces: game, order, analytics, static
  ├── Deployments/Services (blue)
  ├── MySQL per service (game, order)
  ├── Ingress-NGINX (LoadBalancer)
  └── monitoring namespace:
       kube-prometheus-stack (Prometheus + Grafana)
```

---

## 📋 Prerequisites
- AWS account with an IAM user having permissions for EKS.
- Docker Hub account (or another container registry).
- EC2 instance (Amazon Linux recommended) with:
  - Outbound internet access
  - Inbound port **3000** open (if you want to access Grafana via browser).

---

## 1) Install tooling on EC2

### Docker
```
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -aG docker $USER && newgrp docker
```
### Git
```
sudo yum install -y git
```
### AWS CLI v2
```
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install
```
### kubectl
```
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/
kubectl version --client
```

### eksctl
```
curl --silent --location "https://github.com/eksctl-io/eksctl/releases/latest/download/eksctl_Linux_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
eksctl version
```

---

## 2) Configure AWS credentials

aws configure


Enter:
- Access key
- Secret key
- Region (e.g., \`eu-north-1\`)
- Output format (e.g., \`json\`)

**Optional** – Attach \`AdministratorAccess\` to an IAM user (for demo/lab purposes only):

```
aws iam attach-user-policy   --user-name <USERNAME> --policy-arn arn:aws:iam::aws:policy/AdministratorAccess
```

---

## 3) Create the EKS cluster
```
eksctl create cluster   --name multi-service-cluster   --version 1.28   --region <REGION>   --nodegroup-name multi-service-nodes   --node-type t3.medium   --nodes 3   --nodes-min 2   --nodes-max 5   --managed   --with-oidc   --tags "env=dev,project=multi-service-app"   --asg-access
```

---

## 4) Login to Docker Hub
```
docker login
```

---

## 5) Install NGINX Ingress Controller
```
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.9.4/deploy/static/provider/aws/deploy.yaml
```
---

## 6) Clone the repository

git clone <URL>
cd <repo-root>


---

## 7) Build & push Docker images
Run for each service directory:

# Build
```
docker build -t game-service .
docker build -t order-service .
docker build -t analytics-service .
docker build -t static-site .
```

# Tag
```
docker tag game-service `<DOCKER_USERNAME>`/game-service:0.1
docker tag order-service `<DOCKER_USERNAME>`/order-service:0.1
docker tag analytics-service `<DOCKER_USERNAME>`/analytics-service:0.1
docker tag static-site `<DOCKER_USERNAME>`/static-site:0.1
```

# Push
```
docker push `<DOCKER_USERNAME>`/game-service:0.1
docker push `<DOCKER_USERNAME>`/order-service:0.1
docker push `<DOCKER_USERNAME>`/analytics-service:0.1
docker push `<DOCKER_USERNAME>`/static-site:0.1
```

---

## 8) Deploy to EKS

### Create namespaces
```
kubectl create namespace game
kubectl create namespace analytics
kubectl create namespace order
kubectl create namespace static
```

### Game service
```
kubectl apply -f game-service-blue-deployment.yaml -n game
kubectl apply -f game-service-lb.yaml -n game
kubectl apply -f mysql-deployment.yaml -n game

COLOR=blue
sed "s/{{COLOR}}/$COLOR/g" game-ingress.template.yaml > game-ingress.yaml
kubectl apply -f game-ingress.yaml -n game
```

### Order service
```
kubectl apply -f order-service-blue-deployment.yaml -n order
kubectl apply -f order-service-lb.yaml -n order
kubectl apply -f mysql-deployment.yaml -n order

COLOR=blue
sed "s/{{COLOR}}/$COLOR/g" order-ingress.template.yaml > order-ingress.yaml
kubectl apply -f order-ingress.yaml -n order
```

### Analytics service

```
COLOR=blue
sed "s/{{COLOR}}/$COLOR/g" analytics-ingress.template.yaml > analytics-ingress.yaml
kubectl apply -f analytics-service-blue-deployment.yaml -n analytics
kubectl apply -f analytics-ingress.yaml -n analytics
```

### Static site
```
  kubectl apply -f static-site-deployment.yaml -n static
  kubectl apply -f static-ingress.yaml -n static
```

---

## 9) Get service & ingress endpoints

- kubectl get svc -n order
- kubectl get svc -n analytics
- kubectl get svc -n game
- kubectl get svc -n static

- kubectl get ingress -n order
- kubectl get ingress -n analytics
- kubectl get ingress -n game
- kubectl get ingress -n static


---

## 10) Database access from pods

# Game service
- kubectl get pods -n game
- kubectl exec -it <MYSQL_POD_NAME> -n game -- mysql -u root -p

# Order service
- kubectl get pods -n order
- kubectl exec -it <MYSQL_POD_NAME> -n order -- mysql -u root -p

# Analytics service
- kubectl get pods -n analytics


---

## 11) Monitoring: Prometheus + Grafana

### Install Helm

```curl https://raw.githubusercontent.com/helm/helm/master/scripts/get-helm-3 | bash```


### Add repo & install stack

```
 helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
 helm repo update
```
```
 helm install prometheus-stack prometheus-community/kube-prometheus-stack   --namespace monitoring   --create-namespace
```

### Port-forward Grafana

``` kubectl port-forward --address=0.0.0.0 svc/prometheus-stack-grafana -n monitoring 3000:80 ```


Grafana login:
```
Username: admin
Password: prom-operator
```

---

## 🛠 Troubleshooting
- Docker permission denied → Run \`newgrp docker\` or re-login to EC2.
- Ingress stuck on pending → Check \`kubectl get svc -n ingress-nginx\` and ensure public subnets.
- Images not pulling → Verify image names/tags and registry credentials.

---

## 🧹 Cleanup

helm uninstall prometheus-stack -n monitoring
kubectl delete ns monitoring game order analytics static
eksctl delete cluster --name multi-service-cluster --region eu-north-1


---

## 💰 Costs
- EKS control plane hourly fee
- EC2 worker nodes (instance cost + storage)
- Load Balancers
- EBS volumes for MySQL PVCs
- Data transfer charges

---

## 📌 Notes & Best Practices
- Replace \`DOCKER_USERNAME\` with your Docker Hub/ECR namespace.
- Use Kubernetes secrets for DB passwords instead of hardcoding.
- Keep \`kubectl\`, \`eksctl\`, and EKS version aligned.
- For blue/green deploys, swap ingress color in templates.

---

**License:** MIT
