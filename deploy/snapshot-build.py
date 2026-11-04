#!/usr/bin/env python3
"""Cópia do banco só para o build, com conteúdo público: o contexto do build passa pelo cache do builder.
Lista de permissão: tabela ou configuração que não estiver aqui vai vazia, inclusive as criadas no futuro."""
import sqlite3, sys

TABELAS_PUBLICAS = {
    "categories", "category_translations", "tags", "posts", "post_translations", "post_tags",
    "post_images", "post_image_translations", "post_faqs", "post_faq_translations", "settings", "users",
}
# Tabelas internas da busca (FTS) dos posts
PREFIXOS_INTERNOS = ("post_translations_fts",)
CONFIGURACOES_PUBLICAS = ["leads.qualification_mode", "recaptcha.site_key", "ui.floating_whatsapp_enabled"]
# Autor dos posts continua: as páginas mostram nome, bio e avatar
AJUSTES = ["UPDATE users SET password_hash = '', email = 'autor' || id || '@invalido.test'"]

origem, destino = sys.argv[1], sys.argv[2]
a = sqlite3.connect(f"file:{origem}?mode=ro", uri=True)
b = sqlite3.connect(destino)
a.backup(b)
a.close()
tabelas = [r[0] for r in b.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'")]
for t in tabelas:
    if t not in TABELAS_PUBLICAS and not t.startswith(PREFIXOS_INTERNOS):
        b.execute(f'DELETE FROM "{t}"')
marcas = ",".join("?" * len(CONFIGURACOES_PUBLICAS))
b.execute(f"DELETE FROM settings WHERE key NOT IN ({marcas})", CONFIGURACOES_PUBLICAS)
for sql in AJUSTES:
    b.execute(sql)
b.commit()
# Sem o VACUUM os dados apagados continuariam nas páginas livres do arquivo
b.execute("VACUUM")
b.close()
