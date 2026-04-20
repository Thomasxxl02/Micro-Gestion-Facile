# ✅ CD Implementation Checklist

**Project:** Micro-Gestion-Facile  
**Date Created:** April 20, 2026  
**Status:** Ready for Deployment

---

## 📋 Pre-Implementation (BEFORE pushing)

### Validate Local Setup

- [ ] Run validation script:
  ```bash
  chmod +x scripts/validate-cd-pipeline.sh
  ./scripts/validate-cd-pipeline.sh
  ```
- [ ] All checks pass (Docker, nginx, build succeeds)
- [ ] Docker image builds locally without errors
- [ ] Container starts and responds to requests

### Prepare Deployment Server

- [ ] Server details documented:
  - [ ] Host/IP: `___________________`
  - [ ] SSH User: `___________________`
  - [ ] SSH Port: `___________________`

- [ ] Server prerequisites:
  - [ ] Ubuntu/Debian Linux installed
  - [ ] Docker installed: `docker --version`
  - [ ] Docker daemon running: `sudo systemctl status docker`
  - [ ] SSH enabled: `sudo systemctl status ssh`
  - [ ] Firewall allows SSH: `sudo ufw status`

- [ ] Create deploy user:

  ```bash
  sudo adduser deploy
  sudo usermod -aG docker deploy
  ```

- [ ] Configure SSH keys:

  ```bash
  sudo -u deploy mkdir -p /home/deploy/.ssh
  # Add public key to /home/deploy/.ssh/authorized_keys
  sudo -u deploy chmod 600 /home/deploy/.ssh/authorized_keys
  ```

- [ ] Test SSH access:

  ```bash
  ssh -i ~/.ssh/deploy_key deploy@HOST "docker ps"
  # Should show containers (empty list OK)
  ```

- [ ] Create Docker network (optional, for Nginx reverse proxy):
  ```bash
  docker network create nginx-network
  ```

---

## 🔐 GitHub Setup

### 1. Generate SSH Key Pair (if not exists)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -C "github-actions" -N ""
```

- [ ] Public key: `~/.ssh/deploy_key.pub`
- [ ] Private key: `~/.ssh/deploy_key`
- [ ] Uploaded to server: `/home/deploy/.ssh/authorized_keys`

### 2. Create GitHub Repository Secrets

**Navigate to:** Settings → Secrets and variables → Actions

**Create these secrets:**

| Secret Name       | Value                   | Notes                        |
| ----------------- | ----------------------- | ---------------------------- |
| `DEPLOY_HOST`     | `your.server.com`       | FQDN or IP address           |
| `DEPLOY_USER`     | `deploy`                | SSH user (e.g., deploy)      |
| `DEPLOY_SSH_KEY`  | _(private key content)_ | Run: `cat ~/.ssh/deploy_key` |
| `DEPLOY_SSH_PORT` | `22`                    | Optional (defaults to 22)    |

- [ ] `DEPLOY_HOST` created
- [ ] `DEPLOY_USER` created
- [ ] `DEPLOY_SSH_KEY` created (copy full private key)
- [ ] `DEPLOY_SSH_PORT` created (optional)

**Verify in UI:**

- [ ] All 4 secrets visible in Settings

---

## 📁 File Verification

### Workflow Configuration

- [ ] `.github/workflows/cd.yml` exists
- [ ] File contains: `build-and-push`, `scan-trivy`, `deploy-ssh`, `notify-deployment`
- [ ] Workflow permissions correct (defaults OK)

### Container Configuration

- [ ] `Dockerfile` exists (~70 lines)
  - [ ] Multi-stage build (Node → Nginx)
  - [ ] Non-root user setup
  - [ ] Health checks enabled
- [ ] `nginx.conf` exists (~90 lines)
  - [ ] SPA routing configured
  - [ ] Service Worker no-cache
  - [ ] Security headers present
- [ ] `.dockerignore` exists (~60 lines)
  - [ ] node_modules, dist excluded
  - [ ] .git, .env excluded

### Documentation

- [ ] `docs/CD_WORKFLOW_SETUP.md` exists (complete setup guide)
- [ ] `docs/CD_WORKFLOW_QUICKREF.md` exists (quick reference)
- [ ] `docs/CD_NOTIFICATIONS.md` exists (notification integrations)
- [ ] `docs/CD_PIPELINE_SUMMARY.md` exists (this document)

### Scripts

- [ ] `scripts/validate-cd-pipeline.sh` exists
- [ ] Script is executable: `chmod +x scripts/validate-cd-pipeline.sh`

---

## 🧪 Testing Phase

### 1. Local Docker Build Test

```bash
docker build -t micro-gestion-facile:test .
```

- [ ] Build completes without errors
- [ ] Build time noted: `_____ min`
- [ ] Image size reasonable (< 200 MB)

### 2. Local Container Test

```bash
docker run --rm -p 8080:8080 micro-gestion-facile:test
```

- [ ] Container starts without errors
- [ ] Health check passes: `curl http://localhost:8080`
- [ ] Status code 200 or redirect to index.html

### 3. Cleanup

```bash
docker stop <container-id>
docker rmi micro-gestion-facile:test
```

- [ ] Test image removed

---

## 🚀 First Deployment

### Pre-Push Checklist

- [ ] All local tests passing
- [ ] All files committed
- [ ] GitHub secrets configured (verified in UI)
- [ ] SSH key tested on server
- [ ] No uncommitted changes: `git status` clean

### Push to Main

```bash
git add .
git commit -m "ci: add complete CD pipeline (build → Trivy → GHCR → SSH deploy)"
git push origin main
```

- [ ] Push successful
- [ ] No merge conflicts

### Monitor Deployment

**GitHub UI:** Actions → CD - Build, Scan & Deploy

- [ ] Workflow starts automatically
- [ ] `build-and-push` job runs and completes✅
- [ ] `scan-trivy` job runs and completes ✅
- [ ] `deploy-ssh` job runs and completes ✅
- [ ] `notify-deployment` job completes ✅

**Timeline:** ~10 minutes total

### Verify Deployment

**On server:**

```bash
ssh deploy@YOUR.SERVER.COM

# Check container
docker ps | grep micro-gestion-facile

# View logs
docker logs micro-gestion-facile

# Test app
docker exec micro-gestion-facile wget -O- http://localhost/ | head -20
```

- [ ] Container is running
- [ ] Container is healthy
- [ ] App responds to requests
- [ ] No error logs

**Remote test:**

```bash
curl http://YOUR.SERVER:8080
```

- [ ] Response received
- [ ] HTTP status 200 or 301 (if SPA routing working)

---

## 🔍 Post-Deployment Verification

### 1. GitHub Artifacts

- [ ] GitHub Actions UI shows artifacts:
  - [ ] `trivy-scan-report` (JSON + SARIF)
  - [ ] No critical vulnerabilities reported

### 2. GitHub Security Tab

- [ ] Settings → Security → Vulnerability alerts
  - [ ] Trivy scan results visible
  - [ ] No blocking issues

### 3. Container Health

```bash
docker inspect micro-gestion-facile --format='{{json .State.Health}}'
```

- [ ] Health status: "healthy" ✅
- [ ] Healthy count increasing

### 4. Logs Review

```bash
docker logs micro-gestion-facile | tail -20
```

- [ ] No error messages (ERROR, CRITICAL)
- [ ] Normal Nginx startup messages present

---

## 📊 Monitoring Setup (Optional)

- [ ] Setup notification webhook:
  - [ ] Discord: [CD_NOTIFICATIONS.md](docs/CD_NOTIFICATIONS.md)
  - [ ] Slack: [CD_NOTIFICATIONS.md](docs/CD_NOTIFICATIONS.md)
  - [ ] Telegram: [CD_NOTIFICATIONS.md](docs/CD_NOTIFICATIONS.md)

- [ ] GitHub branch protection (recommended):
  ```bash
  # Settings → Branches → Add rule
  # Require status checks to pass before merging:
  # ✅ build-and-test (CI)
  # ✅ lint check results
  ```

---

## 🔄 Maintenance Checklist (Weekly)

- [ ] Check workflow run history
  - [ ] No failed runs
  - [ ] Average build time acceptable
- [ ] Review container logs
  - [ ] No error patterns
  - [ ] Memory/CPU usage normal
- [ ] Verify app still works
  - [ ] Test core workflows
  - [ ] Check PWA functionality (offline mode)

---

## 🆘 Troubleshooting By Symptom

### Build Fails

- [ ] Check Docker version: `docker --version` (need 20+)
- [ ] Check disk space: `df -h` (need 10+ GB)
- [ ] Review build logs in GitHub UI
- [ ] Try local build: `docker build -t test .`
- [ ] **Reference:** [CD_WORKFLOW_SETUP.md § Docker login fails](docs/CD_WORKFLOW_SETUP.md)

### Trivy Scan Times Out

- [ ] Image too large
- [ ] Network timeout
- [ ] Trivy service issue
- [ ] **Reference:** [CD_WORKFLOW_SETUP.md § Trivy scan times out](docs/CD_WORKFLOW_SETUP.md)

### SSH Deploy Fails

- [ ] SSH key incorrect: verify in secrets
- [ ] Host unreachable: test manually
- [ ] User permissions: check sudo docker access
- [ ] Firewall: check port 22 open
- [ ] **Reference:** [CD_WORKFLOW_SETUP.md § SSH Connection Refused](docs/CD_WORKFLOW_SETUP.md)

### Container Won't Start

- [ ] Check logs: `docker logs micro-gestion-facile`
- [ ] Check health: `docker inspect micro-gestion-facile`
- [ ] Check port: 8080 available
- [ ] Try manual run: `docker run -it micro-gestion-facile`
- [ ] **Reference:** [CD_WORKFLOW_SETUP.md § Container Fails to Start](docs/CD_WORKFLOW_SETUP.md)

### Health Check Fails

- [ ] App not responding on port 8080
- [ ] Nginx config issue
- [ ] Check: `docker exec micro-gestion-facile wget http://localhost/`
- [ ] **Reference:** [CD_WORKFLOW_SETUP.md § Health Check Fails](docs/CD_WORKFLOW_SETUP.md)

---

## 📚 Documentation References

| Document                                           | Purpose                                | Read Time |
| -------------------------------------------------- | -------------------------------------- | --------- |
| [CD_PIPELINE_SUMMARY.md](CD_PIPELINE_SUMMARY.md)   | Overview of complete pipeline          | 5 min     |
| [CD_WORKFLOW_QUICKREF.md](CD_WORKFLOW_QUICKREF.md) | Commands, architecture, common issues  | 5-10 min  |
| [CD_WORKFLOW_SETUP.md](CD_WORKFLOW_SETUP.md)       | Complete setup + troubleshooting guide | 15-20 min |
| [CD_NOTIFICATIONS.md](CD_NOTIFICATIONS.md)         | Discord, Slack, Telegram integration   | 10-15 min |

---

## ✨ Success Criteria

✅ **Pipeline is working when:**

1. **Build Stage** ✅
   - Docker image builds in < 5 minutes
   - Image pushed to GHCR with correct tags

2. **Scan Stage** ✅
   - Trivy scan completes in < 3 minutes
   - No critical vulnerabilities blocking deployment
   - Results visible in GitHub Security tab

3. **Deploy Stage** ✅
   - SSH connection successful
   - Container pulled and started
   - Health checks pass
   - Container running and responsive

4. **Notify Stage** ✅
   - Status message logged
   - (Optional: Discord/Slack notification received)

**Overall:** Workflow runs to completion in ~10 minutes

---

## 🎓 Learning Outcomes

After completing this setup, you'll understand:

- ✅ Multi-stage Docker builds
- ✅ GitHub Container Registry (GHCR)
- ✅ Security vulnerability scanning (Trivy)
- ✅ SSH deployment automation
- ✅ GitHub Actions workflows
- ✅ Container health checks
- ✅ PWA Nginx configuration

---

## 🚀 Next Milestones

### Within 1 Week

- [ ] Complete this checklist ✅
- [ ] First deployment successful
- [ ] Add notification webhooks

### Within 1 Month

- [ ] Setup staging environment
- [ ] Configure branch protection rules
- [ ] Add performance testing (Lighthouse)

### Within 3 Months

- [ ] Multi-region deployment (optional)
- [ ] Database migrations automation
- [ ] Cost monitoring and alerts

---

## 📞 Quick Help

**Stuck?** Check:

1. [CD_WORKFLOW_SETUP.md § Troubleshooting](docs/CD_WORKFLOW_SETUP.md#-troubleshooting)
2. GitHub Actions workflow logs (UI)
3. Server logs: `docker logs micro-gestion-facile`

**Ready to start?** → Run: `./scripts/validate-cd-pipeline.sh` ✅

---

**Status: READY TO DEPLOY** 🎉

_Mark the box below when deployment is complete:_

- [ ] **✅ FIRST PRODUCTION DEPLOYMENT SUCCESSFUL**
  - Date: `_______________`
  - Time taken: `_______________`
  - Notes: `_______________`
