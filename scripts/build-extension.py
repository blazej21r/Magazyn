#!/usr/bin/env python3
"""Pakuje folder extension/ do mymagazine-vinted.zip (plik „Pobierz wtyczkę” w Ustawieniach aplikacji).

Uruchom z katalogu głównego repozytorium po każdej zmianie wtyczki:
    python3 scripts/build-extension.py
"""
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / 'extension'
OUT = ROOT / 'mymagazine-vinted.zip'

with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as zf:
    for path in sorted(SRC.rglob('*')):
        if path.is_file():
            # Stały znacznik czasu — ta sama zawartość daje identyczny plik ZIP
            info = zipfile.ZipInfo(f'mymagazine-vinted/{path.relative_to(SRC).as_posix()}', date_time=(2026, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            zf.writestr(info, path.read_bytes())

print(f'Zapisano {OUT.relative_to(ROOT)}')
