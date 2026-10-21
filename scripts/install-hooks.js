#!/usr/bin/env node
// Instala o gancho do Git que grava uma versão nova em version.json a cada commit.
// O jogo publicado carrega os arquivos com "?v=versão" (o navegador não usa cópias antigas) e o menu oferece
// o botão "Atualizar". Rode uma vez em cada máquina, depois de clonar: node scripts/install-hooks.js
'use strict';
const fs = require('fs'), path = require('path');

const hook = path.join(__dirname, '..', '.git', 'hooks', 'pre-commit');
if (!fs.existsSync(path.dirname(hook))) { console.error('✖ Não achei a pasta .git/hooks: rode dentro do repositório.'); process.exit(1); }
fs.writeFileSync(hook, `#!/bin/sh
# grava uma versão nova a cada commit (instalado por scripts/install-hooks.js)
printf '{"version":"%s"}' "$(date +%Y%m%d-%H%M%S)" > version.json
git add version.json
`, { mode: 0o755 });
console.log('✔ Gancho instalado: cada commit grava uma versão nova em version.json.');
