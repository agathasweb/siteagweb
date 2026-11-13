#!/usr/bin/env python3
"""Monta os HTML-fonte das peças (um arquivo por peça) a partir dos blocos abaixo.
Uso: python3 montar.py && ./render.sh   (os .html gerados ficam versionados aqui em src/)"""
import os
AQUI = os.path.dirname(os.path.abspath(__file__))
CROWN = '<svg class="crown" viewBox="0 0 40 34"><path d="M3 9l9 8 8-13 8 13 9-8-3 18H6z" fill="#d4a72c"/><rect x="6" y="29" width="28" height="4" rx="1.5" fill="#d4a72c"/><circle cx="3" cy="8" r="3" fill="#d4a72c"/><circle cx="20" cy="3" r="3" fill="#d4a72c"/><circle cx="37" cy="8" r="3" fill="#d4a72c"/></svg>'
ILUS = '<div class="ilus">Imagem ilustrativa · dados fictícios</div>'
OFERTA_L = '<div class="oferta-l">30% de desconto nos 3 primeiros meses<br>para quem começar até 31/12</div>'
ESCOLA = 'Colégio Vila Aurora'

def pagina(arq, eyebrow, h1, sub, stage, cta='Teste grátis por 7 dias', h1c='', n='', ilus=True, oferta=True, stage_style='', arr=False):
    r = '../' if '/' in arq else ''
    direita = f'<div class="arr">arraste →</div>' if arr else (f'<div class="btn">{cta}</div>' if cta else '')
    html = f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&family=Caveat:wght@600&display=block" rel="stylesheet"><link rel="stylesheet" href="{r}base.css"><link rel="stylesheet" href="{r}pecas.css"></head><body><div class="wrap">
<div class="eyebrow">{CROWN} {eyebrow}{f'<span class="n">{n}</span>' if n else ''}</div>
<h1 class="{h1c}">{h1}</h1>
{f'<p class="sub">{sub}</p>' if sub else ''}
<div class="stage" style="{stage_style}">
{stage.replace('IMG/', r + 'img/')}
</div>
{ILUS if ilus else ''}
<div class="foot"><div class="brand">{CROWN} Salomão <span>· app da escola</span>{OFERTA_L if oferta else ''}</div>{direita}</div></div></body></html>
'''
    with open(os.path.join(AQUI, arq), 'w') as f:
        f.write(html)

def app_top(nome=ESCOLA, logo='🌅', cor='#1f2b44'):
    return f'<div class="ah" style="--c:{cor}"><div class="lg">{logo}</div>{nome}<div class="mn"></div></div>'

NAV = lambda on='Avisos': '<div class="nav">' + ''.join(
    f'<div class="{"on" if t == on else ""}"><i>{i}</i>{t}</div>' for i, t in
    [('🏠', 'Início'), ('📖', 'Tarefas'), ('📄', 'Boletim'), ('🍔', 'Cantina'), ('📢', 'Avisos'), ('🚪', 'Portaria')]) + '</div>'

def aviso_fixo(extra=''):
    return f'''<div class="ac"><span class="fix">📌 Fixo até 16/11</span><h5>🚌 Passeio ao zoológico</h5><p>Sexta-feira, saída às 8h e volta às 12h. Levar lanche, água e boné.</p><small>Hoje, 07:42 · Turma 3º ano A</small>{extra}</div>'''

def fone_aviso(push=True, cor='#1f2b44', nome=ESCOLA, logo='🌅', w=400):
    p = f'<div class="push" style="--c:{cor}"><div class="ic">{logo}</div><div><small>{nome} · agora</small><b>📢 Passeio ao zoológico</b><span>Sexta, saída às 8h. Toque para ler.</span></div></div>' if push else ''
    return f'''<div class="phone" style="width:{w}px;--c:{cor}">{app_top(nome, logo, cor)}{p}<div class="ab">
{aviso_fixo()}
<div class="ac"><h5>👥 Reunião de pais do 4º bimestre</h5><p>Sábado, às 9h, na sala de cada turma.</p><small>06/11 · Todas as famílias</small></div>
<div class="ac"><h5>🎉 Festa de encerramento</h5><p>Dia 12/12, às 18h, no pátio da escola.</p><small>05/11 · Todas as famílias</small></div>
</div>{NAV()}</div>'''

def rot(txt, cls, fone):
    return f'<div class="pw"><div class="rt {cls}">{txt}</div>{fone}</div>'

# ---------------------------------------------------------------- 3.1 avisos
pagina('A1-quem-leu.html', 'Avisos com leitura',
       'Quem leu o aviso? <em>Agora você sabe.</em>',
       'Cada aviso mostra quem abriu e leu. E o lembrete vai <b>só para quem falta.</b>',
       '''<div class="shot" style="width:936px"><img src="IMG/quem-leu.png"></div>
<div class="callout" style="left:150px;bottom:-6px">✅ <span><b>23 de 25</b> famílias leram</span></div>''')

chat = '''<div class="phone" style="width:400px"><div class="chat"><div class="ch">Pais · 3º ano A<small>38 participantes · 214 mensagens não lidas</small></div>
<div class="bb"><u>Mãe do Davi</u>Bom dia 🌞🌞</div>
<div class="bb"><u>Pai da Laura</u>Alguém sabe se tem aula amanhã?</div>
<div class="bb r">Bom diaaa</div>
<div class="bb x"><u>Secretaria</u>AVISO: passeio na sexta, saída às 8h</div>
<div class="bb"><u>Mãe do Theo</u>kkkkkk</div>
<div class="bb"><u>Vó da Helena</u>Quem achou um casaco azul?</div>
<div class="bb r">Qual o valor do passeio??</div>
<div class="bb"><u>Pai do Gael</u>Que passeio? 😳</div>
<div class="bb"><u>Mãe da Alice</u>Bom dia grupo 🙏</div>
<div class="bb"><u>Mãe do Davi</u>Tem aula sexta?</div>
<div class="bb r">Alguém tem a lista de material?</div>
</div></div>'''
pagina('A2-sumiu-no-grupo.html', 'Avisos da escola',
       'O recado <em>sumiu no grupo</em> de novo?',
       'No app, o aviso chega como notificação, fica fixo no topo e <b>a escola vê quem abriu e leu.</b>',
       rot('ANTES · no grupo', 'a', chat) + rot('DEPOIS · no app da escola', 'd', fone_aviso()))

papel = '''<div style="flex:1;position:relative;display:flex;align-items:center;justify-content:center">
<div style="width:390px;height:440px;transform:rotate(-7deg);filter:drop-shadow(0 22px 26px rgba(0,0,0,.45))">
<div style="width:100%;height:100%;clip-path:polygon(2% 4%,30% 0,62% 3%,98% 1%,100% 34%,96% 66%,99% 97%,66% 100%,34% 96%,3% 99%,0 62%,4% 30%);
background:linear-gradient(118deg,transparent 0 31%,rgba(0,0,0,.09) 31.4%,transparent 34%),linear-gradient(64deg,transparent 0 55%,rgba(255,255,255,.75) 55.4%,rgba(0,0,0,.07) 57%,transparent 60%),linear-gradient(170deg,transparent 0 44%,rgba(0,0,0,.08) 44.5%,transparent 48%),linear-gradient(20deg,transparent 0 70%,rgba(0,0,0,.07) 70.5%,transparent 74%),linear-gradient(95deg,transparent 0 22%,rgba(255,255,255,.6) 22.5%,rgba(0,0,0,.05) 24%,transparent 27%),#ece4cb;
padding:44px 38px;color:#3a3f4d;font-family:'Caveat',cursive;font-size:35px;line-height:1.18">
<div style="font-family:Poppins;font-size:17px;font-weight:700;letter-spacing:3px;color:#6b7080;margin-bottom:14px">COMUNICADO</div>
Srs. pais,<br>sexta-feira teremos passeio ao zoológico.<br>Saída às 8h.<br>Levar lanche, água e boné.<br><span style="font-size:28px">A coordenação</span></div></div>
<div class="callout" style="left:6px;bottom:16px;font-size:25px;padding:16px 22px;transform:rotate(3deg)">🎒 <span>Achado <b>5 dias depois</b></span></div>
</div>'''
pagina('A3-bilhete-na-mochila.html', 'Avisos da escola',
       'O bilhete <em>voltou na mochila</em> sem ninguém ver.',
       'Papel se perde. O aviso no app chega na hora: para todas as famílias, uma turma ou um aluno.',
       papel + fone_aviso(), h1c='m')

grupos = ''.join(f'<div class="gl"><div class="g">👥</div><div>{g}<small>{m}</small></div><span class="q">{q}</span></div>' for g, m, q in [
    ('Pais · 1º ano A', 'Prof, pode falar agora?', '47'), ('Pais · 2º ano A', 'Bom dia 🌞', '112'), ('Pais · 3º ano A', 'Qual o valor do passeio?', '214'),
    ('Pais · 4º ano A', 'Prof, viu minha mensagem?', '63'), ('Pais · 5º ano A', 'kkkkk', '89'), ('Recados 3º ano', 'Áudio (2:14)', '31'),
    ('Reforço · tarde', 'Tem aula hoje?', '18'), ('Festa junina 2026', 'Figurinha', '140'), ('Mães do 3º ano', 'Bom dia grupo', '76'), ('Formatura 5º ano', 'Foto', '25')])
pagina('A4-12-grupos.html', 'Avisos da escola',
       '<em>Seu número</em> não precisa estar em 12 grupos.',
       'O aviso sai da escola, pelo app da escola, <b>com o nome da escola.</b>',
       rot('ANTES · 12 grupos', 'a', f'''<div class="phone" style="width:400px"><div class="chat"><div class="ch">Conversas<small>Celular pessoal da professora · 22h47</small></div>{grupos}</div></div>''') + rot('DEPOIS · app da escola', 'd', fone_aviso(push=False)),
       h1c='m')

paraquem = ''.join(f'<div class="chip {"on" if i == 1 else ""}" style="font-size:27px;padding:12px 24px;white-space:nowrap;{"" if i == 1 else "border-color:#d5dae4;color:#1f2b44"}">{t}</div>' for i, t in enumerate(
    ['Todas as famílias', 'Uma turma', 'Alunos escolhidos', 'Professores e gestão', 'Escola inteira']))
pagina('A5-turma-certa.html', 'Avisos com leitura',
       'Avisou a <em>turma certa</em>?',
       'Um aviso para todos, outro só para o 3º ano, outro só para os professores. <b>Você escolhe quem recebe.</b>',
       f'''<div class="col" style="justify-content:flex-start;gap:26px"><div class="shot" style="width:936px"><img src="IMG/form-aviso.png"></div>
<div class="big"><h4>Para quem vai este aviso?</h4><div class="chips" style="gap:12px">{paraquem}</div></div></div>''', ilus=False)

# ---------------------------------------------------------------- 3.2 carrossel "Tudo num app só"
T = 'carrossel-tudo/'
EB = 'Tudo num app só'
tiles = ''.join(f'<div class="tile"><i>{i}</i><span><b>{k}</b> {t}</span></div>' for k, (i, t) in enumerate(
    [('📺', 'Portaria com TV'), ('🍔', 'Cantina sem dinheiro'), ('📢', 'Avisos com leitura'), ('📝', 'Notas e frequência'), ('💰', 'Financeiro'), ('📱', 'App com a sua marca')], 1))
pagina(T + '01-capa.html', EB, '6 coisas que a sua escola faz <em>num app só</em>', '(e com a marca dela)',
       f'<div class="grid6" style="grid-auto-rows:1fr;align-content:stretch;margin-bottom:20px">{tiles}</div>', n='1/8', ilus=False, oferta=False, arr=True)
pagina(T + '02-portaria.html', EB, '<em>1.</em> Portaria com TV',
       'O pai avisa que chegou, <b>a TV chama o aluno pelo nome</b> e fica o registro de quem buscou.',
       '<div class="tv" style="width:936px"><img src="IMG/tv-portaria.png"></div><div class="callout" style="right:30px;top:560px">🔊 <span>“Júlia, <b>3º ano A</b>”</span></div>', n='2/8', oferta=False, arr=True, stage_style='margin-top:90px')

def fone_cantina(w=400, encomenda=False):
    lanches = '''<div class="ac"><h5>Lanches encomendados</h5>
<div style="display:flex;justify-content:space-between;font-size:15px;padding-top:10px"><span><b>Sex, 13/11</b><br><span style="color:#5d6679">Pão de queijo + suco natural</span></span><b>R$ 9,50</b></div></div>'''
    extrato = '''<div class="ac"><h5>Extrato</h5>
<div style="display:flex;justify-content:space-between;font-size:15px;padding:9px 0;border-bottom:1px solid #eef0f4"><span>Hoje · Pão de queijo, água</span><b style="color:#d93a3a">−R$ 7,00</b></div>
<div style="display:flex;justify-content:space-between;font-size:15px;padding:9px 0;border-bottom:1px solid #eef0f4"><span>Ontem · Salada de frutas</span><b style="color:#d93a3a">−R$ 7,00</b></div>
<div style="display:flex;justify-content:space-between;font-size:15px;padding:9px 0"><span>Seg · Crédito por PIX</span><b style="color:#16a34a">+R$ 50,00</b></div></div>'''
    return f'''<div class="phone" style="width:{w}px">{app_top()}<div class="ab">
<div class="kid"><div class="i">PM</div><div><span>Mãe de</span><b>Pedro Henrique M.</b><span>3º ano A · 8 anos</span></div></div>
<div class="ac"><small style="font-size:14px">Crédito na cantina</small><div style="font-size:38px;font-weight:800;color:#16a34a;letter-spacing:-1px">R$ 68,50</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px"><div class="b1">📅 Encomendar</div><div class="b2">＋ Colocar crédito</div></div></div>
{lanches + extrato if encomenda else extrato + lanches}
</div>{NAV('Cantina')}</div>'''

pagina(T + '03-cantina.html', EB, '<em>2.</em> Cantina sem dinheiro',
       'Crédito no app, <b>PIX que entra sozinho</b> e lanche encomendado pela família.',
       fone_cantina() + '''<div class="col">
<div class="big"><h4>✅ PIX recebido</h4><div style="font-size:44px;font-weight:800;color:#16a34a">+R$ 50,00</div><div style="font-size:21px;color:#5d6679;margin-top:4px">O crédito entrou sozinho.</div></div>
<div class="big"><h4>🍔 Compra na cantina</h4><div class="ln"><span>Pão de queijo</span><b>R$ 4,00</b></div><div class="ln"><span>Água</span><b>R$ 3,00</b></div><div class="ln"><span>Saldo depois</span><b style="color:#16a34a">R$ 68,50</b></div></div>
</div>''', n='3/8', oferta=False, arr=True)
pagina(T + '04-avisos.html', EB, '<em>3.</em> Avisos com leitura',
       'A família abre o aviso e <b>você vê quem leu.</b> O lembrete vai só para quem falta.',
       '''<div class="shot" style="width:936px"><img src="IMG/quem-leu.png"></div>
<div class="callout" style="left:22px;top:392px;font-size:25px;padding:18px 22px;gap:12px">🔔 <span>Lembrar <b>só quem falta</b></span></div>''', n='4/8', oferta=False, arr=True, stage_style='margin-top:110px')
pagina(T + '05-notas-frequencia.html', EB, '<em>4.</em> Notas e frequência',
       'O professor lança pelo celular e <b>a família acompanha no app.</b>',
       rot('Professor', 'd', '<div class="phone" style="width:400px"><img src="IMG/app-chamada.png"></div>') +
       rot('Família', 'd', '<div class="phone" style="width:400px"><img src="IMG/app-boletim.png"></div>'), n='5/8', oferta=False, arr=True)
pagina(T + '06-financeiro.html', EB, '<em>5.</em> Financeiro de verdade',
       'Recebimentos, despesas e saldo projetado. <b>Lembrete de vencimento automático.</b>',
       '''<div class="shot" style="width:936px"><div style="height:372px;overflow:hidden"><img src="IMG/financeiro.png" style="width:1440px;margin-top:-84px"></div>
<div style="height:106px;overflow:hidden;border-top:1px solid #e6e9ef"><img src="IMG/financeiro.png" style="width:936px;margin-top:-300px"></div></div>
<div class="callout" style="right:20px;top:505px">🔔 <span>Lembrete de vencimento <b>automático</b></span></div>''', n='6/8', oferta=False, arr=True, stage_style='margin-top:90px')

def fone_marca(nome, logo, cor, acento, w=290, crianca=('LS', 'Laura S.', '2º ano B')):
    return f'''<div class="phone" style="width:{w}px;border-radius:40px;border-width:10px;--c:{cor};--a:{acento}">
<div class="ah" style="font-size:15.5px;padding:22px 16px 14px;gap:9px"><div class="lg" style="width:30px;height:30px;font-size:16px">{logo}</div>{nome}</div>
<div class="ab" style="padding:12px">
<div class="kid" style="padding:11px 12px;gap:10px"><div class="i" style="width:40px;height:40px;font-size:15px">{crianca[0]}</div><div><span>Mãe de</span><b style="font-size:15px">{crianca[1]}</b><span>{crianca[2]}</span></div></div>
<div class="ac" style="padding:12px 13px;margin-bottom:10px"><h5 style="font-size:14.5px">📢 Passeio ao zoológico</h5><p style="font-size:12.5px">Sexta, saída às 8h.</p></div>
<div class="ac" style="padding:12px 13px;margin-bottom:10px"><small>Crédito na cantina</small><div style="font-size:24px;font-weight:800;color:{cor}">R$ 42,00</div></div>
<div class="ac" style="padding:12px 13px;margin-bottom:10px"><h5 style="font-size:14.5px">📄 Boletim</h5><p style="font-size:12.5px">Média geral 8,9</p></div>
<div class="ac" style="padding:12px 13px;margin-bottom:10px"><h5 style="font-size:14.5px">📖 Tarefas de casa</h5><p style="font-size:12.5px">1 para fazer</p></div>
<div style="background:{acento};color:{'#1f2b44' if acento in ('#d4a72c', '#f2b84b', '#f4c95d') else '#fff'};font-weight:700;text-align:center;border-radius:12px;padding:12px;font-size:14.5px">Buscar na saída</div>
</div><div class="nav" style="font-size:9.5px;padding:9px 4px 13px"><div><i style="font-size:16px">🏠</i>Início</div><div><i style="font-size:16px">📖</i>Tarefas</div><div><i style="font-size:16px">📄</i>Boletim</div><div><i style="font-size:16px">🍔</i>Cantina</div><div><i style="font-size:16px">📢</i>Avisos</div><div><i style="font-size:16px">🚪</i>Portaria</div></div></div>'''
TRES = (fone_marca('Colégio Vila Aurora', '🌅', '#7a2e3a', '#f2b84b') +
        fone_marca('Escola Ipê Dourado', '🌳', '#1d5c63', '#f4c95d', crianca=('TG', 'Theo G.', '4º ano A')) +
        fone_marca('Instituto Sabiá', '🐦', '#4a3b8f', '#e8734a', crianca=('HM', 'Helena M.', '1º ano A')))
pagina(T + '07-marca-da-escola.html', EB, '<em>6.</em> App com a marca da escola',
       'Nome, logo e cores da sua escola. <b>A nossa marca não aparece.</b>', TRES,
       n='7/8', oferta=False, arr=True, stage_style='gap:22px', h1c='m')
pagina(T + '08-fechamento.html', EB, '<em>R$ 249 por mês</em>', 'Tudo isso para até 250 alunos, com preço fixo.',
       '''<div class="col" style="gap:34px">
<div class="chk" style="font-size:50px"><i>✓</i>Teste grátis por 7 dias</div>
<div class="chk" style="font-size:50px"><i>✓</i>Garantia de 30 dias</div>
<div class="chk" style="font-size:50px"><i>✓</i>Migração gratuita</div>
<div class="oferta" style="margin-top:24px;font-size:40px;padding:30px 34px"><em>30% de desconto</em> nos 3 primeiros meses<small>Para quem começar até 31/12</small></div></div>''',
       n='8/8', ilus=False, oferta=False, h1c='xg')

# ---------------------------------------------------------------- 3.3 carrossel de preço
P = 'carrossel-preco/'
EP = 'Preço na página'
pagina(P + '01-quanto-custa.html', EP, 'Quanto custa um sistema para a <em>sua escola?</em>', '',
       '<div style="position:absolute;right:-30px;bottom:-60px;font-size:560px;font-weight:800;line-height:1;color:transparent;-webkit-text-stroke:5px rgba(212,167,44,.55)">?</div>',
       n='1/6', ilus=False, oferta=False, arr=True, h1c='xg')
pagina(P + '02-a-maioria-nao-diz.html', EP, 'A maioria <em>não diz.</em>', 'Você só descobre depois da reunião com o vendedor.',
       '''<div class="col" style="align-items:center"><div style="position:relative;background:#fff;color:#5d6679;border-radius:28px 28px 28px 6px;padding:44px 50px;font-size:52px;font-weight:600;line-height:1.25;max-width:860px;box-shadow:0 18px 40px rgba(0,0,0,.35)">“Agende uma reunião para saber o valor…”
<div style="position:absolute;left:-30px;right:-30px;top:50%;height:12px;border-radius:6px;background:#d93a3a;transform:rotate(-6deg)"></div></div></div>''',
       n='2/6', ilus=False, oferta=False, arr=True, h1c='g')
pagina(P + '03-o-nosso-esta-na-pagina.html', EP, 'O nosso está na página:', '',
       '''<div class="col" style="gap:8px"><div style="font-size:260px;font-weight:800;letter-spacing:-12px;line-height:1;color:#d4a72c">R$ 249</div>
<div style="font-size:84px;font-weight:700;letter-spacing:-3px">por mês</div>
<div style="font-size:48px;color:#c9cfdb;margin-top:14px">até 250 alunos</div></div>''',
       n='3/6', ilus=False, oferta=False, arr=True, h1c='m')
mods = ''.join(f'<div class="chip" style="font-size:38px;padding:16px 30px">{m}</div>' for m in ['Avisos', 'Portaria com TV', 'Cantina', 'Notas', 'Frequência', 'Financeiro'])
pagina(P + '04-por-aluno.html', EP, 'Isso dá a partir de <em>R$ 0,99 por aluno</em>', '',
       f'''<div class="col" style="gap:26px"><div style="font-size:58px;font-weight:700;letter-spacing:-1.5px">com 6 módulos:</div><div class="chips">{mods}</div>
<div style="font-size:29px;color:#9aa3b5;margin-top:10px">R$ 249 por mês ÷ 250 alunos = R$ 0,99 por aluno</div></div>''',
       n='4/6', ilus=False, oferta=False, arr=True, h1c='g')
pagina(P + '05-sem-pegadinha.html', EP, 'Preço fixo, <em>sem pegadinha</em>', '',
       '''<div class="col" style="gap:34px">
<div class="chk no" style="font-size:46px"><i>✕</i>Sem fidelidade</div>
<div class="chk no" style="font-size:46px"><i>✕</i>Sem taxa de implantação</div>
<div class="chk no" style="font-size:46px"><i>✕</i><span>Sem reajuste surpresa no 13º mês</span></div></div>''',
       n='5/6', ilus=False, oferta=False, arr=True, h1c='g')
pagina(P + '06-teste-gratis.html', EP, 'Teste grátis por 7 dias, <em>sem falar com vendedor.</em>', '',
       '''<div class="col" style="gap:26px"><div class="oferta"><em>30% de desconto</em> nos 3 primeiros meses<small>Para quem começar até 31/12</small></div>
<div class="chk" style="font-size:34px"><i>✓</i>R$ 249 por mês, até 250 alunos</div>
<div class="chk" style="font-size:34px"><i>✓</i>Garantia de 30 dias e migração gratuita</div></div>''',
       n='6/6', ilus=False, oferta=False, h1c='g', cta='Começar o teste grátis')

# ---------------------------------------------------------------- 3.4 white label
pagina('B1-app-da-sua-escola.html', 'App com a marca da escola',
       'O app é da <em>sua</em> escola. Não é o nosso.',
       'O pai abre e vê o nome, o logo e as cores da sua escola. <b>Já vem incluso.</b>',
       TRES, stage_style='gap:22px')

# ---------------------------------------------------------------- 3.5 portaria e cantina
pagina('P1-tv-chama.html', 'Portaria com TV',
       'A TV chama. A portaria libera. <em>Fica o registro.</em>',
       'O pai avisa pelo app que chegou e <b>a TV chama o aluno pelo nome.</b>',
       '''<div class="tv" style="width:936px;position:absolute;left:0;top:0"><img src="IMG/tv-portaria.png"></div>
<div class="phone" style="width:300px;border-radius:40px;border-width:10px;position:absolute;right:-14px;bottom:-10px;height:330px"><img src="IMG/app-portaria.png"></div>''',
       h1c='m', stage_style='gap:0')
linhas = ''.join(f'''<div style="display:grid;grid-template-columns:1.5fr 1.25fr .62fr .62fr .6fr;gap:10px;align-items:center;padding:17px 0;border-top:1px solid #eef0f4;font-size:21px">
<div><b style="font-weight:600">{a}</b><small style="display:block;font-size:15.5px;color:#7a8396">{t}</small></div><div>{r}<small style="display:block;font-size:15.5px;color:#7a8396">{p}</small></div><div>{h1}</div><div style="color:#16a34a;font-weight:600">{h2}</div><div><span style="background:#e3f5ea;color:#16803c;font-weight:700;border-radius:20px;padding:5px 12px;font-size:17px;white-space:nowrap">{e}</span></div></div>'''
                 for a, t, r, p, h1, h2, e in [
    ('Júlia A. Santos', '3º ano A', 'Priscila Santos', 'Mãe', '11:42', '11:45', '3 min'),
    ('Davi e Laura Rocha', '1º e 4º ano · irmãos', 'Marcos Rocha', 'Pai', '11:44', '11:46', '2 min'),
    ('Helena Machado', '2º ano A', 'Lúcia Machado', 'Avó', '11:47', '11:51', '4 min'),
    ('Theo Gomes', '5º ano A', 'Simone Gomes', 'Mãe', '11:50', '11:52', '2 min'),
    ('Alice Dias', '2º ano A', 'Juliana Dias', 'Mãe', '11:53', '11:57', '4 min')])
pagina('P2-quem-buscou.html', 'Portaria com TV',
       'Quem buscou o seu aluno <em>hoje?</em>',
       'Cada saída fica registrada: quem pediu, a que horas e quanto esperou. <b>Irmãos saem juntos.</b>',
       f'''<div class="big" style="width:936px;align-self:flex-start;padding:26px 30px 14px"><h4 style="display:flex;justify-content:space-between">Saídas de hoje <span style="font-size:17px;font-weight:500;color:#7a8396">Quarta, 11/11 · 5 liberadas</span></h4>
<div style="display:grid;grid-template-columns:1.5fr 1.25fr .62fr .62fr .6fr;gap:10px;font-size:15px;font-weight:600;color:#7a8396;padding:6px 0 10px;text-transform:uppercase;letter-spacing:1px"><div>Aluno</div><div>Quem buscou</div><div>Pedido</div><div>Liberado</div><div>Espera</div></div>{linhas}</div>
<div class="callout" style="right:24px;bottom:-4px;font-size:27px;padding:18px 26px">⏱ <span>Espera média hoje: <b>3 min</b></span></div>''')
pagina('C1-cantina-sem-troco.html', 'Cantina sem dinheiro',
       'Cantina <em>sem troco</em> e sem caderninho',
       'O pai põe crédito por PIX, o valor entra sozinho e <b>a família vê o que o aluno comeu.</b>',
       fone_cantina() + '''<div class="col">
<div class="big"><h4>✅ PIX recebido</h4><div style="font-size:44px;font-weight:800;color:#16a34a">+R$ 50,00</div><div style="font-size:21px;color:#5d6679;margin-top:4px">O crédito entrou sozinho.</div></div>
<div class="big"><h4>🍔 O que ele comeu hoje</h4><div class="ln"><span>Pão de queijo</span><b>R$ 4,00</b></div><div class="ln"><span>Água</span><b>R$ 3,00</b></div><div class="ln"><span>Pago com crédito</span><b style="color:#16a34a">sem dinheiro</b></div></div>
</div>''')
pagina('C2-lanche-de-amanha.html', 'Cantina sem dinheiro',
       'O lanche de amanhã, <em>pedido hoje</em>',
       'A família encomenda pelo app e <b>a cantina já sabe quanto preparar.</b>',
       fone_cantina(encomenda=True) + '''<div class="col">
<div class="big"><h4>📋 Encomendas de amanhã</h4><div style="font-size:17px;color:#7a8396;margin:-6px 0 8px">Painel da cantina · sexta, 13/11</div>
<div class="ln"><span>Pão de queijo</span><b>14</b></div><div class="ln"><span>Suco natural</span><b>11</b></div><div class="ln"><span>Coxinha assada</span><b>9</b></div><div class="ln"><span>Salada de frutas</span><b>6</b></div></div>
<div class="callout" style="position:static;font-size:24px;padding:18px 22px;white-space:normal">👩‍🍳 <span>Preparo na <b>quantidade certa</b></span></div>
</div>''')

# ---------------------------------------------------------------- WhatsApp oficial (opcional, sem valor na arte)
def zap(titulo, sub, bolhas, w=400):
    b = ''.join(f'<div class="bb{" r" if lado == "r" else ""}" style="{"background:#d9fdd3;" if lado == "r" else ""}font-size:16px;max-width:300px">{f"<u style=\"color:#128c7e\">{quem}</u>" if quem else ""}{txt}</div>' for lado, quem, txt in bolhas)
    return f'<div class="phone" style="width:{w}px"><div class="chat" style="background:#efe7dd"><div class="ch" style="background:#075e54">{titulo}<small>{sub}</small></div>{b}</div></div>'

AVISO_ZAP = [('l', ESCOLA, '📢 <b>Passeio ao zoológico</b><br>Sexta-feira, saída às 8h e volta às 12h. Levar lanche, água e boné.<br><span style="color:#027eb5">Veja no app da escola</span>'),
             ('r', '', 'Obrigada! Ele vai sim 🙂'),
             ('l', 'Secretaria · Ana', 'Combinado! Qualquer dúvida é só chamar por aqui.')]
linha = lambda nome, papel, cor, estado: f'<div class="ln"><span><b style="color:#1d2740">{nome}</b> · {papel}</span><b style="color:{cor}">● {estado}</b></div>'

pagina('W1-varios-atendentes.html', 'WhatsApp oficial da escola',
       'Um número. <em>A equipe toda</em> atendendo.',
       'Secretaria, financeiro e coordenação respondem no mesmo WhatsApp, <b>cada um com o próprio acesso.</b>',
       zap(ESCOLA, 'conta comercial oficial', AVISO_ZAP) + f"""<div class="col">
<div class="big"><h4>👥 Atendendo agora</h4>{linha('Ana', 'Secretaria', '#16a34a', 'em conversa')}{linha('Carlos', 'Financeiro', '#16a34a', 'em conversa')}{linha('Bia', 'Coordenação', '#b88a14', 'livre')}</div>
<div class="callout" style="position:static;font-size:24px;padding:18px 22px;white-space:normal">📱 <span>O WhatsApp <b>continua no celular</b> da escola</span></div>
</div>""", cta='Saiba mais')

pagina('W2-envio-em-massa.html', 'WhatsApp oficial da escola',
       'Avise 300 famílias <em>sem medo de bloqueio</em>',
       'Envio em massa pela <b>API oficial da Meta</b>, do número da própria escola.',
       zap(ESCOLA, 'conta comercial oficial', AVISO_ZAP[:1] + [('l', ESCOLA, '👥 <b>Reunião de pais do 4º bimestre</b><br>Sábado, às 9h, na sala de cada turma.<br><span style="color:#027eb5">Veja no app da escola</span>')]) + """<div class="col">
<div class="big"><h4>📤 Aviso enviado</h4><div style="font-size:17px;color:#7a8396;margin:-6px 0 8px">Passeio ao zoológico · hoje, 07:42</div>
<div class="ln"><span>Famílias</span><b>312</b></div><div class="ln"><span>Entregues</span><b style="color:#16a34a">309</b></div><div class="ln"><span>Lidas</span><b style="color:#16a34a">271</b></div></div>
<div class="callout" style="position:static;font-size:24px;padding:18px 22px;white-space:normal">✅ <span>Canal oficial, <b>sem aplicativo não oficial</b></span></div>
</div>""", cta='Saiba mais')

pagina('W3-app-e-whatsapp.html', 'Avisos da escola',
       'O aviso no app <em>e no WhatsApp</em>',
       'Publicou uma vez: chega no app da escola e, se quiser, <b>no WhatsApp oficial da escola.</b>',
       rot('NO APP DA ESCOLA', 'd', fone_aviso()) + rot('NO WHATSAPP OFICIAL', 'd', zap(ESCOLA, 'conta comercial oficial', AVISO_ZAP[:2])), cta='Saiba mais')
print('ok')
