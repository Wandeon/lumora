#!/bin/bash

# EventiCRO PostgreSQL Backup Script
# Runs automated backups with retention and Prometheus metrics

set -euo pipefail

# Configuration
BACKUP_DIR="/home/admin/backups/eventicro"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/eventicro_${TIMESTAMP}.sql.gz"
METRICS_FILE="/var/lib/node_exporter/textfile_collector/backup_eventicro.prom"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Database credentials
DB_CONTAINER="eventicro-postgres"
DB_NAME="eventicro"
DB_USER="eventicro"
PGPASSWORD="cs5SA7tuU6LqGpMoix6mu4ZypkZ2JKmq"

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

# Initialize metrics
backup_success=0
backup_duration=0
backup_size=0

# Start time
start_time=$(date +%s)

log "Starting EventiCRO database backup..."

# Perform backup
if docker exec -e PGPASSWORD="${PGPASSWORD}" "${DB_CONTAINER}" \
    pg_dump -U "${DB_USER}" -d "${DB_NAME}" --no-owner --no-acl | \
    gzip > "${BACKUP_FILE}"; then
    
    backup_success=1
    backup_size=$(stat -f%z "${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_FILE}" 2>/dev/null || echo 0)
    log "Backup completed successfully: ${BACKUP_FILE} (${backup_size} bytes)"
else
    log "ERROR: Backup failed!"
    backup_success=0
fi

# Calculate duration
end_time=$(date +%s)
backup_duration=$((end_time - start_time))

# Clean up old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "eventicro_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete
remaining_backups=$(find "${BACKUP_DIR}" -name "eventicro_*.sql.gz" -type f | wc -l)
log "Remaining backups: ${remaining_backups}"

# Export Prometheus metrics
sudo mkdir -p "$(dirname "${METRICS_FILE}")"
sudo tee "${METRICS_FILE}" > /dev/null << METRICS
# HELP backup_eventicro_success Whether the last backup was successful (1=success, 0=failure)
# TYPE backup_eventicro_success gauge
backup_eventicro_success ${backup_success}

# HELP backup_eventicro_duration_seconds Time taken to complete the backup
# TYPE backup_eventicro_duration_seconds gauge
backup_eventicro_duration_seconds ${backup_duration}

# HELP backup_eventicro_size_bytes Size of the backup file in bytes
# TYPE backup_eventicro_size_bytes gauge
backup_eventicro_size_bytes ${backup_size}

# HELP backup_eventicro_timestamp_seconds Unix timestamp of last backup
# TYPE backup_eventicro_timestamp_seconds gauge
backup_eventicro_timestamp_seconds $(date +%s)

# HELP backup_eventicro_count Total number of backup files
# TYPE backup_eventicro_count gauge
backup_eventicro_count ${remaining_backups}
METRICS

log "Metrics exported to ${METRICS_FILE}"
log "Backup process completed."

exit $((1 - backup_success))
