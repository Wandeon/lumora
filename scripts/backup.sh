#!/bin/sh
# scripts/backup.sh
# Database backup script for Lumora

set -e

BACKUP_DIR="/backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="${BACKUP_DIR}/lumora-${TIMESTAMP}.sql.gz"

echo "[$(date)] Starting backup..."

# Create backup directory if needed
mkdir -p "${BACKUP_DIR}"

# Perform backup
pg_dump -h postgres -U lumora -d lumora | gzip > "${BACKUP_FILE}"

# Verify backup created
if [ -f "${BACKUP_FILE}" ]; then
    SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] Backup completed: ${BACKUP_FILE} (${SIZE})"
else
    echo "[$(date)] ERROR: Backup file not created!"
    exit 1
fi

# Cleanup old backups
echo "[$(date)] Cleaning up backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "lumora-*.sql.gz" -mtime +${RETENTION_DAYS} -delete

REMAINING=$(ls -1 "${BACKUP_DIR}"/lumora-*.sql.gz 2>/dev/null | wc -l)
echo "[$(date)] Backup complete. ${REMAINING} backups retained."
