#!/usr/bin/env python3
"""
Quick deployment check for SubtitleLingo HuggingFace Spaces
"""

import os
from pathlib import Path

def check_structure():
    """Check required files and directories"""
    print("SubtitleLingo Deployment Check")
    print("=" * 40)

    required_files = [
        'app.py',
        'requirements.txt',
        'README.md',
        'config/settings.py',
        'utils/opensubtitles.py',
        'utils/subtitle_parser.py',
        'utils/turso_client.py',
        'api_handlers/movies.py',
        'api_handlers/subtitles.py',
        'api_handlers/analysis.py'
    ]

    required_dirs = [
        'config',
        'utils',
        'api_handlers'
    ]

    print("Checking directories...")
    for dir_path in required_dirs:
        if os.path.isdir(dir_path):
            print(f"[OK] {dir_path}")
        else:
            print(f"[MISSING] {dir_path}")

    print("\nChecking files...")
    for file_path in required_files:
        if os.path.isfile(file_path):
            print(f"[OK] {file_path}")
        else:
            print(f"[MISSING] {file_path}")

    print("\nDeployment check complete!")

if __name__ == "__main__":
    check_structure()