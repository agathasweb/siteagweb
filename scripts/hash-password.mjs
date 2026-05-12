#!/usr/bin/env node
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const ROUNDS = 12;

async function main() {
  const fromArg = process.argv[2];
  let password = fromArg;

  if (!password) {
    const rl = createInterface({ input: stdin, output: stdout });
    password = (await rl.question("Senha do admin: ")).trim();
    rl.close();
  }

  if (!password || password.length < 8) {
    console.error("Senha precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, ROUNDS);
  console.log("\nHash gerado (copie para ADMIN_PASSWORD_HASH no .env):\n");
  console.log(hash);
  console.log();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
