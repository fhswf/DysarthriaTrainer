#!/usr/bin/env python3
"""
Cross-platform restore script for AKI Sprachtraining
Restores PostgreSQL database and media files from snapshots
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


def get_env_variable(var_name: str, default: str = "") -> str:
    """Get environment variable or use default"""
    return os.environ.get(var_name, default)


def run_command(cmd: list, capture_output: bool = False, input_data: Optional[str] = None) -> subprocess.CompletedProcess:
    """Run shell command and return result"""
    try:
        result = subprocess.run(
            cmd,
            check=True,
            capture_output=capture_output,
            text=True,
            input=input_data
        )
        return result
    except subprocess.CalledProcessError as e:
        print_colored(f"✗ Command failed: {' '.join(cmd)}", Colors.RED)
        print_colored(f"Error: {e.stderr if capture_output else str(e)}", Colors.RED)
        sys.exit(1)


def list_snapshots(backups_dir: Path):
    """List available snapshots"""
    print_colored("Available snapshots:", Colors.YELLOW)
    if not backups_dir.exists():
        print("  (none found)")
        return
    
    snapshots = [d for d in backups_dir.iterdir() if d.is_dir()]
    if not snapshots:
        print("  (none found)")
        return
    
    for snapshot in sorted(snapshots):
        metadata_file = snapshot / "metadata.json"
        if metadata_file.exists():
            metadata = json.loads(metadata_file.read_text())
            created = metadata.get('created_at', 'unknown')
            size_mb = metadata.get('total_size_bytes', 0) / (1024 * 1024)
            print(f"  - {snapshot.name} (created: {created}, size: {size_mb:.1f} MB)")
        else:
            print(f"  - {snapshot.name}")


def confirm_restore(snapshot_name: str, non_interactive: bool = False) -> bool:
    """Ask user for confirmation"""
    if non_interactive:
        return True
    
    print()
    response = input(f"{Colors.YELLOW}This will REPLACE current data. Continue? [y/N]: {Colors.NC}")
    return response.lower() in ('y', 'yes')


def restore_database(snapshot_dir: Path, postgres_user: str, postgres_db: str, postgres_host: str):
    """Restore PostgreSQL database from compressed SQL file"""
    print_colored("[1/2] Restoring PostgreSQL database...", Colors.YELLOW)
    
    db_file_gz = snapshot_dir / "database.sql.gz"
    
    if not db_file_gz.exists():
        db_file = snapshot_dir / "database.sql"
        if not db_file.exists():
            print_colored("✗ Database file not found", Colors.RED)
            sys.exit(1)
        # Use uncompressed file
        sql_data = db_file.read_text(encoding='utf-8')
    else:
        # Decompress and read SQL
        with gzip.open(db_file_gz, 'rt', encoding='utf-8') as f:
            sql_data = f.read()
    
    # Restore database via psql (we're inside the container network)
    psql_cmd = [
        "psql",
        "-h", postgres_host,
        "-U", postgres_user,
        "-d", postgres_db
    ]
    
    # Set PGPASSWORD environment variable
    env = os.environ.copy()
    env['PGPASSWORD'] = get_env_variable("POSTGRES_PASSWORD", "postgres")
    
    try:
        subprocess.run(
            psql_cmd,
            check=True,
            capture_output=True,
            text=True,
            input=sql_data,
            env=env
        )
    except subprocess.CalledProcessError as e:
        print_colored(f"✗ psql failed: {e.stderr}", Colors.RED)
        sys.exit(1)
    
    print_colored("✓ Database restored", Colors.GREEN)


def restore_media(snapshot_dir: Path, media_target: Path):
    """Restore media files from compressed tar.gz archive or legacy uncompressed backup"""
    print_colored("[2/2] Restoring media files...", Colors.YELLOW)
    
    media_archive = snapshot_dir / "media.tar.gz"
    media_source = snapshot_dir / "media"
    
    # Check for compressed archive (new format)
    if media_archive.exists():
        # Backup existing media if it exists (copy, don't move)
        if media_target.exists() and any(media_target.iterdir()):
            backup_timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_dir = media_target.parent / f"media.backup.{backup_timestamp}"
            print(f"Backing up existing media to {backup_dir.name}...")
            shutil.copytree(media_target, backup_dir)
            
            # Clear existing media files
            for item in media_target.iterdir():
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
        
        # Extract tar.gz archive
        with tarfile.open(media_archive, "r:gz") as tar:
            # Extract to parent directory (archive contains "media/" folder)
            # Use data filter for Python 3.12+ compatibility
            tar.extractall(path=media_target.parent, filter='data')
        
        # Count files
        file_count = len([f for f in media_target.rglob('*') if f.is_file()])
        print_colored(f"✓ Restored {file_count} media files from compressed archive", Colors.GREEN)
        
        return file_count
    
    # Fallback: Check for legacy uncompressed format
    elif media_source.exists():
        print_colored("⚠ Using legacy uncompressed backup format", Colors.YELLOW)
        
        # Backup existing media if it exists (copy, don't move)
        if media_target.exists() and any(media_target.iterdir()):
            backup_timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            backup_dir = media_target.parent / f"media.backup.{backup_timestamp}"
            print(f"Backing up existing media to {backup_dir.name}...")
            shutil.copytree(media_target, backup_dir)
            
            # Clear existing media files
            for item in media_target.iterdir():
                if item.is_file():
                    item.unlink()
                elif item.is_dir():
                    shutil.rmtree(item)
        
        # Create target directory if needed
        media_target.mkdir(parents=True, exist_ok=True)
        
        # Copy media files
        file_count = 0
        for item in media_source.rglob('*'):
            if item.is_file():
                # Preserve directory structure
                rel_path = item.relative_to(media_source)
                dest_file = media_target / rel_path
                dest_file.parent.mkdir(parents=True, exist_ok=True)
                
                shutil.copy2(item, dest_file)
                file_count += 1
        
        print_colored(f"✓ Restored {file_count} media files", Colors.GREEN)
        
        return file_count
    
    else:
        print_colored("⚠ No media files in snapshot, skipping", Colors.YELLOW)
        return 0


def main():
    """Main restore function"""
    # Parse arguments
    if len(sys.argv) < 2:
        print_colored("Error: Snapshot name required", Colors.RED)
        print()
        print("Usage: python restore.py <snapshot_name> [--non-interactive]")
        print()
        
        # List available snapshots
        project_root = Path(__file__).parent.parent.parent
        backups_dir = project_root / "backups" / "snapshots"
        list_snapshots(backups_dir)
        sys.exit(1)
    
    snapshot_name = sys.argv[1]
    non_interactive = "--non-interactive" in sys.argv or "-y" in sys.argv
    
    # Setup paths (inside container)
    project_root = Path("/app")
    backups_dir = project_root / "backups" / "snapshots"
    snapshot_dir = backups_dir / snapshot_name
    media_target = project_root / "media"  # Mounted from ./data/media
    
    # Validate snapshot exists
    if not snapshot_dir.exists():
        print_colored(f"Error: Snapshot '{snapshot_name}' not found", Colors.RED)
        print(f"Location: {snapshot_dir}")
        print()
        list_snapshots(backups_dir)
        sys.exit(1)
    
    print_colored("=== AKI Sprachtraining Restore ===", Colors.GREEN)
    print(f"Snapshot: {snapshot_name}")
    print(f"Location: {snapshot_dir}")
    print()
    
    # Show metadata if available
    metadata_file = snapshot_dir / "metadata.json"
    if metadata_file.exists():
        metadata = json.loads(metadata_file.read_text())
        print_colored("Snapshot Information:", Colors.YELLOW)
        for key in ['snapshot_name', 'created_at', 'media_files_count']:
            if key in metadata:
                print(f"  {key}: {metadata[key]}")
        print()
    
    # Confirm restore
    if not confirm_restore(snapshot_name, non_interactive):
        print("Restore cancelled")
        sys.exit(0)
    
    # Get environment variables
    postgres_user = get_env_variable("POSTGRES_USER", "postgres")
    postgres_db = get_env_variable("POSTGRES_DB", "speech_training")
    postgres_host = get_env_variable("POSTGRES_HOST", "postgres_timescale_pg_vector")
    
    try:
        # Restore database
        restore_database(snapshot_dir, postgres_user, postgres_db, postgres_host)
        
        # Restore media files
        file_count = restore_media(snapshot_dir, media_target)
        
        # Success message
        print()
        print_colored("=== Restore Complete ===", Colors.GREEN)
        print()
        print("Next steps:")
        print("  1. Restart backend: docker compose restart backend")
        print("  2. Verify data in application")
        
    except Exception as e:
        print_colored(f"\n✗ Restore failed: {str(e)}", Colors.RED)
        sys.exit(1)


if __name__ == "__main__":
    main()
