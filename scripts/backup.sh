#!/bin/bash
# PostgreSQL Backup Script for sGate

set -e

# Configuration
BACKUP_DIR="/backups"
DB_HOST="postgres"
DB_PORT="5432"
DB_NAME="sgate_production"
DB_USER="sgate_prod"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="sgate_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=30

# Create backup directory
mkdir -p ${BACKUP_DIR}

# Create backup
echo "Creating backup: ${BACKUP_FILE}"
pg_dump -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} \
  --format=custom --verbose --file="${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
gzip "${BACKUP_DIR}/${BACKUP_FILE}"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

echo "Backup completed: ${COMPRESSED_FILE}"

# Clean up old backups (older than retention period)
echo "Cleaning up backups older than ${RETENTION_DAYS} days..."
find ${BACKUP_DIR} -name "sgate_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -exec rm {} \;

echo "Backup process completed successfully"