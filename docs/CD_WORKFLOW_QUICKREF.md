# 🚀 CD Workflow Quick Reference

## ⚡ Quick Commands

### Push to Trigger Auto-Deploy

```bash
git push origin main
# → Automatically runs: build → scan → deploy
```

### Deploy Specific Tag

```bash
git tag v1.0.0
git push origin v1.0.0
# → Tagged image deployed automatically
```

### Manual Trigger via CLI

```bash
gh workflow run "cd.yml" -f environment=production
```

---

## 📊 Workflow Files

| File                        | Purpose                                  |
| --------------------------- | ---------------------------------------- |
| `.github/workflows/cd.yml`  | Main CD workflow (build → scan → deploy) |
| `Dockerfile`                | Multi-stage build for PWA container      |
| `nginx.conf`                | Production PWA web server config         |
| `.dockerignore`             | Optimize Docker build context            |
| `docs/CD_WORKFLOW_SETUP.md` | Complete setup guide                     |

---

## 🔐 Secrets Required

```bash
DEPLOY_HOST         # Server hostname/IP
DEPLOY_USER         # SSH user (e.g., deploy)
DEPLOY_SSH_KEY      # Private SSH key (PEM format)
DEPLOY_SSH_PORT     # SSH port (optional, defaults to 22)
```

**To set secrets:**

1. Go to GitHub repo → **Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add each secret from table above

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│   GitHub Repo (push main / tag v1.0.0)              │
│                                                      │
│  → Trigger: .github/workflows/cd.yml                │
└───────────────────┬─────────────────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
   ┌─────▼─────┐        ┌─────▼─────┐
   │ Build Job │        │ Build Job │
   │ (matrix   │        │ (AMD64)   │
   │  linux)   │        │ (Alpine)  │
   └─────┬──────────────┘           │
         │                          │
    ┌────┴────────┐                 │
    │ Push Image  │ ────────────────│
    │  to GHCR    │                 │
    │ ghcr.io/... │                 │
    └────┬────────┘                 │
         │                          │
    ┌────▼──────────────────────────▼──────┐
    │  Scan Job (Trivy)                    │
    │  - Vulnerabilities: CRITICAL, HIGH   │
    │  - Output: SARIF + JSON              │
    │  - Report to GitHub Security         │
    └────┬───────────────────────────────┬─┘
         │                               │
    ┌────▼────────────────────────────┐ │
    │ Deploy Job (SSH)                │ │ (parallel)
    │ - SSH to server                 │ │
    │ - Pull image from GHCR          │ │
    │ - Stop old container            │ │
    │ - Run new container             │ │
    │ - Health checks                 │ │
    │ - Cleanup                       │ │
    └────┬────────────────────────────┘ │
         │                              │
    ┌────▼──────────────────────────┐   │
    │ Notify Job (always)           ◄───┘
    │ - Status: ✅ or ❌            │
    │ - Ready for Discord/Slack     │
    └────────────────────────────────┘

         Server (Production)
    ┌────────────────────────────────┐
    │ Docker Container               │
    │ (micro-gestion-facile)         │
    │                                │
    │ ┌──────────────────────────┐   │
    │ │ Nginx (port 8080)        │   │
    │ │ PWA dist static files    │   │
    │ │ Service Worker (sw.js)   │   │
    │ │ Health checks: ENABLED   │   │
    │ └──────────────────────────┘   │
    └────────────────────────────────┘
```

---

## 🎯 What Each Stage Does

### 1️⃣ **build-and-push**

- ✅ Multi-stage Docker build
- ✅ Node 20 Alpine (builder)
- ✅ Nginx Alpine (production)
- ✅ Push to ghcr.io with tags
- ✅ Cache layers for speed

**Output:** `ghcr.io/thomasxxl02/micro-gestion-facile:main` (ready)

---

### 2️⃣ **scan-trivy**

- 🔍 Scan image for vulnerabilities
- ⚠️ Report CRITICAL/HIGH to GitHub Security
- 📊 Generate JSON + SARIF reports
- 💾 Save artifacts (30 days)

**Output:** Vulnerabilities in GitHub Security tab

---

### 3️⃣ **deploy-ssh**

- 🔐 SSH to production server
- 📥 Pull image from GHCR
- 🛑 Stop old container
- 🎬 Run new container
- ✅ Health checks (30s × 3 retries)
- 🧹 Cleanup unused resources

**Result:** Live updated container on server

---

### 4️⃣ **notify**

- 📢 Log deployment status
- ✨ Ready to notify teams (Discord/Slack)

---

## 🧪 Testing Locally

### Build Docker Image

```bash
cd /path/to/Micro-Gestion-Facile

# Build
docker build -t micro-gestion-facile:latest .

# Run
docker run --rm -p 8080:8080 micro-gestion-facile:latest

# Test
curl http://localhost:8080
# or visit http://localhost:8080 in browser
```

### Lint & Type Check (Before Push)

```bash
npm run type-check
npm run lint
npm run test
```

### Full Local Build Test

```bash
./scripts/test-build-locally.sh  # if exists
# or manually:
docker build -t test:latest .
docker run --rm -it -p 8080:8080 test:latest
```

---

## 📈 Monitoring Deployments

### View GitHub Workflow Runs

**GitHub UI** → **Actions tab** → **CD - Build, Scan & Deploy**

### View Real-time Logs

1. Click workflow run
2. Click job name (build-and-push, scan-trivy, etc.)
3. Expand steps to see logs
4. Search for errors or success messages

### Common Log Patterns

✅ **Success:**

```
✅ Couverture de tests : 85.2%
Build succeeded
Image pushed: ghcr.io/...
✅ Container deployed successfully
✅ Container is healthy
✨ Deployment complete!
```

❌ **Failure:**

```
Error: unauthorized (login failed)
Error: Connection refused (SSH issue)
Container failed to become healthy (health check failed)
```

---

## 🔧 Troubleshooting

| Issue                  | Cause              | Fix                                   |
| ---------------------- | ------------------ | ------------------------------------- |
| Docker login fails     | Bad token          | Use `GITHUB_TOKEN` (automatic)        |
| SSH connection refused | Wrong credentials  | Check `DEPLOY_SSH_KEY`, `DEPLOY_HOST` |
| Container won't start  | Image not found    | Verify image published to GHCR        |
| Health check fails     | App not responding | Check nginx.conf, port 8080           |
| Trivy scan times out   | Large image        | Split build, use smaller base         |

---

## 🚀 Production Checklist

Before first production deploy:

- [ ] All secrets configured in GitHub
- [ ] SSH key tested locally: `ssh -i key user@host "docker ps"`
- [ ] Server has Docker installed & running
- [ ] Firewall allows SSH inbound
- [ ] Deploy user created with docker group access
- [ ] Nginx config reviewed (or skip if using Docker port directly)
- [ ] Backup plan if deployment fails

---

## 📚 Related Docs

- [CD_WORKFLOW_SETUP.md](CD_WORKFLOW_SETUP.md) — Complete setup guide
- [Dockerfile](../Dockerfile) — Container build definition
- [nginx.conf](../nginx.conf) — Web server config for PWA
- [.github/workflows/cd.yml](../.github/workflows/cd.yml) — Workflow definition

---

## 💡 Next Steps

1. **Configure secrets** in GitHub
2. **Test SSH** on server
3. **Push to main** to trigger first deployment
4. **Monitor logs** in GitHub Actions UI
5. **Verify app** on production server

🎉 **Done!** Your CI/CD pipeline is ready.
