#!/usr/bin/env python3
"""Cópia do banco só para o build, sem dados pessoais nem credenciais: o contexto do build vai para o cache do builder."""
import sqlite3, sys

LIMPEZA = [
    "DELETE FROM leads",
    "DELETE FROM subscriptions",
    "DELETE FROM capi_event_log",
    "DELETE FROM login_attempts",
    "DELETE FROM social_accounts",
    "DELETE FROM social_scheduled_posts",
    "DELETE FROM social_published_posts",
    "DELETE FROM social_insights_daily",
    "DELETE FROM social_audience",
    "DELETE FROM ads_accounts",
    "DELETE FROM ads_campaigns",
    "DELETE FROM ads_action_log",
    "DELETE FROM cupons",
    "DELETE FROM settings WHERE key LIKE '%secret%'",
    # Autor dos posts continua: as páginas mostram nome, bio e avatar
    "UPDATE users SET password_hash = '', email = 'autor' || id || '@invalido.test', social_links = social_links",
]

origem, destino = sys.argv[1], sys.argv[2]
a = sqlite3.connect(f"file:{origem}?mode=ro", uri=True)
b = sqlite3.connect(destino)
a.backup(b)
a.close()
for sql in LIMPEZA:
    b.execute(sql)
b.commit()
# Sem o VACUUM os dados apagados continuariam nas páginas livres do arquivo
b.execute("VACUUM")
b.close()
