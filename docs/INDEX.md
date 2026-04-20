# 📚 CD Pipeline Documentation Hub

**Welcome to the GitHub Actions CD Pipeline for Micro-Gestion-Facile!**

This hub provides navigation to all CD pipeline documentation and guides.

---

## 🎯 Choose Your Path

### 🚀 I want to deploy RIGHT NOW (5 minutes)

→ Start here: [CD_WORKFLOW_QUICKREF.md](CD_WORKFLOW_QUICKREF.md)

**Contains:**

- Quick commands and architecture overview
- Workflow stages explanation
- Common troubleshooting tips
- "What each stage does" summary

### 🔧 I need complete setup instructions (20 minutes)

→ Read: [CD_WORKFLOW_SETUP.md](CD_WORKFLOW_SETUP.md)

**Contains:**

- Step-by-step GitHub secrets configuration
- SSH key generation and server setup
- Dockerfile & Nginx configuration explained
- Complete troubleshooting section
- Verification checklist

### 📋 I want to follow a guided checklist

→ Use: [CD_IMPLEMENTATION_CHECKLIST.md](CD_IMPLEMENTATION_CHECKLIST.md)

**Contains:**

- Pre-implementation validation
- Server setup checklist
- GitHub secrets configuration
- File verification
- Testing phase procedures
- Post-deployment verification
- Maintenance checklist

### 📢 I want to add notifications (Discord/Slack)

→ Refer to: [CD_NOTIFICATIONS.md](CD_NOTIFICATIONS.md)

**Contains:**

- Discord webhook setup
- Slack integration
- Telegram notifications
- Teams integration
- Email notifications
- PagerDuty for critical alerts
- Complete notification templates

### 📊 I want a high-level overview

→ Start here: [CD_PIPELINE_SUMMARY.md](CD_PIPELINE_SUMMARY.md)

**Contains:**

- Files created and their purposes
- Pipeline architecture diagram
- Key metrics and performance
- Security features
- Common tasks examples
- Troubleshooting quick links

---

## 📁 Files Overview

### Core Infrastructure

| File                       | Size       | Purpose                                  |
| -------------------------- | ---------- | ---------------------------------------- |
| `.github/workflows/cd.yml` | ~250 lines | Main CD workflow (build → scan → deploy) |
| `Dockerfile`               | ~40 lines  | Multi-stage container build              |
| `nginx.conf`               | ~90 lines  | PWA web server configuration             |
| `.dockerignore`            | ~60 lines  | Build context optimization               |

### Documentation

| File                                                             | Time       | Audience                   |
| ---------------------------------------------------------------- | ---------- | -------------------------- |
| [CD_PIPELINE_SUMMARY.md](CD_PIPELINE_SUMMARY.md)                 | 5 min      | Everyone (overview)        |
| [CD_WORKFLOW_QUICKREF.md](CD_WORKFLOW_QUICKREF.md)               | 5-10 min   | Developers (quick start)   |
| [CD_WORKFLOW_SETUP.md](CD_WORKFLOW_SETUP.md)                     | 15-20 min  | DevOps (detailed setup)    |
| [CD_NOTIFICATIONS.md](CD_NOTIFICATIONS.md)                       | 10-15 min  | Team leads (notifications) |
| [CD_IMPLEMENTATION_CHECKLIST.md](CD_IMPLEMENTATION_CHECKLIST.md) | Self-paced | Everyone (step-by-step)    |
| [INDEX.md](INDEX.md)                                             | 3 min      | Everyone (this file)       |

### Scripts

| File                              | Purpose                              |
| --------------------------------- | ------------------------------------ |
| `scripts/validate-cd-pipeline.sh` | Local validation (Docker, SSH, etc.) |

---

## 🔄 Typical Usage Flow

### 1️⃣ **First Time Setup** (30-60 min total)

```
Start here:
   ↓
[CD_WORKFLOW_QUICKREF.md] ← 5-10 min overview
   ↓
[CD_IMPLEMENTATION_CHECKLIST.md] ← Follow step-by-step
   ↓
[CD_WORKFLOW_SETUP.md] ← Refer for details
   ↓
Run validation: ./scripts/validate-cd-pipeline.sh
   ↓
Configure GitHub secrets
   ↓
Test first deployment
   ↓
(Optional) [CD_NOTIFICATIONS.md] ← Add Discord/Slack
```

### 2️⃣ **Subsequent Deployments** (< 5 min)

```
Commit code
   ↓
git push origin main
   ↓
Watch GitHub UI → Actions tab
   ↓
Deployment complete (~10 min)
```

### 3️⃣ **Troubleshooting** (< 10 min per issue)

```
Issue occurs
   ↓
Check: [CD_WORKFLOW_SETUP.md § Troubleshooting]
   ↓
Or: [CD_WORKFLOW_QUICKREF.md § Troubleshooting]
   ↓
Review GitHub Actions logs
   ↓
Check server logs: docker logs micro-gestion-facile
   ↓
Fixed ✅
```

---

## 🎓 Understanding the Pipeline

### What is CD?

**CD = Continuous Deployment** (fully automated delivery)

Your pipeline:

1. **Builds** Docker container (Node + Axios)
2. **Tests** security with Trivy
3. **Pushes** image to GHCR
4. **Deploys** to production via SSH
5. **Notifies** team of status

### Why These Tools?

| Tool                          | Purpose           | Why                                |
| ----------------------------- | ----------------- | ---------------------------------- |
| **Docker**                    | Container builds  | Reproducible, portable deployments |
| **GitHub Container Registry** | Image storage     | Private, integrated with GitHub    |
| **Trivy**                     | Security scanning | Finds vulnerabilities before prod  |
| **SSH**                       | Remote deployment | Secure, no passwords in logs       |
| **Nginx**                     | Web server        | Fast, lightweight for PWA          |

### How Long Does It Take?

- **Build**: 3-5 min (first run), 1-2 min (cached)
- **Scan**: 2-3 min
- **Deploy**: 1-2 min
- **Total**: ~10 min per deployment

---

## ✅ Pre-Requisites Checklist

Before starting, verify you have:

- [ ] GitHub account with repo access
- [ ] Docker installed locally (`docker --version`)
- [ ] SSH key pair generated
- [ ] Production server with:
  - [ ] Docker installed
  - [ ] SSH access enabled
  - [ ] Deploy user created
- [ ] GitHub secrets configured

👉 **Full checklist:** [CD_IMPLEMENTATION_CHECKLIST.md § Pre-Implementation](CD_IMPLEMENTATION_CHECKLIST.md#-pre-implementation-before-pushing)

---

## 🚀 Quick Start Commands

Copy-paste quick start:

```bash
# 1. Validate local setup
chmod +x scripts/validate-cd-pipeline.sh
./scripts/validate-cd-pipeline.sh

# 2. Generate SSH key (if needed)
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N ""

# 3. Add to GitHub secrets (manual - see docs)
# Settings → Secrets and variables → Actions
# Create: DEPLOY_HOST, DEPLOY_USER, DEPLOY_SSH_KEY, DEPLOY_SSH_PORT

# 4. Deploy!
git add .
git commit -m "ci: add CD pipeline"
git push origin main

# 5. Watch deployment
# GitHub UI → Actions → CD - Build, Scan & Deploy
```

---

## 📊 Pipeline At A Glance

```
┌─ Push to main
│
├─→ [build-and-push] (5-10 min)
│   └─ Docker build → GHCR push
│
├─→ [scan-trivy] (2-3 min) [parallel]
│   └─ Security scan → GitHub Security tab
│
├─→ [deploy-ssh] (1-2 min) [waits for both above]
│   └─ SSH to server → run container
│
└─→ [notify] (instant) [always]
    └─ Status message (Discord/Slack optional)

✨ Total: ~10 minutes
```

---

## 🔐 Secrets Configuration

**Required GitHub Secrets:**

```
DEPLOY_HOST       = your-server.com
DEPLOY_USER       = deploy
DEPLOY_SSH_KEY    = (private key content)
DEPLOY_SSH_PORT   = 22 (optional)
```

**Where to add:** GitHub → Settings → Secrets and variables → Actions

👉 **Detailed guide:** [CD_WORKFLOW_SETUP.md § Required GitHub Secrets](CD_WORKFLOW_SETUP.md#-required-github-secrets)

---

## 🛠️ Common Tasks

### Deploy Current Code

```bash
git push origin main
# That's it! Workflow runs automatically
```

### Deploy Specific Version

```bash
git tag v1.0.0
git push origin v1.0.0
# Image tagged as v1.0.0 and deployed
```

### Check Deployment Status

```bash
# In GitHub UI: Actions tab
# Or via CLI:
gh run list --workflow=cd.yml --limit=5
```

### Rollback to Previous Version

```bash
# On server:
docker run -d --name micro-gestion-facile \
  ghcr.io/thomasxxl02/micro-gestion-facile:v1.0.0
```

### Test Locally Before Push

```bash
docker build -t micro-gestion-facile:test .
docker run --rm -p 8080:8080 micro-gestion-facile:test
# Visit http://localhost:8080
```

---

## 📞 Getting Help

### **My question is about:**

| Topic           | Documentation                                                                             |
| --------------- | ----------------------------------------------------------------------------------------- |
| Getting started | [CD_WORKFLOW_QUICKREF.md](CD_WORKFLOW_QUICKREF.md)                                        |
| SSH setup       | [CD_WORKFLOW_SETUP.md § SSH Configuration](CD_WORKFLOW_SETUP.md#-required-github-secrets) |
| Fixing issues   | [CD_WORKFLOW_SETUP.md § Troubleshooting](CD_WORKFLOW_SETUP.md#-troubleshooting)           |
| Notifications   | [CD_NOTIFICATIONS.md](CD_NOTIFICATIONS.md)                                                |
| Step-by-step    | [CD_IMPLEMENTATION_CHECKLIST.md](CD_IMPLEMENTATION_CHECKLIST.md)                          |
| Architecture    | [CD_PIPELINE_SUMMARY.md](CD_PIPELINE_SUMMARY.md)                                          |

### **Common Issues & Solutions:**

| Issue                  | Solution                                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------------------------- |
| Docker build fails     | Check: [CD_WORKFLOW_SETUP.md § Docker Login Fails](CD_WORKFLOW_SETUP.md#-docker-login-fails)             |
| SSH connection refused | Check: [CD_WORKFLOW_SETUP.md § SSH Connection Refused](CD_WORKFLOW_SETUP.md#-ssh-connection-refused)     |
| Container won't start  | Check: [CD_WORKFLOW_SETUP.md § Container Fails to Start](CD_WORKFLOW_SETUP.md#-container-fails-to-start) |
| Trivy scan times out   | Check: [CD_WORKFLOW_SETUP.md § Trivy scan times out](CD_WORKFLOW_SETUP.md#-trivy-scan-times-out)         |

---

## 📈 Metrics to Monitor

Track these after first deployment:

| Metric            | Typical | Warning  |
| ----------------- | ------- | -------- |
| Build time        | 3-5 min | > 15 min |
| Scan time         | 2-3 min | > 10 min |
| Deploy time       | 1-2 min | > 5 min  |
| Success rate      | > 95%   | < 90%    |
| Container startup | < 500ms | > 2s     |

---

## 🎯 Next Steps

**Choose your next action:**

- [ ] **First time?** → [CD_WORKFLOW_QUICKREF.md](CD_WORKFLOW_QUICKREF.md)
- [ ] **Need setup?** → [CD_IMPLEMENTATION_CHECKLIST.md](CD_IMPLEMENTATION_CHECKLIST.md)
- [ ] **Want details?** → [CD_WORKFLOW_SETUP.md](CD_WORKFLOW_SETUP.md)
- [ ] **Add notifications?** → [CD_NOTIFICATIONS.md](CD_NOTIFICATIONS.md)
- [ ] **Validate locally?** → `./scripts/validate-cd-pipeline.sh`

---

## 📚 Full Documentation Map

```
docs/
├── CD_PIPELINE_SUMMARY.md
│   └─ Overview + architecture
│
├── CD_WORKFLOW_QUICKREF.md
│   └─ Quick start (5-10 min)
│
├── CD_IMPLEMENTATION_CHECKLIST.md
│   ├─ Pre-implementation
│   ├─ GitHub setup
│   ├─ File verification
│   ├─ Testing phase
│   ├─ First deployment
│   ├─ Post-deployment
│   └─ Maintenance
│
├── CD_WORKFLOW_SETUP.md
│   ├─ Complete setup guide
│   ├─ SSH configuration
│   ├─ Dockerfile explained
│   ├─ nginx.conf explained
│   ├─ Workflow stages
│   └─ Troubleshooting (detailed)
│
├── CD_NOTIFICATIONS.md
│   ├─ Discord
│   ├─ Slack
│   ├─ Telegram
│   ├─ Teams
│   ├─ Email
│   └─ PagerDuty
│
└── INDEX.md (this file)
    └─ Navigation hub
```

---

## 🎉 Ready?

**Pick a document above and get started!**

Most common path:

1. Read [CD_WORKFLOW_QUICKREF.md](CD_WORKFLOW_QUICKREF.md) (5 min)
2. Follow [CD_IMPLEMENTATION_CHECKLIST.md](CD_IMPLEMENTATION_CHECKLIST.md) (30-60 min)
3. Run `./scripts/validate-cd-pipeline.sh` (2 min)
4. Push to main and deploy! 🚀

---

**Questions?** Check the appropriate documentation or GitHub Actions logs.

**Ready to deploy?** → `git push origin main` 🎉
