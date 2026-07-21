# Cross-Platform Backup & Restore System ✨

**Works on Windows, Mac, and Linux!**

This backup system uses Python scripts running inside Docker containers, ensuring identical behavior across all platforms. No bash scripts required!

## Quick Start

All commands work identically on **Windows PowerShell/CMD**, **Mac Terminal**, and **Linux Shell**:

```bash
# Create a backup
npm run backup

# Create a named backup
npm run backup my_snapshot_name

# List available snapshots
npm run restore

# Restore a snapshot
npm run restore my_snapshot_name
```

## How It Works

The backup/restore system:

- ✅ Runs Python scripts inside the backend Docker container
- ✅ Uses PostgreSQL client tools (pg_dump/psql) from the container
- ✅ Accesses database via Docker network (no host dependencies)
- ✅ Reads environment variables from `.env` file
- ✅ Works identically on all operating systems

## Complete Workflow Example

### 1. Create a Backup

**Windows PowerShell:**

```powershell
cd C:\path\to\project
npm run backup production_backup
```

**Mac/Linux:**

```bash
cd /path/to/project
npm run backup production_backup
```

**Output:**

```
=== AKI Sprachtraining Backup ===
Creating snapshot: production_backup

[1/3] Backing up PostgreSQL database...
✓ Database backed up (compressed: 0.3 MB)
[2/3] Backing up media files...
✓ Backed up 44 media files (7.1 MB)
[3/3] Creating metadata...
✓ Metadata created

=== Backup Complete ===
Location: /app/backups/snapshots/production_backup

To restore this backup:
  npm run restore production_backup
```

### 2. List Available Snapshots

```bash
npm run restore
```

**Output:**

```
Error: Snapshot name required

Usage: python restore.py <snapshot_name> [--non-interactive]

Available snapshots:
  - test_backup (created: 2025-12-04T22:10:36.116393, size: 7.5 MB)
  - production_backup (created: 2025-12-04T22:15:20.341234, size: 7.5 MB)
```

### 3. Restore a Snapshot

```bash
npm run restore production_backup
```

**Output:**

```
=== AKI Sprachtraining Restore ===
Snapshot: production_backup
Location: /app/backups/snapshots/production_backup

Snapshot Information:
  snapshot_name: production_backup
  created_at: 2025-12-04T22:15:20.341234
  media_files_count: 44

This will REPLACE current data. Continue? [y/N]: y

[1/2] Restoring PostgreSQL database...
✓ Database restored
[2/2] Restoring media files...
✓ Restored 44 media files

=== Restore Complete ===

Next steps:
  1. Restart backend: docker compose restart backend
  2. Verify data in application
```

## Alternative: Direct Docker Commands

You can also run the scripts directly with `docker compose exec`:

```bash
# Backup
docker compose exec backend python scripts/backup.py my_backup

# Restore
docker compose exec backend python scripts/restore.py my_backup

# Non-interactive restore (for automation)
docker compose exec backend python scripts/restore.py my_backup --non-interactive
```

## What Gets Backed Up

Each snapshot contains:

```
backups/snapshots/production_backup/
├── database.sql.gz      # Compressed PostgreSQL dump with --clean --if-exists
├── media.tar.gz        # Compressed archive of all media files
└── metadata.json       # Backup information (timestamp, file counts, sizes)
```

**Key Features:**

- **Database**: Compressed with gzip (5-10x size reduction)
- **Media Files**: Compressed with tar.gz (varies by file type, ~10-50% for audio)
- **All operations run inside Docker container** - works on Windows, Mac, Linux

## Platform-Specific Notes

### Windows

- ✅ Works in PowerShell, CMD, and Windows Terminal
- ✅ Docker Desktop must be running
- ✅ Colored output supported in Windows Terminal
- ✅ Paths with spaces work correctly

### Mac

- ✅ Requires Docker Desktop
- ✅ Works in Terminal, iTerm2, and all shells
- ✅ Full colored output support

### Linux

- ✅ Requires Docker and Docker Compose
- ✅ Works with bash, zsh, fish, etc.
- ✅ Full colored output support

## Auto-Restore on Startup

**This feature is already configured by default!** ✨

To automatically restore a snapshot when starting the project:

1. Set the snapshot name in `.env` (copy from `.env.example` if needed):

```bash
# Backup & Restore
# Set to a snapshot name to auto-restore on startup
RESTORE_SNAPSHOT=production_backup
```

2. Start the project:

```bash
docker compose up -d
```

The specified snapshot will be restored automatically before migrations run.

**To disable auto-restore:** Leave `RESTORE_SNAPSHOT` empty or comment it out:

```bash
# RESTORE_SNAPSHOT=
```

## Automated Backups

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task → Daily
3. Action: Start a program
   - Program: `cmd.exe`
   - Arguments: `/c cd C:\path\to\project && npm run backup daily_backup`
   - Start in: `C:\path\to\project`

### Mac/Linux Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cd /path/to/project && npm run backup daily_backup >> backups/backup.log 2>&1
```

## Best Practices

1. **Before Migrations**: Always create a backup before running database migrations

```bash
npm run backup before_migration
docker compose exec backend alembic upgrade head
```

2. **Regular Backups**: Set up automated daily backups

3. **Test Restores**: Periodically test restore process to ensure backups work

4. **Offsite Storage**: Copy important snapshots to cloud storage

```bash
# After backup
# Windows (OneDrive)
xcopy /E /I backups\snapshots\production_backup "%OneDrive%\Backups\aki\"

# Mac (iCloud Drive)
cp -r backups/snapshots/production_backup ~/Library/Mobile\ Documents/com~apple~CloudDocs/Backups/

# Linux (any cloud with rclone)
rclone sync backups/snapshots/production_backup remote:backups/
```

5. **Naming Convention**: Use descriptive names with dates

```bash
npm run backup stable_v1_0_0
npm run backup before_major_update_2025_12_04
npm run backup weekly_backup_2025_week_49
```

## Troubleshooting

### Backend Container Not Running

**Error:** `Error response from daemon: Container ... is not running`

**Solution:**

```bash
docker compose up -d
docker compose ps  # Verify containers are running
```

### Database Connection Failed

**Error:** `psql: error: connection to server failed`

**Solution:**

```bash
docker compose logs postgres_timescale_pg_vector
docker compose restart postgres_timescale_pg_vector
```

### Permission Errors on Windows

**Error:** `PermissionError: [WinError 5] Access denied`

**Solution:** Run PowerShell/CMD as Administrator

### No Space Left on Device

**Error:** `OSError: [Errno 28] No space left on device`

**Solution:** Clean up old snapshots:

```bash
# Windows
rmdir /S backups\snapshots\old_backup_name

# Mac/Linux
rm -rf backups/snapshots/old_backup_name
```

## Technical Details

### Database Backup

- Uses `pg_dump` with `--clean --if-exists` flags
- Compressed with gzip (5-10x size reduction)
- Includes all tables, indexes, and sequences
- Runs inside Docker network (no host PostgreSQL needed)

### Database Restore

- Uses `psql` to execute SQL dump
- Drops and recreates all objects
- Runs inside Docker network
- Automatically handles decompression

### Media Backup/Restore

- Uses Python's `tarfile` for cross-platform compression
- Creates compressed tar.gz archive of all media files
- Preserves directory structure and file metadata
- Typical compression: 10-50% depending on file types (audio/images)
- Backward compatible with legacy uncompressed backups
- Backs up existing files before restore

### Why Docker-Based?

- **No Platform Dependencies**: Works without PostgreSQL tools on host
- **Consistent Environment**: Same Python and tools across all systems
- **Network Access**: Container can access database directly
- **Environment Variables**: Automatically loaded from `.env`
- **Version Control**: Scripts tracked in git, snapshots ignored

## Storage Management

Monitor snapshot disk usage:

**Windows PowerShell:**

```powershell
Get-ChildItem backups/snapshots -Directory | ForEach-Object {
    $size = (Get-ChildItem $_.FullName -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    "{0:N2} MB - {1}" -f $size, $_.Name
}
```

**Mac/Linux:**

```bash
du -sh backups/snapshots/*
```

## Migration Workflow

```bash
# 1. Create pre-migration backup
npm run backup before_migration

# 2. Run migrations
docker compose exec backend alembic upgrade head

# 3. Test application
# If problems occur:
npm run restore before_migration
docker compose restart backend
```

## Support

For issues:

1. Check containers: `docker compose ps`
2. View logs: `docker compose logs backend postgres_timescale_pg_vector`
3. Verify snapshot: `cat backups/snapshots/<name>/metadata.json` (Mac/Linux) or `type backups\snapshots\<name>\metadata.json` (Windows)
4. Review this documentation
5. Check main project README

---

**Note:** The old bash scripts (`backup.sh`, `restore.sh`) are deprecated and have been replaced with this Python-based cross-platform solution.
