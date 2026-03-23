"""
HackHunt ingestion pipeline runner.

Works in both local dev (`Hackathon_FInder/app/`) and CI (repo root == app/).
"""

from pathlib import Path
import sys

# The script lives at <root>/scripts/run_ingestion.py
# We need <root> on sys.path so Python can resolve `ingestion.*` imports.
SCRIPT_DIR = Path(__file__).resolve().parent          # …/scripts/
REPO_ROOT = SCRIPT_DIR.parent                         # …/app/ (or repo root in CI)

if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

# Also add the *parent* of REPO_ROOT so that `app.ingestion.*` works locally
# (where the folder structure is  `Hackathon_FInder/app/ingestion/…`).
PARENT_OF_ROOT = REPO_ROOT.parent
if str(PARENT_OF_ROOT) not in sys.path:
    sys.path.insert(0, str(PARENT_OF_ROOT))

# Try the canonical `app.ingestion.pipeline` import first (local dev),
# fall back to `ingestion.pipeline` (CI / GitHub Actions).
try:
    from app.ingestion.pipeline import main
except ModuleNotFoundError:
    from ingestion.pipeline import main  # type: ignore[no-redef]


if __name__ == "__main__":
    main()
