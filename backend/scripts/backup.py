#!/usr/bin/env python3
"""
Cross-platform backup script for AKI Sprachtraining
Backs up PostgreSQL database and media files into timestamped snapshots
"""

import os
import sys
import json
import shutil
import gzip
import tarfile
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[0;32m'
    YELLOW = '\033[1;33m'
    RED = '\033[0;31m'
    NC = '\033[0m'  # No Color


def print_colored(message: str, color: str = Colors.NC):
    """Print colored message to console"""
    print(f"{color}{message}{Colors.NC}")


def get_snapshot_name(custom_name: Optional[str] = None) -> str:
    """Generate snapshot name with timestamp"""
    if custom_name:
        return custom_name
    return f"backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}"


def get_env_variable(var_name: str, default: str = "") -> str:
    """Get environment variable or use default"""
    return os.environ.get(var_name, default)


def run_command(cmd: list, capture_output: bool = False) -> subprocess.CompletedProcess:
    """Run shell command and return result"""
    try:
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=capture_output,
            text=True
        )
        return result
    except subprocess.CalledProcessError as e:
        print_colored(f"✗ Command failed: {' '.join(cmd)}", Colors.RED)
        print_colored(f"Error: {e.stderr if capture_output else str(e)}", Colors.RED)
        sys.exit(1)


def backup_database(snapshot_dir: Path, postgres_user: str, postgres_db: str, postgres_host: str):
    """Backup PostgreSQL database to compressed SQL file"""
    print_colored("[1/3] Backing up PostgreSQL database...", Colors.YELLOW)
    
    db_file = snapshot_dir / "database.sql"
    db_file_gz = snapshot_dir / "database.sql.gz"
    
    # Run pg_dump directly (we're inside the container network)
    pg_dump_cmd = [
        "pg_dump",
        "-h", postgres_host,
        "-U", postgres_user,
        "-d", postgres_db,
        "--clean", "--if-exists"
    ]
    
    # Set PGPASSWORD environment variable
    env = os.environ.copy()
    env['PGPASSWORD'] = get_env_variable("POSTGRES_PASSWORD", "postgres")
    
    # Execute pg_dump and capture output
    try:
        result = subprocess.run(
            pg_dump_cmd,
            check=True,
            capture_output=True,
            text=True,
            env=env
        )
    except subprocess.CalledProcessError as e:
        print_colored(f"✗ pg_dump failed: {e.stderr}", Colors.RED)
        sys.exit(1)
    
    # Write to file
    db_file.write_text(result.stdout, encoding='utf-8')
    
    # Compress the SQL file
    with open(db_file, 'rb') as f_in:
        with gzip.open(db_file_gz, 'wb') as f_out:
            shutil.copyfileobj(f_in, f_out)
    
    # Remove uncompressed file
    db_file.unlink()
    
    # Get compressed size
    size_mb = db_file_gz.stat().st_size / (1024 * 1024)
    print_colored(f"✓ Database backed up (compressed: {size_mb:.1f} MB)", Colors.GREEN)
    
    return db_file_gz.stat().st_size


def backup_media(snapshot_dir: Path, media_source: Path):
    """Backup media files to compressed tar.gz archive"""
    print_colored("[2/3] Backing up media files...", Colors.YELLOW)
    
    if not media_source.exists():
        print_colored("⚠ Media source directory does not exist, skipping", Colors.YELLOW)
        return 0, 0
    
    # Check if media directory has any files
    media_files = list(media_source.rglob('*'))
    media_files = [f for f in media_files if f.is_file()]
    
    if not media_files:
        print_colored("⚠ No media files found, skipping", Colors.YELLOW)
        return 0, 0
    
    # Create compressed tar archive
    media_archive = snapshot_dir / "media.tar.gz"
    
    file_count = 0
    total_size = 0
    
    # Calculate uncompressed size
    for item in media_files:
        total_size += item.stat().st_size
        file_count += 1
    
    # Create tar.gz archive
    with tarfile.open(media_archive, "w:gz") as tar:
        tar.add(media_source, arcname="media")
    
    # Get compressed size
    compressed_size = media_archive.stat().st_size
    size_mb = total_size / (1024 * 1024)
    compressed_mb = compressed_size / (1024 * 1024)
    compression_ratio = (1 - compressed_size / total_size) * 100 if total_size > 0 else 0
    
    print_colored(
        f"✓ Backed up {file_count} media files ({size_mb:.1f} MB → {compressed_mb:.1f} MB, {compression_ratio:.1f}% compression)",
        Colors.GREEN
    )
    
    return file_count, compressed_size


def create_metadata(
    snapshot_dir: Path,
    snapshot_name: str,
    db_size: int,
    media_count: int,
    media_size: int
):
    """Create metadata JSON file"""
    print_colored("[3/3] Creating metadata...", Colors.YELLOW)
    
    metadata = {
        "snapshot_name": snapshot_name,
        "created_at": datetime.now().isoformat(),
        "database_size_bytes": db_size,
        "media_files_count": media_count,
        "media_size_bytes": media_size,
        "total_size_bytes": db_size + media_size,
        "postgres_user": get_env_variable("POSTGRES_USER"),
        "postgres_db": get_env_variable("POSTGRES_DB"),
        "backup_version": "1.0"
    }
    
    metadata_file = snapshot_dir / "metadata.json"
    metadata_file.write_text(json.dumps(metadata, indent=2), encoding='utf-8')
    
    print_colored("✓ Metadata created", Colors.GREEN)
    
    return metadata


def main():
    """Main backup function"""
    # Parse arguments
    snapshot_name = get_snapshot_name(sys.argv[1] if len(sys.argv) > 1 else None)
    
    print_colored("=== AKI Sprachtraining Backup ===", Colors.GREEN)
    print(f"Creating snapshot: {snapshot_name}\n")
    
    # Setup paths
    project_root = Path("/app")  # Inside container
    backups_dir = project_root / "backups" / "snapshots"
    snapshot_dir = backups_dir / snapshot_name
    media_source = project_root / "media"  # Mounted from ./data/media
    
    # Create snapshot directory
    snapshot_dir.mkdir(parents=True, exist_ok=True)
    
    # Get environment variables
    postgres_user = get_env_variable("POSTGRES_USER", "postgres")
    postgres_db = get_env_variable("POSTGRES_DB", "speech_training")
    postgres_host = get_env_variable("POSTGRES_HOST", "postgres_timescale_pg_vector")
    
    try:
        # Backup database
        db_size = backup_database(snapshot_dir, postgres_user, postgres_db, postgres_host)
        
        # Backup media files
        media_count, media_size = backup_media(snapshot_dir, media_source)
        
        # Create metadata
        metadata = create_metadata(
            snapshot_dir,
            snapshot_name,
            db_size,
            media_count,
            media_size
        )
        
        # Success message
        print()
        print_colored("=== Backup Complete ===", Colors.GREEN)
        print(f"Location: {snapshot_dir}")
        print()
        print("To restore this backup:")
        print_colored(f"  npm run restore {snapshot_name}", Colors.YELLOW)
        
    except Exception as e:
        print_colored(f"\n✗ Backup failed: {str(e)}", Colors.RED)
        # Cleanup failed backup
        if snapshot_dir.exists():
            shutil.rmtree(snapshot_dir)
        sys.exit(1)


if __name__ == "__main__":
    main()
