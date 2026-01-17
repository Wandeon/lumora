# Lumora Operations Runbook

## Quick Reference

### Health Check

```bash
curl https://lumora.genai.hr/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2026-01-17T...",
  "responseTime": 150,
  "services": {
    "database": "ok",
    "redis": "ok",
    "smtp": "ok"
  }
}
```

### Container Status

```bash
cd /home/admin/lumora
docker-compose ps
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis
```

---

## Common Issues

### 1. App Not Responding

**Symptoms:** 502/503 errors, health check fails

**Steps:**

1. Check container status:
   ```bash
   docker-compose ps
   ```
2. View app logs:
   ```bash
   docker-compose logs app --tail=50
   ```
3. Restart app:
   ```bash
   docker-compose restart app
   ```
4. If persists, rebuild:
   ```bash
   docker-compose up -d --build app
   ```

### 2. Database Connection Issues

**Symptoms:** "Database connection failed" in health check

**Steps:**

1. Check postgres status:
   ```bash
   docker-compose ps postgres
   ```
2. View logs:
   ```bash
   docker-compose logs postgres --tail=50
   ```
3. Test connection:
   ```bash
   docker-compose exec postgres pg_isready -U lumora
   ```
4. Restart:
   ```bash
   docker-compose restart postgres
   ```
5. Wait for health check, then restart app:
   ```bash
   docker-compose restart app
   ```

### 3. Redis Issues

**Symptoms:** Rate limiting fails, slow responses

**Steps:**

1. Check redis:
   ```bash
   docker-compose exec redis redis-cli ping
   ```
2. View memory:
   ```bash
   docker-compose exec redis redis-cli info memory
   ```
3. Restart:
   ```bash
   docker-compose restart redis
   ```

### 4. Email Not Sending

**Symptoms:** Users not receiving emails

**Steps:**

1. Check SMTP container:
   ```bash
   docker-compose ps smtp
   ```
2. Check health endpoint shows "smtp: ok"
3. View SMTP logs:
   ```bash
   docker-compose logs smtp --tail=50
   ```
4. Common causes:
   - Check spam folders
   - Verify EMAIL_FROM domain has proper SPF/DKIM
   - Check if SMTP relay is rate-limited

### 5. High Memory Usage

**Symptoms:** Slow responses, OOM errors

**Steps:**

1. Check container stats:
   ```bash
   docker stats
   ```
2. If app memory high, restart:
   ```bash
   docker-compose restart app
   ```
3. If postgres memory high, check for long-running queries:
   ```bash
   docker-compose exec postgres psql -U lumora -c "SELECT pid, now() - pg_stat_activity.query_start AS duration, query FROM pg_stat_activity WHERE state = 'active';"
   ```

### 6. Disk Space Issues

**Symptoms:** Uploads fail, database errors

**Steps:**

1. Check disk usage:
   ```bash
   df -h
   ```
2. Clean Docker resources:
   ```bash
   docker system prune -a
   ```
3. Check backup sizes:
   ```bash
   du -sh /home/admin/lumora/backups/*
   ```

---

## Deployment

### Standard Deploy

```bash
cd /home/admin/lumora
git pull origin master
docker-compose build app
docker-compose up -d app
docker-compose exec app npx prisma migrate deploy
```

### Deploy with Full Rebuild

```bash
cd /home/admin/lumora
git pull origin master
docker-compose down
docker-compose build --no-cache app
docker-compose up -d
docker-compose exec app npx prisma migrate deploy
```

### Rollback

```bash
# Find previous working commit
git log --oneline -10

# Revert to specific commit
git checkout <commit-sha>
docker-compose build app
docker-compose up -d app
```

### Verify Deployment

```bash
# Check health
curl https://lumora.genai.hr/api/health

# Check logs for errors
docker-compose logs app --tail=20
```

---

## Backups

### Backup Location

- Automatic backups: `./backups/`
- Retention: 30 days
- Schedule: Daily (via backup container)

### Manual Backup

```bash
docker-compose exec postgres pg_dump -U lumora lumora | gzip > backup-$(date +%Y%m%d-%H%M%S).sql.gz
```

### Restore from Backup

```bash
# Stop app to prevent writes during restore
docker-compose stop app

# Restore
gunzip -c backup-YYYYMMDD-HHMMSS.sql.gz | docker-compose exec -T postgres psql -U lumora lumora

# Restart app
docker-compose start app
```

### Test Backup Integrity

```bash
# List tables in backup
gunzip -c backups/lumora-2026-01-17.sql.gz | grep "CREATE TABLE" | head -20
```

---

## External Monitoring Setup

### UptimeRobot (Recommended)

1. Create account at https://uptimerobot.com
2. Add New Monitor:
   - Monitor Type: HTTP(s)
   - Friendly Name: Lumora Production
   - URL: `https://lumora.genai.hr/api/health`
   - Monitoring Interval: 5 minutes
3. Add Alert Contacts (email, Slack, etc.)
4. Set up status page (optional)

### Expected Health Response

- Status code: 200 (healthy) or 503 (degraded)
- Response time: < 2000ms typically

### Alert Thresholds

- Response time > 5000ms: Warning
- Response time > 10000ms: Critical
- Any 5xx error: Critical

---

## Sentry Error Monitoring

### Configuration

Set in environment:

```bash
SENTRY_DSN=https://xxx@sentry.io/xxx
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Verify Sentry

Check Sentry dashboard for:

- Error reports from production
- Performance metrics
- Release tracking

---

## Database Maintenance

### View Active Connections

```bash
docker-compose exec postgres psql -U lumora -c "SELECT count(*) FROM pg_stat_activity;"
```

### Kill Long Queries

```bash
docker-compose exec postgres psql -U lumora -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE duration > interval '5 minutes' AND state = 'active';"
```

### Vacuum Database

```bash
docker-compose exec postgres psql -U lumora -c "VACUUM ANALYZE;"
```

---

## SSL Certificate

Managed by reverse proxy (nginx/Caddy). Check:

```bash
echo | openssl s_client -servername lumora.genai.hr -connect lumora.genai.hr:443 2>/dev/null | openssl x509 -noout -dates
```

---

## Contacts

| Role             | Contact               |
| ---------------- | --------------------- |
| Technical Lead   | admin@lumora.genai.hr |
| Stripe Support   | Stripe Dashboard      |
| Domain/DNS       | Cloudflare Dashboard  |
| Error Monitoring | Sentry Dashboard      |
| Storage (R2)     | Cloudflare Dashboard  |

---

## SLAs

| Metric              | Target      |
| ------------------- | ----------- |
| Uptime              | 99.5%       |
| Response Time (p95) | < 2 seconds |
| RTO (Recovery Time) | 4 hours     |
| RPO (Data Loss)     | 24 hours    |

---

## Incident Response

### Severity Levels

| Level         | Description                 | Response Time     |
| ------------- | --------------------------- | ----------------- |
| P1 - Critical | Site down, payments failing | < 1 hour          |
| P2 - High     | Feature broken, data issue  | < 4 hours         |
| P3 - Medium   | Degraded performance        | < 24 hours        |
| P4 - Low      | Minor issues                | Next business day |

### Incident Steps

1. **Assess** - Check health endpoint, logs, monitoring
2. **Communicate** - Update status page if applicable
3. **Mitigate** - Apply quick fix (restart, rollback)
4. **Resolve** - Deploy permanent fix
5. **Review** - Post-mortem for P1/P2 incidents

---

_Last Updated: 2026-01-17_
