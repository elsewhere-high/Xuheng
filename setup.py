"""Include the public runtime resources in installed wheels."""
from pathlib import Path

from setuptools import setup

files_by_directory: dict[str, list[str]] = {}
for folder in ("data", "contracts"):
    for file in sorted(Path(folder).rglob("*")):
        if file.is_file():
            destination = (Path("share/xuheng") / file.parent).as_posix()
            files_by_directory.setdefault(destination, []).append(file.as_posix())

setup(data_files=list(files_by_directory.items()))
