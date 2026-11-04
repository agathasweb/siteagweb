#!/usr/bin/env python3
"""Gera deploy/.env.runtime a partir do .env.local, com os valores que o Next enxergaria: sem aspas e com \\$ virando $."""
import os, re, sys

origem, destino = sys.argv[1], sys.argv[2]
linhas = []
for bruta in open(origem, encoding="utf8"):
    m = re.match(r"^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)=(.*)$", bruta.rstrip("\n"))
    if not m:
        continue
    chave, valor = m.group(1), m.group(2).strip()
    if len(valor) >= 2 and valor[0] == valor[-1] and valor[0] in "\"'":
        valor = valor[1:-1]
    else:
        valor = re.sub(r"\s+#.*$", "", valor)
    linhas.append(f"{chave}={valor.replace(chr(92) + '$', '$')}\n")
fd = os.open(destino, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
with os.fdopen(fd, "w", encoding="utf8") as f:
    f.writelines(linhas)
