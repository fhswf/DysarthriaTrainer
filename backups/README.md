# Backup & Restore System

**Cross-Platform Solution** - Works on Windows, Mac, and Linux! 🎉

This directory contains Python scripts that run inside Docker containers for backing up and restoring the AKI Sprachtraining database and media files.

## Directory Structure

```
backups/
├── README.md                    # This file
├── snapshots/                   # Backup snapshots (not in git)
│   └── <snapshot_name>/
│       ├── database.sql.gz      # Compressed PostgreSQL dump
│       ├── media/               # Media files
│       └── metadata.json        # Backup information
backend/scripts/
├── backup.py                    # Python backup script
└── restore.py                   # Python restore script
```

## Creating Backups

### Basic Usage

From the **project root directory**:

```bash
# Windows (PowerShell/CMD)
npm run backup

# Mac/Linux
npm run backup
```

Creates a timestamped snapshot: `backup_YYYYMMDD_HHMMSS`

### Named Snapshots

```bash
# Windows
npm run backup production_v1

# Mac/Linux
npm run backup production_v1
```

Alternative direct Docker command (all platforms):

```bash
docker compose exec backend python scripts/backup.py production_v1
```

### What Gets Backed Up

- **Database**: Full PostgreSQL dump with `--clean --if-exists` flags
- **Media Files**: All files in `data/media/` directory
- **Metadata**: JSON file with snapshot info, file counts, and timestamps

### Example Output

```
=== AKI Sprachtraining Backup ===
Creating snapshot: production_v1

[1/3] Backing up PostgreSQL database...
✓ Database backed up (compressed: 2.3 MB)

[2/3] Backing up media files...
✓ Backed up 127 media files (15.8 MB)

[3/3] Creating metadata...
✓ Metadata created

=== Backup Complete ===
Location: backups/snapshots/production_v1

To restore this backup:
  npm run restore production_v1
```

## Restoring Backups

### List Available Snapshots

```bash
# All platforms - just run restore without arguments to see list
npm run restore
```

Or directly:

```bash
docker compose exec backend python scripts/restore.py
```

### Restore a Snapshot

```bash
# All platforms
npm run restore production_v1
```

Or directly:

```bash
docker compose exec backend python scripts/restore.py production_v1
```

⚠️ **Warning**: This will **replace** your current database and media files!

### Restore Process

1. Shows snapshot metadata
2. Asks for confirmation (type `y` to proceed)
3. Restores database (drops existing tables)
4. Backs up existing media to `media.backup.YYYYMMDD_HHMMSS`
5. Restores media files from snapshot
6. Shows completion summary

### Example Output

```
=== AKI Sprachtraining Restore ===
Snapshot: production_v1
Location: backups/snapshots/production_v1

Snapshot Information:
  snapshot_name: production_v1
  created_at: 2025-12-04T14:30:45Z
  media_files_count: 127

This will REPLACE current data. Continue? [y/N]: y

[1/2] Restoring PostgreSQL database...
✓ Database restored

[2/2] Restoring media files...
Backing up existing media to media.backup.20251204_143500...
✓ Restored 127 media files

=== Restore Complete ===

Next steps:
  1. Restart backend: docker compose restart backend
  2. Verify data in application
```

## Auto-Restore on Startup

### Using Environment Variable

Add to `.env`:

```bash
RESTORE_SNAPSHOT=production_v1
```

Then modify the backend service in `compose.yml` to run the restore script before migrations.

### Docker Compose Integration

Update `compose.yml` backend service command:

```yaml
backend:
  environment:
    - RESTORE_SNAPSHOT=${RESTORE_SNAPSHOT:-}
  command: >
    sh -c "
      if [ -n \"$$RESTORE_SNAPSHOT\" ]; then
        python scripts/restore.py $$RESTORE_SNAPSHOT --non-interactive
      fi &&
      python -m alembic upgrade head &&
      uvicorn src.main:app --host ${UVICORN_HOST} --port ${UVICORN_PORT} --reload
    "
```

## Quick Commands Reference

All commands work on **Windows, Mac, and Linux**:

```bash
# Create timestamped backup
npm run backup

# Create named backup
npm run backup my_snapshot_name

# List available snapshots
npm run restore

# Restore specific snapshot
npm run restore my_snapshot_name

# Direct Docker commands (alternative)
docker compose exec backend python scripts/backup.py
docker compose exec backend python scripts/backup.py my_snapshot_name
docker compose exec backend python scripts/restore.py
docker compose exec backend python scripts/restore.py my_snapshot_name
```

## Best Practices

### Backup Frequency

- **Development**: Before major changes or migrations
- **Production**: Daily automated backups (use cron/Task Scheduler)
- **Before Updates**: Always create a snapshot before upgrading

### Snapshot Naming

Use descriptive names:

```bash
npm run backup pre_migration_2025_12_04
npm run backup stable_v1_0_0
npm run backup before_user_import
```

### Retention Policy

**Development:**

- Keep last 5 snapshots
- Keep weekly snapshots for 1 month

**Production:**

- Keep daily backups for 1 week
- Keep weekly backups for 1 month
- Keep monthly backups for 1 year
- Store critical snapshots offsite

### Storage Management

Monitor snapshot disk usage:

```bash
# Windows PowerShell
Get-ChildItem backups/snapshots -Directory | ForEach-Object {
    "{0:N2} MB - {1}" -f ((Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB), $_.Name
}

# Mac/Linux
du -sh backups/snapshots/*
```

## Troubleshooting

### Backend Container Not Running

**Error**: `Error response from daemon: Container ... is not running`

**Solution**: Start Docker containers:

```bash
docker compose up -d
```

### Database Connection Failed

**Error**: `psql: error: connection to server failed`

**Solution**: Ensure PostgreSQL container is healthy:

```bash
docker compose ps
docker compose logs postgres_timescale_pg_vector
```

### Media Files Not Restored

**Error**: `⚠ No media files in snapshot`

**Cause**: Backup created when `data/media/` was empty

**Solution**: Check if media files existed during backup by reviewing `metadata.json`

### Permission Errors on Windows

**Error**: `PermissionError: [WinError 5] Access denied`

**Solution**: Run PowerShell/CMD as Administrator or check Docker Desktop settings

### Python Not Found in Container

**Error**: `python: not found`

**Solution**: Rebuild backend container:

```bash
docker compose build backend
docker compose up -d backend
```

## Safety Features

### Backup Script

- **Non-Destructive**: Only reads, never modifies source data
- **Compressed**: Uses gzip to save disk space
- **Timestamped**: Automatic naming prevents overwrites
- **Metadata**: Tracks backup info for validation

### Restore Script

- **Confirmation Prompt**: Requires explicit `y` to proceed
- **Media Backup**: Saves existing media before overwrite
- **Error Handling**: Exits on failure with clear error messages
- **Validation**: Checks snapshot existence before proceeding

## Technical Details

### How It Works

The backup/restore system uses **Python scripts running inside Docker containers**, making it compatible with all platforms (Windows, Mac, Linux).

**Key Components:**

- `backend/scripts/backup.py` - Python backup script
- `backend/scripts/restore.py` - Python restore script
- Docker Compose - Executes scripts in backend container
- npm scripts - Convenient cross-platform commands

### Database Backup Method

```python
# Runs pg_dump inside postgres container via docker compose exec
docker compose exec -T postgres_timescale_pg_vector \
  pg_dump -U $POSTGRES_USER -d $POSTGRES_DB \
  --clean --if-exists
```

Output is compressed with gzip (5-10x size reduction).

### Database Restore Method

```python
# Streams decompressed SQL to psql inside postgres container
docker compose exec -T postgres_timescale_pg_vector \
  psql -U $POSTGRES_USER -d $POSTGRES_DB < database.sql
```

Cleans existing schema first with `--clean --if-exists` flags.

### Media Backup/Restore

Uses Python's `shutil` module to copy files recursively:

- Preserves directory structure
- Maintains file permissions and timestamps
- Backs up existing media before restore

### Why Docker-Based?

✅ **Cross-Platform**: Works identically on Windows, Mac, Linux
✅ **No Dependencies**: No need to install PostgreSQL tools on host
✅ **Network Access**: Container has direct access to database
✅ **Environment Variables**: Automatically loads from `.env`
✅ **Consistent**: Same Python version across all platforms

## Advanced Usage

### Automated Daily Backups

**Windows (Task Scheduler)**:

1. Open Task Scheduler
2. Create Basic Task
3. Trigger: Daily at 2:00 AM
4. Action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c cd C:\path\to\project && npm run backup daily_%date:~-4,4%%date:~-10,2%%date:~-7,2%`

**Mac/Linux (crontab)**:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/project && npm run backup daily_$(date +\%Y\%m\%d) >> backups/backup.log 2>&1
```

### Backup to Cloud Storage

After creating backup, sync to cloud:

```bash
# Create backup
npm run backup production_backup

# Windows (OneDrive/Google Drive)
xcopy /E /I backups\snapshots\production_backup "%OneDrive%\Backups\aki_sprachtraining\production_backup"

# Mac (iCloud Drive)
rsync -av backups/snapshots/production_backup ~/Library/Mobile\ Documents/com~apple~CloudDocs/Backups/

# Linux (rclone to any cloud)
rclone sync backups/snapshots/production_backup remote:backups/production_backup
```

### Restore to Different Environment

```bash
# Copy snapshot from production to dev
# Then restore in dev environment
npm run restore production_backup
```

## Migration Workflow

Before running database migrations:

```bash
# 1. Create backup
npm run backup before_migration_$(date +%Y%m%d)  # Mac/Linux
npm run backup before_migration_%date:~-4,4%%date:~-10,2%%date:~-7,2%  # Windows CMD

# 2. Run migrations
docker compose exec backend alembic upgrade head

# 3. Test application
# If issues occur, restore backup:
npm run restore before_migration_YYYYMMDD
docker compose restart backend
```

## Platform-Specific Notes

### Windows

- Use PowerShell or CMD (both work)
- Path separators: Use forward slashes `/` or backslashes `\`
- Docker Desktop must be running
- Colored output works in Windows Terminal

### Mac

- Requires Docker Desktop
- All commands work in Terminal
- Colored output supported

### Linux

- Docker and Docker Compose required
- All commands work in any shell (bash, zsh, fish)
- Colored output supported

## Support

For issues or questions:

1. Check Docker logs: `docker compose logs backend postgres_timescale_pg_vector`
2. Verify containers running: `docker compose ps`
3. Check snapshot metadata: `cat backups/snapshots/<name>/metadata.json` (Mac/Linux) or `type backups\snapshots\<name>\metadata.json` (Windows)
4. Review this documentation
5. Check project's main README.md
