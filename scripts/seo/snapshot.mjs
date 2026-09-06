#!/usr/bin/env node
// Baixa uma cópia somente-leitura do banco de PRODUÇÃO para data/prod-snapshot.db,
// que é o que as ferramentas de SEO leem (pauta, review, canibalização).
//
// Uso: node scripts/seo/snapshot.mjs
//
// Lê host/usuário/porta/chave do próprio deploy.sh, para não duplicar config.
// Não escreve nada em produção: usa sqlite3 backup API em modo readonly e
// remove o arquivo temporário do servidor no fim.

import { execFileSync } from "node:child_process";
import { readFileSync, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { REPO } from "./db.mjs";

function fromDeploy(nome, padrao) {
  try {
    const sh = readFileSync(join(REPO, "deploy.sh"), "utf8");
    const m = sh.match(new RegExp(`^${nome}="?([^"\\n]+)"?`, "m"));
    return m ? m[1].replace("$HOME", homedir()) : padrao;
  } catch {
    return padrao;
  }
}

const USER = fromDeploy("PROD_USER", "root");
const HOST = fromDeploy("PROD_HOST", "");
const PORT = fromDeploy("PROD_PORT", "22");
const BASE = fromDeploy("PROD_BASE", "/home/agweb/web/agathas.com.br").replace("$PROD_DOMAIN", fromDeploy("PROD_DOMAIN", "agathas.com.br"));
const KEY = fromDeploy("SSH_KEY", join(homedir(), ".ssh", "id_hostinger_vps"));

const REMOTO = `${BASE}/private/data/agathas.db`;
const TMP_REMOTO = "/tmp/agathas-seo-snapshot.db";
const DESTINO = join(REPO, "data", "prod-snapshot.db");

if (!HOST) {
  console.error("✗ PROD_HOST não encontrado no deploy.sh.");
  process.exit(1);
}
if (!existsSync(KEY)) {
  console.error(`✗ Chave SSH não encontrada: ${KEY}`);
  process.exit(1);
}

const SSH = ["-p", PORT, "-i", KEY, "-o", "IdentitiesOnly=yes", "-o", "ConnectTimeout=15"];

// O backup precisa incluir o WAL — por isso a API de backup do sqlite, e não um cp.
const PY = `python3 -c "
import sqlite3
o=sqlite3.connect('file:${REMOTO}?mode=ro',uri=True)
d=sqlite3.connect('${TMP_REMOTO}')
o.backup(d); d.close(); o.close()
"`;

console.log(`Copiando banco de produção (${USER}@${HOST})...`);
try {
  execFileSync("ssh", [...SSH, `${USER}@${HOST}`, PY], { stdio: "inherit" });
  execFileSync("scp", ["-P", PORT, "-i", KEY, "-o", "IdentitiesOnly=yes", `${USER}@${HOST}:${TMP_REMOTO}`, DESTINO], {
    stdio: "inherit",
  });
  execFileSync("ssh", [...SSH, `${USER}@${HOST}`, `rm -f ${TMP_REMOTO}`], { stdio: "inherit" });
} catch (err) {
  console.error(`✗ Falha ao copiar o banco: ${err.message}`);
  process.exit(1);
}

const mb = (statSync(DESTINO).size / 1024 / 1024).toFixed(1);
console.log(`✓ data/prod-snapshot.db atualizado (${mb} MB) — ${new Date().toLocaleString("pt-BR")}`);
