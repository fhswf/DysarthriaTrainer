import hashlib
import os
import urllib.request
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse, ParseResult
from pathlib import Path


def checkpoint_cache_path(
    checkpoint_file: str | os.PathLike,
    checkpoint_url: str,
) -> Path:
    path = Path(checkpoint_file)

    url_hash = hashlib.sha256(
        checkpoint_url.encode("utf-8")
    ).hexdigest()[:12]

    return path.with_name(
        f"{path.stem}_{url_hash}{path.suffix}"
    )


def ensure_file_exists(file: str | os.PathLike, url: str, force_download: bool = False):
    """Ensure that a file exists at the specified path. If not, download it from the given URL."""
    if Path(file).is_file() and not force_download:
        return
    # File does not exist or force download is requested.
    download_file(file, url)


def download_file(filepath: str | os.PathLike, url: str, timeout: int | None = None) -> None:
    """Download a file from a URL to a specified local filepath."""
    result: ParseResult = urlparse(url)
    if not all([result.scheme, result.netloc, result.path]):
        raise ValueError(f"Invalid URL {url!r}: malformed URL")
    try:
        Path(filepath).parent.mkdir(parents=True, exist_ok=True)
        # TODO: Timeout handling
        urllib.request.urlretrieve(url=url, filename=filepath)
    # handle network/download errors (e.g., 404, DNS failure, refused connection, etc.)
    except (HTTPError, URLError) as e:
        if (path := Path(filepath)).exists():
            path.unlink(missing_ok=True)
        raise RuntimeError(f"Failed to download file from {url!r}: {e}")
    # handle file system errors (e.g., permission issues, disk full, etc.)
    except OSError as e:
        raise RuntimeError(f"Failed to save downloaded file to {filepath!r}: {e}")
