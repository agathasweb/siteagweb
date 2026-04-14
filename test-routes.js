const http = require('http');
const routes = ['/servicos','/servicos/moodle','/servicos/desenvolvimento','/servicos/trafego-pago','/servicos/consultoria','/produtos','/produtos/hospedagem-moodle','/produtos/hospedagem-gerenciada','/produtos/voyia','/produtos/sga','/quem-somos','/contato','/blog','/privacidade','/termos','/politica-cookies'];
let done = 0;
routes.forEach(r => {
  http.get('http://localhost:3001'+r, res => {
    console.log(res.statusCode, r);
    if(++done === routes.length) process.exit(0);
  }).on('error', e => {
    console.log('ERR', r, e.message);
    if(++done === routes.length) process.exit(1);
  });
});
