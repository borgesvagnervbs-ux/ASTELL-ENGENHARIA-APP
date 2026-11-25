// Configuração do Supabase: arquivo config.js

// Cartão de confirmação (substitui o confirm() do navegador): devolve true se o usuário confirmar
let lastClick = null; document.addEventListener('click', e => { lastClick = e.target; }, true);
function ask(msg, ok = 'Excluir') {
  if (!document.getElementById('ask-css')) { const st = document.createElement('style'); st.id = 'ask-css'; st.textContent = `.askov{position:fixed!important;inset:0!important;z-index:2147483000!important;background:rgba(4,9,15,.6)!important}
.askdlg{position:fixed!important;inset:0!important;z-index:2147483001!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important;pointer-events:none!important;box-sizing:border-box}
.askdlg .askbox{pointer-events:auto;box-sizing:border-box;width:min(420px,100%);max-height:92vh;overflow:auto;padding:22px;border-radius:18px;background:#101b28;border:1px solid #1f2f3f;box-shadow:0 20px 60px rgba(0,0,0,.8);text-align:center;color:#e8eef2}
.askdlg .askbox h3{margin:0 0 10px;font-size:1.2rem;line-height:1.3;color:#fff;text-align:center;font-weight:700}
.askdlg .asksub{margin:0 0 14px;color:#8a9aa6;font-size:.88rem;text-align:center}
.askdlg .askbtns{display:flex;gap:10px;justify-content:center;margin-top:16px}
.askdlg .askbtns button{margin:0!important;width:auto!important;min-height:44px;padding:0 20px!important;border-radius:12px;font-weight:600;font-size:1rem;cursor:pointer}
.askdlg .askbtns .askno{background:#3dc08c!important;color:#04231a!important;border:0!important}
.askdlg .askbtns .askyes{background:#e5534b!important;color:#fff!important;border:0!important}
.askhl{position:relative!important;z-index:2147482999!important;border:2px solid #3dc08c!important;box-shadow:0 0 0 4px rgba(61,192,140,.25),0 0 24px rgba(61,192,140,.35)!important}
`; document.head.appendChild(st); }   // estilo próprio: não depende do style.css
  return new Promise(res => {
    const del = ok === 'Excluir', btn = lastClick && lastClick.closest && lastClick.closest('[data-del],[data-deldoc],[data-deldc],[data-delplan],[data-emdd],[data-gdel],[data-xdel]'),
      card = del && btn ? btn.closest('.card,.gtile,.pfile,.item,.bthumb,.stagerow') : null, sub = del && !/^Excluir [^?]{0,40}\?$/.test(msg);
    const back = document.createElement('div'); back.className = 'askov';
    const dlg = document.createElement('div'); dlg.className = 'askdlg'; dlg.setAttribute('role', 'alertdialog'); dlg.setAttribute('aria-modal', 'true');
    dlg.innerHTML = `<div class="askbox"><h3></h3><p class="asksub" hidden></p><div class="askbtns"><button type="button" class="askno">Cancelar</button><button type="button" class="askyes">${ok}</button></div></div>`;
    dlg.querySelector('h3').textContent = del ? 'Tem certeza que deseja fazer essa exclusão?' : msg;
    if (sub) { const p = dlg.querySelector('.asksub'); p.textContent = msg; p.hidden = false; }
    if (card) card.classList.add('askhl');   // o elemento continua no lugar, destacado com borda verde
    const end = v => { document.removeEventListener('keydown', key, true); if (card) card.classList.remove('askhl'); back.remove(); dlg.remove(); res(v); }, key = e => { if (e.key === 'Escape') { e.stopPropagation(); end(false); } };
    back.addEventListener('click', e => { e.stopPropagation(); end(false); });
    dlg.addEventListener('click', e => { e.stopPropagation(); if (e.target.closest('.askno')) end(false); else if (e.target.closest('.askyes')) end(true); });
    document.addEventListener('keydown', key, true); document.body.append(back, dlg); dlg.querySelector('.askno').focus();
  });
}

const APP_VERSION = '2026.10.21-63'; // mostrada no Perfil; acompanha o ?v= dos arquivos no index.html
// Dentro do aplicativo (Median/WebView) o Google bloqueia o login por OAuth; lá o acesso é por e-mail e senha.
let REC_FLOW = /[#&]type=recovery/.test(location.hash);   // aberto pelo link de recuperação de senha
const IN_APP = /median|gonative/i.test(navigator.userAgent);
if (IN_APP) document.documentElement.classList.add('in-app');
let sb; try { sb = supabase.createClient(new URL(SUPABASE_URL.trim()).origin, SUPABASE_KEY.trim()); } catch (e) { sb = null; }
const $ = s => document.querySelector(s); let app = $('#app');
const fail = m => { app.innerHTML = '<div class="card" style="margin:16px"><b>Não foi possível iniciar o Astell Home</b><p class="mute">' + m + '</p></div>'; };
if (!sb || /COLE_AQUI/.test(SUPABASE_URL + SUPABASE_KEY)) { fail('Abra o arquivo config.js e preencha SUPABASE_URL e SUPABASE_KEY (Supabase > Project Settings > API).'); throw new Error('Supabase não configurado'); }
addEventListener('error', e => { if (!app.innerHTML.trim()) fail('Erro: ' + e.message); });
addEventListener('unhandledrejection', e => { if (!app.innerHTML.trim()) fail('Erro: ' + (e.reason?.message || e.reason)); });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString('pt-BR') : '—';
const FS = { n: ['Normal', '100%'], g: ['Grande', '112.5%'], x: ['Muito grande', '125%'] };
function applyFs() { let k = 'n'; try { k = localStorage.getItem('astell_fs') || 'n'; } catch (e) {} document.documentElement.style.fontSize = (FS[k] || FS.n)[1]; return FS[k] ? k : 'n'; }
applyFs();
const S = { profile: null, res: [], cur: null, groups: {} };
const staff = () => false; // este app é somente de consulta do cliente
let toastTimer;
function toast(m, err) {   // aviso no topo da tela: verde (salvo/sucesso) ou vermelho (erro), com ícone
  const t = $('#toast'); t.setAttribute('role', err ? 'alert' : 'status'); t.textContent = '';
  const ic = document.createElement('i'); ic.className = 'tic'; ic.textContent = err ? '!' : '✓';
  const tx = document.createElement('span'); tx.textContent = m; t.append(ic, tx);
  t.className = 'show' + (err ? ' err' : ' ok'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.className = '', err ? 5000 : 3500);
}
const addMonths = (d, m) => { const x = new Date(d + 'T00:00'); x.setMonth(x.getMonth() + m); return x; };
function wState(w) { const start = new Date(w.start_date + 'T00:00'), end = w._end || addMonths(w.start_date, w.months), left = end - new Date(), total = end - start;   // vigente; próxima do vencimento = resta 1/4 do prazo ou menos; expirada
  return left <= 0 ? ['Expirada', 'bad', end] : left <= total / 4 ? ['Próxima do vencimento', 'warn', end] : ['Vigente', 'ok', end]; }
// Inspeções preventivas: mesma linha do tempo das garantias (início = última execução, fim = próxima execução)
const MST = { 'Pendente': 's-pend', 'Em andamento': 's-and', 'Concluída': 's-conc', 'Cancelada': 's-canc' };   // mesmas cores do painel admin
const perTxt = r => r.interval_months ? `${r.interval_months} ${+r.interval_months === 1 ? 'mês' : 'meses'}` : (r.frequency || '');
function mInfo(r) {
  if (!r.next_due || r.status === 'Cancelada') return null;   // concluídas também mostram a barra
  const n = +r.interval_months || 0, endD = new Date(r.next_due + 'T00:00'), iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const startIso = r.last_done || (n ? iso(addMonths(r.next_due, -n)) : null); if (!startIso || isNaN(endD)) return null;
  const tot = n || Math.max(1, Math.round((endD - new Date(startIso + 'T00:00')) / 2629800000));
  return wInfo({ start_date: startIso, months: tot, _end: endD });
}
const effSt = r => { const st = r.status || 'Pendente'; if (st !== 'Concluída') return st; const w = mInfo(r); return w && w.kind !== 'ok' ? 'Pendente' : st; };   // concluída que chegou perto do vencimento volta a ser Pendente
function mBox(r) {
  const w = mInfo(r); if (!w) return '';
  return `<div class="wbox w-${w.kind}">${w.kind === 'warn' ? `<p class="wwarn">Inspeção próxima do vencimento - faltam ${w.txt}</p>` : w.kind === 'bad' ? `<p class="wexp">Inspeção vencida em ${w.end.toLocaleDateString('pt-BR')}</p>` : ''}<div class="wfig"><div><span class="wnum wtot">${w.total}</span><span class="wlbl">Periodicidade</span></div><div><span class="wnum wrem">${w.kind === 'bad' ? 'Vencida' : w.big}</span><span class="wlbl">${w.kind === 'bad' ? 'Prazo esgotado' : 'Restantes'}</span></div></div><div class="wbar" role="img" aria-label="Tempo restante até a próxima execução"><i style="width:${w.pct.toFixed(1)}%"></i></div><span class="wpill">${w.s}</span></div>`;
}
function wInfo(w) {   // tudo que o cartão da garantia mostra: tempo restante (meses e dias), % da barra e frase de alerta
  const [s, c, end] = wState(w), start = new Date(w.start_date + 'T00:00'), now = new Date(), total = end - start, left = Math.max(0, end - now), from = now < start ? start : now;
  let m = 0, d = 0; if (left > 0) { m = (end.getFullYear() - from.getFullYear()) * 12 + end.getMonth() - from.getMonth(); let t = new Date(from); t.setMonth(t.getMonth() + m); if (t > end) { m--; t = new Date(from); t.setMonth(t.getMonth() + m); } d = Math.floor((end - t) / 864e5); }
  const mm = n => n + (n === 1 ? ' mês' : ' meses'), dd = n => n + (n === 1 ? ' dia' : ' dias');
  const txt = [m ? mm(m) : '', d || !m ? dd(d) : ''].filter(Boolean).join(' e ');
  return { s, c, end, m, d, txt, big: m ? mm(m) : dd(d), total: mm(+w.months || 0), pct: c === 'bad' ? 100 : total > 0 ? Math.max(2, Math.min(100, left / total * 100)) : 0, kind: c === 'bad' ? 'bad' : c === 'warn' ? 'warn' : 'ok' };
}

// Módulos genéricos: f = [coluna, rótulo, tipo]
const T = {
  warranties: { label: 'Garantias', order: 'start_date', f: [['system','Sistema ou componente'],['coverage','Descrição da cobertura'],['start_date','Data inicial','date'],['months','Prazo (meses)','number'],['notes','Condições e exclusões','textarea']],
    row: r => { const [s, c, end] = wState(r); return `<b>${esc(r.system)}</b> <span class="badge ${c}">${s}</span><p>${esc(r.coverage)}</p><span class="mute">${fmt(r.start_date)} até ${end.toLocaleDateString('pt-BR')}</span><p class="mute">${esc(r.notes)}</p>`; },
    note: 'Os prazos valem conforme contrato, fabricante e lei. As condições contratuais e legais prevalecem sobre estes indicadores.' },
  maintenance_tasks: { label: 'Manutenção preventiva', order: 'next_due', f: [['name','Tarefa'],['system','Sistema'],['interval_months','Periodicidade (meses)','number'],['last_done','Última execução','date'],['next_due','Próxima execução','date'],['status','Situação',['Pendente','Em andamento','Concluída','Cancelada']],['instructions','Instruções','textarea']],
    row: r => { const st = effSt(r), late = r.next_due && new Date(r.next_due + 'T00:00') < new Date() && !['Concluída', 'Cancelada'].includes(st); return `<b>${esc(r.name)}</b> <span class="badge ${MST[st] || 's-pend'}">${st}</span>${late ? ' <span class="badge bad">Atrasada</span>' : ''}<p class="mute">${esc(r.system)} · ${esc(perTxt(r))}</p>${mBox(r)}Última: ${fmt(r.last_done)} · Próxima execução: ${fmt(r.next_due)}<p class="mute">${esc(r.instructions)}</p>`; } },
  equipment: { label: 'Equipamentos', f: [['name','Nome'],['category','Categoria'],['maker','Fabricante'],['model','Modelo'],['serial','Nº de série'],['location','Localização']],
    row: r => `<b>${esc(r.name)}</b><span class="mute">${esc(r.category)} · ${esc(r.location)}</span><p>${esc(r.maker)} ${esc(r.model)} ${r.serial ? '· Série ' + esc(r.serial) : ''}</p>` },
};
const REQ_CATS = ['Elétrica','Hidráulica','Cobertura','Esquadrias','Revestimentos','Pintura','Steel Frame','Equipamentos','Outros'];
const STATUS = ['Recebida','Em análise','Aguardando informações','Agendada','Em atendimento','Concluída','Encerrada'];
// Pastas de documentos (as mesmas do painel admin)
const DCATS = {
  geral: { l: 'Documentos gerais', i: 'doc' },
  pref: { l: 'Prefeitura', i: 'prefeitura', kind: 'prefeitura', f: [['tipo', 'Tipo de documento'], ['processo', 'Nº do protocolo / processo'], ['orgao', 'Órgão ou setor emissor'], ['validade', 'Validade', 'date'], ['situacao', 'Situação']] },
  banc: { l: 'Bancos', i: 'banco', kind: 'bancos', f: [['instituicao', 'Banco / instituição financeira'], ['tipo', 'Tipo de documento'], ['contrato', 'Nº do contrato'], ['valor', 'Valor (R$)'], ['vencimento', 'Vencimento / validade', 'date']] },
  cons: { l: 'Construtoras', i: 'capacete', kind: 'construtoras', f: [['empresa', 'Construtora / empresa'], ['cnpj', 'CNPJ'], ['tipo', 'Tipo de documento'], ['responsavel', 'Responsável técnico'], ['numero', 'Nº do contrato / ART'], ['valor', 'Valor (R$)']] },
  plan: { l: 'Plantas Técnicas', i: 'regua', kind: 'plantas', f: [['disciplina', 'Disciplina'], ['prancha', 'Nº da prancha'], ['revisao', 'Revisão'], ['escala', 'Escala'], ['projetista', 'Projetista / responsável']] },
  arq: { l: 'Arquitetura', i: 'compasso', kind: 'arquitetura', f: [['tipo', 'Tipo de documento'], ['etapa', 'Etapa'], ['escritorio', 'Escritório / arquiteto responsável'], ['registro', 'Nº do CAU / RRT'], ['versao', 'Versão / revisão']] },
};
const DOC_CATS = ['Projeto arquitetônico','Projeto estrutural','Projeto elétrico','Projeto hidráulico','Projeto sanitário','Climatização','Cobertura','Memorial descritivo','Manuais','Notas e comprovantes','Termo de entrega','Garantia','Outros'];

const PT_CATS = ['Elétrica','Hidráulica','Gás','Climatização','Estrutura','Paredes','Equipamentos'];
const ico = (d, c = '') => `<svg class="ico ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d.split('|').map(p => `<path d="${p}"/>`).join('')}</svg>`;
const IC = { prefeitura: 'M3 21h18|M5 10v11|M9 10v11|M15 10v11|M19 10v11|M2 10l10-7 10 7z', banco: 'M2 6h20v12H2z|M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z|M6 12h.01|M18 12h.01', capacete: 'M10 10V5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5|M14 6a6 6 0 0 1 6 6v3|M4 15v-3a6 6 0 0 1 6-6|M3 15h18v4H3z', regua: 'M3 17L17 3l4 4L7 21z|M14 6l2 2|M11 9l2 2|M8 12l2 2|M5 15l2 2', compasso: 'M12 2.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z|M11 5.5L5 21|M13 5.5L19 21|M8 15h8', wallet: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1|M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4', calclock: 'M16 2v4|M8 2v4|M3 10h18|M21 11V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6|M17 17.5a4.5 4.5 0 1 0 9 0 4.5 4.5 0 1 0-9 0|M21.5 15.5v2l1.2.8', trend: 'M3 3v16a2 2 0 0 0 2 2h16|M7 16V9|M12 16V5|M17 16v-5', alert: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M12 8v4|M12 16h.01', pie: 'M21 12c.55 0 1.02-.45.95-1A10 10 0 0 0 13 2.05c-.55-.07-1 .4-1 .95v8a1 1 0 0 0 1 1z|M21.21 15.89A10 10 0 1 1 8 2.83', receipt: 'M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z|M8 8h8|M8 12h8|M8 16h5', lock: 'M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z|M7 11V7a5 5 0 0 1 10 0v4|M12 15.5v2', palette: 'M12 22a10 10 0 1 1 10-10c0 3-2 4-4 4h-2a2 2 0 0 0-1 3.7c.6.5.4 2.3-3 2.3z|M7.5 11.5h.01|M10.5 7.5h.01|M15.5 8h.01|M17.5 12h.01', info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z|M12 16v-4|M12 8h.01', out: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4|M16 17l5-5-5-5|M21 12H9', home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M9 22V12h6v10', casa: 'M4 21V8l8-5 8 5v13|M9 21v-6h6v6', drop: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z', layers: 'M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5', shield: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z|M9 12l2 2 4-4', wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', phones: 'M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3', doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M8 13h8|M8 17h8', user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', chev: 'M9 18l6-6-6-6', check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14|M22 4L12 14.01l-3-3', bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9|M10.3 21a1.94 1.94 0 0 0 3.4 0', pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0|M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5', chevd: 'M6 9l6 6 6-6', bolt: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z|M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3|M21 15l-5-5L5 21', calendar: 'M8 2v4|M16 2v4|M3 10h18|M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z|M8 14h.01|M12 14h.01|M16 14h.01|M8 18h.01|M12 18h.01', dl: 'M12 3v12|M7 11l5 5 5-5|M5 21h14', folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', usr: 'M20 21a8 8 0 0 0-16 0|M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8', tick: 'M5 12.5l4.5 4.5L19 7.5', dollar: 'M12 2v20|M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6' };
const TILES = [['estrutura', 'Estrutura', 'Steel Frame', 'layers'], ['sistemas', 'Instalações', 'Elétrica e hidráulica', 'bolt'], ['garantias', 'Garantias', 'Prazos e condições', 'shield'], ['manutencao', 'Manutenção', 'Cuidados da sua casa', 'wrench']];
const BCAT = { estrutura: 'Estrutura', sistemas: 'Sistemas', materiais: 'Materiais' };
const pct = (v, t) => t > 0 ? Math.round(v / t * 100) + '%' : '0%';
function finPaint(edit) {
  const f = S.fin, saldo = f.budget - f.spent, card = ([ic, lbl, v, neg]) => `<div class="fmet">${ico(IC[ic])}<b class="${neg ? 'neg' : ''}">${brl(v)}<small>${pct(v, f.budget)}</small></b><span>${lbl}</span></div>`;
  $('#fin').innerHTML = `<div class="card fcard"><h3>ORÇAMENTO DA OBRA</h3>${f.budget > 0 && !edit ? `<span class="obadge ${f.all > f.budget ? 'bad' : 'good'} fbadge">${f.all > f.budget ? 'Acima do limite' : 'Dentro do limite'}</span>` : ''}${edit ? `<form id="fbf" class="fedit"><label>Orçamento total planejado<input id="fbv" inputmode="numeric" autocomplete="off" value="${brl(f.budget)}"></label><div class="frow"><button class="btn-main">Salvar</button><button type="button" class="btn-cancel" data-fcancel>Cancelar</button></div></form>` : `<div class="fbig">${brl(f.budget)}</div><p class="mute fsub">Orçamento total planejado</p>${f.budget > 0 ? `${oBar(pctN(f.all, f.budget), f.all > f.budget ? 'r' : 'g')}<div class="oleg"><span>${pctN(f.all, f.budget)}% utilizado</span><span>${Math.max(0, 100 - pctN(f.all, f.budget))}% disponível</span></div>` : ''}<button type="button" class="link fedt" data-fedit>Editar</button>`}
    <div class="fgrid">${[['wallet', 'Total realizado', f.spent], ['calclock', 'Contas a pagar', f.pay], ['trend', 'Saldo do orçamento', saldo, saldo < 0], ['alert', 'Contas vencidas', f.late]].map(card).join('')}</div></div>
    <div class="cgrid">${[['orcamentos', 'Orçamentos', 'Planejado x realizado', 'pie'], ['contas', 'Contas a pagar', 'Vencimentos e pagamentos', 'calendar'], ['custos', 'Despesas', 'Lançamentos financeiros', 'receipt'], ['relatorios', 'Relatórios', 'Gráficos e indicadores', 'trend']].map(([h, t, s, i]) => `<a class="card ccard" href="${h === 'custos' ? '#custos' : '#financeiro?' + h}">${ico(IC[i])}<b>${t}</b><small class="mute">${s}</small></a>`).join('')}</div>`;
  if (edit) { const i = $('#fbv'); i.focus(); const fm = () => { const d = i.value.replace(/\D/g, '').slice(0, 14); i.value = brl(Number(d || 0) / 100); }; i.oninput = fm; i.select();
    $('#fbf').onsubmit = async e => { e.preventDefault(); const v = Number(i.value.replace(/\D/g, '') || 0) / 100, { data, error } = await sb.rpc('set_residence_budget', { p_id: f.id, p_value: v }); if (error) return toast('Não foi possível salvar o orçamento: ' + error.message, 1); f.budget = Number(data ?? v); finPaint(); toast('Orçamento salvo.'); }; }
}
// ---- Orçamento por categoria (etapa da obra) ----
// ---- Controle financeiro: parcelas e contas a pagar ----
const PAYM = ['Pix', 'Débito', 'Crédito', 'Boleto'];
const addMonIso = (iso, k) => { const [y, m, d] = iso.split('-').map(Number), t = new Date(y, m - 1 + k, 1), last = new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate(); return xIso(new Date(t.getFullYear(), t.getMonth(), Math.min(d, last))); };
const instOf = id => (S.inst || []).filter(i => String(i.expense_id) === String(id)).sort((a, b) => a.num - b.num);
const dayDiff = iso => Math.round((new Date(iso + 'T00:00') - new Date(todayIso() + 'T00:00')) / 864e5);
const instSt = i => i.paid_on ? 'paid' : i.due_on < todayIso() ? 'late' : dayDiff(i.due_on) <= 15 ? 'soon' : 'ok';   // paga · vencida · vence em até 15 dias · a vencer
const INST_C = { paid: 'cok', soon: 'cg', late: 'cx', ok: 'cf' }, INST_T = { paid: 'PAGA', soon: 'VENCE EM BREVE', late: 'VENCIDA', ok: 'A VENCER' };
async function instLoad() { const { data } = await sb.from('expense_installments').select('*').eq('residence_id', S.cur.id).order('due_on'); S.inst = data || []; }
const payLine = e => { const n = instOf(e.id).length, c = e.pay_cond === 'parcelado' ? `Parcelado em ${n || '?'}x` : e.pay_cond === 'avista' ? 'À vista' : ''; return [e.pay_method, c].filter(Boolean).join(' · '); };
const OTONE = { g: '#1fa855', o: '#d97706', b: '#3b82f6', r: '#dc2626', s: '#64748b' }, OTONE_SUB = { g: '#6fcf97', o: '#f0a65a', b: '#7db2f7', r: '#ef7b7b', s: '#94a3b8' };
const todayIso = () => xIso(new Date()), pctN = (v, t) => t > 0 ? Math.round(v / t * 100) : 0, inCat = (e, c) => nrm(e.category) === nrm(c), subOf = e => e.subcategory || 'Outros';
const cbEff = b => b.pct != null ? S.fin.budget * Number(b.pct) / 100 : Number(b.amount || 0);
const cbOf = c => (S.cbud || []).find(b => nrm(b.category) === nrm(c));
function splitPay(list) {   // despesa parcelada: pago = parcelas pagas, a pagar = parcelas em aberto; demais: pela data da despesa
  const t = todayIso(); let pago = 0, comp = 0;
  list.forEach(e => { const ins = instOf(e.id), tot = ins.reduce((a, i) => a + Number(i.amount), 0), rest = Math.max(0, Number(e.amount) - tot);
    ins.forEach(i => { if (i.paid_on) pago += Number(i.amount); else comp += Number(i.amount); });
    if (e.spent_on <= t) pago += rest; else comp += rest; });
  return { pago, comp };
}
const barTone = p => p > 100 ? 'r' : p >= 80 ? 'g' : p >= 40 ? 'o' : 'b';
const oBar = (p, tone, sub) => `<div class="obar" role="progressbar" aria-valuenow="${Math.min(p, 100)}" aria-valuemin="0" aria-valuemax="100"><i style="width:${Math.min(p, 100)}%;background:${(sub ? OTONE_SUB : OTONE)[tone]}"></i></div>`;
const encQ = t => encodeURIComponent(t);
async function seedCats() {   // 1ª vez: as categorias já lançadas viram categorias orçadas, dividindo o orçamento geral em partes iguais
  const f = S.fin, k = 'astell_seed_' + f.id; let done = false; try { done = !!localStorage.getItem(k); } catch (_) {}
  if (done || (S.cbud || []).length || !(f.budget > 0)) return;
  const cats = []; S.exp.forEach(e => { const c = (S.xcats || []).find(x => nrm(x) === nrm(e.category)) || e.category; if (c && !cats.some(x => nrm(x) === nrm(c))) cats.push(c); });
  if (!cats.length) return;
  const cents = Math.round(f.budget * 100), base = Math.floor(cents / cats.length), rest = cents - base * cats.length;
  const rows = cats.map((c, i) => ({ residence_id: f.id, category: c, amount: (base + (i < rest ? 1 : 0)) / 100, pct: null }));
  const { data, error } = await sb.from('category_budgets').insert(rows).select(); if (error) return;
  S.cbud = data && data.length ? data : rows; try { localStorage.setItem(k, '1'); } catch (_) {}
}
async function finLoad() {
  const rid = S.cur.id; await instLoad(); const [{ data: rs }, { data: ex }, { data: cb }, { data: cs }, { data: ss }] = await Promise.all([sb.from('residences').select('budget').eq('id', rid).single(), sb.from('expenses').select('*').eq('residence_id', rid).order('spent_on', { ascending: false }).order('created_at', { ascending: false }), sb.from('category_budgets').select('*').eq('residence_id', rid).order('created_at'), sb.from('expense_categories').select('name').order('name'), sb.from('expense_subcategories').select('category,name')]);
  S.exp = ex || []; S.xcats = xCats(cs || [], S.exp); S.xsubs = ss || []; S.cbud = cb || [];
  const sp = splitPay(S.exp); const late = S.inst.filter(i => instSt(i) === 'late').reduce((a, i) => a + Number(i.amount), 0); S.fin = { id: rid, budget: Number((rs && rs.budget) || 0), spent: sp.pago, pay: Math.max(0, sp.comp - late), late, all: sp.pago + sp.comp };
  await seedCats();
}
function orcView() {   // categorias orçadas (o orçamento geral fica na tela Financeiro)
  const f = S.fin, alloc = (S.cbud || []).reduce((a, b) => a + cbEff(b), 0);
  const rows = (S.cbud || []).map((b, i) => { const eff = cbEff(b), u = S.exp.filter(e => inCat(e, b.category)).reduce((a, e) => a + Number(e.amount), 0), p = pctN(u, eff), tn = barTone(p);
    return `<a class="orow" href="#financeiro?cat=${encQ(b.category)}"><span class="onum">${i + 1}.</span><span class="obody"><span class="otop"><b>${esc(b.category)}</b><strong>${brl(eff)}</strong></span>${oBar(p, tn)}<small class="mute">${p}% do orçamento consumido${b.pct != null ? ` · ${String(b.pct).replace('.', ',')}% do geral` : ''}</small></span><span class="oarr" aria-hidden="true">›</span></a>`; }).join('');
  return `<h2>Orçamentos</h2><div class="card ocard"><div class="ohead"><b>Orçamento por categoria</b><small class="mute">Distribuído: ${brl(alloc)}${f.budget > 0 ? ` (${pctN(alloc, f.budget)}% do geral)` : ''}</small></div>${alloc > f.budget && f.budget > 0 ? '<p class="owarn">A soma das categorias passa do orçamento geral.</p>' : ''}${f.budget > 0 ? '' : '<p class="mute">Defina o orçamento total na tela Financeiro.</p>'}${rows || '<p class="empty">Nenhuma categoria orçada ainda.</p>'}</div><a class="newreq" href="#financeiro?orcnova">+ Lançar orçamento de categoria</a><a class="btn-cancel" href="#financeiro">Voltar ao Financeiro</a>`;
}
const pctTxt = n => String(Math.round(n * 100) / 100).replace('.', ',');
function orcForm(cat) {
  const b = cat ? cbOf(cat) : null, B = S.fin.budget, others = (S.cbud || []).filter(x => !b || x.id !== b.id).reduce((a, x) => a + cbEff(x), 0), rest = Math.max(0, B - others), v0 = b ? cbEff(b) : rest;
  return `<h2>${b ? 'Editar orçamento' : 'Lançar orçamento'}</h2><form class="card" id="obf"><label>Categoria (etapa da obra)<div class="comboin" data-combo="cat"><input class="comboq" type="search" name="category" required maxlength="60" autocomplete="off" role="combobox" aria-expanded="false" placeholder="Pesquise ou digite uma categoria…" value="${esc(b ? b.category : '')}"${b ? ' readonly' : ''}><ul class="combolist" role="listbox" hidden></ul></div></label>
    <label>Valor (R$)<input id="ov" inputmode="numeric" autocomplete="off" value="${brl(v0)}"></label>
    <label>Percentual do orçamento geral (%)<input id="op" inputmode="decimal" autocomplete="off" placeholder="0"${B > 0 ? '' : ' disabled'} value="${B > 0 ? pctTxt(v0 / B * 100) : ''}"></label>
    <p class="mute" id="oeq">${B > 0 ? `Resta no orçamento geral: ${brl(rest)} (${pctTxt(rest / B * 100)}%).` : 'Defina primeiro o orçamento total em Financeiro para usar o percentual.'}</p>
    <button>Salvar orçamento</button><a class="btn-cancel" href="#financeiro?${b ? 'cat=' + encQ(b.category) : 'orcamentos'}">Cancelar</a>${b ? '<button type="button" class="link" id="odel">Excluir orçamento desta categoria</button>' : ''}</form>`;
}
function orcFormInit(cat) {
  const f = $('#obf'), ov = $('#ov'), op = $('#op'), B = S.fin.budget; let last = 'brl';   // last: campo que o cliente editou por último (é o que fica gravado)
  const getV = () => Number(ov.value.replace(/\D/g, '') || 0) / 100, getP = () => Math.min(100, parseFloat(op.value.replace(',', '.')) || 0);
  ov.addEventListener('input', () => { last = 'brl'; const v = Number(ov.value.replace(/\D/g, '').slice(0, 14) || 0) / 100; ov.value = brl(v); if (B > 0) op.value = v ? pctTxt(v / B * 100) : ''; });
  op.addEventListener('input', () => { last = 'pct'; op.value = op.value.replace(/[^\d,]/g, '').replace(/(,.*?),/g, '$1').replace(/(,\d{2}).*/, '$1').slice(0, 6); if (getP() >= 100 && parseFloat(op.value.replace(',', '.')) > 100) op.value = '100'; ov.value = brl(Math.round(B * getP()) / 100); });
  f.onsubmit = async e => { e.preventDefault(); const typed = String(f.category.value || '').trim().replace(/\s+/g, ' '), v = last === 'pct' ? Math.round(B * getP()) / 100 : getV(); if (!typed) return toast('Informe a categoria.', 1);
    if (!(v > 0)) return toast('Informe um valor maior que zero.', 1);
    const known = (S.xcats || XDEF).find(x => nrm(x) === nrm(typed)), name = known || typed, ex = cbOf(name); if (!cat && ex) return toast('Esta categoria já tem orçamento. Abra-a para editar.', 1);
    if (!known) await sb.from('expense_categories').insert({ name });
    const row = last === 'pct' ? { amount: v, pct: getP() } : { amount: v, pct: null };
    const { error } = ex ? await sb.from('category_budgets').update(row).eq('id', ex.id) : await sb.from('category_budgets').insert({ residence_id: S.cur.id, category: name, ...row });
    if (error) return toast('Não foi possível salvar: ' + error.message, 1); toast('Orçamento da categoria salvo.'); location.hash = '#financeiro?cat=' + encQ(name); };
  const dl = $('#odel'); if (dl) dl.onclick = async () => { if (!await ask('Excluir o orçamento desta categoria? As despesas lançadas continuam salvas.')) return; const b = cbOf(cat), { error } = await sb.from('category_budgets').delete().eq('id', b.id); if (error) return toast('Não foi possível excluir.', 1); toast('Orçamento excluído.'); location.hash = '#financeiro?orcamentos'; };
}
function catView(cat) {
  const b = cbOf(cat); if (!b) return '<p class="empty">Esta categoria não tem orçamento lançado.</p><a class="btn-cancel" href="#financeiro?orcamentos">Voltar</a>';
  const eff = cbEff(b), list = S.exp.filter(e => inCat(e, b.category)), { pago, comp } = splitPay(list), disp = Math.max(0, eff - pago - comp), est = pago + comp - eff;
  const line = (lbl, v, tn) => `<div class="cline"><div class="ctop"><span>${lbl}</span><b>${brl(v)}</b></div>${oBar(pctN(v, eff), tn)}</div>`;
  const by = {}; list.forEach(e => { const k = subOf(e), key = nrm(k); (by[key] = by[key] || { name: k, items: [] }).items.push(e); });
  const subs = Object.values(by).sort((a, b) => b.items.reduce((s, e) => s + +e.amount, 0) - a.items.reduce((s, e) => s + +e.amount, 0));
  const srows = subs.map((s, i) => { const tot = s.items.reduce((a, e) => a + Number(e.amount), 0), p = pctN(tot, eff), sp = splitPay(s.items), big = s.items.reduce((m, e) => Number(e.amount) > Number(m.amount) ? e : m, s.items[0]), last = s.items[0];   // lista já vem da mais recente para a mais antiga
    return `<div class="orow sub"><a class="olinkrow" href="#financeiro?sub=${encQ(b.category)}&${encQ(s.name)}"><span class="onum">${i + 1}.</span><span class="obody"><span class="otop"><b>${esc(s.name)}</b><strong>${brl(tot)}</strong></span>${oBar(p, barTone(p), true)}<small class="mute">${p}% do orçamento da categoria</small></span></a><button type="button" class="oarr" data-subx aria-expanded="false" aria-label="Ver detalhes de ${esc(s.name)}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></button></div>
      <div class="opanel" hidden><div class="pgrid"><span>Realizado (pago)</span><b>${brl(sp.pago)}</b><span>Comprometido (a pagar)</span><b>${brl(sp.comp)}</b><span>Lançamentos</span><b>${s.items.length}</b><span>Maior lançamento</span><b>${brl(big.amount)}<small class="mute"> ${esc(big.description)}</small></b><span>Último lançamento</span><b>${fmt(last.spent_on)}</b></div><a class="link olist" href="#financeiro?sub=${encQ(b.category)}&${encQ(s.name)}">Ver todos os lançamentos ›</a></div>`; }).join('');
  return `<div class="card ocat"><h3>${esc(b.category)}</h3><div class="fbig">${brl(eff)}${S.fin.budget > 0 ? `<small class="fpct">${pctTxt(eff / S.fin.budget * 100)}% do geral</small>` : ''}</div><a class="link fedt oedit" href="#financeiro?orcedit=${encQ(b.category)}">Editar</a><p class="mute fsub">Orçamento previsto</p>${line('Realizado (pago)', pago, 'g')}${line('Comprometido (a pagar)', comp, 'o')}${line('Disponível', disp, 'b')}<span class="opill">${pctN(pago, eff)}% já pago</span>${est > 0 ? `<p class="owarn">Acima do orçamento da categoria em ${brl(est)}.</p>` : ''}</div>
    <h3 class="osec">Gastos por subcategoria</h3>${srows ? `<div class="card ocard">${srows}</div>` : '<p class="empty">Nenhuma despesa lançada nesta categoria.</p>'}<a class="btn-cancel" href="#financeiro?orcamentos">Voltar aos orçamentos</a>`;
}
function subView(cat, sub) {
  const b = cbOf(cat), eff = b ? cbEff(b) : 0, list = S.exp.filter(e => inCat(e, cat) && nrm(subOf(e)) === nrm(sub)), tot = list.reduce((a, e) => a + Number(e.amount), 0);   // S.exp já em ordem: mais recente primeiro
  return `<h2>${esc(sub)}</h2><p class="mute">${esc(cat)} · ${list.length} ${list.length === 1 ? 'lançamento' : 'lançamentos'} · ${brl(tot)}${eff ? ` · ${pctN(tot, eff)}% do orçamento da categoria` : ''}</p>${list.map(e => xCardHtml(e, `<p class="xpct">${eff ? pctN(Number(e.amount), eff) : 0}% do orçamento da categoria</p>`)).join('') || '<p class="empty">Nenhum lançamento nesta subcategoria.</p>'}<a class="btn-cancel" href="#financeiro?cat=${encQ(cat)}">Voltar à categoria</a>`;
}
function contasPaint() {   // calendário financeiro (mesmo layout do cronograma) + lista de contas do mês/dia
  const { y, m } = S.fc, el = $('#fcal'); if (!el) return;
  const pre = y + '-' + String(m + 1).padStart(2, '0') + '-', first = new Date(y, m, 1).getDay(), nd = new Date(y, m + 1, 0).getDate(), t = new Date(), hoje = t.getFullYear() === y && t.getMonth() === m ? t.getDate() : 0;
  const mine = S.inst.filter(i => String(i.due_on).startsWith(pre)), by = {}; mine.forEach(i => (by[+i.due_on.slice(8, 10)] = by[+i.due_on.slice(8, 10)] || []).push(i));
  let cells = ''; for (let i = 0; i < first; i++) cells += '<span class="cd0"></span>';
  for (let d = 1; d <= nd; d++) cells += by[d] ? `<button type="button" class="cday has${d === hoje ? ' hoje' : ''}${S.fc.sel === d ? ' sel' : ''}" data-fcday="${d}" aria-pressed="${S.fc.sel === d}" aria-label="Dia ${d}: ${by[d].length} conta(s)"><b>${d}</b><i class="dots2">${by[d].map(i => `<u class="${INST_C[instSt(i)]}"></u>`).join('')}</i></button>` : `<span class="cday${d === hoje ? ' hoje' : ''}" data-fcday="0"><b>${d}</b></span>`;
  if (S.fc.sel && !by[S.fc.sel]) S.fc.sel = null; const sel = S.fc.sel, list = mine.filter(i => !sel || +i.due_on.slice(8, 10) === sel).sort((a, b) => a.due_on.localeCompare(b.due_on));
  const ex = id => S.exp.find(x => String(x.id) === String(id)) || {}, open = S.inst.filter(i => !i.paid_on), sum = f => open.filter(f).reduce((a, i) => a + Number(i.amount), 0);
  el.innerHTML = `<div class="fsum"><div><small>A pagar</small><b>${brl(sum(i => instSt(i) !== 'late'))}</b></div><div><small>Vencidas</small><b class="neg">${brl(sum(i => instSt(i) === 'late'))}</b></div></div>
  <div class="calhead"><button type="button" data-fc="-1" aria-label="Mês anterior">‹</button><b>${MESES[m]} ${y}</b><button type="button" data-fc="1" aria-label="Próximo mês">›</button></div>
  <div class="calgrid">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => `<span class="cwd">${x}</span>`).join('')}${cells}</div>
  <div class="callegend"><span><u class="cok"></u>Paga</span><span><u class="cg"></u>Vence em até 15 dias</span><span><u class="cx"></u>Vencida</span><span><u class="cf"></u>A vencer</span></div>
  <h3>${sel ? `Contas do dia ${String(sel).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}` : `Contas de ${MESES[m].toLowerCase()}`}</h3>` +
  (list.map(i => { const e = ex(i.expense_id), st = instSt(i);
    return `<div class="card cpay"><div class="xtop"><b>${esc(e.description || 'Despesa')}</b><strong>${brl(i.amount)}</strong></div><p class="mute"><u class="${INST_C[st]}"></u><b class="cst ${st}">${INST_T[st]}</b> · Vence em ${fmt(i.due_on)}${i.paid_on ? ` · paga em ${fmt(i.paid_on)}` : ''}</p><p class="mute">${i.total > 1 ? `Parcela ${i.num} de ${i.total}` : 'Pagamento único'}${e.pay_method ? ' · ' + esc(e.pay_method) : ''}</p><div class="xact"><button type="button" class="link" data-paytgl="${i.id}">${i.paid_on ? 'Desfazer pagamento' : 'Marcar como paga'}</button><button type="button" class="link" data-xview="${esc(i.expense_id)}">Ver despesa</button></div></div>`; }).join('') || '<p class="empty">Nenhuma conta com vencimento neste período.</p>');
}
const NAV = [['home', 'Início', 'home', ['home']], ['casa', 'Minha Casa', 'layers', ['casa', 'estrutura', 'sistemas', 'materiais', 'garantias', 'manutencao', 'equipamentos', 'planta', 'midias', 'cronograma', 'detalhe', 'documentos']], ['financeiro', 'Financeiro', 'dollar', ['financeiro', 'custos']], ['assistencia', 'Suporte', 'phones', ['assistencia']]];
$('#nav').innerHTML = NAV.map(([h, l, i, g]) => `<a href="#${h}" data-g="${g.join(' ')}">${ico(IC[i])}<span>${l}</span></a>`).join('');
$('#top .bico').innerHTML = ico(IC.casa, 'brandico'); $('#bell').innerHTML = ico(IC.bell); $('#avatar').innerHTML = ico(IC.usr);
function paintAvatar() { const el = $('#avatar'), v = S.profile && S.profile.avatar; if (el) { el.innerHTML = v ? `<img class="avimg" src="${v}" alt="Perfil">` : ico(IC.usr); el.classList.toggle('hasimg', !!v); } }
// Avisos: cadastros novos feitos pelo admin na residência (gerados por gatilhos no banco; o texto é montado aqui)
const AV = { ast: ['atualização', 'atualizações', 'f', '#assistencia'], img: ['imagem', 'imagens', 'f', '#midias'], vid: ['vídeo', 'vídeos', 'm', '#midias'], doc: ['documento', 'documentos', 'm', '#documentos'], gar: ['garantia', 'garantias', 'f', '#garantias'], man: ['manutenção', 'manutenções', 'f', '#manutencao'], equip: ['equipamento', 'equipamentos', 'm', '#equipamentos'], plan: ['planta técnica', 'plantas técnicas', 'f', '#planta'], estr: ['item de Estrutura', 'itens de Estrutura', 'm', '#estrutura'], sist: ['item de Instalações', 'itens de Instalações', 'm', '#sistemas'], mat: ['material', 'materiais', 'm', '#materiais'] };
function avMsg(n) { if (n.kind === 'ast' && n.info) return n.info; const [s, p, g] = AV[n.kind] || ['item', 'itens', 'm']; return n.cnt > 1 ? `${n.cnt} ${g === 'f' ? 'novas' : 'novos'} ${p} ${g === 'f' ? 'foram cadastradas' : 'foram cadastrados'} para a sua residência` : `${g === 'f' ? 'Uma nova' : 'Um novo'} ${s} ${g === 'f' ? 'foi cadastrada' : 'foi cadastrado'} para a sua residência`; }
function fotoParaJpeg(file) {   // recorta no centro, reduz para 256x256 e converte em JPEG leve (~20 KB)
  return new Promise((ok, fail) => { const u = URL.createObjectURL(file), im = new Image(); im.onerror = () => { URL.revokeObjectURL(u); fail(new Error('img')); };
    im.onload = () => { const s = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 256; c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 256, 256); URL.revokeObjectURL(u); ok(c.toDataURL('image/jpeg', 0.82)); }; im.src = u; });
}
async function avLoad() {
  if (!S.cur || !S.profile) return [];
  const since = new Date(Date.now() - 60 * 864e5).toISOString();
  const [{ data: ns }, { data: rd }] = await Promise.all([sb.from('notifications').select('id,kind,cnt,info,updated_at').eq('residence_id', S.cur.id).gte('updated_at', since).order('updated_at', { ascending: false }).limit(50), sb.from('notification_reads').select('notification_id,read_at')]);
  const rm = {}; (rd || []).forEach(r => rm[r.notification_id] = r.read_at);
  return (ns || []).filter(n => AV[n.kind]).map(n => ({ ...n, unread: !rm[n.id] || new Date(rm[n.id]) < new Date(n.updated_at) }));
}
async function refreshBell() {   // número de avisos não lidos no sininho
  const b = $('#bell'); if (!b || !S.cur) return;
  const n = (await avLoad()).filter(x => x.unread).length;
  b.innerHTML = ico(IC.bell) + (n ? `<i class="bdg">${n > 9 ? '9+' : n}</i>` : '');
}
setInterval(() => { if (!document.hidden) refreshBell(); }, 60000); document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshBell(); });
function vsrc(u) { return String(u).replace('/upload/', '/upload/f_mp4,vc_h264,q_auto/').replace(/\.\w+$/, '.mp4'); }
function vposter(u) { return String(u).replace('/upload/', '/upload/w_480,c_limit,so_0/').replace(/\.\w+$/, '.jpg'); }
const isVidUrl = u => /\/video\/upload\//.test(u);
function carousel(urls) {
  if (!urls.length) return '<img class="heroimg" src="img/casa.jpg" alt="Foto da residência">';
  S.groups.home = urls;
  const slide = (u, i, clone) => `<img src="${esc(cld(u, 1200))}" data-orig="${esc(u)}" referrerpolicy="no-referrer" alt="Foto ${i + 1} de ${urls.length} da residência" data-lb="home|${i}"${clone ? ' aria-hidden="true"' : ''}>`, many = urls.length > 1;
  return `<div class="carousel" aria-roledescription="carrossel" aria-label="Fotos recentes da residência"><div class="slides">${urls.map((u, i) => slide(u, i)).join('')}${many ? slide(urls[0], 0, true) : ''}</div>${many ? `<button class="cn l" data-cn="-1" aria-label="Foto anterior">‹</button><button class="cn r" data-cn="1" aria-label="Próxima foto">›</button><div class="dots">${urls.map((_, i) => `<span class="dot ${i ? '' : 'on'}"></span>`).join('')}</div>` : ''}</div>`;
}
// Troca automática a cada 4,5 s, sempre para a direita: depois da última foto vem uma cópia da primeira e,
// quando ela termina de deslizar, o carrossel volta sem animação para a primeira de verdade (ninguém percebe).
function initCarousel() {
  clearInterval(S.carTimer);
  const el = app.querySelector('.slides'); if (!el || el.children.length < 3) return;
  const n = el.children.length - 1, dots = [...app.querySelectorAll('.dot')], w = () => el.clientWidth, idx = () => Math.round(el.scrollLeft / w());
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches), sm = reduce ? 'instant' : 'smooth';
  const jump = i => el.scrollTo({ left: i * w(), behavior: 'instant' });
  S.carHold = 0; S.carIdx = idx;
  S.carGo = i => { if (i < 0) { jump(n); setTimeout(() => el.scrollTo({ left: (n - 1) * w(), behavior: sm }), 30); } else el.scrollTo({ left: Math.min(i, n) * w(), behavior: sm }); };
  let settle; el.addEventListener('scroll', () => { dots.forEach((d, k) => d.classList.toggle('on', k === idx() % n)); clearTimeout(settle); settle = setTimeout(() => { if (idx() >= n) jump(0); }, 160); });
  const hold = () => { S.carHold = Date.now() + 8000; };   // depois de o usuário mexer, espera 8 s para voltar a trocar
  el.addEventListener('touchstart', hold, { passive: true }); el.addEventListener('pointerdown', hold);
  S.carTimer = setInterval(() => {
    if (!document.contains(el)) return clearInterval(S.carTimer);
    if (document.hidden || Date.now() < S.carHold) return;
    if (idx() >= n) jump(0);
    S.carGo(idx() + 1);
  }, 4500);
}
const CLD_NAME = typeof CLOUDINARY_CLOUD_NAME !== 'undefined' ? String(CLOUDINARY_CLOUD_NAME).trim() : '';
const CLD_PRESET = typeof CLOUDINARY_UPLOAD_PRESET !== 'undefined' ? String(CLOUDINARY_UPLOAD_PRESET).trim() : (typeof CLOUDINARY_PRESET !== 'undefined' ? String(CLOUDINARY_PRESET).trim() : '');
const CLOUD_OK = !!(CLD_NAME && CLD_PRESET) && !/COLE_AQUI/.test(CLD_NAME + CLD_PRESET);
const REQ_ST = { 'Recebida': 's-pend', 'Aguardando informações': 's-ana', 'Encerrada': 's-conc', 'Em análise': 's-ana', 'Agendada': 's-agd', 'Em atendimento': 's-and', 'Atrasada': 's-late', 'Concluída': 's-conc' }, REQ_UR = { 'Crítica': 'u-crit', 'Alta': 'u-alta', 'Média': 'u-med', 'Baixa': 'u-baixa' };
async function cldPost(file, folder) {
  const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', CLD_PRESET); fd.append('folder', folder);
  const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLD_NAME}/auto/upload`, { method: 'POST', body: fd });
  const j = await resp.json(); if (!resp.ok) throw new Error((j.error && j.error.message) || 'erro no envio'); return j;
}
// Mídias que não carregam (rede bloqueando o Cloudinary, WebView, formato): tenta alternativas e, por fim, mostra aviso com botão "Tentar novamente"
const MSG_REDE = 'Não foi possível carregar. Verifique a sua rede ou utilize seus dados móveis.';
function midBad(t, orig, isVid) {
  const d = document.createElement('div'); d.className = 'midbad'; d.setAttribute('role', 'alert'); d._el = t;
  d.innerHTML = `<span>${MSG_REDE}</span><button type="button" data-retry>Tentar novamente</button>${isVid ? `<a href="${esc(orig)}" target="_blank" rel="noopener">Abrir o vídeo</a>` : ''}`;
  t.replaceWith(d);
}
document.addEventListener('error', e => {
  const t = e.target; if (!t || !t.tagName) return; const tag = t.tagName, orig = t.dataset && t.dataset.orig; if (!orig || (tag !== 'IMG' && tag !== 'VIDEO')) return;
  const n = +(t.dataset.rt || 0); t.dataset.rt = n + 1;
  if (!t.dataset.s0) t.dataset.s0 = tag === 'IMG' ? (t.getAttribute('src') || '') : (t.getAttribute('poster') || '');
  if (tag === 'IMG') {
    if (n === 0) { const vid = isVidUrl(orig); t.src = vid ? String(orig).replace('/upload/', '/upload/so_0/').replace(/\.\w+$/, '.jpg') : orig; return; }   // 2ª tentativa: poster simples / arquivo original
    if (n === 1 && !isVidUrl(orig)) { t.src = String(orig).replace('/upload/', '/upload/f_jpg/'); return; }   // 3ª: força JPEG
    midBad(t, orig, isVidUrl(orig)); return;
  }
  if (n === 0) { t.removeAttribute('poster'); t.src = orig; t.load(); return; }   // vídeo: arquivo original (sem conversão)
  midBad(t, orig, true);
}, true);
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-retry]'); if (!b) return;
  e.preventDefault(); e.stopPropagation();
  const d = b.closest('.midbad'), t = d && d._el; if (!t) return;
  t.dataset.rt = 0;
  if (t.tagName === 'IMG') t.src = t.dataset.s0 || t.dataset.orig; else { t.src = t.dataset.orig; }
  d.replaceWith(t); if (t.tagName === 'VIDEO') t.load();
}, true);
function cld(u, w) { return String(u).replace('/upload/', `/upload/w_${w},c_limit,q_auto,f_auto/`); }
function grp(key, urls, cls = 'thumbs') {
  S.groups[key] = urls;
  return `<div class="${cls}">${urls.map((u, i) => isVidUrl(u) ? `<span class="vt"><img src="${esc(vposter(u))}" alt="Vídeo ${i + 1}" data-orig="${esc(u)}" referrerpolicy="no-referrer" data-lb="${key}|${i}"><i>▶</i></span>` : `<img src="${esc(cld(u, cls === 'thumbs' ? 240 : 500))}" alt="Imagem ${i + 1}" data-orig="${esc(u)}" referrerpolicy="no-referrer" data-lb="${key}|${i}">`).join('')}</div>`;
}
function showLb() {
  const u = S.groups[S.lb.g], cur = u[S.lb.i], lb = $('#lb'); lb.hidden = false;
  const media = isVidUrl(cur) ? `<video controls autoplay playsinline referrerpolicy="no-referrer" data-orig="${esc(cur)}" src="${esc(vsrc(cur))}" poster="${esc(vposter(cur))}"></video>` : `<img src="${esc(cld(cur, 1400))}" data-orig="${esc(cur)}" referrerpolicy="no-referrer" alt="Imagem ${S.lb.i + 1} de ${u.length}">`;
  lb.innerHTML = `<button class="lbx" data-lbx aria-label="Fechar">×</button>${u.length > 1 ? '<button class="lbn l" data-lbn="-1" aria-label="Anterior">‹</button><button class="lbn r" data-lbn="1" aria-label="Próxima">›</button>' : ''}${media}`;
}
// Menu Casa: abas Todos / Imagens / Vídeos
function mediaBlock() {
  const m = S.media || []; if (!m.length) return '';
  const isV = x => x.media_type === 'video' || isVidUrl(x.url), vids = m.filter(isV), imgs = m.filter(x => !isV(x)), tab = S.casaTab || 'all';
  const list = ({ all: m, img: imgs, vid: vids }[tab] || m).map(x => x.url);
  const tabs = [['all', 'Todos', m.length], ['img', 'Imagens', imgs.length], ['vid', 'Vídeos', vids.length]];
  return `<h3>Fotos e vídeos</h3><div class="tabs three" role="tablist">${tabs.map(([k, l, c]) => `<button role="tab" aria-selected="${tab === k}" class="${tab === k ? 'on' : ''}" data-ct="${k}">${l} (${c})</button>`).join('')}</div>` +
    (list.length ? grp('casa-' + tab, list, 'gallery') : `<p class="empty">${tab === 'img' ? 'Nenhuma imagem cadastrada.' : 'Nenhum vídeo cadastrado.'}</p>`);
}
const linkrow = (h, t, s, i) => `<a class="linkrow" href="#${h}">${ico(IC[i])}<span><b>${t}</b><small>${s}</small></span>${ico(IC.chev)}</a>`;
const PL_VIEW = ['glb', 'gltf'], plExt = n => (String(n).split('.').pop() || '').toLowerCase(), plSize = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
const MV_SRC = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js';
function loadMV() { if (window.__mvLoading) return; window.__mvLoading = true; const sc = document.createElement('script'); sc.type = 'module'; sc.src = MV_SRC; document.head.appendChild(sc); }
const mtype = x => ['image', 'video', 'pdf', '3d'].includes(x.type) ? x.type : /^image\//.test(x.type || '') ? 'image' : x.type === 'application/pdf' ? 'pdf' : x.url && isVidUrl(x.url) ? 'video' : x.url ? 'image' : 'file';
async function itemsView(k) {
  const cat = BCAT[k];
  const { data } = await sb.from('building_items').select('*').eq('residence_id', S.cur.id).eq('category', cat).order('created_at');
  const rows = (data || []).filter(r => staff() || r.visible !== false);
  app.innerHTML = `<h1 class="ptitle">${k === 'sistemas' ? 'Instalações' : cat}</h1>` +
    (staff() ? formOf('bitem', 'Adicionar item', `<input type="hidden" name="category" value="${cat}"><label>Título<input name="title" required></label><label>Descrição<textarea name="description" rows="3"></textarea></label><label>Destaques (um por linha)<textarea name="highlights" rows="4"></textarea></label>`) : '') +
    (rows.map(r => {
      const med = (r.media || []).filter(x => x.visible !== false).map(x => ({ ...x, t: mtype(x) })), vis = med.filter(x => x.t === 'image' || x.t === 'video' && x.url), docs = med.filter(x => (x.t === 'pdf' || x.t === '3d') && x.path);
      return `<section class="item"><h2>${esc(r.title)}</h2>${r.description ? `<p class="mute pre">${esc(r.description)}</p>` : ''}<ul class="checks">${(r.highlights || '').split('\n').filter(Boolean).map(h => `<li>${ico(IC.check)}${esc(h)}</li>`).join('')}</ul>` +
        (vis.length ? grp('bi-' + r.id, vis.map(x => x.url), 'gallery') : '') +
        (docs.length ? `<div class="bdocs">${docs.map(x => `<div class="bdoc">${ico(x.t === '3d' ? IC.layers : IC.doc)}<span><b>${x.t === '3d' ? 'Modelo 3D' : 'PDF'} · ${esc(x.name || 'arquivo')}</b>${x.size ? `<small>${plSize(x.size)}</small>` : ''}</span>${x.t === 'pdf' ? `<button type="button" data-open="${esc(x.path)}">Abrir</button>` : PL_VIEW.includes(plExt(x.name)) ? `<button type="button" data-v3d="${esc(x.path)}|${esc(x.name)}">Ver em 3D</button>` : ''}<button type="button" class="ghost2" data-dl="${esc(x.path)}|${esc(x.name || 'arquivo')}">Baixar</button></div>`).join('')}</div>` : '') +
        `${staff() ? `<button class="link" data-del="building_items:${r.id}">Excluir</button>` : ''}</section>`;
    }).join('') || '<p class="empty">A Astell ainda não publicou as informações desta seção.</p>');
}
const rmFmt = d => { const x = new Date(d); return x.toLocaleDateString('pt-BR') + ' ' + x.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
const rmBubbles = id => ((S.rmsgs && S.rmsgs[id]) || []).map(m => `<div class="rm ${m.author_role === 'staff' ? 'st' : 'me'}"><span class="rmw">${m.author_role === 'staff' ? 'Astell' : 'Você'} · ${rmFmt(m.created_at)}</span><p>${esc(m.body)}</p></div>`).join('');
const reqChat = r => {   // conversa entre o cliente e a equipe dentro do card da solicitação
  const L = (S.rmsgs && S.rmsgs[r.id]) || [], waiting = L.length && L[L.length - 1].author_role === 'staff';
  return `<div class="reqchat" id="rc-${r.id}"><span class="lbl">Conversa com a Astell${L.length ? ' (' + L.length + ')' : ''}</span>${L.length ? `<div class="rml">${rmBubbles(r.id)}</div>` : ''}${waiting ? '<p class="rmwait">A Astell aguarda a sua resposta.</p>' : ''}<form data-form="rmsg" data-id="${r.id}" class="rmf"><textarea name="body" rows="2" maxlength="2000" required placeholder="${L.length ? 'Escreva sua resposta…' : 'Quer acrescentar alguma informação? Escreva aqui.'}" aria-label="Mensagem para a Astell"></textarea><button>Enviar</button></form></div>`;
};
async function rmReload(id) {
  const { data } = await sb.from('service_messages').select('*').eq('request_id', id).order('created_at'); S.rmsgs = S.rmsgs || {}; S.rmsgs[id] = data || [];
  const el = document.getElementById('rc-' + id), r = (S.reqs || []).find(x => x.id === id); if (el && r) { el.outerHTML = reqChat(r); const l = document.querySelector('#rc-' + id + ' .rml'); if (l) l.scrollTop = l.scrollHeight; }
}
const reqCard = r => { const fotos = (r.media || []).filter(x => x.url).map(x => x.url), hj = new Date(), hjI = hj.getFullYear() + '-' + String(hj.getMonth() + 1).padStart(2, '0') + '-' + String(hj.getDate()).padStart(2, '0'),
    late = r.status === 'Atrasada' || (r.scheduled_for && String(r.scheduled_for) < hjI && !['Concluída', 'Encerrada'].includes(r.status)), base = r.status === 'Atrasada' ? (r.status_before || 'Agendada') : r.status;   // atrasada: mantém a situação de antes e acrescenta a etiqueta vermelha
  return `<div class="card"><b>${esc(r.protocol)}</b> <span class="badge ${REQ_ST[base] || ''}">${esc(base)}</span> <span class="badge ${REQ_UR[r.urgency] || 'u-med'}">${esc(r.urgency || 'Média')}</span>${late ? ' <span class="badge s-late">Atrasada</span>' : ''}<p>${esc(r.category)} · ${esc(r.place)}</p><p>${esc(r.description)}</p>${r.preferred_date || r.contact_time ? `<p class="mute">Sua sugestão: ${r.preferred_date ? 'dia ' + fmt(r.preferred_date) : ''}${r.preferred_date && r.contact_time ? ' · ' : ''}${r.contact_time ? 'horário ' + esc(r.contact_time) : ''}</p>` : ''}${r.scheduled_for ? `<p class="sched">${ico(IC.calendar)}<span>Data prevista de atendimento: <b>${fmt(r.scheduled_for)}</b></span></p>` : ''}${fotos.length ? grp('req' + r.id, fotos) : ''}${r.staff_note ? `<div class="astnote"><span class="lbl">Assistência que será feita</span><p>${esc(r.staff_note)}</p></div>` : ''}${reqChat(r)}
      ${staff() ? `<form data-form="upd" data-id="${r.id}">${sel('status', 'Situação', STATUS).replace(`<option>${base}`, `<option selected>${base}`)}<label>Comentário<input name="staff_note" value="${esc(r.staff_note || '')}"></label><button>Atualizar</button></form>` : ''}</div>`; };
const warCard = r => { const w = wInfo(r); return `<div class="card"><b>${esc(r.system)}</b><div class="wbox w-${w.kind}">${w.kind === 'warn' ? `<p class="wwarn">Garantia próxima do vencimento - faltam ${w.txt}</p>` : w.kind === 'bad' ? `<p class="wexp">Garantia expirada em ${w.end.toLocaleDateString('pt-BR')}</p>` : ''}<div class="wfig"><div><span class="wnum wtot">${w.total}</span><span class="wlbl">Prazo total</span></div><div><span class="wnum wrem">${w.kind === 'bad' ? 'Expirada' : w.big}</span><span class="wlbl">${w.kind === 'bad' ? 'Vencida' : 'Restantes'}</span></div></div><div class="wbar" role="img" aria-label="Tempo restante da garantia"><i style="width:${w.pct.toFixed(1)}%"></i></div><span class="wpill">${w.s}</span></div>${r.coverage ? `<p>${esc(r.coverage)}</p>` : ''}${r.fromExp ? xSup(r) : `<p><a class="xcontact" href="https://wa.me/5554996528034" target="_blank" rel="noopener">Contate a ASTELL</a></p>`}<span class="mute">${fmt(r.start_date)} até ${w.end.toLocaleDateString('pt-BR')}</span>${r.notes ? `<p class="mute">${esc(r.notes)}</p>` : ''}${staff() && !r.fromExp ? `<button class="link" data-del="warranties:${r.id}">Excluir</button>` : ''}</div>`; };
const expWar = e => ({ id: e.id, system: e.description, coverage: 'Item de Despesas', supplier: e.supplier, supplier_phone: e.supplier_phone, start_date: e.spent_on, months: e.warranty_months, notes: e.notes, fromExp: true });   // garantia cadastrada junto da despesa (só aparece no app do cliente)
async function garantiasView() {
  const [{ data }, { data: ex }] = await Promise.all([sb.from('warranties').select('*').eq('residence_id', S.cur.id).order('start_date'), sb.from('expenses').select('*').eq('residence_id', S.cur.id).not('warranty_months', 'is', null)]);
  const per = m => m % 12 ? `${m} meses` : `${m / 12} ${m === 12 ? 'ano' : 'anos'}`;
  app.innerHTML = `<div class="gtitle">${ico(IC.shield, 'big')}<h1>Garantias</h1><p class="mute">Mais segurança para o seu investimento.</p></div>
  <div class="card gsum"><b>Resumo da garantia</b><div id="gs"></div><p class="mute">Sua casa conta com garantia de acordo com o contrato e a legislação vigente.</p></div>` +
    (staff() ? formOf('warranties', 'Adicionar garantia', T.warranties.f.map(input).join('')) : '') +
    `<h3>Prazos por sistema</h3><div id="gl"></div>` +
    linkrow('assistencia', 'Solicitar assistência', 'Precisa de suporte? Fale com a nossa equipe.', 'phones') + `<p class="notice">${T.warranties.note}</p>`;
  S.gw = [...(data || []), ...(ex || []).map(expWar)].map(r => ({ r, k: wInfo(r).kind })).sort((a, b) => String(a.r.start_date).localeCompare(String(b.r.start_date))); S.gf = null; gaPaint();
}
function gaPaint() {   // resumo (números = filtros) + lista filtrada
  const all = S.gw || [], n = k => all.filter(x => x.k === k).length, two = v => String(v), f = S.gf;
  const box = (k, v, l, c) => `<button type="button" class="gnum ${c}${f === k ? ' on' : ''}" data-gf="${k || 'all'}" aria-pressed="${f === k}"><b>${two(v)}</b><span>${l}</span></button>`;
  const tot = all.length, pc = v => tot ? (v / tot * 100).toFixed(2) : 0;
  const gs = $('#gs'), gl = $('#gl'); if (!gs || !gl) return;
  gs.innerHTML = `<div class="gnums">${box('ok', n('ok'), 'Garantias vigentes', 'n-ok')}${box('warn', n('warn'), 'Próximas do vencimento', 'n-warn')}${box('bad', n('bad'), 'Garantias expiradas', 'n-bad')}${box(null, tot, 'Total de garantias', 'n-all')}</div>
  <h4>Distribuição das garantias</h4><div class="gdist" role="img" aria-label="Distribuição das garantias">${tot ? `<i class="gok" style="width:${pc(n('ok'))}%"></i><i class="gwarn" style="width:${pc(n('warn'))}%"></i><i class="gbad" style="width:${pc(n('bad'))}%"></i>` : ''}</div>
  <div class="gleg"><span><u class="gok"></u>Vigentes</span><span><u class="gwarn"></u>Próximas do vencimento</span><span><u class="gbad"></u>Expiradas</span></div>`;
  const rows = all.filter(x => !f || x.k === f);
  gl.innerHTML = rows.map(x => warCard(x.r)).join('') || `<p class="empty">${all.length ? 'Nenhuma garantia neste status.' : 'Nenhuma garantia cadastrada ainda.'}</p>`;
}
const DEFREQ = ['system', 'name', 'description', 'months', 'start_date', 'event_date'];
const fld = ([k, l, t = 'text', req], v = {}) => {
  const val = v[k] ?? (k === 'months' ? 1 : ''), r = (req ?? DEFREQ.includes(k)) ? 'required' : '';
  if (Array.isArray(t)) return `<label>${l}<select name="${k}">${t.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
  return `<label>${l}${t === 'textarea' ? `<textarea name="${k}" rows="3" ${r}>${esc(val)}</textarea>` : `<input name="${k}" type="${t}" value="${esc(val)}" ${r}${t === 'number' && /months/.test(k) ? ` min="${k === 'months' ? 1 : 0}" step="1" inputmode="numeric" data-nonneg` : ''}>`}</label>`;
};
const input = f => fld(f);
const RES_F = [['code', 'Código (ex.: AST-2026-002)', 'text', true], ['name', 'Nome da residência', 'text', true], ['address', 'Endereço'], ['area_m2', 'Área construída (m²)', 'number'], ['floors', 'Pavimentos', 'number'], ['build_system', 'Sistema construtivo'], ['project_no', 'Nº do projeto'], ['start_date', 'Início da obra', 'date'], ['delivery_date', 'Entrega', 'date'], ['tech_lead', 'Responsável técnico'], ['notes', 'Observações', 'textarea']];
const sel = (name, label, opts) => `<label>${label}<select name="${name}">${opts.map(o => `<option>${o}</option>`).join('')}</select></label>`;
const formOf = (id, title, inner, btn = 'Salvar') => `<details class="card"><summary>${title}</summary><form data-form="${id}">${inner}<button>${btn}</button></form></details>`;
const clean = o => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, v === '' ? null : v]));

async function listView(k) {
  const c = T[k];
  const { data, error } = await sb.from(k).select('*').eq('residence_id', S.cur.id).order(c.order || 'created_at', { ascending: false });
  if (error) return toast('Não foi possível carregar os dados.', 1);
  S.rows = S.rows || {}; S.rows[k] = data;
  const im = {};
  if (k === 'maintenance_tasks') { const { data: ii } = await sb.from('images').select('url,ref_id').eq('residence_id', S.cur.id).eq('kind', 'maintenance').order('created_at'); (ii || []).forEach(x => (im[x.ref_id] = im[x.ref_id] || []).push(x.url)); }
  const ed = S.edit && S.edit.k === k ? data.find(r => r.id === S.edit.id) : null;
  const form = !staff() ? '' : ed ? `<form class="card" data-form="edit:${k}" data-id="${ed.id}"><b>Editar</b>${c.f.map(f => fld(f, ed)).join('')}<button>Salvar alterações</button><button type="button" class="ghost2" data-cancel>Cancelar</button></form>` : formOf(k, 'Adicionar', c.f.map(input).join(''));
  const btns = r => !staff() ? '' : `<div class="acts"><button class="link" data-edit="${k}:${r.id}">Editar</button>${'visible' in r ? `<button class="link" data-vis="${k}:${r.id}">${r.visible ? 'Ocultar do cliente' : 'Mostrar ao cliente'}</button>` : ''}${k === 'maintenance_tasks' ? `<button class="link" data-done="${r.id}">Marcar como executada</button>` : ''}<button class="link danger" data-del="${k}:${r.id}">Excluir</button></div>`;
  app.innerHTML = `<h2>${c.label}</h2>` + form +
    (data.length ? data.map(r => `<div class="card">${c.row(r)}${im[r.id] ? grp('m' + r.id, im[r.id]) : ''}${r.visible === false ? '<p><span class="badge">Oculto do cliente</span></p>' : ''}${btns(r)}</div>`).join('') : '<p class="empty">Nada cadastrado ainda. A Astell publica as informações da sua casa aqui.</p>') +
    (c.note ? `<p class="notice">${c.note}</p>` : '');
}

const views = {
  async avisos() {
    const l = await avLoad(), fd = s => { const d = new Date(s); return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }); };
    app.innerHTML = `<h2>Avisos</h2>${l.some(x => x.unread) ? '<button type="button" class="avall" data-avall>Marcar todos como lidos</button>' : ''}${l.length ? l.map(n => `<a class="card calnote avn${n.unread ? ' unread' : ''}" href="${AV[n.kind][3]}" data-avread="${n.id}"><u class="cm"></u><p>${esc(avMsg(n))}.<small>${fd(n.updated_at)}</small></p>${ico(IC.chev)}</a>`).join('') : '<p class="empty">Nenhum aviso por enquanto. Quando a Astell cadastrar algo novo ou responder às suas assistências, o aviso aparece aqui.</p>'}`; S.avl = l;
  },
  async home() {
    const r = S.cur;
    const [{ data: hi }, evs, { data: docs }] = await Promise.all([
      sb.from('images').select('*').eq('residence_id', r.id).eq('kind', 'residence').order('created_at', { ascending: false }).limit(30),
      calEvents(r.id),
      sb.from('doc_records').select('title,files').eq('residence_id', r.id).eq('kind', 'construtoras').order('created_at', { ascending: false })]);
    const pics = (hi || []).filter(x => (x.media_type || 'image') === 'image').sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 5).map(x => x.url);
    const hj = new Date().toISOString().slice(0, 10), nx = (evs || []).find(x => String(x.d) >= hj);
    const hr = new Date().getHours(), sau = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite', nome = String((S.profile && !/@/.test(S.profile.name || '') && S.profile.name) || '').trim().split(/\s+/)[0];
    const nm = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim(), man = (docs || []).find(d => nm(d.title) === 'manual do proprietario') || (docs || []).find(d => nm(d.title).includes('manual do proprietario')), mf = man && (man.files || []);   // Manual do Proprietário: registro de Construtoras com esse título (sem diferenciar maiúsculas/acentos)
    const chip = (t, ic, inner) => `<a class="dchip" href="#documentos?${ic}">${ico(IC.doc)}<span>${t}</span>${ico(IC.dl)}</a>`;
    const mchip = mf && mf.length === 1 ? `<button type="button" class="dchip" data-open="${esc(mf[0].path)}">${ico(IC.doc)}<span>Manual do Proprietário</span>${ico(IC.dl)}</button>` : chip('Manual do Proprietário', 'cons');
    const sec = (t, s, extra = '') => `<div class="sec"><i class="sbar"></i><div><h2>${t}</h2><p>${s}</p></div>${extra}</div>`;
    app.innerHTML = `<h1 class="greet">${sau}${nome ? `, <span>${esc(nome)}!</span>` : '!'}</h1><p class="greetsub">Sua casa, sempre ao seu alcance.</p><i class="gline"></i>
    <div class="rescard2">${ico(IC.casa)}<span><b>${esc(r.name)}</b><small>${ico(IC.pin)}${esc(r.address || r.code)}</small></span>${ico(IC.chevd, 'cd')}${S.res.length > 1 ? `<select id="homeSel" aria-label="Trocar de residência">${S.res.map(x => `<option value="${x.id}" ${x.id === r.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>` : ''}</div>
    <div class="hero2">${carousel(pics)}<div class="hbar"><span class="hok"><i>${ico(IC.tick)}</i>Residência cadastrada</span>${r.build_system ? `<span class="hsep"></span><span class="hsys">${esc(r.build_system)}</span>` : ''}<a class="hdet" href="#casa">${ico(IC.image)}Ver detalhes</a></div></div>
    ${sec('Sua casa', 'Acesse tudo sobre sua residência')}
    <div class="tiles2">${TILES.map(([h, t, s, i]) => `<a class="tile2" href="#${h}">${ico(IC[i], 'tico')}<span><b>${t}</b><small>${s}</small></span>${ico(IC.chev)}</a>`).join('')}</div>
    <div class="assist">${ico(IC.phones, 'aico')}<i class="vsep"></i><span><b>Precisa de assistência?</b><small>Estamos aqui para ajudar com sua residência.</small></span><a class="abtn" href="#assistencia?nova"><span>SOLICITAR<br>ATENDIMENTO</span>${ico(IC.chev)}</a></div>
    ${sec('Manutenção preventiva', 'Mantenha sua casa sempre em perfeito estado')}
    <div class="prev">${ico(IC.calendar, 'pico')}<span><small>Próxima recomendação:</small>${nx ? `<b>${esc(nx.t)}</b><small>${CAL_K[nx.k][0]} · ${fmt(nx.d)}</small>` : '<b>Nada agendado</b><small>Veja o cronograma completo.</small>'}</span><a class="pbtn" href="#cronograma">Ver cronograma${ico(IC.chev)}</a></div>
    ${sec('Documentos importantes', 'Acesse seus documentos sempre que precisar', `<a class="seall" href="#documentos">Ver todos${ico(IC.chev)}</a>`)}
    <div class="dchips">${mchip}${chip('Plantas Técnicas', 'plan')}</div>`;
    initCarousel();
  },
  async casa() {
    const { data: im0 } = await sb.from('images').select('*').eq('residence_id', S.cur.id).eq('kind', 'residence').order('created_at');
    const r = S.cur, rows = [['Código', r.code], ['Endereço', r.address], ['Área construída', r.area_m2 && r.area_m2 + ' m²'], ['Pavimentos', r.floors], ['Sistema construtivo', r.build_system], ['Nº do projeto', r.project_no], ['Início da obra', fmt(r.start_date)], ['Entrega', fmt(r.delivery_date)], ['Responsável técnico', r.tech_lead], ['Observações', r.notes]];
    const CARDS = [['documentos', 'Documentos', 'doc'], ['midias', 'Mídias', 'image'], ['estrutura', 'Estrutura', 'layers'], ['sistemas', 'Instalações', 'bolt'], ['garantias', 'Garantias', 'shield'], ['manutencao', 'Manutenções', 'wrench'], ['assistencia', 'Assistências', 'phones'], ['cronograma', 'Cronograma', 'calendar'], ['financeiro', 'Financeiro', 'dollar']];
    app.innerHTML = `<h2>${esc(r.name)}</h2><div class="card">${rows.map(([a, b]) => `<p><span class="mute">${a}</span><br>${esc(b || '—')}</p>`).join('')}</div><div class="cgrid">${CARDS.map(([h, t, i]) => `<a class="card ccard" href="#${h}">${ico(IC[i])}<b>${t}</b></a>`).join('')}</div>`;
  },
  async financeiro() {
    const q = S.q, SUB = { relatorios: ['Relatórios', 'Gráficos e indicadores.'] };
    if (SUB[q]) { app.innerHTML = `<h2>${SUB[q][0]}</h2><div class="card"><p>${SUB[q][1]}</p><p class="mute">Esta área está em desenvolvimento e ficará disponível em breve.</p></div><a class="btn-cancel" href="#financeiro">Voltar ao Financeiro</a>`; return; }
    await finLoad(); const dq = t => { try { return decodeURIComponent(t); } catch { return t; } };
    if (q === 'contas') { const n = new Date(); S.fc = { y: n.getFullYear(), m: n.getMonth(), sel: null }; app.innerHTML = '<h2>Contas a pagar</h2><div class="card" id="fcal"></div>'; contasPaint(); return; }
    if (q === 'orcamentos') { app.innerHTML = orcView(); return; }
    if (q === 'orcnova') { app.innerHTML = orcForm(); orcFormInit(); return; }
    let m;
    if ((m = /^orcedit=(.+)$/.exec(q))) { const c = dq(m[1]); if (!cbOf(c)) { app.innerHTML = '<p class="empty">Esta categoria não tem orçamento lançado.</p><a class="btn-cancel" href="#financeiro?orcamentos">Voltar</a>'; return; } app.innerHTML = orcForm(c); orcFormInit(c); return; }
    if ((m = /^cat=(.+)$/.exec(q))) { app.innerHTML = catView(dq(m[1])); return; }
    if ((m = /^sub=([^&]+)&(.+)$/.exec(q))) { app.innerHTML = subView(dq(m[1]), dq(m[2])); return; }
    app.innerHTML = '<div id="fin"></div>'; finPaint();
  },
  async custos() {
    const rid = S.cur.id, [{ data: ex }, { data: cs }, { data: ss }] = await Promise.all([sb.from('expenses').select('*').eq('residence_id', rid).order('spent_on', { ascending: false }).order('created_at', { ascending: false }), sb.from('expense_categories').select('name').order('name'), sb.from('expense_subcategories').select('category,name')]);
    S.exp = ex || []; S.xcats = xCats(cs || [], S.exp); S.xsubs = ss || []; await instLoad();
    if (S.nova) { app.innerHTML = xForm({}, 'new'); return; }
    if (S.xv) { const x = S.exp.find(z => String(z.id) === S.xv.id); if (!x) return app.innerHTML = '<p class="empty">Não foi possível encontrar este lançamento.</p><a class="btn-cancel" href="#custos">Voltar</a>'; app.innerHTML = xForm(x, S.xv.m === 'ver' ? 'view' : 'edit'); return; }
    const now = new Date(); S.xm = { y: now.getFullYear(), m: now.getMonth() };
    app.innerHTML = `<h2>Despesas</h2><p class="mute">Acompanhe os gastos da sua obra.</p><div class="card xsum"><b>Resumo dos gastos</b><div id="xs"></div></div><a class="newreq" href="#custos?nova">+ Lançar despesa</a><div id="xh"></div>`;
    xPaint();
  },
  async midias() {
    const { data } = await sb.from('images').select('*').eq('residence_id', S.cur.id).eq('kind', 'residence').order('created_at');
    S.media = data || []; S.casaTab = 'all'; app.innerHTML = `<h2>Mídias</h2><div id="mb">${mediaBlock() || '<p class="empty">Nenhuma mídia cadastrada ainda.</p>'}</div>`;
  },
  async cronograma() { const ev = await calEvents(S.cur.id), n = new Date(); S.cal = { y: n.getFullYear(), m: n.getMonth(), ev }; app.innerHTML = '<h2>Cronograma</h2><div id="cal"></div>'; calPaint(); },
  async detalhe() {
    const [k, id] = S.q.split(':'), tb = { man: 'maintenance_tasks', ast: 'service_requests', gar: 'warranties', gex: 'expenses' }[k], { data: r } = tb ? await sb.from(tb).select('*').eq('id', id).maybeSingle() : { data: null };
    if (!r) return app.innerHTML = '<p class="empty">Não foi possível encontrar este item.</p>';
    if (k === 'ast') return app.innerHTML = `<h2>Assistência</h2>${reqCard(r)}`;
    if (k === 'gex') return app.innerHTML = `<h2>Garantia</h2>${warCard(expWar(r))}`;
    if (k === 'gar') return app.innerHTML = `<h2>Garantia</h2>${warCard(r)}`;
    const { data: ii } = await sb.from('images').select('url').eq('residence_id', S.cur.id).eq('kind', 'maintenance').eq('ref_id', r.id).order('created_at'), im = (ii || []).map(x => x.url);
    app.innerHTML = `<h2>Manutenção</h2><div class="card">${T.maintenance_tasks.row(r)}${im.length ? grp('m' + r.id, im) : ''}</div>`;
  },
  manutencao: () => listView('maintenance_tasks'), garantias: garantiasView, estrutura: () => itemsView('estrutura'), sistemas: () => itemsView('sistemas'), materiais: () => itemsView('materiais'), equipamentos: () => listView('equipment'),
  async documentos() {   // mesmas seis pastas do painel admin; dentro de cada uma, tudo o que foi cadastrado para a residência
    const q = S.q, c = DCATS[q], rid = S.cur.id;
    if (!c) { app.innerHTML = `<h2>Documentos</h2><div class="cgrid">${Object.entries(DCATS).map(([k, x]) => `<a class="card ccard" href="#documentos?${k}">${ico(IC[x.i])}<b>${x.l}</b></a>`).join('')}</div>`; return; }
    if (q !== 'geral') {
      const { data, error } = await sb.from('doc_records').select('*').eq('residence_id', rid).eq('kind', c.kind).order('doc_date', { ascending: false }).order('created_at', { ascending: false });
      if (error) { app.innerHTML = `<h2>${c.l}</h2><p class="empty">Não foi possível carregar esta pasta agora.</p><a class="btn-cancel" href="#documentos">Voltar</a>`; return; }
      app.innerHTML = `<h2>${c.l}</h2>` + ((data || []).map(d => { const e = d.extra || {};
        const lines = c.f.filter(([k]) => e[k]).map(([k, l, t]) => `<span class="mute meta">${l}: ${esc(t === 'date' ? fmt(e[k]) : e[k])}</span>`).join('');
        const files = (d.files || []).map(x => `<button type="button" class="dfile" data-open="${esc(x.path)}">${ico(IC.doc)}<span>${x.type === 'application/pdf' ? 'PDF' : 'Imagem'} · ${esc(x.name)}</span>${ico(IC.dl)}</button>`).join('');
        return `<div class="card dcard"><b>${esc(d.title)}</b><span class="mute meta">Data: ${fmt(d.doc_date)}</span>${lines}${d.notes ? `<p class="mute">${esc(d.notes)}</p>` : ''}<div class="dfiles">${files || '<span class="mute">Sem arquivos.</span>'}</div></div>`; }).join('') || '<p class="empty">Nada cadastrado nesta pasta para a sua residência.</p>') + '<a class="btn-cancel" href="#documentos">Voltar aos documentos</a>';
      return;
    }
    const { data } = await sb.from('documents').select('*').eq('residence_id', rid).order('created_at', { ascending: false });
    S.rows = S.rows || {}; S.rows.documents = data;
    const up = staff() ? formOf('doc', 'Enviar documento', `<label>Título<input name="title" required></label>${sel('category', 'Categoria', DOC_CATS)}<label>Versão<input name="version"></label><label>Descrição<input name="description"></label><label>Arquivo<input name="file" type="file" required></label>`, 'Enviar') : '';
    app.innerHTML = `<h2>${c.l}</h2>${up}` + ((data || []).map(d => `<div class="card"><b>${esc(d.title)}</b><span class="mute">${esc(d.category)} · v${esc(d.version || '1')} · ${fmt(d.created_at.slice(0, 10))}</span><p>${esc(d.description)}</p><button data-open="${esc(d.path)}">Abrir</button>${staff() ? `<button class="link" data-vis="documents:${d.id}">${d.visible ? 'Ocultar do cliente' : 'Mostrar ao cliente'}</button> <button class="link" data-deldoc="${d.id}|${esc(d.path)}">Excluir</button>` : ''}</div>`).join('') || '<p class="empty">Nenhum documento disponível ainda.</p>') + '<a class="btn-cancel" href="#documentos">Voltar aos documentos</a>';
  },
  async assistencia() {
    const fields = `${sel('category', 'Categoria', REQ_CATS)}<label>Local da casa<input name="place" required></label><label>Descreva a assistência de que você precisa<textarea name="description" rows="6" required placeholder="Conte o que aconteceu, onde, desde quando e qualquer detalhe que ajude a equipe."></textarea></label>${CLOUD_OK ? '<label>Fotos e vídeos do problema (opcional)<input name="photos" type="file" accept="image/*,video/*" multiple></label><p class="mute">Até 8 arquivos: imagens de até 10 MB e vídeos de até 100 MB cada.</p>' : ''}${dpField('preferred_date', 'Melhor data para o atendimento (opcional)')}${tmField('contact_time', 'Melhor horário para contato (opcional)')}`;
    if (S.nova) { app.innerHTML = `<h2>Nova solicitação de assistência</h2><p class="notice">Esta é uma solicitação formal. Em risco imediato (gás, fogo, choque), afaste-se e ligue 193 ou 192.</p><form class="card" data-form="req">${fields}<button>Enviar solicitação</button><a class="btn-cancel" href="#assistencia">Cancelar</a></form>`; return; }
    await sb.rpc('mark_late_requests');
    const { data } = await sb.from('service_requests').select('*').eq('residence_id', S.cur.id).order('created_at', { ascending: false });
    S.reqs = data || []; S.rmsgs = {}; if (S.reqs.length) { const { data: ms } = await sb.from('service_messages').select('*').in('request_id', S.reqs.map(r => r.id)).order('created_at'); (ms || []).forEach(m => (S.rmsgs[m.request_id] = S.rmsgs[m.request_id] || []).push(m)); }
    app.innerHTML = `<h2>Assistência técnica</h2><p class="notice">Esta é uma solicitação formal. Em risco imediato (gás, fogo, choque), afaste-se e ligue 193 ou 192.</p><a class="newreq" href="#assistencia?nova">+ Nova solicitação</a>` +
      ((data || []).map(reqCard).join('') || '<p class="empty">Você ainda não abriu solicitações.</p>');
  },
  async planta() {
    const rid = S.cur.id;
    const [{ data: fp }, { data: pts }] = await Promise.all([sb.from('floorplans').select('*').eq('residence_id', rid).not('path', 'is', null).order('created_at'), sb.from('plan_points').select('*').eq('residence_id', rid)]);
    const up = staff() ? formOf('plan', 'Enviar planta (imagem PNG ou JPG)', '<label>Título<input name="title" required></label><label>Imagem<input name="file" type="file" accept="image/*" required></label>', 'Enviar') : '';
    if (!(fp || []).length) return app.innerHTML = `<h2>Planta técnica</h2>${up}<p class="empty">Nenhuma planta cadastrada ainda. <a href="#assistencia">Solicite informações à Astell</a>.</p>`;
    const cur = fp.find(p => p.id === S.planId) || fp[0]; S.planId = cur.id;
    const { data: u } = await sb.storage.from('documents').createSignedUrl(cur.path, 3600);
    S.pts = (pts || []).filter(p => p.floorplan_id === cur.id);
    app.innerHTML = `<h2>Planta técnica</h2>${up}<label>Planta<select id="planSel">${fp.map(p => `<option value="${p.id}" ${p.id === cur.id ? 'selected' : ''}>${esc(p.title)}</option>`).join('')}</select></label>` +
      (staff() ? `<button data-place>${S.place ? 'Parar de marcar pontos' : 'Marcar pontos na planta'}</button>${S.place ? '<p class="notice">Toque na planta onde fica o ponto, conforme o projeto.</p>' : ''}` : '') +
      `<div class="plan ${S.place ? 'placing' : ''}" style="margin-top:12px"><img data-plan="1" src="${u?.signedUrl || ''}" alt="${esc(cur.title)}">${S.pts.map(p => `<button class="pin" title="${esc(p.label)}" aria-label="${esc(p.label)}" data-pt="${p.id}" style="left:${p.x}%;top:${p.y}%"></button>`).join('')}</div><div id="ptbox"></div>` +
      '<p class="notice">Os pontos são cadastrados pela Astell a partir dos projetos da obra. Em caso de dúvida, consulte os projetos oficiais em Documentos.</p>';
  },
  async mais() {
    const q = S.q, nome = String((!/@/.test(S.profile.name || '') && S.profile.name) || '').trim().split(/\s+/)[0], P = S.profile;
    const papel = P.is_super ? 'Superusuário' : P.role === 'admin' ? 'Administrador' : P.role === 'tech' ? 'Técnico' : 'Proprietário';
    const T = [['dados', 'Dados pessoais', 'Informações cadastrais', 'usr'], ['notificacoes', 'Notificações', 'Alertas e avisos', 'bell'], ['seguranca', 'Segurança', 'Proteção da conta', 'lock'], ['personalizacao', 'Personalização', 'Tema e aparência', 'palette'], ['atendimento', 'Atendimento', 'Suporte técnico', 'phones'], ['sobre', 'Sobre', 'Versão e informações', 'info']];
    const back = '<a class="btn-cancel" href="#mais">Voltar ao perfil</a>', row = (l, v) => `<div class="pfrow"><span>${l}</span><b>${v}</b></div>`;
    if (!q || !T.some(t => t[0] === q)) {
      app.innerHTML = `<div class="pf"><h3 class="pft0">Perfil e configurações</h3><div class="pfhi"><h2>Olá${nome ? ', ' + esc(nome) : ''}!</h2><p>Gerencie sua conta e personalize sua experiência.</p></div>
      <div class="pfgrid">${T.map(([k, t, s, i]) => `<a class="pftile" href="#mais?${k}">${ico(IC[i])}<b>${t}</b><small>${s}</small></a>`).join('')}</div>
      <button type="button" class="pfout" data-out>${ico(IC.out)}<span>Sair da conta</span>${ico(IC.chev)}</button></div>`; return;
    }
    const tt = T.find(t => t[0] === q)[1]; let body = '', cpfTxt = '—', minhas = [];
    if (q === 'dados') { const { data: vr } = await sb.from('residence_users').select('residence_id').eq('user_id', P.id), ids = (vr || []).map(x => x.residence_id); minhas = S.res.filter(r => ids.includes(r.id)); }   // só as residências vinculadas ao CPF do usuário no painel (superusuário sem vínculo: nenhuma)
    if (q === 'dados') { const { data: { session } } = await sb.auth.getSession(), c = String(((session && session.user && session.user.user_metadata) || {}).cpf || ''); if (/^\d{11}$/.test(c)) cpfTxt = '***.' + c.slice(3, 6) + '.' + c.slice(6, 9) + '-**'; }
    if (q === 'dados') body = `<div class="card pfphoto"><span class="pfav">${P.avatar ? `<img src="${P.avatar}" alt="Sua foto">` : ico(IC.usr)}</span><div><label class="pbtn pfpick">${P.avatar ? 'Trocar foto' : 'Adicionar foto'}<input type="file" id="pffile" accept="image/*" hidden></label>${P.avatar ? '<button type="button" class="link danger" id="pfrm">Remover foto</button>' : ''}<p class="mute">A foto aparece no lugar do ícone de perfil.</p></div></div><div class="card">${row('Nome', esc(/@/.test(P.name || '') ? '—' : (P.name || '—')))}${row('E-mail', esc(P.email || '—'))}${row('Tipo de acesso', papel)}${row('CPF', cpfTxt)}${row(minhas.length > 1 ? 'Residências' : 'Residência', minhas.length ? minhas.map(r => esc(r.name)).join(', ') : '—')}</div><p class="mute">Por segurança, o CPF é exibido parcialmente. Para corrigir qualquer dado cadastral, fale com a Astell: ${contactAstell('Contate a ASTELL')}</p>`;
    else if (q === 'notificacoes') body = `<div class="card"><p>Quando a Astell cadastrar algo novo para a sua residência (mídias, documentos, garantias, manutenções, equipamentos e outros), um aviso aparece no sininho no alto da tela.</p><p class="mute">Os avisos são atualizados sempre que você abre o aplicativo. Alterações e exclusões não geram aviso.</p><a class="pbtn" href="#avisos">Ver meus avisos${ico(IC.chev)}</a></div>`;
    else if (q === 'seguranca') body = `<div class="card"><h3 style="margin-top:0">Alterar senha</h3><p>Por segurança, enviaremos um link de redefinição para o e-mail da sua conta${P.email ? ': <b>' + esc(P.email) + '</b>' : ''}. A tela para criar a nova senha só abre quando você clicar nesse link.</p><button type="button" class="btn-main" id="pwmail">Enviar link para o meu e-mail</button><p class="mute" id="pwmsg"></p></div><p class="mute">Se o e-mail não chegar em alguns minutos, confira a caixa de spam.</p>`;
    else if (q === 'personalizacao') { const cur = applyFs(); body = `<div class="card"><h3 style="margin-top:0">Tamanho do texto</h3><div class="fsopt">${Object.entries(FS).map(([k, [l]]) => `<button type="button" class="${k === cur ? 'on' : ''}" data-fs="${k}">${l}</button>`).join('')}</div></div><div class="card">${row('Tema', 'Escuro')}<p class="mute">O tema escuro é o único disponível por enquanto.</p></div>`; }
    else if (q === 'atendimento') body = `<div class="card"><h3 style="margin-top:0">Fale com a Astell</h3><p>Dúvidas, orientações ou solicitações sobre a sua residência.</p><p>${contactAstell('Chamar no WhatsApp')} <span class="mute">(54) 99652-8034</span></p></div><div class="card"><h3 style="margin-top:0">Assistência técnica</h3><p>Abra uma solicitação formal para acionar a equipe técnica e acompanhe o andamento no aplicativo.</p><a class="pbtn" href="#assistencia?nova">Nova solicitação${ico(IC.chev)}</a></div><p class="notice">Em risco imediato (gás, fogo, choque), afaste-se e ligue 193 ou 192.</p>`;
    else if (q === 'sobre') body = `<div class="card"><b>Astell Home</b><p class="mute">Sua casa. Sua história. Tudo em um só lugar.</p>${row('Versão', APP_VERSION)}${row('Desenvolvido por', 'Astell Engenharia')}</div><p class="mute">Aqui você acompanha a documentação, as garantias, as manutenções e o histórico da sua residência, sempre atualizados pela Astell.</p>`;
    app.innerHTML = `<div class="pfsub"><h2>${tt}</h2>${body}${back}</div>`;
    if (q === 'seguranca') $('#pwmail').onclick = async e => {
      const b = e.currentTarget, m = $('#pwmsg'); if (!P.email) return toast('Sua conta não tem e-mail cadastrado.', 1);
      b.disabled = true; const { error } = await sb.auth.resetPasswordForEmail(P.email, { redirectTo: location.origin + location.pathname });
      if (error) { b.disabled = false; return toast('Não foi possível enviar o e-mail agora: ' + error.message, 1); }
      m.textContent = 'Link enviado para ' + P.email + '. Abra o e-mail e toque no link para criar a nova senha.'; let n = 60; const t = setInterval(() => { b.textContent = `Reenviar em ${--n}s`; if (n <= 0) { clearInterval(t); b.disabled = false; b.textContent = 'Enviar link novamente'; } }, 1000); b.textContent = 'Reenviar em 60s';
    };
    if (q === 'dados') {
      const f = $('#pffile'), rm = $('#pfrm'), salvar = async v => { const { error } = await sb.rpc('set_my_avatar', { p_avatar: v }); if (error) return toast('Não foi possível salvar a foto: ' + error.message, 1); S.profile.avatar = v || null; paintAvatar(); route(); toast(v ? 'Foto atualizada.' : 'Foto removida.'); };
      f.onchange = async () => { const file = f.files[0]; if (!file) return; if (!/^image\//.test(file.type)) return toast('Escolha uma imagem.', 1); try { await salvar(await fotoParaJpeg(file)); } catch (x) { toast('Não foi possível usar essa imagem.', 1); } };
      if (rm) rm.onclick = () => salvar('');
    }
  },
};

// Eventos
app.addEventListener('submit', async e => {
  e.preventDefault(); if (!e.target.dataset.form) return; const f = e.target, id = f.dataset.form, o = clean(Object.fromEntries(new FormData(f))), rid = S.cur?.id; let r;
  if (id === 'rmsg') { const body = String(o.body || '').trim(); if (!body) return; const bt = f.querySelector('button'); bt.disabled = true; const w = await sb.from('service_messages').insert({ request_id: f.dataset.id, body }); bt.disabled = false; if (w.error) return toast('Não foi possível enviar a mensagem.', 1); await rmReload(f.dataset.id); return toast('Mensagem enviada à Astell.'); }
  if (id.startsWith('edit:')) { r = await sb.from(id.slice(5)).update(o).eq('id', f.dataset.id); S.edit = null; }
  else if (id === 'editres') { r = await sb.from('residences').update(o).eq('id', rid); if (!r.error) { await loadRes(rid); return toast('Dados da residência salvos.'); } }
  else if (T[id]) r = await sb.from(id).insert({ ...o, residence_id: rid });
  else if (id === 'req') {
    const fotos = f.photos ? [...f.photos.files].filter(x => x.size) : []; delete o.photos;
    if (fotos.length > 8) return toast('Envie no máximo 8 arquivos.', 1);
    for (const x of fotos) { const v = /^video\//.test(x.type); if (!v && !/^image\//.test(x.type)) return toast(`"${x.name}" não é imagem nem vídeo.`, 1); if (x.size > (v ? 100 : 10) * 1048576) return toast(`"${x.name}" é maior que ${v ? 100 : 10} MB.`, 1); }
    const media = [], btn = f.querySelector('button:not([type])'); if (btn) btn.disabled = true;
    try { for (let i = 0; i < fotos.length; i++) { toast(`Enviando arquivo ${i + 1} de ${fotos.length}…`); const j = await cldPost(fotos[i], 'astell-home/assistencia'); media.push({ url: j.secure_url, type: /^video\//.test(fotos[i].type) ? 'video' : 'image', name: fotos[i].name, public_id: j.public_id }); } }
    catch (err) { if (btn) btn.disabled = false; return toast('Não foi possível enviar os arquivos: ' + err.message, 1); }
    r = await sb.from('service_requests').insert({ ...o, urgency: 'Média', media, residence_id: rid, protocol: 'AST-' + Date.now().toString(36).toUpperCase() }); if (btn) btn.disabled = false;
  }
  else if (id === 'exp') {
    const files = f.files ? [...f.files.files].filter(x => x.size) : []; delete o.files;
    const amt = parseFloat(String(o.amount || '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.'));
    if (!(amt > 0)) return toast('Informe um valor maior que zero.', 1);
    const eid = f.dataset.id, old = eid ? (S.exp || []).find(z => String(z.id) === String(eid)) : null, kept = old ? (old.media || []).filter((m, i) => { const c = f.querySelector(`[data-keep="${i}"]`); return !c || c.checked; }) : [];
    if (o.supplier_phone && telDigits(o.supplier_phone).length < 10) return toast('Telefone inválido. Use DDD + número.', 1);
    if (files.length + kept.length > 6) return toast('Envie no máximo 6 arquivos.', 1);
    for (const x of files) { if (!/^image\//.test(x.type) && x.type !== 'application/pdf') return toast(`"${x.name}" não é imagem nem PDF.`, 1); if (x.size > 10 * 1048576) return toast(`"${x.name}" é maior que 10 MB.`, 1); }
    const btn = f.querySelector('button:not([type])'); if (btn) btn.disabled = true; const media = [];
    try { for (let i = 0; i < files.length; i++) { toast(`Enviando arquivo ${i + 1} de ${files.length}…`); const j = await cldPost(files[i], 'astell-home/despesas'); media.push({ url: j.secure_url, type: files[i].type === 'application/pdf' ? 'pdf' : 'image', name: files[i].name, public_id: j.public_id }); } }
    catch (err) { if (btn) btn.disabled = false; return toast('Não foi possível enviar os arquivos: ' + err.message, 1); }
    const typed = String(o.category || '').trim().replace(/\s+/g, ' '), known = (S.xcats || XDEF).find(x => x.toLowerCase() === typed.toLowerCase());
    if (!known) await sb.from('expense_categories').insert({ name: typed });   // nova categoria fica cadastrada para as próximas vezes
    const catF = known || typed, subT = String(o.subcategory || '').trim().replace(/\s+/g, ' ') || 'Outros', subK = subsOf(catF).find(x => nrm(x) === nrm(subT));
    if (!subK && nrm(subT) !== 'outros') await sb.from('expense_subcategories').insert({ category: catF, name: subT });   // nova subcategoria fica cadastrada dentro da categoria
    const cond = o.pay_cond || null, method = o.pay_method || null, due = o.first_due || null; let plan = [];
    if (cond === 'parcelado') { const n = parseInt(o.pay_n, 10), pv = parseFloat(String(o.pay_v || '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')) || Math.floor(amt / n * 100) / 100;
      if (!(n >= 2 && n <= 60)) { if (btn) btn.disabled = false; return toast('Informe a quantidade de parcelas (de 2 a 60).', 1); } if (!due) { if (btn) btn.disabled = false; return toast('Informe a data de vencimento da 1ª parcela.', 1); } if (!(pv > 0)) { if (btn) btn.disabled = false; return toast('Informe o valor da parcela.', 1); }
      const last = Math.round((amt - pv * (n - 1)) * 100) / 100; if (!(last > 0)) { if (btn) btn.disabled = false; return toast('O valor das parcelas ultrapassa o valor da despesa.', 1); }
      plan = Array.from({ length: n }, (_, i) => ({ num: i + 1, total: n, due_on: addMonIso(due, i), amount: i === n - 1 ? last : pv })); }
    else if (cond === 'avista' && due) plan = [{ num: 1, total: 1, due_on: due, amount: amt }];
    const row = { pay_method: method, pay_cond: cond, description: String(o.description).trim(), amount: amt, spent_on: o.spent_on, category: catF, subcategory: subK || (nrm(subT) === 'outros' ? 'Outros' : subT), supplier: o.supplier, supplier_phone: o.supplier_phone, notes: o.notes, media, warranty_months: parseInt(o.warranty_months, 10) >= 1 ? parseInt(o.warranty_months, 10) : null };
    r = eid ? await sb.from('expenses').update({ ...row, media: [...kept, ...media] }).eq('id', eid) : await sb.from('expenses').insert({ residence_id: rid, ...row }).select('id').single();
    if (!r.error) { const xid = eid || (r.data && r.data.id), oldI = eid ? instOf(eid) : [], paid = {}; oldI.forEach(i => { if (i.paid_on && i.total === plan.length) paid[i.num] = i.paid_on; });   // parcelas já pagas continuam pagas
      if (xid && (plan.length || oldI.length)) { if (oldI.length) { const d = await sb.from('expense_installments').delete().eq('expense_id', xid); if (d.error) r = d; }
        if (!r.error && plan.length) { const ii = await sb.from('expense_installments').insert(plan.map(p => ({ ...p, expense_id: xid, residence_id: rid, paid_on: paid[p.num] || null }))); if (ii.error) r = ii; } } }
    if (btn) btn.disabled = false;
  }
  else if (id === 'upd') { r = await sb.from('service_requests').update(o).eq('id', f.dataset.id); if (!r.error) await sb.from('history_events').insert({ residence_id: rid, category: 'Assistência', description: 'Solicitação atualizada: ' + o.status }); }
  else if (id === 'bitem') r = await sb.from('building_items').insert({ ...o, residence_id: rid });
  else if (id === 'plan') { const file = f.file.files[0], path = `${rid}/planta_${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;
    r = await sb.storage.from('documents').upload(path, file); if (!r.error) r = await sb.from('floorplans').insert({ residence_id: rid, title: o.title, path }); }
  else if (id === 'pt') { r = await sb.from('plan_points').insert({ ...o, residence_id: rid, floorplan_id: S.planId, x: S.pend.x, y: S.pend.y }); S.pend = null; }
  else if (id === 'newres') { r = await sb.from('residences').insert(o).select().single(); if (!r.error) { await loadRes(r.data.id); return toast('Residência cadastrada.'); } }
  else if (id === 'doc') { const file = f.file.files[0], path = `${rid}/${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;
    r = await sb.storage.from('documents').upload(path, file); if (!r.error) { r = await sb.from('documents').insert({ residence_id: rid, title: o.title, category: o.category, version: o.version, description: o.description, path }); } }
  if (r?.error) return toast('Não foi possível salvar: ' + r.error.message, 1);
  if (id === 'req') history.replaceState(null, '', '#assistencia'); if (id === 'exp') history.replaceState(null, '', '#custos');
  toast(id === 'req' ? 'Solicitação enviada.' : id === 'exp' ? (f.dataset.id ? 'Despesa atualizada.' : 'Despesa salva.') : 'Salvo com sucesso.'); route();
});
app.addEventListener('click', async e => {
  const d = e.target.dataset;
  if (d.cn && S.carGo) { S.carHold = Date.now() + 8000; S.carGo(S.carIdx() + +d.cn); }
  if (d.xm && S.xm) { const x = new Date(S.xm.y, S.xm.m + +d.xm, 1); S.xm = { y: x.getFullYear(), m: x.getMonth() }; xPaint(); }
  { const sx = e.target.closest && e.target.closest('[data-subx]'); if (sx) { const row = sx.closest('.orow'), pn = row && row.nextElementSibling; if (pn && pn.classList.contains('opanel')) { const open = pn.hidden; pn.hidden = !open; sx.setAttribute('aria-expanded', String(open)); row.classList.toggle('open', open); } } }
  if (S.fc) { const fn = e.target.closest && e.target.closest('[data-fc]'); if (fn) { const x = new Date(S.fc.y, S.fc.m + +fn.dataset.fc, 1); S.fc.y = x.getFullYear(); S.fc.m = x.getMonth(); S.fc.sel = null; contasPaint(); }
    const fd = e.target.closest && e.target.closest('[data-fcday]'); if (fd) { const n = +fd.dataset.fcday; S.fc.sel = !n || S.fc.sel === n ? null : n; contasPaint(); }
    const pt = e.target.closest && e.target.closest('[data-paytgl]'); if (pt) { const i = S.inst.find(z => String(z.id) === pt.dataset.paytgl); if (i) { const v = i.paid_on ? null : todayIso(), { error } = await sb.from('expense_installments').update({ paid_on: v }).eq('id', i.id); if (error) return toast('Não foi possível atualizar a conta.', 1); i.paid_on = v; contasPaint(); toast(v ? 'Conta marcada como paga.' : 'Pagamento desfeito.'); } } }
  if (d.xview) location.hash = '#custos?ver=' + encodeURIComponent(d.xview);
  if (d.xedit) location.hash = '#custos?edit=' + encodeURIComponent(d.xedit);
  if (d.xdel && await ask('Excluir este lançamento?')) { const { error } = await sb.from('expenses').delete().eq('id', d.xdel); if (error) return toast('Não foi possível excluir.', 1); S.exp = (S.exp || []).filter(x => x.id !== d.xdel); toast('Lançamento excluído.'); if ($('#xh')) xPaint(); else route(); }
  if (d.gf) { const k = d.gf === 'all' ? null : d.gf; S.gf = S.gf === k ? null : k; gaPaint(); }
  { const ar = e.target.closest && e.target.closest('[data-avread]'); if (ar) { sb.rpc('mark_notifs_read', { p_ids: [ar.dataset.avread] }).then(refreshBell); } }
  if (d.avall !== undefined) { await sb.rpc('mark_notifs_read', { p_ids: (S.avl || []).map(x => x.id) }); route(); refreshBell(); }
  if (d.cal && S.cal) { const x = new Date(S.cal.y, S.cal.m + +d.cal, 1); S.cal.y = x.getFullYear(); S.cal.m = x.getMonth(); S.cal.sel = null; calPaint(); }
  { const cd = e.target.closest && e.target.closest('[data-calday]'); if (cd && S.cal) { const n = +cd.dataset.calday; S.cal.sel = !n || S.cal.sel === n ? null : n; calPaint(); } }
  if (d.ct) { S.casaTab = d.ct; $('#mb').innerHTML = mediaBlock(); }
  if (d.lb) { const [g, i] = d.lb.split('|'); S.lb = { g, i: +i }; showLb(); }
  if (e.target.closest && e.target.closest('[data-out]')) sb.auth.signOut();
  if (e.target.closest && e.target.closest('[data-fedit]')) finPaint(true);
  if (e.target.closest && e.target.closest('[data-fcancel]')) finPaint();
  { const fb = e.target.closest && e.target.closest('[data-fs]'); if (fb) { try { localStorage.setItem('astell_fs', fb.dataset.fs); } catch (x) {} applyFs(); route(); } }
  if (d.print !== undefined) print();
  if (d.place !== undefined) { S.place = !S.place; S.pend = null; route(); }
  if (d.plan && S.place) { const b = e.target.getBoundingClientRect(); S.pend = { x: +((e.clientX - b.left) / b.width * 100).toFixed(2), y: +((e.clientY - b.top) / b.height * 100).toFixed(2) };
    $('#ptbox').innerHTML = `<form class="card" data-form="pt"><b>Novo ponto</b>${sel('category', 'Categoria', PT_CATS)}<label>Identificação<input name="label" required></label><label>Detalhes<textarea name="description" rows="3"></textarea></label><button>Salvar ponto</button></form>`; }
  if (d.pt) { const p = S.pts.find(x => x.id === d.pt); $('#ptbox').innerHTML = `<div class="card"><b>${esc(p.label)}</b><span class="mute">${esc(p.category)}</span><p>${esc(p.description)}</p>${staff() ? `<button class="link" data-del="plan_points:${p.id}">Excluir ponto</button>` : ''}</div>`; }
  if (d.dl) { const [p, n] = d.dl.split('|'), { data, error } = await sb.storage.from('documents').createSignedUrl(p, 60, { download: n || true }); error ? toast('Acesso negado.', 1) : window.open(data.signedUrl, '_blank', 'noopener'); }
  if (d.v3d) { const [p, n] = d.v3d.split('|'), { data, error } = await sb.storage.from('documents').createSignedUrl(p, 3600); if (error) return toast('Acesso negado.', 1); loadMV(); const lb = $('#lb'); lb.hidden = false; lb.innerHTML = `<button class="lbx" data-lbx aria-label="Fechar">×</button><model-viewer src="${esc(data.signedUrl)}" alt="${esc(n)}" camera-controls touch-action="pan-y" shadow-intensity="1" auto-rotate></model-viewer>`; }
  if (d.open) { const { data, error } = await sb.storage.from('documents').createSignedUrl(d.open, 60); error ? toast('Acesso negado.', 1) : window.open(data.signedUrl, '_blank', 'noopener'); }
  if (d.del && await ask('Excluir este registro?')) { const [t, id] = d.del.split(':'); await sb.from(t).delete().eq('id', id); route(); }
  if (d.deldoc && await ask('Excluir este documento?')) { const [id, p] = d.deldoc.split('|'); await sb.storage.from('documents').remove([p]); await sb.from('documents').delete().eq('id', id); route(); }
});

function route() {
  if (!S.profile) return;
  clearInterval(S.carTimer);
  const [h, q] = (location.hash.slice(1) || 'home').split('?'); S.nova = q === 'nova'; S.q = q || ''; { const mm = /^(ver|edit)=(.+)$/.exec(q || ''); S.xv = mm ? { m: mm[1], id: decodeURIComponent(mm[2]) } : null; }
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', (a.dataset.g || '').split(' ').includes(h)));
  $('#avatar').classList.toggle('on', h === 'mais'); refreshBell();
  if (!S.cur) return app.innerHTML = '<p class="empty">Nenhuma residência vinculada à sua conta. Fale com a Astell.</p>';
  const v = views[h] || views.home, go = location.hash;
  if (S.lastGo !== go) { S.lastGo = go; window.scrollTo(0, 0); document.documentElement.scrollTop = 0; document.body.scrollTop = 0; if (app.scrollTo) app.scrollTo(0, 0); }   // nova tela sempre começa pelo topo
  Promise.resolve(v()).finally(() => { if (location.hash === go) crumbs(h); });
}
// Caminho de navegação (breadcrumb) no alto de todas as telas, exceto o Início
const XDEF = ['Construção', 'Acabamentos', 'Mobiliário', 'Eletrodomésticos', 'Eletrônicos', 'Área externa', 'Serviços'], XCOL = ['#3dc08c', '#4aa3ff', '#f08a3c', '#b57bee', '#e5534b', '#26b5c4', '#e3c04a', '#8d99a6', '#6fd36f', '#ff7fb0'];
const brl = v => Number(v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), xIso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
// Telefone com máscara e link para o WhatsApp (mesmo padrão do telefone do proprietário no painel admin)
const telDigits = v => String(v || '').replace(/\D/g, '').slice(0, 11);
function telMask(v) { const d = telDigits(v); if (!d) return ''; if (d.length <= 2) return '(' + d; if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`; if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`; return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`; }
const xSup = e => `${e.supplier ? `<p class="mute">Fornecedor: ${esc(e.supplier)}</p>` : ''}${e.supplier_phone ? `<p class="mute">WhatsApp: <a class="xwa" href="https://wa.me/55${telDigits(e.supplier_phone)}" target="_blank" rel="noopener">${esc(telDigits(e.supplier_phone).length >= 10 ? telMask(e.supplier_phone) : e.supplier_phone)}</a></p>` : ''}`;
// Formulário do lançamento de despesa: novo, visualizar (somente leitura) ou editar
function xForm(e, mode) {
  const view = mode === 'view', md = e.media || [], ph = telDigits(e.supplier_phone).length >= 10 ? telMask(e.supplier_phone) : (e.supplier_phone || '');
  const ins = e.id ? instOf(e.id) : [], pn = ins.length > 1 ? ins.length : '', pf = ins[0] ? ins[0].due_on : '', pv = ins[0] ? Number(ins[0].amount) : 0;
  const title = { new: 'Lançar despesa', view: 'Visualizar despesa', edit: 'Editar despesa' }[mode], vv = (k, d = '') => esc(e[k] ?? d);
  const keep = mode === 'edit' && md.length ? `<div class="field"><span class="lbl">Arquivos já anexados (desmarque para remover)</span>${md.map((m, i) => `<label class="xkeep"><input type="checkbox" data-keep="${i}" checked> ${esc(m.name || (m.type === 'pdf' ? 'comprovante.pdf' : 'imagem'))}</label>`).join('')}</div>` : '';
  const shown = view && md.length ? (md.filter(x => x.type !== 'pdf').length ? grp('xv' + e.id, md.filter(x => x.type !== 'pdf').map(x => x.url)) : '') + (md.some(x => x.type === 'pdf') ? `<div class="xpdf">${md.filter(x => x.type === 'pdf').map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${ico(IC.doc)}<span>${esc(x.name || 'comprovante.pdf')}</span></a>`).join('')}</div>` : '') : '';
  return `<h2>${title}</h2><form class="card" data-form="exp"${e.id ? ` data-id="${esc(e.id)}"` : ''}><fieldset class="xfs"${view ? ' disabled' : ''}><label>O que foi comprado<input name="description" required maxlength="160" value="${vv('description')}"></label><label>Valor (R$)<input name="amount" required inputmode="decimal" placeholder="0,00" autocomplete="off" value="${e.amount != null ? esc(Number(e.amount).toFixed(2).replace('.', ',')) : ''}"></label>${dpField('spent_on', 'Data', e.spent_on || xIso(new Date()), true)}
      <label>Categoria<div class="comboin" data-combo="cat"><input class="comboq" type="search" name="category" required maxlength="60" autocomplete="off" role="combobox" aria-expanded="false" aria-label="Pesquisar categoria" placeholder="Pesquise ou digite uma nova categoria…" value="${vv('category')}"><ul class="combolist" role="listbox" hidden></ul></div></label>${view ? '' : '<p class="mute combohint">Digite parte do nome e escolha na lista. Se a categoria não existir, ela será criada ao salvar e ficará disponível nas próximas pesquisas.</p>'}
      <label>Subcategoria — opcional<div class="comboin" data-combo="sub"><input class="comboq" type="search" name="subcategory" maxlength="60" autocomplete="off" role="combobox" aria-expanded="false" aria-label="Pesquisar subcategoria" placeholder="Pesquise ou digite uma subcategoria…" value="${esc(e.subcategory && e.subcategory !== 'Outros' ? e.subcategory : '')}"><ul class="combolist" role="listbox" hidden></ul></div></label>${view ? '' : '<p class="mute combohint">As subcategorias ficam dentro da categoria escolhida. Se deixar em branco, o gasto entra em “Outros”.</p>'}
      <label>Forma de pagamento — opcional<select name="pay_method"><option value="">Não informar</option>${PAYM.map(m => `<option value="${m}"${e.pay_method === m ? ' selected' : ''}>${m}</option>`).join('')}</select></label>
      <label>Condição de pagamento — opcional<select name="pay_cond"><option value="">Não informar</option><option value="avista"${e.pay_cond === 'avista' ? ' selected' : ''}>À vista</option><option value="parcelado"${e.pay_cond === 'parcelado' ? ' selected' : ''}>Parcelado</option></select></label>
      <div class="payopt" data-payopt${e.pay_cond ? '' : ' hidden'}><label data-par${e.pay_cond === 'parcelado' ? '' : ' hidden'}>Quantidade de parcelas<input name="pay_n" type="number" min="2" max="60" step="1" inputmode="numeric" data-nonneg placeholder="Ex.: 5" value="${pn || ''}"></label>${dpField('first_due', e.pay_cond === 'parcelado' ? 'Vencimento da 1ª parcela' : 'Data de vencimento', pf)}<label data-par${e.pay_cond === 'parcelado' ? '' : ' hidden'}>Valor de cada parcela (R$)<input name="pay_v" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${pv ? esc(pv.toFixed(2).replace('.', ',')) : ''}"></label><p class="mute combohint">As datas de vencimento alimentam o calendário de Contas a pagar. As parcelas seguintes vencem a cada mês.</p></div>
      <label>Garantia do item (meses) — opcional<input name="warranty_months" type="number" min="1" step="1" inputmode="numeric" data-nonneg placeholder="Sem garantia" value="${vv('warranty_months')}"></label><label>Fornecedor<input name="supplier" maxlength="120" value="${vv('supplier')}"></label><label>Telefone do fornecedor<input name="supplier_phone" class="tel" type="tel" inputmode="numeric" maxlength="15" placeholder="(00) 00000-0000" autocomplete="off" value="${esc(ph)}"></label><label>Descrição adicional<textarea name="notes" rows="3">${vv('notes')}</textarea></label>
      ${view ? '' : keep + (CLOUD_OK ? '<label>Comprovantes e notas (imagens ou PDF)<input name="files" type="file" accept="image/*,application/pdf" multiple></label><p class="mute">Até 6 arquivos de até 10 MB cada.</p>' : '')}</fieldset>${shown}${view ? `<button type="button" data-xedit="${esc(e.id)}">Editar</button><a class="btn-cancel" href="#custos">Voltar</a>` : `<button>${mode === 'edit' ? 'Salvar alterações' : 'Salvar despesa'}</button><a class="btn-cancel" href="#custos">Cancelar</a>`}</form>`;
}
function xCats(custom, ex) {   // categorias padrão + criadas pelo cliente (sem repetir, ignorando maiúsculas)
  const out = [...XDEF], has = n => out.some(x => x.toLowerCase() === String(n).toLowerCase());
  [...(custom || []).map(c => c.name), ...(ex || []).map(e => e.category)].filter(Boolean).forEach(n => { if (!has(n)) out.push(n); }); return out;
}
function subsOf(cat) {   // subcategorias de uma categoria (criadas + usadas nas despesas); "Outros" sempre existe
  const out = ['Outros'], has = n => out.some(x => nrm(x) === nrm(n));
  [...(S.xsubs || []).filter(x => nrm(x.category) === nrm(cat)).map(x => x.name), ...(S.exp || []).filter(x => nrm(x.category) === nrm(cat)).map(x => x.subcategory)].filter(Boolean).forEach(n => { if (!has(n)) out.push(n); });
  return [out[0], ...out.slice(1).sort((a, b) => a.localeCompare(b, 'pt-BR'))];
}
const xColor = c => XCOL[Math.max(0, (S.xcats || []).findIndex(x => x.toLowerCase() === String(c).toLowerCase())) % XCOL.length];
function xCardHtml(e, extra = '') {
  const md = e.media || [], im = md.filter(x => x.type !== 'pdf').map(x => x.url), pd = md.filter(x => x.type === 'pdf');
      return `<div class="card xcard"><div class="xtop"><b>${esc(e.description)}</b><strong>${brl(e.amount)}</strong></div><p class="mute"><span class="xcat" style="--c:${xColor(e.category)}">${esc(e.category)}</span>${e.subcategory ? `<span class="xcat xsubt" style="--c:${xColor(e.category)}">${esc(e.subcategory)}</span>` : ''} ${fmt(e.spent_on)}</p>${extra}${payLine(e) ? `<p class="mute">Pagamento: ${esc(payLine(e))}</p>` : ''}${xSup(e)}${e.warranty_months ? `<p class="mute xwar">Garantia: ${e.warranty_months} ${e.warranty_months === 1 ? 'mês' : 'meses'} (até ${addMonths(e.spent_on, e.warranty_months).toLocaleDateString('pt-BR')})</p>` : ''}${e.notes ? `<p>${esc(e.notes)}</p>` : ''}${im.length ? grp('x' + e.id, im) : ''}${pd.length ? `<div class="xpdf">${pd.map(x => `<a href="${esc(x.url)}" target="_blank" rel="noopener">${ico(IC.doc)}<span>${esc(x.name || 'comprovante.pdf')}</span></a>`).join('')}</div>` : ''}<div class="xact"><button type="button" class="link" data-xview="${e.id}">Visualizar</button><button type="button" class="link" data-xedit="${e.id}">Editar</button><button type="button" class="link" data-xdel="${e.id}">Excluir</button></div></div>`;
}
function xPaint() {
  const ex = S.exp || [], tot = ex.reduce((a, e) => a + Number(e.amount), 0), by = {};
  ex.forEach(e => { const k = (S.xcats || []).find(x => x.toLowerCase() === String(e.category).toLowerCase()) || e.category; by[k] = (by[k] || 0) + Number(e.amount); });
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]); let acc = 0;
  const segs = rows.map(([c, v]) => { const p = tot ? v / tot * 100 : 0, el = `<circle r="15.9155" cx="21" cy="21" fill="none" stroke="${xColor(c)}" stroke-width="6" stroke-dasharray="${p.toFixed(3)} ${(100 - p).toFixed(3)}" stroke-dashoffset="${(25 - acc).toFixed(3)}"/>`; acc += p; return el; }).join('');
  const nw = ex.filter(e => e.warranty_months).length, xs = $('#xs'); if (xs) xs.innerHTML = tot ? `<p class="mute">${ex.length} ${ex.length === 1 ? 'lançamento' : 'lançamentos'} · ${nw} com garantia</p><div class="xdon"><div class="xring"><svg viewBox="0 0 42 42" role="img" aria-label="Gastos por categoria"><circle r="15.9155" cx="21" cy="21" fill="none" stroke="#ffffff14" stroke-width="6"/>${segs}</svg><div class="xcen"><small>Total</small><b>${brl(tot)}</b></div></div>
    <ul class="xleg">${rows.map(([c, v]) => `<li><i style="background:${xColor(c)}"></i><span>${esc(c)}</span><em>${(v / tot * 100).toFixed(1).replace('.', ',')}%</em><b>${brl(v)}</b></li>`).join('')}</ul></div>` : '<p class="empty">Nenhuma despesa lançada ainda.</p>';
  const { y, m } = S.xm, pre = y + '-' + String(m + 1).padStart(2, '0'), mes = ex.filter(e => String(e.spent_on).startsWith(pre)), mt = mes.reduce((a, e) => a + Number(e.amount), 0), xh = $('#xh'); if (!xh) return;
  xh.innerHTML = `<div class="calhead"><button type="button" data-xm="-1" aria-label="Mês anterior">‹</button><b>${MESES[m]} ${y}</b><button type="button" data-xm="1" aria-label="Próximo mês">›</button></div><p class="xmt">Total do mês: <b>${brl(mt)}</b> · ${mes.length} ${mes.length === 1 ? 'lançamento' : 'lançamentos'}</p>` +
    (mes.map(e => xCardHtml(e)).join('') || '<p class="empty">Nenhuma despesa neste mês.</p>');
}
// Campos de data e hora com seletor verde (o do navegador não aceita cor): digitar com máscara ou abrir o seletor
const DP_SVG = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>', TM_SVG = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
const dpIso = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`, dpBr = iso => iso ? `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}` : '';
function dpParse(t) { const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t || ''); if (!m) return null; const d = new Date(+m[3], +m[2] - 1, +m[1]); return d.getFullYear() === +m[3] && d.getMonth() === +m[2] - 1 && d.getDate() === +m[1] ? `${m[3]}-${m[2]}-${m[1]}` : null; }
const dpField = (name, label, iso = '', req = false) => `<div class="field"><span class="lbl">${label}${req ? ' *' : ''}</span><div class="dpbox" data-dp="date"><input class="dptxt" type="text" inputmode="numeric" placeholder="dd/mm/aaaa" maxlength="10" autocomplete="off" value="${esc(dpBr(iso))}" aria-label="${esc(label)}" ${req ? 'required' : ''}><button type="button" class="dpbtn" data-dpbtn aria-label="Abrir calendário — ${esc(label)}">${DP_SVG}</button><input type="hidden" name="${name}" value="${esc(iso || '')}"><div class="dpop" hidden></div></div></div>`;
const tmField = (name, label, val = '', req = false) => `<div class="field"><span class="lbl">${label}${req ? ' *' : ''}</span><div class="dpbox" data-dp="time"><input class="dptxt" type="text" name="${name}" inputmode="numeric" placeholder="hh:mm" maxlength="5" autocomplete="off" value="${esc(val)}" aria-label="${esc(label)}" ${req ? 'required' : ''}><button type="button" class="dpbtn" data-dpbtn aria-label="Abrir relógio — ${esc(label)}">${TM_SVG}</button><div class="dpop dptime" hidden></div></div></div>`;
function dpRender(box, y, m) {
  const pop = box.querySelector('.dpop'), sel = box.querySelector('[type=hidden]').value, n = new Date(), hoje = dpIso(n.getFullYear(), n.getMonth(), n.getDate()), ini = new Date(y, m, 1).getDay(), dias = new Date(y, m + 1, 0).getDate(); let cells = '<span></span>'.repeat(ini);
  for (let d = 1; d <= dias; d++) { const iso = dpIso(y, m, d); cells += `<button type="button" class="dpday${iso === sel ? ' sel' : ''}${iso === hoje ? ' today' : ''}" data-dpday="${iso}" aria-label="${d} de ${MESES[m]} de ${y}">${d}</button>`; }
  pop.dataset.y = y; pop.dataset.m = m;
  pop.innerHTML = `<div class="dphead"><button type="button" data-dpnav="-12" aria-label="Ano anterior">«</button><button type="button" data-dpnav="-1" aria-label="Mês anterior">‹</button><b>${MESES[m]} ${y}</b><button type="button" data-dpnav="1" aria-label="Próximo mês">›</button><button type="button" data-dpnav="12" aria-label="Próximo ano">»</button></div><div class="dpgrid">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => `<i>${x}</i>`).join('')}${cells}</div><div class="dpfoot"><button type="button" data-dptoday>Hoje</button><button type="button" data-dpclear>Limpar</button></div>`;
}
function tmRender(box) {
  const pop = box.querySelector('.dpop'), v = box.querySelector('.dptxt').value, [h, mi] = /^\d{2}:\d{2}$/.test(v) ? v.split(':') : ['', ''];
  pop.innerHTML = `<div class="tmcols"><div><small>Hora</small><div class="tmcol">${Array.from({ length: 24 }, (_, i) => { const x = String(i).padStart(2, '0'); return `<button type="button" class="tmb${x === h ? ' sel' : ''}" data-tmh="${x}">${x}</button>`; }).join('')}</div></div><div><small>Minuto</small><div class="tmcol">${Array.from({ length: 12 }, (_, i) => { const x = String(i * 5).padStart(2, '0'); return `<button type="button" class="tmb${x === mi ? ' sel' : ''}" data-tmm="${x}">${x}</button>`; }).join('')}</div></div></div><div class="dpfoot"><button type="button" data-tmnow>Agora</button><button type="button" data-dpclear>Limpar</button></div>`;
  const s = pop.querySelector('.tmb.sel'); if (s) s.scrollIntoView({ block: 'nearest' });
}

// Seletor de horário digital: setas para subir/descer horas e minutos OU digitar nos números
const TP_CSS = `.tpov{position:fixed;inset:0;z-index:2147482000;background:rgba(4,9,15,.7);display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}
.tpbox{width:min(340px,100%);background:#101b28;border:1px solid #1f2f3f;border-radius:20px;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.8);color:#e8eef2;box-sizing:border-box}
.tpbox h3{margin:0 0 14px;font-size:1.05rem;font-weight:700;color:#fff}
.tpdig{display:flex;align-items:center;justify-content:center;gap:22px;padding:6px 0 14px}
.tpcell{display:flex;flex-direction:column;align-items:center;gap:2px}
.tpcell input{width:84px;height:64px;margin:0;padding:0;text-align:center;font-size:2.6rem;font-weight:700;border-radius:14px;background:transparent;border:2px solid transparent;color:#fff;box-sizing:border-box}
.tpcell input:focus{border-color:#3dc08c;outline:none;background:rgba(61,192,140,.12)}
.tpcell small{color:#8a9aa6;font-size:.85rem}
.tparr{width:56px;height:40px;margin:0;padding:0;border:0;border-radius:10px;background:transparent;color:#3dc08c;cursor:pointer;display:grid;place-items:center}
.tparr:hover,.tparr:active{background:rgba(61,192,140,.18)}.tparr svg{width:26px;height:26px}
.tpsep{font-size:2.4rem;font-weight:700;color:#3dc08c;align-self:center;margin-top:-6px}
.tpbtns{display:flex;gap:10px;justify-content:flex-end;margin-top:6px}.tpbtns button{margin:0;min-height:44px;padding:0 20px;border-radius:12px;font-weight:700;font-size:1rem;cursor:pointer;border:0}
.tpbtns .tpno{background:transparent;color:#3dc08c}.tpbtns .tpok{background:#3dc08c;color:#04231a}`;
function tpOpen(box) {
  if (!document.getElementById('tp-css')) { const st = document.createElement('style'); st.id = 'tp-css'; st.textContent = TP_CSS; document.head.appendChild(st); }
  const inp = box.querySelector('.dptxt'), m = /^(\d{2}):(\d{2})$/.exec(inp.value), n = new Date(); let H = m ? +m[1] : n.getHours(), M = m ? +m[2] : n.getMinutes();
  const ov = document.createElement('div'); ov.className = 'tpov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  const up = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6"/></svg>', dn = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';
  const cell = (k, lbl) => `<div class="tpcell"><button type="button" class="tparr" data-k="${k}" data-d="1" aria-label="Aumentar ${lbl.toLowerCase()}">${up}</button><input class="tp${k}" inputmode="numeric" maxlength="2" autocomplete="off" aria-label="${lbl}"><small>${lbl}</small><button type="button" class="tparr" data-k="${k}" data-d="-1" aria-label="Diminuir ${lbl.toLowerCase()}">${dn}</button></div>`;
  ov.innerHTML = `<div class="tpbox"><h3>Escolha o horário</h3><div class="tpdig">${cell('h', 'Horas')}<span class="tpsep">:</span>${cell('m', 'Minutos')}</div><div class="tpbtns"><button type="button" class="tpno">Cancelar</button><button type="button" class="tpok">OK</button></div></div>`;
  document.body.appendChild(ov);
  const ih = ov.querySelector('.tph'), im = ov.querySelector('.tpm'), p2 = v => String(v).padStart(2, '0'), show = () => { ih.value = p2(H); im.value = p2(M); };
  const step = (k, d) => { if (k === 'h') H = (H + d + 24) % 24; else M = (M + d + 60) % 60; show(); };
  show();
  // segurar a seta repete a mudança, como nos celulares
  let rep, tm; const stop = () => { clearTimeout(tm); clearInterval(rep); };
  ov.querySelectorAll('.tparr').forEach(b => { b.addEventListener('pointerdown', e => { e.preventDefault(); const k = b.dataset.k, d = +b.dataset.d; step(k, d); tm = setTimeout(() => { rep = setInterval(() => step(k, d), 90); }, 450); }); ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => b.addEventListener(ev, stop)); b.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); step(b.dataset.k, +b.dataset.d); } }); });
  const typed = (el, max, set, next) => {
    el.addEventListener('focus', () => el.select());
    el.addEventListener('input', () => { el.value = el.value.replace(/\D/g, '').slice(0, 2); if (el.value === '') return; let v = Math.min(+el.value, max); if (el.value.length === 2 || v * 10 > max) { set(v); el.value = p2(v); if (next) next.focus(); } else set(v); });
    el.addEventListener('blur', show);
    el.addEventListener('keydown', e => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); step(el === ih ? 'h' : 'm', e.key === 'ArrowUp' ? 1 : -1); el.select(); } });
    el.addEventListener('wheel', e => { e.preventDefault(); step(el === ih ? 'h' : 'm', e.deltaY < 0 ? 1 : -1); }, { passive: false });
  };
  typed(ih, 23, v => { H = v; }, im); typed(im, 59, v => { M = v; }, null);
  const end = ok => { stop(); if (ok) { if (document.activeElement === ih && ih.value) H = Math.min(23, +ih.value); if (document.activeElement === im && im.value) M = Math.min(59, +im.value); inp.value = p2(H) + ':' + p2(M); inp.setCustomValidity(''); } document.removeEventListener('keydown', key, true); ov.remove(); };
  const key = e => { if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); end(false); } else if (e.key === 'Enter' && !e.target.closest('.tparr')) { e.preventDefault(); end(true); } };
  document.addEventListener('keydown', key, true);
  ov.addEventListener('click', e => { e.stopPropagation(); if (e.target === ov || e.target.closest('.tpno')) end(false); else if (e.target.closest('.tpok')) end(true); });
  ih.focus();
}
function dpReveal(pop) {   // sem espaço embaixo (menu inferior): abre para cima; se também não couber, rola a tela
  pop.classList.remove('up'); const br = pop.parentElement.getBoundingClientRect(), h = pop.offsetHeight;
  if (br.bottom + 6 + h > innerHeight - 110 && br.top - 6 - h > 70) pop.classList.add('up'); else requestAnimationFrame(() => pop.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }));
}   // mantém o calendário inteiro visível (a margem do CSS evita o menu de baixo)
function dpCloseAll(except) { let any = false; document.querySelectorAll('.dpop:not([hidden])').forEach(p => { if (!except || !p.closest('[data-dp]').contains(except)) { p.hidden = true; any = true; } }); return any; }
function dpSetTime(box, v) { const t = box.querySelector('.dptxt'); t.value = v; t.setCustomValidity(''); }
document.addEventListener('click', e => {
  const t = e.target, box = t.closest && t.closest('[data-dp]');
  if (!box) { dpCloseAll(); return; } dpCloseAll(box);
  const pop = box.querySelector('.dpop'), isDate = box.dataset.dp === 'date';
  if (t.closest('[data-dpbtn]')) { if (!pop.hidden) pop.hidden = true; else { if (isDate) { const v = box.querySelector('[type=hidden]').value, d = v ? new Date(v + 'T00:00') : new Date(); dpRender(box, d.getFullYear(), d.getMonth()); } else { tpOpen(box); return; } pop.hidden = false; dpReveal(pop); } return; }
  const nav = t.closest('[data-dpnav]'); if (nav) { const d = new Date(+pop.dataset.y, +pop.dataset.m + +nav.dataset.dpnav, 1); dpRender(box, d.getFullYear(), d.getMonth()); dpReveal(pop); return; }
  const day = t.closest('[data-dpday]'); if (day) { box.querySelector('[type=hidden]').value = day.dataset.dpday; const tx = box.querySelector('.dptxt'); tx.value = dpBr(day.dataset.dpday); tx.setCustomValidity(''); pop.hidden = true; return; }
  if (t.closest('[data-dptoday]')) { const n = new Date(), iso = dpIso(n.getFullYear(), n.getMonth(), n.getDate()); box.querySelector('[type=hidden]').value = iso; const tx = box.querySelector('.dptxt'); tx.value = dpBr(iso); tx.setCustomValidity(''); pop.hidden = true; return; }
  if (t.closest('[data-dpclear]')) { if (isDate) { box.querySelector('[type=hidden]').value = ''; box.querySelector('.dptxt').value = ''; } else dpSetTime(box, ''); box.querySelector('.dptxt').setCustomValidity(''); pop.hidden = true; return; }
  const th = t.closest('[data-tmh]'); if (th) { const cur = box.querySelector('.dptxt').value, mm = /^\d{2}:(\d{2})$/.exec(cur); dpSetTime(box, th.dataset.tmh + ':' + (mm ? mm[1] : '00')); tmRender(box); return; }
  const tmn = t.closest('[data-tmm]'); if (tmn) { const cur = box.querySelector('.dptxt').value, hh = /^(\d{2}):\d{2}$/.exec(cur); dpSetTime(box, (hh ? hh[1] : '08') + ':' + tmn.dataset.tmm); pop.hidden = true; return; }
  if (t.closest('[data-tmnow]')) { const n = new Date(); dpSetTime(box, String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0')); pop.hidden = true; }
});
document.addEventListener('input', e => {
  const t = e.target; if (!t.classList || !t.classList.contains('dptxt')) return; const box = t.closest('[data-dp]'); let d = t.value.replace(/\D/g, '');
  if (box.dataset.dp === 'date') {
    d = d.slice(0, 8); t.value = d.length > 4 ? `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}` : d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
    const iso = dpParse(t.value); box.querySelector('[type=hidden]').value = iso || ''; t.setCustomValidity(t.value && !iso ? 'Data inválida. Use dd/mm/aaaa.' : '');
    if (iso && !box.querySelector('.dpop').hidden) dpRender(box, +iso.slice(0, 4), +iso.slice(5, 7) - 1);
  } else {
    d = d.slice(0, 4); t.value = d.length > 2 ? `${d.slice(0, 2)}:${d.slice(2)}` : d; const ok = /^([01]\d|2[0-3]):[0-5]\d$/.test(t.value);
    t.setCustomValidity(t.value && !ok ? 'Hora inválida. Use hh:mm (00:00 a 23:59).' : ''); if (ok && !box.querySelector('.dpop').hidden) tmRender(box);
  }
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && dpCloseAll()) { e.preventDefault(); e.stopPropagation(); } }, true);
// Pesquisa de categoria: mesmo modelo da pesquisa de residências/proprietários do painel admin
const nrm = t => String(t == null ? '' : t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
function comboOpts(box) {   // categoria: todas; subcategoria: somente as da categoria escolhida no mesmo formulário
  if (box.dataset.combo !== 'sub') return S.xcats || XDEF;
  const f = box.closest('form'), c = f && f.querySelector('[name=category]'); return subsOf(c ? c.value : '');
}
function catList(box) {
  const inp = box.querySelector('.comboq'), ul = box.querySelector('.combolist'), q = nrm(inp.value).trim();
  if (!q) return catClose(box);   // sem caracteres digitados: nenhuma sugestão
  const items = comboOpts(box).filter(c => nrm(c).includes(q) && nrm(c) !== q).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (!items.length) return catClose(box);   // nenhuma categoria contém o que foi digitado: a caixa não aparece
  ul.innerHTML = items.map((c, i) => `<li role="option" data-opt="${esc(c)}" class="${i ? '' : 'on'}"><b>${esc(c)}</b></li>`).join(''); ul.hidden = false; inp.setAttribute('aria-expanded', 'true');
}
function catClose(box) { const ul = box.querySelector('.combolist'); ul.hidden = true; ul.innerHTML = ''; box.querySelector('.comboq').setAttribute('aria-expanded', 'false'); }
function catPick(box, v) { box.querySelector('.comboq').value = v; catClose(box); }
const isCat = e => e.target.classList && e.target.classList.contains('comboq') && e.target.closest('[data-combo]');
document.addEventListener('input', e => { if (isCat(e)) catList(e.target.closest('[data-combo]')); });
document.addEventListener('focusin', e => { if (isCat(e)) catList(e.target.closest('[data-combo]')); });
document.addEventListener('focusout', e => { if (isCat(e)) setTimeout(() => { const b = e.target.closest('[data-combo]'); b && catClose(b); }, 120); });
document.addEventListener('mousedown', e => { const li = e.target.closest && e.target.closest('[data-combo] .combolist li[data-opt]'); if (!li) return; e.preventDefault(); catPick(li.closest('[data-combo]'), li.dataset.opt); });
document.addEventListener('keydown', e => {
  if (!isCat(e)) return; const box = e.target.closest('[data-combo]'), ul = box.querySelector('.combolist'), lis = [...ul.querySelectorAll('li[data-opt]')]; let i = lis.findIndex(l => l.classList.contains('on'));
  if (e.key === 'Escape' && !ul.hidden) { e.preventDefault(); catClose(box); e.stopPropagation(); return; }
  if (e.key === 'Enter') { if (!ul.hidden && i >= 0) { e.preventDefault(); catPick(box, lis[i].dataset.opt); } return; }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); if (ul.hidden) return catList(box); if (!lis.length) return; if (i >= 0) lis[i].classList.remove('on'); i = (i + (e.key === 'ArrowDown' ? 1 : -1) + lis.length) % lis.length; lis[i].classList.add('on'); lis[i].scrollIntoView({ block: 'nearest' }); }
});
document.addEventListener('change', e => { const sel = e.target.closest && e.target.closest('select[name=pay_cond]'); if (!sel) return; const f = sel.closest('form'), box = f.querySelector('[data-payopt]'), par = sel.value === 'parcelado'; box.hidden = !sel.value; box.querySelectorAll('[data-par]').forEach(x => x.hidden = !par); const lb = box.querySelector('.dpbox').previousElementSibling; if (lb) lb.textContent = par ? 'Vencimento da 1ª parcela' : 'Data de vencimento'; payAuto(f); });
function payAuto(f) {   // valor da parcela sugerido = valor da despesa ÷ quantidade (enquanto não for digitado à mão)
  const n = parseInt(f.pay_n && f.pay_n.value, 10), a = parseFloat(String(f.amount.value || '').replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')), pv = f.pay_v; if (!pv || pv.dataset.man === '1' || !(n >= 2) || !(a > 0)) return; pv.value = (Math.floor(a / n * 100) / 100).toFixed(2).replace('.', ',');
}
document.addEventListener('input', e => { const f = e.target.closest && e.target.closest('form[data-form=exp]'); if (!f) return; if (e.target.name === 'pay_v') e.target.dataset.man = e.target.value ? '1' : ''; if (e.target.name === 'pay_n' || e.target.name === 'amount') payAuto(f); });
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
async function calEvents(rid) {   // tudo que tem data no cronograma da residência
  const [{ data: mt }, { data: sr }, { data: wr }, { data: xr }] = await Promise.all([
    sb.from('maintenance_tasks').select('id,name,next_due,status,last_done,interval_months').eq('residence_id', rid).not('next_due', 'is', null),
    sb.from('service_requests').select('id,protocol,category,status,scheduled_for').eq('residence_id', rid),
    sb.from('warranties').select('id,system,start_date,months').eq('residence_id', rid),
    sb.from('expenses').select('id,description,spent_on,warranty_months').eq('residence_id', rid).not('warranty_months', 'is', null)]);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), ev = [];
  const hj = iso(new Date());   // s (situação): exp = garantia expirada (vermelho) · late = atrasada (amarelo) · ok = realizada (verde); sem s = ainda por vir
  (mt || []).filter(x => x.status !== 'Cancelada').forEach(x => { const past = String(x.next_due) < hj, done = x.status === 'Concluída'; if (past) ev.push({ d: x.next_due, k: 'man', id: x.id, t: x.name, s: done ? 'ok' : 'late' }); else if (!(done && effSt(x) === 'Concluída')) ev.push({ d: x.next_due, k: 'man', id: x.id, t: x.name }); });
  (sr || []).filter(x => x.scheduled_for).forEach(x => { const past = String(x.scheduled_for) < hj, done = ['Concluída', 'Encerrada'].includes(x.status), t = `${x.category || 'Assistência'} (${x.protocol})`; if (past) ev.push({ d: x.scheduled_for, k: 'ast', id: x.id, t, s: done ? 'ok' : 'late' }); else if (!done) ev.push({ d: x.scheduled_for, k: 'ast', id: x.id, t }); });
  (wr || []).filter(x => x.start_date && x.months != null).forEach(x => { const e = addMonths(x.start_date, +x.months); if (!isNaN(e)) ev.push({ d: iso(e), k: 'gar', id: x.id, t: x.system, s: iso(e) < hj ? 'exp' : '' }); });
  (xr || []).forEach(x => { const e = addMonths(x.spent_on, +x.warranty_months); if (!isNaN(e)) ev.push({ d: iso(e), k: 'gex', id: x.id, t: x.description, s: iso(e) < hj ? 'exp' : '' }); });
  return ev.sort((a, b) => String(a.d).localeCompare(String(b.d)));
}
const CAL_S = { exp: 'cx', late: 'cx', ok: 'cok' };   // cor do círculo conforme a situação
const calCls = e => CAL_S[e.s] || CAL_K[e.k][1];
const CAL_K = { man: ['Manutenção', 'cm'], ast: ['Assistência', 'ca'], gar: ['Garantia', 'cg'], gex: ['Garantia', 'cg'] };
function calPaint() {
  const { y, m, ev } = S.cal, el = $('#cal'); if (!el) return;
  const pre = y + '-' + String(m + 1).padStart(2, '0') + '-', first = new Date(y, m, 1).getDay(), nd = new Date(y, m + 1, 0).getDate(), t = new Date(), hoje = t.getFullYear() === y && t.getMonth() === m ? t.getDate() : 0;
  const by = {}; ev.filter(e => String(e.d).startsWith(pre)).forEach(e => (by[+String(e.d).slice(8, 10)] = by[+String(e.d).slice(8, 10)] || []).push(e));
  let cells = ''; for (let i = 0; i < first; i++) cells += '<span class="cd0"></span>';
  for (let d = 1; d <= nd; d++) cells += by[d] ? `<button type="button" class="cday has${d === hoje ? ' hoje' : ''}${S.cal.sel === d ? ' sel' : ''}" data-calday="${d}" aria-pressed="${S.cal.sel === d}" aria-label="Dia ${d}: ${by[d].length} aviso(s)"><b>${d}</b><i class="dots2">${by[d].map(e => `<u class="${calCls(e)}"></u>`).join('')}</i></button>` : `<span class="cday${d === hoje ? ' hoje' : ''}" data-calday="0"><b>${d}</b></span>`;
  if (S.cal.sel && !by[S.cal.sel]) S.cal.sel = null; const sel = S.cal.sel;
  const list = Object.keys(by).map(Number).sort((a, b) => a - b).filter(d => !sel || d === sel).flatMap(d => by[d].map(e => ({ ...e, day: d })));
  const msg = e => { const dd = String(e.day).padStart(2, '0') + '/' + String(m + 1).padStart(2, '0'); const T = e.k === 'man' ? 'a manutenção' : 'a assistência'; if (e.s === 'exp') return `Dia <b>${dd}</b>: <b>EXPIRADA</b> a garantia de <b>${esc(e.t)}</b>.`; if (e.s === 'late') return `Dia <b>${dd}</b>: <b>ATRASADA</b> ${T} <b>${esc(e.t)}</b>.`; if (e.s === 'ok') return `Dia <b>${dd}</b>: <b>REALIZADA</b> ${T} <b>${esc(e.t)}</b>.`;
    return e.k === 'man' ? `Dia <b>${dd}</b>: deve ser feita a manutenção <b>${esc(e.t)}</b>.` : e.k === 'ast' ? `Dia <b>${dd}</b>: será atendida a assistência <b>${esc(e.t)}</b>.` : `Dia <b>${dd}</b>: expira a garantia de <b>${esc(e.t)}</b>.`; };
  el.innerHTML = `<div class="calhead"><button type="button" data-cal="-1" aria-label="Mês anterior">‹</button><b>${MESES[m]} ${y}</b><button type="button" data-cal="1" aria-label="Próximo mês">›</button></div>
  <div class="calgrid">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => `<span class="cwd">${x}</span>`).join('')}${cells}</div>
  <div class="callegend">${[...new Map(Object.values(CAL_K).map(([l, c]) => [l, c]))].map(([l, c]) => `<span><u class="${c}"></u>${l}</span>`).join('')}</div>
  <h3>${sel ? `Avisos do dia ${String(sel).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}` : `Avisos de ${MESES[m].toLowerCase()}`}</h3>${list.length ? list.map(e => `<a class="card calnote" href="#detalhe?${e.k}:${e.id}"><u class="${calCls(e)}"></u><p>${msg(e)}</p>${ico(IC.chev)}</a>`).join('') : '<p class="empty">Nada agendado para este mês.</p>'}`;
}
const CR = { financeiro: [['', 'Financeiro']], custos: [['financeiro', 'Financeiro'], ['', 'Despesas']], avisos: [['', 'Avisos']], midias: [['casa', 'Minha Casa'], ['', 'Mídias']], cronograma: [['casa', 'Minha Casa'], ['', 'Cronograma']], casa: [['casa', 'Minha Casa']], estrutura: [['casa', 'Minha Casa'], ['', 'Estrutura']], sistemas: [['casa', 'Minha Casa'], ['', 'Instalações']], materiais: [['casa', 'Minha Casa'], ['', 'Materiais']], garantias: [['casa', 'Minha Casa'], ['', 'Garantias']], manutencao: [['casa', 'Minha Casa'], ['', 'Manutenção']], equipamentos: [['casa', 'Minha Casa'], ['', 'Equipamentos']], planta: [['casa', 'Minha Casa'], ['', 'Planta técnica']], documentos: [['casa', 'Minha Casa'], ['', 'Documentos']], assistencia: [['assistencia', 'Suporte']], mais: [['mais', 'Perfil']] };
const PFT = { dados: 'Dados pessoais', notificacoes: 'Notificações', seguranca: 'Segurança', personalizacao: 'Personalização', atendimento: 'Atendimento', sobre: 'Sobre' };
function crumbs(h) {
  const fq = h === 'financeiro' && S.q ? (() => { const dq = t => { try { return decodeURIComponent(t); } catch { return t; } }, F = ['financeiro', 'Financeiro'], O = ['financeiro?orcamentos', 'Orçamentos'], m1 = /^(cat|orcedit)=(.+)$/.exec(S.q), m2 = /^sub=([^&]+)&(.+)$/.exec(S.q);
    return S.q === 'contas' ? [F, ['', 'Contas a pagar']] : S.q === 'orcamentos' ? [F, ['', 'Orçamentos']] : S.q === 'orcnova' ? [F, O, ['', 'Lançar orçamento']] : m1 ? (m1[1] === 'cat' ? [F, O, ['', esc(dq(m1[2]))]] : [F, O, ['financeiro?cat=' + m1[2], esc(dq(m1[2]))], ['', 'Editar orçamento']]) : m2 ? [F, O, ['financeiro?cat=' + m2[1], esc(dq(m2[1]))], ['', esc(dq(m2[2]))]] : null; })() : null;
  const c = fq ? fq : h === 'documentos' && DCATS[S.q] ? [['casa', 'Minha Casa'], ['documentos', 'Documentos'], ['', DCATS[S.q].l]] : h === 'custos' && (S.nova || S.xv) ? [['financeiro', 'Financeiro'], ['custos', 'Despesas'], ['', S.xv ? (S.xv.m === 'ver' ? 'Visualizar despesa' : 'Editar despesa') : 'Lançar despesa']] : h === 'mais' && S.q && PFT[S.q] ? [['mais', 'Perfil'], ['', PFT[S.q]]] : h === 'detalhe' ? [['casa', 'Minha Casa'], ['cronograma', 'Cronograma'], ['', 'Detalhe']] : h === 'assistencia' && S.nova ? [['assistencia', 'Suporte'], ['', 'Nova solicitação']] : CR[h]; if (!c || !app.firstElementChild || app.querySelector('.crumbs')) return;
  const last = c.length - 1, items = [['home', 'Início'], ...c].map(([href, t], i, a) => i === a.length - 1 ? `<li aria-current="page">${t}</li>` : `<li><a href="#${href}">${t}</a></li>`);
  app.insertAdjacentHTML('afterbegin', `<ol class="crumbs" aria-label="Você está em">${items.join('<li class="sep" aria-hidden="true">›</li>')}</ol>`);
}
addEventListener('hashchange', () => { S.edit = null; route(); });

async function loadRes(selectId) {
  const { data } = await sb.from('residences').select('*').order('created_at');
  S.res = data || []; S.cur = S.res.find(r => r.id === selectId) || S.res.find(r => r.id === S.cur?.id) || S.res[0] || null;
  route();
}

const GOOGLE_SVG = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
function cpfDigits(v) { return String(v || '').replace(/\D/g, '').slice(0, 11); }
function cpfMask(v) { return cpfDigits(v).replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2'); }
function cpfOk(d) { if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false; for (let t = 9; t < 11; t++) { let s = 0; for (let i = 0; i < t; i++) s += d[i] * (t + 1 - i); if ((s * 10) % 11 % 10 != d[t]) return false; } return true; }
const PW_RULES = [['Mínimo de 8 caracteres', p => p.length >= 8], ['Letra maiúscula', p => /[A-Z]/.test(p)], ['Letra minúscula', p => /[a-z]/.test(p)], ['Número', p => /\d/.test(p)], ['Caractere especial (! @ # $ ...)', p => /[^A-Za-z0-9]/.test(p)]];
const pwList = p => PW_RULES.map(([t, f]) => `<li class="${f(p) ? 'ok' : ''}">${f(p) ? '✓' : '○'} ${t}</li>`).join('');
const strongPw = p => PW_RULES.every(([, f]) => f(p));
const CPF_INPUT = id => `<label>CPF<input id="${id}" class="cpf" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" required autocomplete="off"></label>`;

// Login por CPF + senha. O primeiro acesso confere CPF e e-mail com o cadastro do proprietário no painel; a recuperação de senha vai para esse e-mail.
const WA_ASTELL = 'https://wa.me/5554996528034';
const contactAstell = (txt = 'Contate a ASTELL') => `<a class="xcontact" href="${WA_ASTELL}" target="_blank" rel="noopener">${txt}</a>`;
const EYE = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>';
const EYE_OFF = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3l18 18M10.6 5.1A10.7 10.7 0 0112 5c6.4 0 10 7 10 7a17 17 0 01-3.2 4.2M6.6 6.6A17 17 0 002 12s3.6 7 10 7a10.5 10.5 0 004.4-1M9.9 9.9a3 3 0 004.2 4.2"/></svg>';
const pwInput = (id, label, auto) => `<label>${label}<span class="pwbox"><input id="${id}" type="password" required autocomplete="${auto}"><button type="button" class="pweye" data-eye aria-label="Mostrar senha" aria-pressed="false">${EYE}</button></span></label>`;
document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-eye]'); if (!b) return; const i = b.parentElement.querySelector('input'), show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.innerHTML = show ? EYE_OFF : EYE; b.setAttribute('aria-label', show ? 'Ocultar senha' : 'Mostrar senha'); b.setAttribute('aria-pressed', String(show)); });
const msgBox = (el, html) => { el.innerHTML = html; el.hidden = !html; };

function loginScreen(mode = 'login') {
  $('#top').hidden = $('#nav').hidden = true;
  const su = mode === 'signup', back = location.origin + location.pathname;
  app.innerHTML = `<div class="login"><form id="lf">
    <h1>ASTELL<span>HOME</span></h1><p class="tag">Sua casa. Sua história. Tudo em um só lugar.</p>
    <h2>${su ? 'Primeiro acesso: crie sua senha' : 'Bem-vindo à sua casa Astell'}</h2>
    ${su ? '<p class="lead">Informe o CPF e o e-mail cadastrados pela Astell. Sugerimos o Gmail que você usa no celular: enviaremos um link de confirmação e, se esquecer a senha, a recuperação é feita por ele.</p>' : ''}
    ${CPF_INPUT('cp')}
    ${su ? '<label>E-mail<input id="em" type="email" required autocomplete="email" placeholder="seuemail@gmail.com"></label>' : ''}
    ${pwInput('pw', 'Senha', su ? 'new-password' : 'current-password')}
    ${su ? `<ul class="pwrules" id="pr">${pwList('')}</ul>${pwInput('pw2', 'Confirmar senha', 'new-password')}` : ''}
    <p class="warn" id="lm" hidden></p>
    <button class="btn-main">${su ? 'Criar acesso' : 'Entrar na minha casa'}</button>
    ${su ? '' : '<button type="button" id="fg" class="btn-text">Esqueci minha senha</button>'}
    ${su ? '' : `<div class="or"><span>ou</span></div><button type="button" class="btn-google" id="gg">${GOOGLE_SVG}<span>Entrar com o Google</span></button><p class="fine">Com o Google você confirma seu CPF na primeira vez.</p>`}
    <p class="switch">${su ? 'Já criou sua senha?' : 'Primeiro acesso?'} <button type="button" id="sw" class="btn-text">${su ? 'Entrar' : 'Criar senha'}</button></p>
  </form></div>`;
  $('#sw').onclick = () => loginScreen(su ? 'login' : 'signup');
  if ($('#fg')) $('#fg').onclick = forgotScreen;
  if ($('#gg')) $('#gg').onclick = async () => {
    if (IN_APP) {   // Median: login nativo do Google (o Google bloqueia o login pelo navegador embutido)
      if (!(window.median && median.socialLogin && median.socialLogin.google)) return toast('O login com o Google não está ativo neste aplicativo. Entre com CPF e senha.', 1);
      window.__gLogin = async r => { if (!r || !r.idToken) return toast(r && r.error ? 'Não foi possível entrar com o Google.' : 'Login com o Google cancelado.', 1); const { error } = await sb.auth.signInWithIdToken({ provider: 'google', token: r.idToken }); if (error) return toast('O Supabase não aceitou o login com o Google. Confira o Client ID do Google no Supabase.', 1); };
      return median.socialLogin.google.login({ callback: window.__gLogin });
    }
    if (location.protocol === 'file:') return toast('O login com Google não funciona com o arquivo aberto direto. Abra o app por um endereço http ou https.', 1);
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back } }); if (error) toast('Não foi possível entrar com o Google. Confira se ele está ativado no Supabase.', 1);
  };
  $('#lf').onsubmit = async e => {
    e.preventDefault(); const cpf = cpfDigits($('#cp').value), password = $('#pw').value, btn = $('#lf .btn-main'), lm = $('#lm'); msgBox(lm, '');
    if (!cpfOk(cpf)) return toast('CPF inválido. Confira os números.', 1);
    if (!su) {
      if (!strongPw(password)) return toast('CPF ou senha incorretos.', 1);
      btn.disabled = true; const { data: em } = await sb.rpc('cpf_login_email', { p_cpf: cpf });
      const r = em ? await sb.auth.signInWithPassword({ email: em, password }) : { error: { message: 'x' } }; btn.disabled = false;
      if (r.error) msgBox(lm, /confirm/i.test(r.error.message) ? 'Confirme seu e-mail pelo link que enviamos e tente de novo.' : /rate|too many/i.test(r.error.message) ? 'Muitas tentativas. Aguarde alguns minutos.' : 'CPF ou senha incorretos. Se acabou de criar o acesso, confirme primeiro o link enviado ao seu e-mail.'); return;
    }
    const email = $('#em').value.trim().toLowerCase();
    if (!strongPw(password)) return toast('A senha não atende a todos os requisitos.', 1);
    if (password !== $('#pw2').value) return toast('As senhas não são iguais.', 1);
    btn.disabled = true; const { data: ck } = await sb.rpc('signup_check', { p_cpf: cpf, p_email: email, p_scope: 'app' });
    if (!ck || !ck.ok) { btn.disabled = false; return msgBox(lm, (ck && ck.code === 'NOEMAIL' ? 'O seu cadastro na Astell ainda não tem e-mail.' : 'O CPF e o e-mail não conferem com o cadastro da Astell.') + ' ' + contactAstell()); }
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { cpf }, emailRedirectTo: back } }); btn.disabled = false;
    if ((error && /registered|exists/i.test(error.message)) || (data && data.user && data.user.identities && data.user.identities.length === 0)) {   // e-mail que já tem acesso (ex.: Google): o dono define a senha pelo link enviado ao próprio e-mail
      const r = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
      return msgBox(lm, r.error ? 'Este e-mail já tem acesso, mas não foi possível enviar o link agora (' + esc(r.error.message) + '). Tente em alguns minutos.' : 'Este e-mail já tinha acesso. Enviamos um link para você definir a senha de CPF: abra o e-mail (veja o spam), toque no link, informe o CPF e crie a senha.');
    }
    if (error) return msgBox(lm, 'Não foi possível criar o acesso: ' + esc(error.message));
    if (!data.session) confirmScreen(email, true);
  };
}

// Esqueci a senha: o link vai para o e-mail cadastrado
function forgotScreen() {
  $('#top').hidden = $('#nav').hidden = true;
  app.innerHTML = `<div class="login"><form id="ff"><h1>ASTELL<span>HOME</span></h1><h2>Recuperar senha</h2>
    <p class="lead">Informe seu CPF. Enviaremos um link para o e-mail que você usou no primeiro acesso.</p>${CPF_INPUT('cp')}
    <p class="warn" id="lm" hidden></p><button class="btn-main">Enviar link</button><button type="button" id="bk" class="btn-text">Voltar</button></form></div>`;
  $('#bk').onclick = () => loginScreen();
  $('#ff').onsubmit = async e => {
    e.preventDefault(); const cpf = cpfDigits($('#cp').value), btn = $('#ff .btn-main'); if (!cpfOk(cpf)) return toast('CPF inválido. Confira os números.', 1);
    btn.disabled = true; const { data: em } = await sb.rpc('cpf_login_email', { p_cpf: cpf }); const rr = em ? await sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + location.pathname }) : {}; btn.disabled = false;
    if (rr.error) return msgBox($('#lm'), 'Não foi possível enviar o e-mail agora (' + esc(rr.error.message) + '). Tente novamente em alguns minutos.');
    msgBox($('#lm'), 'Se o CPF tiver acesso, enviamos o link para o e-mail cadastrado. Confira também a caixa de spam. Sem acesso ao e-mail? ' + contactAstell());
  };
}
// Nova senha (aberta pelo link do e-mail de recuperação)
function recoveryScreen(session) {
  $('#top').hidden = $('#nav').hidden = true;
  const needCpf = !/^\d{11}$/.test(String(((session && session.user && session.user.user_metadata) || {}).cpf || ''));   // conta que já existia (ex.: Google): confirma o CPF aqui
  app.innerHTML = `<div class="login"><form id="rf"><h1>ASTELL<span>HOME</span></h1><h2>${needCpf ? 'Crie sua senha de acesso' : 'Crie uma nova senha'}</h2>
    ${needCpf ? CPF_INPUT('cp') : ''}${pwInput('pw', 'Nova senha', 'new-password')}<ul class="pwrules" id="pr">${pwList('')}</ul>${pwInput('pw2', 'Confirmar nova senha', 'new-password')}<button class="btn-main">Salvar senha</button></form></div>`;
  $('#rf').onsubmit = async e => {
    e.preventDefault(); const p = $('#pw').value, cpf = needCpf ? cpfDigits($('#cp').value) : '';
    if (needCpf && !cpfOk(cpf)) return toast('CPF inválido. Confira os números.', 1); if (!strongPw(p)) return toast('A senha não atende a todos os requisitos.', 1); if (p !== $('#pw2').value) return toast('As senhas não são iguais.', 1);
    const { error } = await sb.auth.updateUser(needCpf ? { password: p, data: { cpf } } : { password: p }); if (error) return toast('Não foi possível salvar a senha: ' + error.message, 1);
    if (needCpf) {   // vincula a conta ao CPF (exige e-mail confirmado igual ao cadastrado pela Astell)
      const { data: c } = await sb.rpc('claim_my_cpf');
      if (!c || !c.ok) { toast('Senha salva, mas o CPF e o e-mail não conferem com o cadastro. Fale com a Astell.', 1); REC_FLOW = false; history.replaceState(null, '', location.pathname); const { data: s2 } = await sb.auth.getSession(); return start(s2.session); }
      REC_FLOW = false; history.replaceState(null, '', location.pathname); toast('Senha criada! Da próxima vez entre com CPF e senha.'); const { data: s2 } = await sb.auth.getSession(); return start(s2.session);
    }
    REC_FLOW = false; history.replaceState(null, '', location.pathname); toast('Senha alterada! Entre com seu CPF e a nova senha.'); await sb.auth.signOut();
  };
}
// E-mail ainda não confirmado
function confirmScreen(email, fresh) {
  $('#top').hidden = $('#nav').hidden = true;
  app.innerHTML = `<div class="login"><form id="cm"><h1>ASTELL<span>HOME</span></h1><h2>Confirme seu e-mail</h2>
    <p class="lead">${fresh ? 'Acesso criado! ' : ''}Enviamos um link de confirmação para <b>${esc(email)}</b>. Abra o e-mail (veja também o spam), toque no link e depois volte aqui para entrar com CPF e senha.</p>
    <button type="button" id="rs" class="btn-main">Reenviar e-mail</button><button type="button" id="bk" class="btn-text">Voltar ao login</button></form></div>`;
  $('#bk').onclick = async () => { await sb.auth.signOut(); loginScreen(); };
  $('#rs').onclick = async () => { const { error } = await sb.auth.resend({ type: 'signup', email }); toast(error ? 'Não foi possível reenviar agora. Tente em alguns minutos.' : 'E-mail reenviado.', !!error); };
}

// CPF sem residência vinculada: orienta a falar com a Astell
function semCasaScreen(msg) {
  $('#top').hidden = $('#nav').hidden = true;
  app.innerHTML = `<div class="login"><form id="nc"><h1>ASTELL<span>HOME</span></h1><p class="tag">Falta só uma etapa</p><h2>Sua residência ainda não foi vinculada</h2>
    <p class="lead">${esc(msg || 'Não encontramos uma residência cadastrada para o seu CPF.')}</p>
    <p class="lead">${contactAstell()}</p>
    <button type="button" id="rt" class="btn-main">Verificar novamente</button><button type="button" id="so" class="btn-text">Sair</button></form></div>`;
  $('#so').onclick = () => sb.auth.signOut();
  $('#rt').onclick = async () => { const { data } = await sb.auth.getSession(); start(data.session); };
}

async function claim(cpf) {
  const { data, error } = await sb.rpc('claim_cpf', { p_cpf: cpf });
  if (error || !data) return { ok: false, msg: 'Não foi possível verificar o CPF agora. Tente novamente.' };
  if (data.ok) { sb.auth.updateUser({ data: { cpf: null } }); return data; }
  return { ok: false, msg: { INVALID: 'CPF inválido.', LIMIT: 'Muitas tentativas. Aguarde cerca de 1 hora ou fale com a Astell.', UNAVAILABLE: 'CPF não encontrado ou indisponível. Confira os números ou fale com a Astell.' }[data.code] || 'Não foi possível verificar o CPF.' };
}

function cpfScreen(notice) {
  $('#top').hidden = $('#nav').hidden = true;
  app.innerHTML = `<div class="login"><form id="cf"><h1>ASTELL<span>HOME</span></h1><p class="tag">Falta só uma etapa</p><h2>Confirme seu CPF</h2>
    <p class="lead">Informe o CPF cadastrado pela Astell para acessar os dados da sua residência.</p>${notice ? `<p class="warn">${esc(notice)}</p>` : ''}
    ${CPF_INPUT('cp')}<button class="btn-main">Confirmar CPF</button><button type="button" id="so" class="btn-text">Sair</button></form></div>`;
  $('#cf').onsubmit = async e => {
    e.preventDefault(); const cpf = cpfDigits($('#cp').value);
    if (!cpfOk(cpf)) return toast('CPF inválido. Confira os números.', 1);
    const r = await claim(cpf); if (!r.ok) return toast(r.msg, 1);
    toast(r.residences ? 'CPF confirmado! Sua residência foi encontrada.' : 'CPF confirmado. A Astell ainda vai vincular sua residência.');
    const { data } = await sb.auth.getSession(); start(data.session);
  };
  $('#so').onclick = () => sb.auth.signOut();
}

// logo cadastrada no painel (menu Logo); sem ela, continua o texto ASTELL
async function loadLogo() {
  try {
    const { data } = await sb.from('app_settings').select('value').eq('key', 'logo_url').maybeSingle(); if (!data || !data.value) return;
    $('#top').classList.add('haslogo'); document.querySelectorAll('.logo').forEach(el => { const sp = (/<span[\s\S]*<\/span>/.exec(el.innerHTML) || [''])[0]; el.innerHTML = `<img class="logoimg" src="${esc(String(data.value).replace('/upload/', '/upload/w_360,c_limit,q_auto,f_auto/'))}" alt="Astell">${sp}`; });
  } catch (e) { /* sem logo: fica o texto */ }
}
async function start(session) {
  if (REC_FLOW && session) return recoveryScreen(session);
  if (!session) { S.profile = null; S.cur = null; return loginScreen(); }
  const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
  if (!data) return fail('Sua conta existe, mas ainda não tem perfil no banco. Peça à Astell para conferir se o schema.sql foi executado antes da criação do usuário.');
  S.profile = data; paintAvatar();
  const metaCpf = /^\d{11}$/.test(String((session.user.user_metadata || {}).cpf || ''));
  if (metaCpf && data.role === 'client') {   // acesso criado com CPF + e-mail: vincula as residências cadastradas pela Astell
    const { data: c } = await sb.rpc('claim_my_cpf');
    if (c && c.code === 'UNCONFIRMED') return confirmScreen(session.user.email);
    if (c && c.ok) { const { data: p2 } = await sb.from('profiles').select('*').eq('id', session.user.id).single(); if (p2) { S.profile = p2; paintAvatar(); } }
    const { data: rs } = await sb.from('residences').select('id').limit(1);
    if (!(rs || []).length) return semCasaScreen(c && c.code === 'DENIED' ? 'O CPF ou o e-mail desta conta não conferem com o cadastro da Astell.' : '');
  }
  else if (data.role === 'client' && !data.cpf_claimed) {
    const { data: rs } = await sb.from('residences').select('id').limit(1);
    if (!(rs || []).length) {
      const pend = (session.user.user_metadata || {}).cpf;
      if (pend) { const r = await claim(pend); if (r.ok) { const { data: s2 } = await sb.auth.getSession(); return start(s2.session); } return cpfScreen(r.msg); }
      return cpfScreen();
    }
  }
  $('#top').hidden = $('#nav').hidden = false;
  loadLogo();
  await loadRes();
}
sb.auth.getSession().then(({ data }) => start(data.session));
sb.auth.onAuthStateChange((ev, s) => { if (ev === 'PASSWORD_RECOVERY') REC_FLOW = true;
  if (ev === 'SIGNED_IN' && S.profile && s && S.profile.id === s.user.id) return;
  if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') setTimeout(() => start(s), 0); });

app.addEventListener('change', e => { if (e.target.id === 'planSel') { S.planId = e.target.value; route(); } if (e.target.id === 'homeSel') { S.cur = S.res.find(r => r.id === e.target.value) || S.cur; route(); } });

app.addEventListener('input', e => {
  const t = e.target;
  if (t.classList && t.classList.contains('cpf')) t.value = cpfMask(t.value);
  if (t.id === 'pw' && $('#pr')) $('#pr').innerHTML = pwList(t.value);
});

$('#lb').addEventListener('click', e => {
  const d = e.target.dataset;
  if (e.target.id === 'lb' || d.lbx !== undefined) { $('#lb').hidden = true; $('#lb').innerHTML = ''; }
  if (d.lbn) { const n = S.groups[S.lb.g].length; S.lb.i = (S.lb.i + +d.lbn + n) % n; showLb(); }
});
addEventListener('keydown', e => {
  if ($('#lb').hidden) return;
  if (e.key === 'Escape') { $('#lb').hidden = true; $('#lb').innerHTML = ''; }
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { const n = S.groups[S.lb.g].length; S.lb.i = (S.lb.i + (e.key === 'ArrowRight' ? 1 : -1) + n) % n; showLb(); }
});

addEventListener('keydown', e => { if (e.target.matches && e.target.matches('input[data-nonneg]') && ['-', '+', 'e', 'E', '.', ','].includes(e.key)) e.preventDefault(); });
addEventListener('input', e => { const t = e.target; if (t.matches && t.matches('input.tel')) t.value = telMask(t.value); });
addEventListener('input', e => { const t = e.target; if (t.matches && t.matches('input[data-nonneg]') && t.value !== '' && !/^\d+$/.test(t.value)) t.value = t.value.replace(/\D/g, ''); });
/* ===== ASTI — assistente virtual (início) ===== */
// Conversa por texto ou voz, consultas e cadastros somente nas residências do usuário (o banco já filtra pelo acesso da conta).
const AS = { cache: {}, msgs: [], draft: null, offer: null, ctx: null, welcomed: false, open: false, busy: false, uid: null, rec: null, listening: false };
const asLs = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (_) {} return null; };
const asCap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const asFirst = () => { const n = String((S.profile && S.profile.name) || '').trim().split(/\s+/)[0] || ''; return n.includes('@') ? '' : asCap(n.toLowerCase()); };
const asSum = (a, f = x => x) => a.reduce((s, x) => s + Number(f(x) || 0), 0);
const asMes = ['janeiro', 'fevereiro', 'marco', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const asPlural = (n, s, p) => n + ' ' + (n === 1 ? s : p);
const asIc = {
  bot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="11" rx="4.5"/><path d="M12 8V5"/><circle cx="12" cy="4" r="1"/><path d="M2.5 13v2M21.5 13v2M9 12.5v2M15 12.5v2"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg>',
  spk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>'
};

/* ---------- números, datas, categorias ---------- */
function asNum(s) {
  s = String(s).trim(); if (!s) return NaN;
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (s.includes(',')) return parseFloat(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d+\.\d{1,2}$/.test(s)) return parseFloat(s);
  return parseFloat(s.replace(/\./g, ''));
}
function asMoney(t) {   // t: texto normalizado (minúsculas, sem acento)
  let x = ' ' + t + ' ';
  x = x.replace(/\d{1,2}\/\d{1,2}(\/\d{2,4})?/g, ' ').replace(/\bdia\s+\d{1,2}\b/g, ' ').replace(/\b\d+\s*(x|vezes|parcelas?|meses|mes|anos?|dias?|m2|m²)\b/g, ' ').replace(/\bparcelad[oa]s?\s+(em|de)\s+\d+/g, ' ').replace(/\b(19|20)\d{2}\b(?!\s*(reais|mil))/g, ' ');
  let m;
  if ((m = /r\$\s*([\d.,]+)(\s*(mil|k)\b)?/.exec(x))) { const n = asNum(m[1].replace(/[.,]$/, '')); if (n > 0) return m[2] ? n * 1000 : n; }
  if ((m = /\b([\d.,]+)\s*(mil|k)\b/.exec(x))) { const n = asNum(m[1].replace(/[.,]$/, '')); if (n > 0) return n * 1000; }
  if ((m = /\bmil e (\d+)/.exec(x))) return 1000 + Number(m[1]);
  if ((m = /\b([\d.,]+)\s*(reais|real|conto|contos|pila|pilas)\b/.exec(x))) { const n = asNum(m[1].replace(/[.,]$/, '')); if (n > 0) return n; }
  if (/\bmil (reais|real)\b/.test(x)) return 1000;
  if ((m = /\b(\d[\d.,]*)\b/.exec(x))) { const n = asNum(m[1].replace(/[.,]$/, '')); if (n > 0) return n; }
  return null;
}
function asDate(t, future) {   // devolve AAAA-MM-DD ou null
  const now = new Date(todayIso() + 'T00:00'), Y = now.getFullYear(), M = now.getMonth(), D = now.getDate(), iso = (y, m, d) => xIso(new Date(y, m, d)); let m;
  if (/\bhoje\b/.test(t)) return todayIso();
  if (/\banteontem\b/.test(t)) return iso(Y, M, D - 2);
  if (/\bontem\b/.test(t)) return iso(Y, M, D - 1);
  if (/\bamanha\b/.test(t)) return iso(Y, M, D + 1);
  if ((m = /\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/.exec(t))) { let y = m[3] ? +m[3] : Y; if (y < 100) y += 2000; const d = new Date(y, +m[2] - 1, +m[1]); if (d.getMonth() === +m[2] - 1) return xIso(d); }
  if ((m = new RegExp('\\b(?:dia\\s+)?(\\d{1,2})\\s+de\\s+(' + asMes.join('|') + ')(?:\\s+de\\s+(\\d{4}))?').exec(t))) { const mi = asMes.indexOf(m[2]); let y = m[3] ? +m[3] : Y; if (!m[3] && future && new Date(y, mi, +m[1]) < now) y++; return iso(y, mi, +m[1]); }
  if ((m = /\bdia\s+(\d{1,2})\b/.exec(t))) { const d = +m[1]; if (d >= 1 && d <= 31) { let mo = M; if (future && d < D) mo++; return iso(Y, mo, d); } }
  return null;
}
function asPeriod(t) {   // período citado na frase
  const now = new Date(todayIso() + 'T00:00'), Y = now.getFullYear(), M = now.getMonth(), D = now.getDate(), iso = (y, m, d) => xIso(new Date(y, m, d)); let m;
  if (/\b(mes passado|ultimo mes|mes anterior)\b/.test(t)) return { k: 'lastmonth', from: iso(Y, M - 1, 1), to: iso(Y, M, 0), label: 'no mês passado' };
  if (/\b(este mes|neste mes|mes atual|do mes|no mes|deste mes)\b/.test(t)) return { k: 'month', from: iso(Y, M, 1), to: iso(Y, M + 1, 0), label: 'neste mês' };
  if (/\b(esta semana|nesta semana|essa semana|na semana|desta semana|proximos 7 dias|proximos sete dias)\b/.test(t)) return { k: 'week', from: iso(Y, M, D), to: iso(Y, M, D + 7), label: 'nos próximos 7 dias' };
  if (/\bsemana que vem|proxima semana\b/.test(t)) return { k: 'nextweek', from: iso(Y, M, D + 7), to: iso(Y, M, D + 14), label: 'na semana que vem' };
  if ((m = /\bproximos (\d{1,3}) dias\b/.exec(t))) return { k: 'days', from: iso(Y, M, D), to: iso(Y, M, D + +m[1]), label: `nos próximos ${m[1]} dias` };
  if (/\b(este ano|neste ano|no ano)\b/.test(t)) return { k: 'year', from: iso(Y, 0, 1), to: iso(Y, 11, 31), label: 'neste ano' };
  if (/\bhoje\b/.test(t)) return { k: 'today', from: todayIso(), to: todayIso(), label: 'hoje' };
  if ((m = new RegExp('\\b(?:em|de|no mes de|durante)\\s+(' + asMes.join('|') + ')\\b').exec(t))) { const mi = asMes.indexOf(m[1]); return { k: 'named', from: iso(Y, mi, 1), to: iso(Y, mi + 1, 0), label: 'em ' + ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][mi] }; }
  return null;
}
const AS_SYN = {
  'Acabamentos': ['tinta', 'pintura', 'piso', 'porcelanato', 'revestimento', 'azulejo', 'rejunte', 'gesso', 'forro', 'bancada', 'marmore', 'granito', 'cuba', 'metais', 'torneira', 'massa corrida', 'textura'],
  'Mobiliário': ['sofa', 'mesa', 'cadeira', 'cama', 'armario', 'guarda roupa', 'estante', 'rack', 'colchao', 'movel', 'moveis', 'poltrona', 'marcenaria'],
  'Eletrodomésticos': ['geladeira', 'fogao', 'microondas', 'micro ondas', 'maquina de lavar', 'lava loucas', 'cooktop', 'coifa', 'forno', 'lavadora', 'secadora', 'freezer', 'ar condicionado', 'ventilador'],
  'Eletrônicos': ['tv', 'televisao', 'televisor', 'notebook', 'soundbar', 'celular', 'roteador', 'camera', 'alexa'],
  'Área externa': ['piscina', 'jardim', 'paisagismo', 'grama', 'churrasqueira', 'portao', 'calcada', 'deck', 'muro'],
  'Construção': ['cimento', 'tijolo', 'areia', 'brita', 'concreto', 'ferragem', 'ferro', 'aco', 'steel frame', 'madeira', 'laje', 'fundacao', 'alvenaria', 'pedreiro', 'drywall'],
  'Serviços': ['servico', 'mao de obra', 'frete', 'taxa', 'projeto', 'arquiteto', 'engenheiro', 'diaria', 'instalacao']
};
const asRx = w => new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+') + '([^a-z0-9]|$)');
const asCatList = D => xCats((D && D.cats) || [], (D && D.ex) || []);
function asFindCat(t, list) {   // { name, isNew }
  list = list || (S.xcats && S.xcats.length ? S.xcats : XDEF); let m;
  if ((m = /\bcategoria\s+(?:de\s+|do\s+|da\s+)?([a-z0-9 ]{2,40}?)(?=\s+(?:subcategoria|no|na|em|com|valor|de|por|pago|paga|para|dia|hoje|ontem|forma|parcelad|a vista)\b|$)/.exec(t))) {
    const w = m[1].trim(), hit = list.find(c => nrm(c) === w) || list.find(c => nrm(c).startsWith(w) || w.startsWith(nrm(c)));
    if (hit) return { name: hit, isNew: false }; if (w && !/^(outr|nova|qualquer)/.test(w)) return { name: asCap(w), isNew: true };
  }
  const byLen = [...list].sort((a, b) => b.length - a.length), hit = byLen.find(c => asRx(nrm(c)).test(t));
  if (hit) return { name: hit, isNew: false };
  for (const [cat, words] of Object.entries(AS_SYN)) { const real = list.find(c => nrm(c) === nrm(cat)); if (real && words.some(w => asRx(w).test(t))) return { name: real, isNew: false, via: 'syn' }; }
  return null;
}
function asRes(t) {   // residências citadas (ou a atual)
  const all = S.res || [];
  if (all.length > 1 && /\b(todas|todos)\b.*\b(residencias?|casas?|obras?|imoveis)\b|\b(em|nas|das)\s+todas\b|\bgeral das (casas|obras|residencias)\b/.test(t)) return { list: all, all: true };
  const hit = all.filter(r => (r.name && nrm(r.name).length > 2 && t.includes(nrm(r.name))) || (r.code && t.includes(nrm(r.code))));
  if (hit.length === 1 && all.length > 1) return { list: hit, named: true };
  return { list: S.cur ? [S.cur] : [], cur: true };
}
const asResName = id => { const r = (S.res || []).find(x => x.id === id); return r ? (r.name || r.code) : ''; };

/* ---------- dados (sempre pelas regras de acesso do banco) ---------- */
async function asData(ids, force) {
  const key = ids.slice().sort().join(','), c = AS.cache[key];
  if (!force && c && Date.now() - c.t < 40000) return c.d;
  const IN = tb => sb.from(tb).select('*').in('residence_id', ids);
  const [ex, inst, cb, rs, wa, mt, sr, cs, ss] = await Promise.all([IN('expenses'), IN('expense_installments'), IN('category_budgets'), sb.from('residences').select('*').in('id', ids), IN('warranties'), IN('maintenance_tasks'), IN('service_requests'), sb.from('expense_categories').select('name'), sb.from('expense_subcategories').select('category,name')]);
  const d = { ex: ex.data || [], inst: inst.data || [], cb: cb.data || [], rs: rs.data || [], wa: wa.data || [], mt: mt.data || [], sr: sr.data || [], cats: cs.data || [], subs: ss.data || [] };
  AS.cache[key] = { t: Date.now(), d }; return d;
}
const asDrop = () => { AS.cache = {}; };
/* ---------- IA (Gemini) — só reescreve a frase num comando padrão; quem executa é o app, com confirmação ---------- */
const AS_AI = { on: true, n: 0, pause: 0 };
async function asAI(raw, asking) {
  try {
    if (!AS_AI.on || Date.now() < AS_AI.pause || AS_AI.n >= 80 || !sb.functions || !navigator.onLine) return null; AS_AI.n++;
    const r = await Promise.race([sb.functions.invoke('asti-nlu', { body: { text: String(raw).slice(0, 400), cats: (S.xcats && S.xcats.length ? S.xcats : XDEF), asking: asking || null, today: todayIso() } }), new Promise((_, rej) => setTimeout(() => rej(new Error('tempo esgotado')), 9000))]);
    if (r.error || !r.data || !r.data.canonical) throw (r.error || new Error('vazio'));
    const c = String(r.data.canonical).trim(); if (/^FORA_DO_ESCOPO/i.test(c)) return { off: true }; if (/^NAO_ENTENDI/i.test(c)) return null; return { text: c };
  } catch (e) { AS_AI.pause = Date.now() + 120000; return null; }   // se falhar, o ASTI segue só com as regras locais
}

function asSplit(list, D) {
  const t = todayIso(); let pago = 0, comp = 0;
  list.forEach(e => { const ins = D.inst.filter(i => i.expense_id === e.id), tot = asSum(ins, i => i.amount), rest = Math.max(0, Number(e.amount) - tot);
    ins.forEach(i => { if (i.paid_on) pago += Number(i.amount); else comp += Number(i.amount); });
    if (e.spent_on <= t) pago += rest; else comp += rest; });
  return { pago, comp };
}
const asBudget = (D, rid) => Number(((D.rs || []).find(r => r.id === rid) || {}).budget || 0);
const asBillSt = i => i.paid_on ? 'paid' : i.due_on < todayIso() ? 'late' : dayDiff(i.due_on) <= 15 ? 'soon' : 'ok';
const asExName = (D, i) => { const e = D.ex.find(x => x.id === i.expense_id); return e ? e.description : 'Despesa'; };
const asLimit = p => p > 100 ? ['ultrapassou o limite', 'r'] : p >= 80 ? ['atenção: perto do limite', 'g'] : ['dentro do limite', 'ok'];
const asWhere = R => R.all ? 'em todas as suas residências' : (S.res.length > 1 ? `na residência ${R.list[0].name || R.list[0].code}` : '');

/* ---------- respostas de consulta ---------- */
const rp = (t, o = {}) => ({ t, ...o });
async function qSpend(sl) {
  const R = sl.res, D = await asData(R.list.map(r => r.id)); let list = D.ex;
  if (sl.cat) list = list.filter(e => inCat(e, sl.cat));
  if (sl.per) list = list.filter(e => e.spent_on >= sl.per.from && e.spent_on <= sl.per.to);
  const total = asSum(list, e => e.amount), sp = asSplit(list, D), tag = [sl.cat ? `com **${sl.cat}**` : '', sl.per ? sl.per.label : '', asWhere(R)].filter(Boolean).join(' ');
  if (!list.length) return rp(`Não encontrei despesas lançadas ${tag || 'até agora'}.`, { offer: { t: 'lançar uma despesa', l: 'Lançar uma despesa' }, ask: 'Quer lançar uma despesa agora?' });
  let t = `O total lançado ${tag ? tag : 'até agora'} é **${brl(total)}** (${asPlural(list.length, 'despesa', 'despesas')}).\nDesse valor, ${brl(sp.pago)} já foi pago e ${brl(sp.comp)} ainda está a pagar.`;
  if (R.all) { t += '\n\nPor residência:\n' + R.list.map(r => `• ${r.name || r.code}: ${brl(asSum(list.filter(e => e.residence_id === r.id), e => e.amount))}`).join('\n'); }
  else {
    const rid = R.list[0].id;
    if (sl.cat) { const b = D.cb.find(x => x.residence_id === rid && nrm(x.category) === nrm(sl.cat)), gen = asBudget(D, rid), eff = b ? (b.pct != null ? gen * Number(b.pct) / 100 : Number(b.amount || 0)) : 0;
      if (eff > 0 && !sl.per) { const used = asSum(D.ex.filter(e => inCat(e, sl.cat)), e => e.amount), p = pctN(used, eff); t += `\nO orçamento dessa categoria é ${brl(eff)}: ${p}% consumido, ${asLimit(p)[0]}${used < eff ? ` — restam ${brl(eff - used)}` : ''}.`; } }
    else if (!sl.per) { const gen = asBudget(D, rid); if (gen > 0) { const p = pctN(total, gen); t += `\nDo orçamento geral de ${brl(gen)}, ${p}% já foi consumido, ${asLimit(p)[0]}${total < gen ? ` — restam ${brl(gen - total)}` : ''}.`; } }
    if (!sl.cat) { const by = {}; list.forEach(e => by[e.category] = (by[e.category] || 0) + Number(e.amount)); const top = Object.entries(by).sort((a, b) => b[1] - a[1])[0]; if (top && Object.keys(by).length > 1) t += `\nA categoria com maior gasto é **${top[0]}** (${brl(top[1])}).`; }
  }
  return rp(t, { ctx: { k: 'spend', cat: sl.cat, per: sl.per, res: R }, offer: sl.cat ? { t: 'últimas despesas ' + (sl.cat ? 'de ' + sl.cat : ''), l: 'Ver últimas despesas' } : { t: 'orçamento por categoria', l: 'Ver orçamento por categoria' }, ask: sl.cat ? `Quer ver as últimas despesas de ${sl.cat}?` : 'Quer ver como está o orçamento de cada categoria?', chips: [{ l: 'Contas a vencer', t: 'quais contas vencem esta semana' }, { l: 'Lançar despesa', t: 'lançar uma despesa' }] });
}
async function qBudget(sl) {
  const R = sl.res, D = await asData(R.list.map(r => r.id)); const out = [];
  for (const r of R.list) {
    const gen = asBudget(D, r.id), all = D.ex.filter(e => e.residence_id === r.id), tot = asSum(all, e => e.amount), cbs = D.cb.filter(b => b.residence_id === r.id);
    let t = R.list.length > 1 ? `**${r.name || r.code}**\n` : '';
    if (sl.cat) { const b = cbs.find(x => nrm(x.category) === nrm(sl.cat)), eff = b ? (b.pct != null ? gen * Number(b.pct) / 100 : Number(b.amount || 0)) : 0, used = asSum(all.filter(e => inCat(e, sl.cat)), e => e.amount);
      t += eff > 0 ? `**${sl.cat}**: orçamento de ${brl(eff)}, já usou ${brl(used)} (${pctN(used, eff)}%) — ${asLimit(pctN(used, eff))[0]}${used < eff ? `. Restam ${brl(eff - used)}` : `. Excedeu ${brl(used - eff)}`}.` : `A categoria **${sl.cat}** ainda não tem orçamento definido (já foram lançados ${brl(used)}).`; }
    else {
      t += gen > 0 ? `Orçamento geral: **${brl(gen)}**. Já foi lançado ${brl(tot)} (${pctN(tot, gen)}%) — ${asLimit(pctN(tot, gen))[0]}${tot < gen ? `. Disponível: ${brl(gen - tot)}` : `. Excedeu ${brl(tot - gen)}`}.` : `O orçamento geral ainda não foi definido. Já foram lançados ${brl(tot)}.`;
      if (cbs.length) t += '\n' + cbs.map(b => { const eff = b.pct != null ? gen * Number(b.pct) / 100 : Number(b.amount || 0), u = asSum(all.filter(e => inCat(e, b.category)), e => e.amount), p = pctN(u, eff); return `• ${b.category}: ${brl(u)} de ${brl(eff)} (${p}%)${p > 100 ? ' ⚠' : ''}`; }).join('\n');
    }
    out.push(t);
  }
  return rp(out.join('\n\n'), { ctx: { k: 'budget', cat: sl.cat, res: R }, offer: { t: 'quais contas vencem esta semana', l: 'Ver contas a vencer' }, ask: 'Quer conferir as contas que estão para vencer?', chips: [{ l: 'Definir orçamento', t: 'definir orçamento' }] });
}
async function qBills(sl, t0) {
  const R = sl.res, D = await asData(R.list.map(r => r.id)); let L = D.inst.slice(), per = sl.per, tag = '';
  const late = /\bvencid/.test(t0), paid = /\b(pagas?|pagos?|quitad)/.test(t0) && !/\ba pagar\b/.test(t0), ex = id => D.ex.find(x => x.id === id);
  if (late) { L = L.filter(i => asBillSt(i) === 'late'); tag = 'vencidas'; }
  else if (paid) { L = L.filter(i => i.paid_on); tag = 'pagas'; if (per) L = L.filter(i => i.paid_on >= per.from && i.paid_on <= per.to); }
  else { L = L.filter(i => !i.paid_on); if (per) { L = L.filter(i => i.due_on >= per.from && i.due_on <= per.to); tag = 'em aberto ' + per.label; } else { L = L.filter(i => asBillSt(i) !== 'ok'); tag = 'vencidas ou que vencem em até 15 dias'; } }
  if (sl.cat) L = L.filter(i => { const e = ex(i.expense_id); return e && inCat(e, sl.cat); });
  L.sort((a, b) => (paid ? b.paid_on.localeCompare(a.paid_on) : a.due_on.localeCompare(b.due_on)));
  if (!L.length) return rp(`Boa notícia: não encontrei contas ${tag || 'nesse filtro'} ${asWhere(R)}.`.replace(/\s+\./, '.'), { ctx: { k: 'bills', res: R }, ask: 'Quer ver todas as contas em aberto do mês?', offer: { t: 'contas deste mês', l: 'Contas deste mês' } });
  const tot = asSum(L, i => i.amount), nLate = L.filter(i => asBillSt(i) === 'late').length;
  const lines = L.slice(0, 6).map(i => { const e = ex(i.expense_id), st = asBillSt(i); return `• ${e ? e.description : 'Despesa'}${i.total > 1 ? ` (parcela ${i.num}/${i.total})` : ''} — ${brl(i.amount)} — ${i.paid_on ? 'paga em ' + fmt(i.paid_on) : (st === 'late' ? 'VENCIDA em ' : 'vence em ') + fmt(i.due_on)}`; });
  let t = `Encontrei ${asPlural(L.length, 'conta', 'contas')} ${tag} ${asWhere(R)}, somando **${brl(tot)}**.\n` + lines.join('\n') + (L.length > 6 ? `\n… e mais ${L.length - 6}.` : '');
  if (nLate && !late) t += `\n\nAtenção: ${asPlural(nLate, 'conta está vencida', 'contas estão vencidas')}.`;
  return rp(t, { ctx: { k: 'bills', per, cat: sl.cat, res: R }, offer: !paid ? { t: 'marcar conta como paga', l: 'Marcar como paga' } : null, ask: !paid ? 'Quer que eu marque alguma dessas contas como paga?' : 'Posso mostrar também as contas em aberto, se quiser.', chips: [{ l: 'Abrir calendário', go: '#financeiro?contas' }] });
}
async function qWarr(sl) {
  const R = sl.res, D = await asData(R.list.map(r => r.id)), W = [...D.wa.filter(w => w.visible !== false).map(w => ({ ...w, _r: w.residence_id })), ...D.ex.filter(e => e.warranty_months).map(e => ({ ...expWar(e), _r: e.residence_id }))];
  if (!W.length) return rp('Ainda não há garantias cadastradas para a sua residência. Quando a equipe da Astell ou você cadastrar, eu aviso por aqui.', { ctx: { k: 'warr', res: R } });
  const I = W.map(w => ({ w, i: wInfo(w) })), warn = I.filter(x => x.i.kind === 'warn'), bad = I.filter(x => x.i.kind === 'bad'), ok = I.filter(x => x.i.kind === 'ok'), only = /\b(proxim|vencer|vencimento)/.test(sl.raw || '');
  let t = `Você tem ${asPlural(W.length, 'garantia', 'garantias')}: ${ok.length} vigente${ok.length === 1 ? '' : 's'}, ${warn.length} próxima${warn.length === 1 ? '' : 's'} do vencimento e ${bad.length} expirada${bad.length === 1 ? '' : 's'}.`;
  if (warn.length) t += '\n\nPróximas do vencimento:\n' + warn.map(x => `• ${x.w.system} — vence em ${x.i.end.toLocaleDateString('pt-BR')} (faltam ${x.i.txt})`).join('\n');
  else if (only) t += '\n\nNenhuma garantia está próxima do vencimento no momento.';
  if (!only && bad.length) t += '\n\nExpiradas:\n' + bad.slice(0, 4).map(x => `• ${x.w.system} — expirou em ${x.i.end.toLocaleDateString('pt-BR')}`).join('\n');
  return rp(t, { ctx: { k: 'warr', res: R }, offer: warn.length ? { t: 'abrir uma nova solicitação de assistência', l: 'Abrir assistência técnica' } : null, ask: warn.length ? 'Se precisar acionar alguma garantia, posso abrir uma solicitação de assistência. Quer?' : 'Quer saber das manutenções preventivas agendadas?', chips: [{ l: 'Abrir garantias', go: '#garantias' }] });
}
async function qServ(sl) {
  const R = sl.res, D = await asData(R.list.map(r => r.id)), L = D.sr.slice().sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
  if (!L.length) return rp('Você ainda não tem solicitações de assistência técnica.', { ask: 'Quer abrir uma agora?', offer: { t: 'abrir uma nova solicitação de assistência', l: 'Abrir assistência' } });
  const open = L.filter(r => !/conclu|cancel/i.test(r.status || 'Recebida')); let t = `Você tem ${asPlural(L.length, 'solicitação', 'solicitações')} de assistência, ${open.length} em andamento.\n` + L.slice(0, 5).map(r => `• ${r.protocol} — ${r.category || 'Assistência'}${r.place ? ' (' + r.place + ')' : ''} — **${r.status || 'Recebida'}**${r.scheduled_for ? ` · atendimento previsto para ${fmt(r.scheduled_for)}` : ''}`).join('\n');
  return rp(t, { ctx: { k: 'serv', res: R }, offer: { t: 'abrir uma nova solicitação de assistência', l: 'Abrir nova assistência' }, ask: 'Precisa abrir uma nova solicitação?', chips: [{ l: 'Abrir Suporte', go: '#assistencia' }] });
}
async function qMaint(sl) {
  const R = sl.res, D = await asData(R.list.map(r => r.id)), L = D.mt.filter(m => m.next_due && !/cancel/i.test(m.status || '')).sort((a, b) => a.next_due.localeCompare(b.next_due));
  if (!L.length) return rp('Não há manutenções preventivas com data prevista no momento.', { ctx: { k: 'maint', res: R } });
  const t = `Próximas manutenções preventivas:\n` + L.slice(0, 5).map(m => { const d = dayDiff(m.next_due); return `• ${m.name} — ${fmt(m.next_due)} (${d < 0 ? `atrasada há ${asPlural(-d, 'dia', 'dias')}` : d === 0 ? 'hoje' : `em ${asPlural(d, 'dia', 'dias')}`})`; }).join('\n');
  return rp(t, { ctx: { k: 'maint', res: R }, ask: 'Quer ver também as garantias próximas do vencimento?', offer: { t: 'garantias próximas do vencimento', l: 'Ver garantias' }, chips: [{ l: 'Abrir manutenção', go: '#manutencao' }] });
}
async function qAgenda(sl) {
  const R = sl.res, D = await asData(R.list.map(r => r.id)), lim = xIso(new Date(Date.now() + 30 * 864e5)), E = [];
  D.inst.filter(i => !i.paid_on && i.due_on <= lim).forEach(i => E.push([i.due_on, `Conta: ${asExName(D, i)} — ${brl(i.amount)}`]));
  D.mt.filter(m => m.next_due && m.next_due <= lim && !/cancel/i.test(m.status || '')).forEach(m => E.push([m.next_due, `Manutenção: ${m.name}`]));
  D.sr.filter(r => r.scheduled_for && r.scheduled_for >= todayIso() && r.scheduled_for <= lim).forEach(r => E.push([r.scheduled_for, `Atendimento ${r.protocol} (${r.category || 'assistência'})`]));
  E.sort((a, b) => a[0].localeCompare(b[0]));
  if (!E.length) return rp('Nada previsto nos próximos 30 dias: sem contas, manutenções ou atendimentos agendados.', { ctx: { k: 'agenda', res: R } });
  return rp('Os próximos compromissos (30 dias):\n' + E.slice(0, 8).map(e => `• ${fmt(e[0])} — ${e[1]}`).join('\n'), { ctx: { k: 'agenda', res: R }, ask: 'Quer abrir o cronograma completo?', chips: [{ l: 'Abrir cronograma', go: '#cronograma' }] });
}
async function qLast(sl) {
  const R = sl.res, D = await asData(R.list.map(r => r.id)); let L = D.ex.slice().sort((a, b) => String(b.spent_on).localeCompare(String(a.spent_on)) || String(b.created_at).localeCompare(String(a.created_at)));
  if (sl.cat) L = L.filter(e => inCat(e, sl.cat)); const top = /\bmaior/.test(sl.raw || ''); if (top) L = L.slice().sort((a, b) => Number(b.amount) - Number(a.amount));
  if (!L.length) return rp('Não encontrei despesas para mostrar.', { offer: { t: 'lançar uma despesa', l: 'Lançar uma despesa' }, ask: 'Quer lançar uma?' });
  return rp(`${top ? 'Maiores despesas' : 'Últimas despesas'}${sl.cat ? ' em **' + sl.cat + '**' : ''}:\n` + L.slice(0, 5).map(e => `• ${fmt(e.spent_on)} — ${e.description} (${e.category}) — ${brl(e.amount)}`).join('\n'), { ctx: { k: 'last', cat: sl.cat, res: R }, ask: 'Quer lançar uma nova despesa?', offer: { t: 'lançar uma despesa', l: 'Lançar despesa' }, chips: [{ l: 'Abrir despesas', go: '#custos' }] });
}
async function qInfo(sl) {
  const r = sl.res.list[0]; if (!r) return rp('Não encontrei uma residência vinculada à sua conta.');
  const p = [['Residência', r.name || r.code], ['Endereço', r.address], ['Área', r.area_m2 ? r.area_m2 + ' m²' : ''], ['Pavimentos', r.floors], ['Sistema construtivo', r.build_system], ['Início da obra', r.start_date ? fmt(r.start_date) : ''], ['Previsão de entrega', r.delivery_date ? fmt(r.delivery_date) : ''], ['Responsável técnico', r.tech_lead]].filter(x => x[1]);
  return rp(p.map(x => `• ${x[0]}: ${x[1]}`).join('\n'), { ctx: { k: 'info', res: sl.res }, ask: 'Posso ajudar com mais alguma informação sobre a obra?' });
}
async function qNews(sl) {
  const L = await avLoad(); if (!L.length) return rp('Não há atualizações recentes cadastradas pela equipe da Astell nos últimos 60 dias.', { ask: 'Quer que eu confira as contas a vencer?', offer: { t: 'quais contas vencem esta semana', l: 'Contas a vencer' } });
  const un = L.filter(x => x.unread);
  const t = (un.length ? `Você tem ${asPlural(un.length, 'aviso novo', 'avisos novos')}. ` : 'Você está em dia com os avisos. ') + 'As últimas atualizações da sua residência:\n' + L.slice(0, 5).map(n => `• ${fmt(String(n.updated_at).slice(0, 10))} — ${avMsg(n)}${n.unread ? ' (novo)' : ''}`).join('\n');
  return rp(t, { ctx: { k: 'news' }, ask: 'Quer abrir a central de avisos?', chips: [{ l: 'Abrir avisos', go: '#avisos' }, ...(L[0] && AV[L[0].kind] && AV[L[0].kind][3] ? [{ l: 'Ver o mais recente', go: AV[L[0].kind][3] }] : [])] });
}
async function qSummary(sl) {
  const R = sl.res, D = await asData(R.list.map(r => r.id)), rid = R.list[0].id, gen = asBudget(D, rid), tot = asSum(D.ex.filter(e => e.residence_id === rid), e => e.amount), late = D.inst.filter(i => asBillSt(i) === 'late'), soon = D.inst.filter(i => asBillSt(i) === 'soon'), war = [...D.wa, ...D.ex.filter(e => e.warranty_months).map(expWar)].filter(w => wInfo(w).kind === 'warn'), op = D.sr.filter(r => !/conclu|cancel/i.test(r.status || ''));
  const t = `Resumo de **${R.list[0].name || R.list[0].code}**:\n• Gastos lançados: ${brl(tot)}${gen > 0 ? ` (${pctN(tot, gen)}% do orçamento de ${brl(gen)})` : ''}\n• Contas vencidas: ${late.length}${late.length ? ' (' + brl(asSum(late, i => i.amount)) + ')' : ''}\n• Contas vencendo em até 15 dias: ${soon.length}\n• Garantias próximas do vencimento: ${war.length}\n• Assistências em andamento: ${op.length}`;
  return rp(t, { ctx: { k: 'summary', res: R }, ask: 'Quer detalhar algum desses pontos?', chips: [{ l: 'Contas a vencer', t: 'contas a vencer' }, { l: 'Garantias', t: 'garantias próximas do vencimento' }, { l: 'Assistências', t: 'minhas assistências' }] });
}
const AS_NAV = [   // [expressão, destino, nome da tela] — do mais específico para o mais geral
  [/\bmanual do proprietario\b/, '#documentos?cons', 'Manual do Proprietário'], [/\bplantas? tecnicas?\b/, '#documentos?plan', 'Plantas Técnicas'], [/\bdocumentos? (gerais|geral)\b/, '#documentos?geral', 'Documentos gerais'],
  [/\b(documentos?|pastas?) (da |de |das )?(prefeitura)\b|\bprefeitura\b/, '#documentos?pref', 'Documentos da Prefeitura'], [/\b(documentos?|pastas?) (de |dos |do )?bancos?\b|\bbancos\b/, '#documentos?banc', 'Documentos de Bancos'],
  [/\bconstrutoras?\b/, '#documentos?cons', 'Construtoras'], [/\barquitetura\b/, '#documentos?arq', 'Arquitetura'], [/\b(planta interativa|pontos da planta|planta da casa)\b/, '#planta', 'Planta técnica'],
  [/\b(documentos?|arquivos|pdfs?)\b/, '#documentos', 'Documentos'],
  [/\b(contas a pagar|calendario financeiro|calendario de contas)\b/, '#financeiro?contas', 'Contas a pagar'], [/\borcamentos?\b/, '#financeiro?orcamentos', 'Orçamentos'], [/\b(despesas?|gastos|custos|lancamentos)\b/, '#custos', 'Despesas'], [/\b(financeiro|financas)\b/, '#financeiro', 'Financeiro'],
  [/\bgarantias?\b/, '#garantias', 'Garantias'], [/\b(manutencoes|manutencao|inspecoes)\b/, '#manutencao', 'Manutenções'], [/\bequipamentos?\b/, '#equipamentos', 'Equipamentos'],
  [/\b(instalacoes|sistemas|eletrica|hidraulica)\b/, '#sistemas', 'Instalações'], [/\bmateriais\b/, '#materiais', 'Materiais'], [/\bestrutura\b/, '#estrutura', 'Estrutura'],
  [/\b(midias?|fotos|videos?|imagens|galeria)\b/, '#midias', 'Mídias'], [/\b(cronograma|agenda|calendario|compromissos)\b/, '#cronograma', 'Cronograma'],
  [/\b(nova solicitacao|nova assistencia)\b/, '#assistencia?nova', 'Nova solicitação'], [/\b(assistencias?|suporte|chamados?|solicitacoes)\b/, '#assistencia', 'Assistência técnica'],
  [/\b(avisos?|notificacoes?|sininho)\b/, '#avisos', 'Avisos'], [/\b(dados pessoais|meus dados)\b/, '#mais?dados', 'Dados pessoais'], [/\bseguranca\b|\btrocar senha\b|\balterar senha\b/, '#mais?seguranca', 'Segurança'], [/\b(personalizacao|tamanho do texto|tamanho da letra)\b/, '#mais?personalizacao', 'Personalização'],
  [/\b(perfil|configuracoes|minha conta)\b/, '#mais', 'Perfil'], [/\b(minha casa|dados da (casa|obra|residencia)|a casa)\b/, '#casa', 'Minha Casa'], [/\b(inicio|home|tela inicial|pagina inicial)\b/, '#home', 'Início']];
const AS_VIEWV = /\b(ver|veja|visualizar|visualize|mostrar|mostre|mostra|exibir|exiba|abrir|abra|abre|acessar|acesse|ir para|ir pra|va para|vai para|me leve|me leva|levar|entrar|entre|navegar|quero ver|preciso ver|gostaria de ver|consultar|tela de|tela do|tela da|aba de|aba do|aba da|menu de|menu do|menu da)\b/;
const AS_QUAL = /\b(quanto|quantos|quantas|quais|qual|quando|vencimento|vencer|vence\w*|vencid\w*|proxim\w*|total|esta semana|este mes|ultim\w*|maior\w*|resumo|situacao|status)\b/;
const AS_CRIAR = /\b(lanc\w*|regist\w*|cadastr\w*|adicion\w*|inclu\w*|anot\w*|inser\w*|cri(e|ar)|nova|novo|uma?|solicit\w*|preciso de|quero abrir)\b/;
function asNavMatch(t) {   // tela pedida pelo usuário, ou null
  if (!AS_VIEWV.test(t) || AS_QUAL.test(t)) return null; const h = AS_NAV.find(x => x[0].test(t)); if (!h) return null;
  if (h[1] === '#assistencia' && /\b(abrir|abra|abre)\b/.test(t) && !/\b(tela|suporte|minhas|lista|solicitacoes|chamados|menu|aba)\b/.test(t)) return null;   // “abrir assistência” = criar uma nova
  if (AS_CRIAR.test(t) && /\b(despesas?|gastos|assistencia|solicitacao|garantia|manutencao)\b/.test(t) && !/\b(tela|aba|menu|ver|mostrar|visualizar|exibir)\b/.test(t)) return null;
  return h;
}
function qNav(t) { const h = asNavMatch(t) || AS_NAV.find(x => x[0].test(t)); if (!h) return null; return rp(`Abrindo a tela **${h[2]}** para você.`, { go: h[1], ask: 'Se precisar de mais alguma coisa, é só pedir.' }); }
const qHelp = () => rp('Posso ajudar com tudo o que existe no app, nas suas residências:\n• **Consultar**: gastos, orçamento por categoria, contas a vencer, garantias, manutenções, assistências, cronograma e avisos da Astell.\n• **Cadastrar** (sempre com o seu OK antes de salvar): lançar despesas, abrir solicitação de assistência, marcar contas como pagas e definir orçamentos.\n\nPode falar ou digitar. Por onde quer começar?', { chips: [{ l: 'Quanto já gastamos?', t: 'quanto já gastamos com a construção' }, { l: 'Contas da semana', t: 'quais contas vencem esta semana' }, { l: 'Lançar despesa', t: 'lançar uma despesa' }, { l: 'Abrir assistência', t: 'abrir uma nova solicitação de assistência' }] });
const qHowTo = t => /assistencia|chamado|solicitacao/.test(t)
  ? rp('É simples: no menu, toque em **Suporte** e depois em "Nova solicitação". Informe a categoria, o local da casa e descreva o problema (fotos e vídeos são opcionais).\n\nSe preferir, eu faço isso por você agora mesmo: é só me contar o que aconteceu.', { offer: { t: 'abrir uma nova solicitação de assistência', l: 'Abrir assistência agora' }, ask: 'Quer que eu abra a solicitação agora?', chips: [{ l: 'Abrir Suporte', go: '#assistencia' }] })
  : /despesa|gasto|compra/.test(t)
    ? rp('Vá em **Financeiro › Despesas** e toque em lançar. Informe valor, descrição, categoria e a forma de pagamento.\n\nOu me diga aqui, por exemplo: "lançar despesa de 350 reais com tinta no Pix", e eu monto o lançamento para você confirmar.', { offer: { t: 'lançar uma despesa', l: 'Lançar despesa agora' }, ask: 'Quer lançar uma despesa agora?' })
    : qHelp();

/* ---------- cadastros com confirmação (rascunho → resumo → confirmar) ---------- */
const AS_PAYM = [['pix', 'Pix'], ['debito', 'Débito'], ['credito', 'Crédito'], ['cartao', 'Crédito'], ['boleto', 'Boleto']];
const asPayM = t => { for (const [k, v] of AS_PAYM) if (asRx(k).test(t)) return v; return null; };
const asCond = t => /\ba vista\b|\bavista\b/.test(t) ? 'avista' : /parcel|\b\d{1,2}\s*(x|vezes)\b/.test(t) ? 'parcelado' : null;
const asParcN = t => { const m = /\b(\d{1,2})\s*(x|vezes|parcelas?)\b/.exec(t) || /parcelad[oa]s?\s+(?:em|de)\s+(\d{1,2})\b/.exec(t); return m ? +m[1] : null; };
const AS_PLACES = ['banheiro', 'cozinha', 'sala', 'quarto', 'suíte', 'garagem', 'varanda', 'lavanderia', 'área de serviço', 'escritório', 'corredor', 'telhado', 'jardim', 'fachada', 'área externa', 'sacada', 'closet', 'escada', 'piscina', 'churrasqueira', 'lavabo', 'hall', 'teto', 'sótão'];
const AS_REQSYN = { 'Hidráulica': ['vazamento', 'vazando', 'vaza', 'torneira', 'cano', 'encanamento', 'infiltracao', 'registro', 'descarga', 'entupid', 'ralo', 'caixa d agua', 'chuveiro', 'pia', 'sifao'], 'Elétrica': ['tomada', 'luz', 'disjuntor', 'curto', 'fiacao', 'lampada', 'energia', 'interruptor', 'quadro de luz', 'choque', 'fio'], 'Cobertura': ['telhado', 'goteira', 'calha', 'telha', 'cobertura', 'rufo', 'laje'], 'Esquadrias': ['janela', 'porta', 'vidro', 'fechadura', 'esquadria', 'persiana', 'trinco', 'dobradica'], 'Revestimentos': ['piso', 'azulejo', 'revestimento', 'rejunte', 'porcelanato', 'ceramica', 'descolando'], 'Pintura': ['pintura', 'mofo', 'tinta', 'descascando', 'bolhas', 'mancha', 'rachadura', 'trinca', 'fissura'], 'Steel Frame': ['steel', 'estrutura', 'drywall', 'placa cimenticia'], 'Equipamentos': ['ar condicionado', 'aquecedor', 'forno', 'cooktop', 'coifa', 'equipamento', 'automacao', 'interfone', 'portao eletronico'] };
const asReqCat = t => { for (const [c, w] of Object.entries(AS_REQSYN)) if (w.some(x => asRx(x).test(t))) return c; const m = REQ_CATS.find(c => asRx(nrm(c)).test(t)); return m || null; };
const asPlace = raw => { const n = nrm(raw); const p = AS_PLACES.find(x => asRx(nrm(x)).test(n)); return p ? asCap(p) : null; };
const AS_STRIP = /\b(abrir|abra|abre|criar|crie|cadastrar|cadastre|registrar|registre|solicitar|solicite|fazer|faca|quero|queria|gostaria de|gostaria|preciso de|preciso|precisamos de|necessito de|uma|um|nova|novo|a|o|de|do|da|por favor|pra mim|assistencia tecnica|assistencia|chamado|solicitacao|sobre|para|pra)\b/gi;
function asDescSrv(raw) {
  let x = raw.replace(/\b(abrir|abra|criar|crie|cadastrar|cadastre|registrar|registre|solicitar|solicite|quero|queria|gostaria de|gostaria|preciso de|preciso|precisamos de|necessito de)\b\s*(uma?\s+)?(nova\s+)?(solicita[cç][aã]o\s+de\s+)?(assist[eê]ncia\s+t[eé]cnica|assist[eê]ncia|chamado|solicita[cç][aã]o)?\s*(para|pra|sobre|de|do|da|porque|pois|:)?\s*/i, '').replace(/^[\s,.:;-]+/, '').trim();
  if (x.length < 4 || /^(assist|uma?\b|nova|tecnic)/i.test(x) && x.split(/\s+/).length < 3) return null; return asCap(x);
}
function asDescExp(raw, f) {
  let x = ' ' + raw + ' ';
  x = x.replace(/\b(dia\s+)?\d{1,2}\/\d{1,2}(\/\d{2,4})?/g, ' ').replace(/r\$\s*[\d.,]+(\s*mil)?/ig, ' ').replace(/\b[\d.,]+\s*(reais|real|mil|conto|contos|k)\b/ig, ' ').replace(/\b\d{1,2}\/\d{1,2}(\/\d{2,4})?/g, ' ').replace(/\b(dia\s+\d{1,2}|hoje|ontem|anteontem|amanh[ãa])\b/ig, ' ');
  if (f.cat) x = x.replace(new RegExp('\\b(na |da |de |em |do )?(categoria\\s+)?(de\\s+)?' + f.cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'ig'), ' ');
  if (f.amount) x = x.replace(/\b\d[\d.,]*\b/g, m => { const n = asNum(m.replace(/[.,]$/, '')); return n === f.amount ? ' ' : m; });
  x = x.replace(/\b(pag[oa]s?|primeira parcela|1[ªa] parcela|1 parcela)\b/ig, ' ').replace(/\b(na |da |de |em )?subcategoria\s+\S+/ig, ' ').replace(/\b(na |da |de |em )?categoria\s+\S+/ig, ' ')
    .replace(/\b(lan[cç]ar|lance|lan[cç]o|registrar|registre|cadastrar|cadastre|adicionar|adicione|incluir|inclua|anotar|anote|inserir|insira|criar|crie|quero|gostaria de|gostaria|preciso|despesas?|gastos?|compras?|pagamentos?|paguei|comprei|gastei|pagamos|compramos|gastamos|por favor|nova|novo|uma|um|pra mim)\b/ig, ' ')
    .replace(/\b(no|na|em|via|com|pelo|pela|de|por)?\s*(pix|d[ée]bito|cr[ée]dito|cart[aã]o|boleto)\b/ig, ' ').replace(/\b([àa] vista|parcelad[oa]s?(\s+(em|de))?|\d+\s*(x|vezes|parcelas?))\b/ig, ' ')
    .replace(/\b(vence|vencimento|vencendo)\b.*$/i, ' ').replace(/\bgarantia\s+de\s+\d+\s*\w+/ig, ' ').replace(/\b(fornecedor|loja|empresa)\s+\S+(\s+\S+)?/ig, ' ')
    .replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 4; i++) x = x.replace(/^(de|do|da|dos|das|com|para|pra|em|no|na|nos|nas|o|a|os|as|por|e|referente a|ref\.?|sobre)(\s+|$)/i, '').replace(/(^|\s+)(de|do|da|com|para|em|no|na|e|por)$/i, '').trim();
  x = x.replace(/[.,;:]+$/, '').trim(); return x.length >= 2 ? asCap(x) : null;
}
const asYes = t => /^(sim|s|isso|isso mesmo|confirmo|confirmar|confirma|pode|pode sim|pode ser|ok|okay|certo|claro|quero|quero sim|manda|mande|vamos|positivo|com certeza|por favor|bora|fechado|perfeito|exato|tudo certo|ta bom|esta bom|uhum|aham)( por favor| obrigad[oa]| pode| confirmo)?$/.test(t) || (/^sim\b/.test(t) && t.length < 28);
const asNo = t => /^(nao|n|nao obrigad[oa]|nao quero|cancela\w*|cancelar|deixa|deixa pra la|esquece|desisto|melhor nao|negativo|nada|so isso|so isso mesmo|era so isso|por enquanto nao|agora nao|nao precisa|nao pode)\b/.test(t) && !/^nao (e|era|foi|ficou)\b/.test(t);
const asCancelW = t => /^(cancela\w*|cancelar|deixa( pra la)?|esquece|desisto|melhor nao|nao quero( mais)?|parar|chega|sair)\b/.test(t) || asNo(t) && t.length < 14;

function asFill(d, t, raw, fix, first) {
  const f = d.f, a = d.asking, set = (k, v, nn) => { if (v != null && (f[k] === undefined || fix || a === k)) { f[k] = v; if (nn) Object.assign(f, nn); } };
  if (d.type === 'expense') {
    const list = (S.xcats && S.xcats.length ? S.xcats : XDEF), money = asMoney(t);
    if (money && (f.amount == null || fix || a === 'amount')) f.amount = money;
    const venc = /\b(venc\w*|primeira parcela|1a parcela|1 parcela|boleto para|boleto pro)\b/.test(t), dt = asDate(t, venc);
    if (dt) { if (venc || a === 'due') set('due', asDate(t, true)); else if (a !== 'n') set('date', dt); }
    const pm = asPayM(t); if (pm) set('method', pm); const cd = asCond(t); if (cd) set('cond', cd); const n = asParcN(t); if (n >= 2 && n <= 60) { set('n', n); set('cond', 'parcelado'); }
    const cat = asFindCat(t, list); if (cat && (f.cat == null || fix || a === 'cat')) { f.cat = cat.name; f.catNew = !!cat.isNew; }
    let m = /\bsubcategoria\s+([a-z0-9 ]{2,30}?)(?=\s+(?:no|na|em|com|valor|de|por|pago|paga|para|dia|hoje|ontem|forma)\b|$)/.exec(t); if (m) set('sub', asCap(m[1].trim()));
    m = /\b(?:fornecedor|loja|empresa)\s+([^\s,.]+(?:\s+[^\s,.]+)?)/i.exec(raw); if (m) set('supplier', asCap(m[1].replace(/\s+(com|de|no|na|valor|por|dia|hoje|ontem)$/i, '').trim()));
    m = /garantia\s+de\s+(\d+)\s*(anos?|meses|mes)/.exec(t); if (m) set('warranty', +m[1] * (/^ano/.test(m[2]) ? 12 : 1));
    if (first && !f.desc) { const x = asDescExp(raw, f); if (x) f.desc = x; }
    if (a === 'desc' && !f.desc && !asLooksQuery(t)) { const x = AS_INSV.test(t) ? asDescExp(raw, f) : asCap(raw.trim().replace(/[.!]+$/, '')); if (x && x.length <= 90) f.desc = x; }
    if (a === 'cat' && !f.cat && raw.trim().length <= 30 && !asLooksQuery(t)) { f.cat = asCap(raw.trim().replace(/[.!]+$/, '')); f.catNew = !list.some(c => nrm(c) === nrm(f.cat)); }
    if (a === 'method' && /^(pular|pula|nao|sem|nenhum|depois|nao sei|nao informar|deixa|n\/a|tanto faz)\b/.test(t)) f.method = null;
    if (a === 'n' && f.n == null) { const mm = /\b(\d{1,2})\b/.exec(t); if (mm && +mm[1] >= 2 && +mm[1] <= 60) { f.n = +mm[1]; f.cond = 'parcelado'; } }
    if (a === 'due' && !f.due) { const mm = /^\s*(?:dia\s+)?(\d{1,2})\s*$/.exec(t); if (mm && +mm[1] >= 1 && +mm[1] <= 31) { const dd = asDate('dia ' + mm[1], true); if (dd) f.due = dd; } }
  } else if (d.type === 'service') {
    const c = asReqCat(t); if (c && (f.cat == null || fix || a === 'cat')) f.cat = c;
    const p = asPlace(raw); if (p && (f.place == null || fix || a === 'place')) f.place = p;
    if (first && !f.desc) { const x = asDescSrv(raw); if (x) f.desc = x; }
    if (a === 'desc' && !f.desc && raw.trim().length >= 4 && !asLooksQuery(t)) f.desc = asCap(raw.trim());
    if (a === 'cat' && !f.cat) f.cat = REQ_CATS.find(x => nrm(x) === t) || (/^(outr|nao sei|qualquer|sei la)/.test(t) ? 'Outros' : null);
    if (a === 'place' && !f.place && raw.trim().length <= 40 && !asLooksQuery(t)) f.place = asCap(raw.trim().replace(/[.!]+$/, ''));
    const dt = asDate(t, true); if (dt && /\b(dia|data|prefer|melhor|quando|amanha)\b/.test(t) && !f.date) f.date = dt;
    if (/\b(gas|fogo|incendio|choque|faisca|cheiro de queimado)\b/.test(t)) d.alert = true;
  } else if (d.type === 'pay') {
    const m = /^inst:(.+)$/.exec(t); if (m) f.inst = m[1];
    else if (a === 'inst' && f.cands) { const num = /^\s*(\d)\s*$/.exec(t), idx = num ? +num[1] - 1 : /\bprimeira\b/.test(t) ? 0 : /\bsegunda\b/.test(t) ? 1 : /\bterceira\b/.test(t) ? 2 : -1; if (f.cands[idx]) f.inst = f.cands[idx].id; }
  } else if (d.type === 'budget') {
    const money = asMoney(t); if (money && (f.amount == null || fix || a === 'amount')) f.amount = money;
    const list = (S.xcats && S.xcats.length ? S.xcats : XDEF), cat = asFindCat(t, list);
    if (/\b(geral|total|da obra|da casa|da construcao|do projeto)\b/.test(t) && !cat) { f.scope = 'geral'; f.cat = null; }
    else if (cat && !/\bgeral\b/.test(t)) { f.scope = 'cat'; f.cat = cat.name; f.catNew = !!cat.isNew; }
    if (a === 'scope' && !f.scope && raw.trim().length <= 30) { f.scope = 'cat'; f.cat = asCap(raw.trim()); f.catNew = !list.some(c => nrm(c) === t); }
  }
}
const asLooksQuery = t => /\b(quanto|quantos|quantas|quais|qual|me mostre|mostrar|ver|garantia|vencem|vence)\b/.test(t) && t.split(' ').length > 3;

const brlN = v => brl(v);
const asChipsCats = list => list.slice(0, 9).map(c => ({ l: c, t: c }));
function asAdvance(d) {
  const f = d.f; d.stage = 'ask'; d.asking = null; const q = (field, text, chips) => { d.asking = field; return rp(text, { chips: [...(chips || []), { l: 'Cancelar', t: 'cancelar', ghost: 1 }] }); };
  if (d.type === 'expense') {
    if (!(f.amount > 0)) return q('amount', 'Certo, vamos lançar uma despesa. Qual foi o **valor**?');
    if (!f.desc) return q('desc', `Valor de ${brl(f.amount)}. E o que foi essa despesa? (por exemplo: tinta, mão de obra do pedreiro, geladeira)`);
    if (!f.cat) return q('cat', 'Em qual **categoria** devo lançar?', asChipsCats((S.xcats && S.xcats.length ? S.xcats : XDEF)));
    if (f.method === undefined) return q('method', 'Como foi o **pagamento**? Assim já organizo o seu controle financeiro.', [...['Pix', 'Débito', 'Crédito', 'Boleto'].map(x => ({ l: x, t: x })), { l: 'Pular', t: 'pular' }]);
    if (f.method === 'Pix' || f.method === 'Débito') f.cond = f.cond || 'avista';
    if (f.method && f.cond === undefined) return q('cond', `${f.method}: foi **à vista** ou **parcelado**?`, [{ l: 'À vista', t: 'à vista' }, { l: 'Parcelado', t: 'parcelado' }]);
    if (f.cond === 'parcelado' && !f.n) return q('n', 'Em quantas **parcelas**? (de 2 a 60)');
    if (f.cond === 'parcelado' && !f.due) return q('due', 'Qual a data de **vencimento da 1ª parcela**? (por exemplo: 10/12 ou dia 10)');
    if (f.cond === 'avista' && f.method === 'Boleto' && !f.due) return q('due', 'Qual o **vencimento do boleto**? (por exemplo: 10/12 ou dia 10)');
    f.date = f.date || todayIso();
    let pay = 'Não informado'; if (f.method) { pay = f.method + ' · ' + (f.cond === 'parcelado' ? `parcelado em ${f.n}x de ${brl(Math.floor(f.amount / f.n * 100) / 100)} (1ª em ${fmt(f.due)})` : 'à vista' + (f.due ? ` (vence em ${fmt(f.due)})` : '')); }
    const rows = [d.multi ? ['Residência', d.rname] : null, ['Descrição', f.desc], ['Valor', brl(f.amount)], ['Data', fmt(f.date)], ['Categoria', f.cat + (f.catNew ? ' (nova categoria)' : '')], ['Subcategoria', f.sub || 'Outros'], ['Pagamento', pay], f.supplier ? ['Fornecedor', f.supplier] : null, f.warranty ? ['Garantia', f.warranty + ' meses'] : null].filter(Boolean);
    return asConfirm(d, 'Vou lançar esta despesa:', rows);
  }
  if (d.type === 'service') {
    if (!f.desc) return q('desc', d.alert ? 'Em risco imediato (gás, fogo, choque), afaste-se e ligue 193 ou 192. Depois me conte o que aconteceu.' : 'Claro! Conte o que aconteceu: o que é o problema, onde e desde quando.');
    if (!f.cat) return q('cat', 'Qual a **categoria** da assistência?', REQ_CATS.map(c => ({ l: c, t: c })));
    if (!f.place) return q('place', 'Em qual **local da casa** está o problema?', ['Banheiro', 'Cozinha', 'Sala', 'Quarto', 'Garagem', 'Área externa'].map(c => ({ l: c, t: c })));
    const rows = [d.multi ? ['Residência', d.rname] : null, ['Categoria', f.cat], ['Local', f.place], ['Descrição', f.desc], f.date ? ['Melhor data', fmt(f.date)] : null, ['Urgência', 'Média (a equipe avalia)']].filter(Boolean);
    return asConfirm(d, (d.alert ? 'Em risco imediato (gás, fogo, choque), afaste-se e ligue 193 ou 192. ' : '') + 'Vou abrir esta solicitação de assistência:', rows);
  }
  if (d.type === 'pay') {
    if (!f.inst) { if (f.cands.length === 1) f.inst = f.cands[0].id; else { d.asking = 'inst'; return rp('Encontrei mais de uma conta. Qual delas devo marcar como **paga**?', { chips: [...f.cands.slice(0, 6).map(c => ({ l: c.label, t: 'inst:' + c.id })), { l: 'Cancelar', t: 'cancelar', ghost: 1 }] }); } }
    const c = f.cands.find(x => x.id === f.inst); return asConfirm(d, 'Vou marcar esta conta como paga (com a data de hoje):', [['Conta', c.label], ['Valor', brl(c.amount)], ['Vencimento', fmt(c.due)], ['Paga em', fmt(todayIso())]]);
  }
  if (d.type === 'budget') {
    if (!f.scope) return q('scope', 'O orçamento é **geral** da residência ou de uma **categoria**? Se for de categoria, diga qual.', [{ l: 'Geral', t: 'geral' }, ...asChipsCats((S.xcats && S.xcats.length ? S.xcats : XDEF)).slice(0, 7)]);
    if (!(f.amount > 0)) return q('amount', f.scope === 'geral' ? 'Qual o **valor** do orçamento geral?' : `Qual o **valor** do orçamento de ${f.cat}?`);
    return asConfirm(d, 'Vou atualizar o orçamento:', [d.multi ? ['Residência', d.rname] : null, ['Orçamento', f.scope === 'geral' ? 'Geral da residência' : f.cat + (f.catNew ? ' (nova categoria)' : '')], ['Novo valor', brl(f.amount)]].filter(Boolean));
  }
  return null;
}
function asConfirm(d, head, rows) { d.stage = 'confirm'; d.asking = null; return rp(head + '\n' + rows.map(r => `• ${r[0]}: **${r[1]}**`).join('\n') + '\n\nPosso confirmar?', { confirm: true }); }

async function asStart(type, t, raw, sl) {
  const R = sl.res.list[0]; if (!R) return rp('Não encontrei uma residência vinculada à sua conta para fazer o cadastro.');
  const d = { type, rid: R.id, rname: R.name || R.code, multi: (S.res || []).length > 1, f: {}, stage: 'ask', asking: null };
  AS.draft = d; AS.offer = null;
  if (type === 'pay') { const D = await asData([R.id], true); const un = D.inst.filter(i => !i.paid_on), words = t.split(' ').filter(w => w.length > 3 && !/^(marcar|marque|conta|parcela|como|paga|pago|pagas|pagos|baixa|dar|boleto|quitar|quitada|minha|esta|essa|paguei|pagamento|confirmar)$/.test(w));
    let c = un.filter(i => words.some(w => nrm(asExName(D, i)).includes(w)));
    if (!c.length && /\b(vencid|atrasad)/.test(t)) c = un.filter(i => asBillSt(i) === 'late');
    if (!c.length && /\b(proxima|mais antiga|primeira)\b/.test(t)) c = un.slice().sort((a, b) => a.due_on.localeCompare(b.due_on)).slice(0, 1);
    if (!c.length && /\b(a pagar|em aberto|pendentes?)\b|\b(qual|alguma)\b/.test(t)) c = un.slice().sort((a, b) => a.due_on.localeCompare(b.due_on)).slice(0, 6);
    if (!c.length) { AS.draft = null; if (!un.length) return rp('Não há contas em aberto para marcar como pagas.'); c = un.slice().sort((a, b) => a.due_on.localeCompare(b.due_on)).slice(0, 6); }
    c = c.slice().sort((a, b) => a.due_on.localeCompare(b.due_on)); AS.draft = d;
    d.f.cands = c.map(i => ({ id: i.id, amount: i.amount, due: i.due_on, label: `${asExName(D, i)}${i.total > 1 ? ` ${i.num}/${i.total}` : ''} · ${fmt(i.due_on)} · ${brl(i.amount)}` })); return asAdvance(d); }
  asFill(d, t, raw, false, true); return asAdvance(d);
}
async function asDraftTurn(t, raw) {
  const d = AS.draft; if (/^inst:/.test(raw)) t = raw;
  if (/\b(quanto|quantos|quantas|quais|qual|me mostre|mostre|mostra)\b/.test(t) && t.split(' ').length >= 3 && !asCancelW(t)) { AS.draft = null; AS.pre = 'Deixei o cadastro anterior de lado: nada foi salvo.'; return null; }
  if (asCancelW(t)) { AS.draft = null; return rp('Tudo bem, cancelei. Nada foi salvo.', { ask: 'Posso ajudar com mais alguma coisa?' }); }
  if (d.stage === 'confirm') {
    if (asYes(t)) return asExec(d);
    if (asNo(t)) { AS.draft = null; return rp('Combinado, não salvei nada.', { ask: 'Posso ajudar com mais alguma coisa?' }); }
    if (/^(corrig\w*|alter\w*|edit\w*|mud\w*|troc\w*|ajust\w*|errado|esta errado|nao esta certo)$/.test(t)) return rp('Claro! O que você quer corrigir? Diga, por exemplo: “o valor é R$ 400”, “categoria Acabamentos” ou “foi no Pix”.');
    const before = JSON.stringify(d.f); asFill(d, t, raw, true, false);
    if (before === JSON.stringify(d.f)) { if (asIntentOf(t, raw)) { AS.draft = null; return null; } return { ...asAdvance(d), t: 'Não entendi o que ajustar. Diga, por exemplo, “o valor é R$ 400” ou “categoria Acabamentos”, ou toque em Confirmar/Cancelar.\n\n' + asAdvance(d).t }; }
    return asAdvance(d);
  }
  const before = JSON.stringify(d.f); asFill(d, t, raw, false, false);
  if (before === JSON.stringify(d.f)) { if (asIntentOf(t, raw)) { AS.draft = null; return null; } const ai = await asAI(raw, d.asking); if (ai && ai.text) { const tt = nrm(ai.text); asFill(d, tt, ai.text, false, false); if (before !== JSON.stringify(d.f)) return asAdvance(d); } const r = asAdvance(d); return { ...r, t: 'Desculpe, não consegui entender essa resposta. ' + r.t }; }
  return asAdvance(d);
}
async function asExec(d) {
  const f = d.f, rid = d.rid; AS.draft = null; let err = null, msg = '';
  try {
    if (d.type === 'expense') {
      if (f.catNew) { const r = await sb.from('expense_categories').insert({ name: f.cat }); if (r.error && !/duplicate|unique/i.test(r.error.message)) throw r.error; }
      const sub = f.sub || 'Outros'; if (nrm(sub) !== 'outros') { const r = await sb.from('expense_subcategories').insert({ category: f.cat, name: sub }); if (r.error && !/duplicate|unique/i.test(r.error.message)) throw r.error; }
      const amt = f.amount; let plan = [];
      if (f.cond === 'parcelado') { const n = f.n, pv = Math.floor(amt / n * 100) / 100, last = Math.round((amt - pv * (n - 1)) * 100) / 100; plan = Array.from({ length: n }, (_, i) => ({ num: i + 1, total: n, due_on: addMonIso(f.due, i), amount: i === n - 1 ? last : pv })); }
      else if (f.cond === 'avista' && f.due) plan = [{ num: 1, total: 1, due_on: f.due, amount: amt }];
      const row = { pay_method: f.method || null, pay_cond: f.method ? f.cond : null, description: f.desc, amount: amt, spent_on: f.date || todayIso(), category: f.cat, subcategory: sub, supplier: f.supplier || null, notes: 'Lançado pelo assistente ASTI', media: [], warranty_months: f.warranty || null };
      const r = await sb.from('expenses').insert({ residence_id: rid, ...row }).select('id').single(); if (r.error) throw r.error;
      if (plan.length && r.data) { const ii = await sb.from('expense_installments').insert(plan.map(p => ({ ...p, expense_id: r.data.id, residence_id: rid, paid_on: null }))); if (ii.error) throw ii.error; }
      msg = `Pronto! Lancei **${f.desc}** de ${brl(amt)} em **${f.cat}**${plan.length > 1 ? `, em ${plan.length} parcelas` : ''}.`;
    } else if (d.type === 'service') {
      const row = { category: f.cat, place: f.place, description: f.desc, urgency: 'Média', media: [], residence_id: rid, protocol: 'AST-' + Date.now().toString(36).toUpperCase(), preferred_date: f.date || null };
      const r = await sb.from('service_requests').insert(row); if (r.error) throw r.error;
      msg = `Pronto! Abri a solicitação **${row.protocol}** (${f.cat} · ${f.place}). A equipe da Astell vai analisar e você será avisado por aqui e no sininho quando houver resposta.`;
    } else if (d.type === 'pay') {
      const r = await sb.from('expense_installments').update({ paid_on: todayIso() }).eq('id', f.inst); if (r.error) throw r.error; const c = f.cands.find(x => x.id === f.inst); msg = `Feito! Marquei como paga: **${c.label}**.`;
    } else if (d.type === 'budget') {
      if (f.scope === 'geral') { const r = await sb.rpc('set_residence_budget', { p_id: rid, p_value: f.amount }); if (r.error) throw r.error; msg = `Orçamento geral atualizado para **${brl(f.amount)}**.`; }
      else { if (f.catNew) { await sb.from('expense_categories').insert({ name: f.cat }); } const D = await asData([rid], true), ex = D.cb.find(b => nrm(b.category) === nrm(f.cat));
        const r = ex ? await sb.from('category_budgets').update({ amount: f.amount, pct: null }).eq('id', ex.id) : await sb.from('category_budgets').insert({ residence_id: rid, category: f.cat, amount: f.amount, pct: null }); if (r.error) throw r.error; msg = `Orçamento de **${f.cat}** atualizado para **${brl(f.amount)}**.`; }
    }
  } catch (e) { err = e; }
  if (err) return rp('Não consegui salvar agora: ' + (err.message || 'erro desconhecido') + '. Nada foi gravado. Quer tentar de novo?', { ask: null });
  asDrop(); try { toast('Salvo pelo assistente.'); route(); } catch (_) {}
  const more = d.type === 'expense' ? { ask: 'Deseja lançar outra despesa ou ver quanto já foi gasto em ' + f.cat + '?', offer: { t: 'quanto gastamos com ' + f.cat, l: 'Ver gastos de ' + f.cat }, chips: [{ l: 'Lançar outra', t: 'lançar uma despesa' }, { l: 'Ver contas a vencer', t: 'contas a vencer' }] }
    : d.type === 'service' ? { ask: 'Quer anexar fotos ou vídeos? Isso é feito pela tela Suporte. Posso ajudar com mais alguma coisa?', chips: [{ l: 'Abrir Suporte', go: '#assistencia' }, { l: 'Minhas assistências', t: 'minhas assistências' }] }
      : d.type === 'pay' ? { ask: 'Quer ver as próximas contas a vencer?', offer: { t: 'contas a vencer', l: 'Ver contas a vencer' } }
        : { ask: 'Quer ver como ficou o orçamento por categoria?', offer: { t: 'orçamento por categoria', l: 'Ver orçamento' } };
  return rp(msg, more);
}

/* ---------- entendimento da frase ---------- */
const AS_INSV = /\b(lanc\w*|regist\w*|cadastr\w*|adicion\w*|inclu\w*|anot\w*|inser\w*|cri(e|ar)|abr(a|e|ir)|solicit\w*|fazer|faca|abrir)\b/;
const AS_PROB = /\b(vazando|vazamento|vaza|infiltracao|goteira|curto circuito|queimou|quebrou|quebrado|entupid\w*|mofo|rachadura|trinca\w*|fissura|descascando|sem energia|sem luz|nao funciona|parou de funcionar|estragou|pingando|cheiro de gas)\b/;
function asIntentOf(t, raw) {   // devolve o nome do assunto ou null (usado também para sair de um cadastro em andamento)
  const q = /\b(quanto|quantos|quantas|quais|qual|quem|onde|mostre|mostra|mostrar|me (diga|fale|conte|mostre)|consult\w+|listar|liste)\b/.test(t);
  if (/^(oi|ola|bom dia|boa tarde|boa noite|e ai|opa|hello|oie)\b/.test(t) && t.split(' ').length <= 5) return 'greet';
  if (/\b(obrigad[oa]|valeu|agradec\w+)\b/.test(t)) return 'thanks';
  if (/\b(tchau|ate mais|ate logo|encerrar)\b/.test(t)) return 'bye';
  if (/\b(clima|previsao do tempo|futebol|piada|receita de|noticias?|presidente|bitcoin|filme|musica|horoscopo|loteria|politica)\b/.test(t)) return 'off';
  if (/\b(como|onde|de que (forma|jeito)|qual o passo|me ensina\w*)\b/.test(t) && /(cadastr|abrir|lanc|regist|criar|fazer|solicit|mandar|enviar|usar)/.test(t) && !/\b(quanto)\b/.test(t)) return 'howto';
  if (/\b(o que (voce|vc) (faz|sabe|pode)|ajuda|como funciona|o que posso (perguntar|fazer)|funcionalidades|comandos)\b/.test(t)) return 'help';
  if (/\b(marc\w+|baix\w+|dar baixa|quit\w+|confirm\w+)\b.*\b(pag[ao]s?|paga|quitad\w+)\b/.test(t) || /\bpaguei\b.*\b(parcela|conta|boleto|fatura)\b/.test(t)) return 'pay';
  if (/\b(defin\w+|alter\w+|ajust\w+|mud\w+|atualiz\w+|cri\w+|coloc\w+|aument\w+|diminu\w+|estabele\w+|fix\w+)\b.*\borcamento/.test(t) || (/\borcamento\b/.test(t) && !q && !/\b(como esta|quanto|qual|quais)\b/.test(t) && asMoney(t))) return 'setbudget';
  if (asNavMatch(t)) return 'nav';
  if ((AS_INSV.test(t) && /\b(assistencia|chamado|solicitacao|reparo|conserto)\b/.test(t)) || (/\b(preciso|precisamos|quero|queria|gostaria|necessito)\b/.test(t) && /\b(assistencia|reparo|conserto|tecnico)\b/.test(t)) || (AS_PROB.test(t) && !q && !/\bgarantia\b/.test(t))) return 'service';
  if ((AS_INSV.test(t) && /\b(despesa|gasto|compra|pagamento|nota fiscal|lancamento)\b/.test(t)) || (/\b(paguei|comprei|gastei|pagamos|compramos|gastamos)\b/.test(t) && asMoney(t) && !q) || /\b(nova despesa|uma despesa)\b/.test(t) && !q) return 'expense';
  if (/\b(novidades?|atualizacoes|avisos|notificac\w+|o que mudou|o que (a astell|a equipe) (fez|atualizou|postou)|o que ha de novo)\b/.test(t)) return 'news';
  if (/\b(resumo|situacao geral|panorama|visao geral|como esta (a )?(obra|minha casa|tudo))\b/.test(t)) return 'summary';
  if (/\bgarantias?\b/.test(t)) return 'warr';
  if (/\bmanutenc\w+|inspec\w+/.test(t)) return 'maint';
  if (/\b(cronograma|agenda|compromissos|proximos eventos|proximos compromissos|o que (tenho|ha) (para|pra) (fazer|esta semana|este mes))\b/.test(t)) return 'agenda';
  if (/\b(assistencias?|chamados?|solicitacoes?|protocolos?)\b/.test(t)) return 'serv';
  if (/\b(contas?|vence\w*|vencid\w*|vencer|boletos?|parcelas?|a pagar|pagar|faturas?)\b/.test(t) && !/\b(gast\w+|despesas?)\b/.test(t)) return 'bills';
  if (/\b(orcamentos?|limite|saldo|disponivel|sobra|quanto (falta|resta|sobra)|restante)\b/.test(t)) return 'budget';
  if (/\b(ultimas?|ultimos|maiores|maior|recentes)\b.*\b(despesas?|gastos?|compras?|lancamentos?)\b|\b(despesas?|gastos?)\b.*\b(recentes|ultim\w+|maior\w*)\b/.test(t)) return 'last';
  if (/\b(gast\w+|despesas?|custo\w*|custou|paguei|pagamos|investi\w*|total|quanto (ja )?(foi|saiu|deu))\b/.test(t)) return 'spend';
  if (/\b(endereco|onde fica|area|metragem|entrega|prazo da obra|inicio da obra|responsavel tecnico|dados da (casa|obra|residencia))\b/.test(t)) return 'info';
  return null;
}
async function asHandle(raw, viaAI) {
  const t = nrm(raw).replace(/(\d)([.,])(?=\d)/g, (m, d, s) => d + (s === '.' ? '\u0001' : '\u0002')).replace(/[!?.,;:()"]+/g, ' ').replace(/\u0001/g, '.').replace(/\u0002/g, ',').replace(/\s+/g, ' ').trim();
  if (!S.cur) return rp('Não encontrei nenhuma residência vinculada à sua conta. Fale com a Astell para liberar o acesso.');
  if (AS.draft) { const r = await asDraftTurn(t, raw); if (r) return r; }
  if (AS.offer) { const o = AS.offer; AS.offer = null; if (asYes(t)) return asHandle(o.t); if (asNo(t)) return rp('Tudo bem! Se precisar de mais alguma coisa, é só me chamar.', { chips: asDefChips() }); }
  if (!t) return rp('Pode falar ou digitar o que precisa.');
  let k = asIntentOf(t, raw); const Rr = asRes(t);
  let D = null; try { D = await asData(Rr.list.map(r => r.id)); } catch (_) {}
  const list = asCatList(D), cat0 = asFindCat(t, list), sl = { res: Rr, cat: cat0 ? cat0.name : null, per: asPeriod(t), raw: t };
  if (!k && AS.ctx && (sl.cat || sl.per || Rr.all || Rr.named)) { const c = AS.ctx; k = c.k; sl.cat = sl.cat || c.cat; sl.per = sl.per || c.per; if (!Rr.all && !Rr.named) sl.res = c.res || Rr; }
  if (!k && !viaAI) { const ai = await asAI(raw); if (ai && ai.off) k = 'off'; else if (ai && ai.text && nrm(ai.text) !== t) return asHandle(ai.text, true); }
  if (k === 'greet') return rp(`Olá${asFirst() ? ', ' + asFirst() : ''}! Como posso ajudar você hoje?`, { chips: asDefChips() });
  if (k === 'thanks') return rp('Por nada! Fico feliz em ajudar.', { ask: 'Há mais alguma coisa que eu possa fazer pela sua obra?', chips: asDefChips() });
  if (k === 'bye') return rp('Até mais! Estarei por aqui sempre que precisar.');
  if (k === 'off') return rp('Eu só consigo ajudar com assuntos do aplicativo Astell Home e das suas residências, como gastos, contas, garantias, manutenções e assistências.', { chips: asDefChips() });
  if (k === 'help') return qHelp(); if (k === 'howto') return qHowTo(t);
  if (k === 'nav') return qNav(t);
  if (k === 'expense') return asStart('expense', t, raw, sl);
  if (k === 'service') return asStart('service', t, raw, sl);
  if (k === 'pay') return asStart('pay', t, raw, sl);
  if (k === 'setbudget') return asStart('budget', t, raw, sl);
  const Q = { spend: qSpend, budget: qBudget, bills: s => qBills(s, t), warr: qWarr, maint: qMaint, agenda: qAgenda, serv: qServ, last: qLast, info: qInfo, news: qNews, summary: qSummary }[k];
  if (Q) return Q(sl);
  return rp('Hum, não tenho certeza de ter entendido. Posso consultar gastos, orçamento, contas, garantias, manutenções e assistências, ou fazer cadastros (despesas, assistências, pagamentos). Pode reformular?', { chips: asDefChips() });
}
const asDefChips = () => [{ l: 'Quanto já gastamos?', t: 'quanto já gastamos com a construção' }, { l: 'Contas da semana', t: 'quais contas vencem esta semana' }, { l: 'Garantias', t: 'quais garantias estão próximas do vencimento' }, { l: 'Lançar despesa', t: 'lançar uma despesa' }];

/* ---------- voz: leitura em voz alta (feminina/masculina) e ditado ---------- */
const AS_FEM = new Set(['beatriz', 'raquel', 'ester', 'isabel', 'carmen', 'miriam', 'ruth', 'iris', 'lais', 'thais', 'elis', 'alice', 'rute', 'nair', 'dulce', 'inez', 'ines', 'rosangela', 'solange', 'simone', 'michele', 'michelle', 'denise', 'eliane', 'viviane', 'josiane', 'luciane', 'adriane', 'daiane', 'tatiane', 'cristiane', 'fabiane', 'suzane', 'jaqueline', 'jacqueline', 'aline', 'caroline', 'karoline', 'carolina', 'angelica', 'lidiane', 'rosane', 'rosemeire', 'ivone', 'ivete', 'noemi', 'rebeca', 'rebecca', 'abigail', 'maite']);
const AS_MAS = new Set(['luca', 'joshua', 'nikita', 'mica', 'jonas', 'elias', 'tobias', 'matias', 'lucas', 'andre', 'jose', 'felipe', 'guilherme', 'henrique', 'rodrigo', 'cassio', 'dante', 'jorge', 'vitor', 'davi', 'gabriel', 'daniel', 'rafael', 'miguel', 'samuel', 'emanuel', 'joao', 'caue', 'moises', 'noe', 'josue', 'ezequiel', 'zacarias', 'mateus', 'tomas', 'thomas', 'jesse', 'bruno', 'diego', 'alexandre', 'leandro', 'wesley', 'ney', 'ary', 'rui', 'claudio']);
function asGender() {
  const pref = asLs('astell_asti_voice'); if (pref === 'f' || pref === 'm') return pref;
  const p = S.profile || {}, g = nrm(p.gender || p.sex || p.sexo || p.genero || ''); if (/^(f|fem)/.test(g)) return 'f'; if (/^(m|masc)/.test(g)) return 'm';
  const n = nrm(asFirst()); if (!n) return 'f'; if (AS_FEM.has(n)) return 'f'; if (AS_MAS.has(n)) return 'm';
  return /(a|ane|ine|ice|ise|ele|elle|ete|ede|ila|ia)$/.test(n) ? 'f' : 'm';
}
const asVoiceMode = () => asLs('astell_asti_voice') || 'auto';
function asVoice(g) {
  const vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [], pt = vs.filter(v => /^pt([-_]BR)?/i.test(v.lang)), br = pt.filter(v => /BR/i.test(v.lang)), pool = br.length ? br : pt;
  const fem = /maria|francisca|luciana|fernanda|vit[oó]ria|camila|ana\b|female|feminin|google portugu[eê]s do brasil|helena|joana|leticia|let[ií]cia/i, mas = /daniel|felipe|ant[oô]nio|ricardo|male\b|masculin|jorge|thiago|donato|jos[eé]|marcos/i;
  const hit = pool.find(v => (g === 'f' ? fem : mas).test(v.name) && !(g === 'm' ? fem : mas).test(v.name));
  return { v: hit || pool[0] || null, exact: !!hit };
}
function asSpokenText(t) {
  const mes = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  return String(t).replace(/\*\*/g, '').replace(/[•⚠]/g, ' ').replace(/R\$\s*([\d.]+),(\d{2})/g, (m, a, b) => b === '00' ? a.replace(/\./g, '') + ' reais' : a.replace(/\./g, '') + ' reais e ' + b + ' centavos').replace(/R\$\s*([\d.]+)/g, (m, a) => a.replace(/\./g, '') + ' reais')
    .replace(/\b(\d{2})\/(\d{2})\/(\d{4})\b/g, (m, d, mo, y) => `${+d} de ${mes[+mo - 1] || mo} de ${y}`).replace(/\b(\d{2})\/(\d{2})\b/g, (m, d, mo) => `${+d} de ${mes[+mo - 1] || mo}`).replace(/(\d+)%/g, '$1 por cento').replace(/\bm²/g, ' metros quadrados').replace(/(\d)x\b/g, '$1 vezes').replace(/\n+/g, '. ').replace(/\s+—\s+/g, ', ').replace(/([.!?])\s*\.+/g, '$1').replace(/\s+/g, ' ').trim();
}
let asSpeakTok = 0;
function asStopSpeak() { asSpeakTok++; try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (_) {} }
function asSpeak(text) {
  if (asVoiceMode() === 'off' || !window.speechSynthesis || !text) return; asStopSpeak(); const tok = asSpeakTok;
  const g = asGender(), { v, exact } = asVoice(g), parts = asSpokenText(text).match(/[^.!?]+[.!?]*/g) || [];
  const chunks = []; let cur = ''; parts.forEach(p => { if ((cur + p).length > 180 && cur) { chunks.push(cur); cur = p; } else cur += p; }); if (cur.trim()) chunks.push(cur);
  chunks.forEach(c => { const u = new SpeechSynthesisUtterance(c.trim()); u.lang = 'pt-BR'; if (v) u.voice = v; u.rate = 1.02; u.pitch = exact ? 1 : (g === 'f' ? 1.15 : 0.78); u.onend = u.onerror = () => {}; if (tok === asSpeakTok) speechSynthesis.speak(u); });
}
if (window.speechSynthesis) { try { speechSynthesis.getVoices(); speechSynthesis.onvoiceschanged = () => {}; } catch (_) {} }
function asMic() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, inp = $('#asIn');
  if (AS.listening && AS.rec) { try { AS.rec.stop(); } catch (_) {} return; }
  if (!SR) return asNote('Este aparelho não libera o reconhecimento de voz dentro do app. Você pode usar o microfone do teclado para ditar a mensagem e depois tocar em enviar.');
  asStopSpeak(); let fin = '', err = '';
  const r = new SR(); AS.rec = r; r.lang = 'pt-BR'; r.interimResults = true; r.continuous = false; r.maxAlternatives = 1;
  r.onstart = () => { AS.listening = true; asPaintMic(); inp.placeholder = 'Ouvindo…'; };
  r.onresult = ev => { let s = ''; for (let i = 0; i < ev.results.length; i++) s += ev.results[i][0].transcript; inp.value = s; if (ev.results[ev.results.length - 1].isFinal) fin = s; };
  r.onerror = ev => { err = ev.error || ''; };
  r.onend = () => { AS.listening = false; asPaintMic(); inp.placeholder = 'Digite sua pergunta...';
    if (err === 'not-allowed' || err === 'service-not-allowed') return asNote('Preciso da permissão do microfone para ouvir você. Libere nas configurações do aparelho e tente de novo.');
    if (err === 'no-speech' || err === 'aborted') { if (!fin) return toast('Não ouvi nada. Toque no microfone e fale novamente.', 1); }
    else if (err && !fin) return toast('Não consegui ouvir agora (' + err + '). Tente digitar.', 1);
    const txt = (fin || inp.value).trim(); if (txt) { inp.value = ''; asSend(txt); } };
  try { r.start(); } catch (e) { AS.listening = false; asPaintMic(); }
}
const asPaintMic = () => { const b = $('#asMic'); if (b) { b.classList.toggle('on', AS.listening); b.setAttribute('aria-pressed', AS.listening ? 'true' : 'false'); } };

/* ---------- tela de diálogo ---------- */
const asHtml = t => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
const AS_SUG = ['Quanto já gastamos com a construção?', 'Quais contas vencem esta semana?', 'Quais garantias estão próximas do vencimento?', 'Como faço para cadastrar uma assistência técnica?', 'Lançar uma despesa'];
function asBuild() {
  if ($('#asti')) return;
  const el = document.createElement('div'); el.id = 'asti'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Assistente ASTI');
  el.innerHTML = `<div class="as-card"><div class="as-head"><span class="as-ava">${asIc.bot}</span><div class="as-ttl"><b>ASTI</b><small>Assistente inteligente ASTELL</small></div><span class="as-on">Online</span><button type="button" class="as-ib" id="asVoice" aria-label="Voz do assistente"></button><button type="button" class="as-ib" id="asClose" aria-label="Fechar">${asIc.x}</button><div class="as-menu" id="asMenu" hidden></div></div>
  <div class="as-msgs" id="asMsgs" aria-live="polite"></div>
  <form class="as-comp" id="asForm" autocomplete="off"><input id="asIn" type="text" placeholder="Digite sua pergunta..." enterkeyhint="send" aria-label="Mensagem para o ASTI"><button type="button" class="as-rb" id="asMic" aria-label="Falar" aria-pressed="false">${asIc.mic}</button><button type="submit" class="as-rb as-send" aria-label="Enviar">${asIc.send}</button></form>
  <p class="as-foot">O ASTI só acessa as residências vinculadas à sua conta e sempre pede a sua confirmação antes de salvar.</p></div>`;
  document.body.appendChild(el); asPaintVoiceBtn();
}
function asPaintVoiceBtn() { const b = $('#asVoice'); if (b) b.innerHTML = asVoiceMode() === 'off' ? asIc.mute : asIc.spk; }
function asRender() {
  const box = $('#asMsgs'); if (!box) return; const started = AS.msgs.some(m => m.role === 'me'), last = AS.msgs[AS.msgs.length - 1], nm = asFirst();
  let h = `<div class="as-welcome"><h3>Olá${nm ? ', ' + esc(nm) : ''}! Eu sou o ASTI.</h3><p>Estou aqui para ajudar você a encontrar informações sobre sua obra, consultar despesas, acompanhar serviços e utilizar as funcionalidades do aplicativo.</p></div>`;
  AS.msgs.forEach((m, i) => { const isLast = m === last;
    h += `<div class="as-m ${m.role}"><div class="as-b">${asHtml(m.t)}</div>`;
    if (m.role === 'bot' && isLast && !AS.busy) { if (m.confirm && AS.draft && AS.draft.stage === 'confirm') h += `<div class="as-act"><button type="button" class="as-yes" data-asy>Confirmar</button><button type="button" class="as-fix" data-asf>Corrigir</button><button type="button" class="as-no" data-asn>Cancelar</button></div>`;
      else if (m.chips && m.chips.length) h += `<div class="as-chips">${m.chips.map((c, j) => `<button type="button" class="${c.ghost ? 'ghost' : ''}" data-chip="${j}">${esc(c.l)}</button>`).join('')}</div>`; }
    h += '</div>'; });
  if (AS.busy) h += '<div class="as-m bot"><div class="as-b as-typing"><i></i><i></i><i></i></div></div>';
  if (!started) h += `<div class="as-welcome"><p class="as-sl">Experimente perguntar</p><ul class="as-sug">${AS_SUG.map((s, i) => `<li><button type="button" data-sug="${i}">${esc(s)}</button></li>`).join('')}</ul></div>`;
  box.innerHTML = h; box.scrollTop = box.scrollHeight;
}
function asPush(role, r) { const m = { role, t: r.t, chips: r.chips, confirm: r.confirm }; AS.msgs.push(m); return m; }
function asNote(text) { asPush('bot', rp(text)); asRender(); asSpeak(text); }
async function asSend(text, shown) {
  text = String(text || '').trim(); if (!text || AS.busy) return; asStopSpeak();
  AS.msgs.push({ role: 'me', t: shown || text }); AS.busy = true; asRender();
  let r; try { r = await asHandle(text); } catch (e) { console.error(e); r = rp('Tive um problema para concluir isso agora. Pode tentar de novo em instantes?'); }
  if (!r) r = await asHandle(text).catch(() => rp('Não consegui entender. Pode reformular?'));
  AS.busy = false;
  let full = (AS.pre ? AS.pre + '\n\n' : '') + r.t + (r.ask ? '\n\n' + r.ask : ''); AS.pre = ''; const chips = [...(r.offer && !r.confirm ? [{ l: r.offer.l || 'Sim, por favor', t: r.offer.t }] : []), ...(r.chips || [])];
  AS.offer = r.offer && !r.confirm ? r.offer : null; if (r.ctx) AS.ctx = r.ctx; if (r.confirm) AS.offer = null;
  asPush('bot', { t: full, chips, confirm: r.confirm }); asRender(); asSpeak(full);
  if (r.go) setTimeout(() => asGo(r.go), 900);
}
async function asInsights() {
  try {
    const ids = (S.res || []).map(r => r.id), D = await asData(ids.length ? ids : [S.cur.id]), p = [];
    const late = D.inst.filter(i => asBillSt(i) === 'late'), wk = D.inst.filter(i => !i.paid_on && i.due_on >= todayIso() && dayDiff(i.due_on) <= 7), war = [...D.wa, ...D.ex.filter(e => e.warranty_months).map(expWar)].filter(w => wInfo(w).kind === 'warn');
    if (late.length) p.push(`${asPlural(late.length, 'conta vencida', 'contas vencidas')} (${brl(asSum(late, i => i.amount))})`); if (wk.length) p.push(`${asPlural(wk.length, 'conta vencendo', 'contas vencendo')} nos próximos 7 dias`); if (war.length) p.push(`${asPlural(war.length, 'garantia próxima', 'garantias próximas')} do vencimento`);
    let news = 0; try { news = (await avLoad()).filter(x => x.unread).length; } catch (_) {} if (news) p.push(`${asPlural(news, 'aviso novo', 'avisos novos')} da equipe Astell`);
    const chips = []; if (late.length || wk.length) chips.push({ l: 'Ver contas', t: late.length ? 'contas vencidas' : 'quais contas vencem esta semana' }); if (war.length) chips.push({ l: 'Ver garantias', t: 'garantias próximas do vencimento' }); if (news) chips.push({ l: 'Ver novidades', t: 'o que mudou no app' });
    return p.length ? { t: `Dei uma olhada na sua residência e vi: ${p.join(', ')}.`, ask: 'Quer que eu detalhe algum desses pontos?', chips } : { t: 'Está tudo em dia por aqui: sem contas vencidas, garantias a vencer ou avisos novos.', ask: 'Em que posso ajudar hoje?', chips: asDefChips() };
  } catch (_) { return { t: '', ask: 'Em que posso ajudar hoje?', chips: asDefChips() }; }
}
async function asWelcome() {
  AS.welcomed = true; AS.busy = true; asRender(); const r = await asInsights(); AS.busy = false;
  const hello = `Olá${asFirst() ? ', ' + asFirst() : ''}! Eu sou o ASTI, o assistente da Astell.`, full = [r.t, r.ask].filter(Boolean).join('\n\n');
  asPush('bot', { t: full, chips: r.chips }); asRender(); asSpeak(hello + ' ' + full);
}
function asOpen() {
  if (!S.profile) return; asBuild();
  if (AS.uid !== S.profile.id) { AS.uid = S.profile.id; AS.msgs = []; AS.draft = null; AS.offer = null; AS.ctx = null; AS.welcomed = false; AS.cache = {}; }
  $('#asti').hidden = false; AS.open = true; document.body.classList.add('as-open'); try { history.pushState({ asti: 1 }, ''); } catch (_) {}
  asRender(); if (!AS.welcomed) asWelcome();
}
function asClose(keepSpeech, fromPop) {
  if (!AS.open) return; AS.open = false; const el = $('#asti'); if (el) el.hidden = true; document.body.classList.remove('as-open'); if (!keepSpeech) asStopSpeak();
  if (AS.listening && AS.rec) { try { AS.rec.abort(); } catch (_) {} } const m = $('#asMenu'); if (m) m.hidden = true;
  if (!fromPop && history.state && history.state.asti) { try { history.back(); } catch (_) {} }
}
window.addEventListener('popstate', () => { if (AS.open) asClose(false, true); });
document.addEventListener('keydown', e => { if (e.key === 'Escape' && AS.open) asClose(); });
function asGo(h) {   // fecha o assistente e abre a tela pedida (sem desfazer a navegação com o “voltar” do histórico)
  if (AS.open) { AS.open = false; const el = $('#asti'); if (el) el.hidden = true; document.body.classList.remove('as-open'); const m = $('#asMenu'); if (m) m.hidden = true; if (AS.listening && AS.rec) { try { AS.rec.abort(); } catch (_) {} } }
  S.edit = null;
  try { if (history.state && history.state.asti) history.replaceState(null, '', h); else location.hash = h; } catch (_) { location.hash = h; }
  if (location.hash !== h) location.hash = h; route(); window.scrollTo(0, 0);
}
function asMenu() {
  const m = $('#asMenu'), cur = asVoiceMode(), g = asGender(); m.hidden = !m.hidden; if (m.hidden) return;
  const o = [['auto', `Automática (voz ${g === 'f' ? 'feminina' : 'masculina'})`], ['f', 'Voz feminina'], ['m', 'Voz masculina'], ['off', 'Sem leitura em voz alta']];
  m.innerHTML = '<b>Leitura das respostas</b>' + o.map(x => `<button type="button" data-vm="${x[0]}" class="${cur === x[0] ? 'on' : ''}">${x[1]}</button>`).join('');
}
document.addEventListener('click', e => {
  const tg = e.target.closest ? e.target : e.target.parentElement; if (!tg || !tg.closest) return;
  if (tg.closest('#astiBtn')) { e.preventDefault(); return asOpen(); }
  const root = tg.closest('#asti'); if (!root) return;
  if (tg.closest('#asClose')) return asClose();
  if (tg.closest('#asVoice')) return asMenu();
  if (tg.closest('#asMic')) return asMic();
  const vm = tg.closest('[data-vm]'); if (vm) { asLs('astell_asti_voice', vm.dataset.vm); $('#asMenu').hidden = true; asPaintVoiceBtn(); asStopSpeak(); if (vm.dataset.vm !== 'off') asSpeak('Olá! Esta é a minha voz. Vou ler as respostas para você.'); else toast('Leitura em voz alta desligada.'); return; }
  if (!tg.closest('.as-menu') && !tg.closest('#asVoice')) { const m = $('#asMenu'); if (m) m.hidden = true; }
  const sg = tg.closest('[data-sug]'); if (sg) return asSend(AS_SUG[+sg.dataset.sug]);
  const ch = tg.closest('[data-chip]'); if (ch) { const last = AS.msgs[AS.msgs.length - 1], c = last && last.chips && last.chips[+ch.dataset.chip]; if (!c) return; if (c.go) return asGo(c.go); return asSend(c.t, c.l); }
  if (tg.closest('[data-asy]')) return asSend('sim', 'Confirmar');
  if (tg.closest('[data-asn]')) return asSend('não', 'Cancelar');
  if (tg.closest('[data-asf]')) { AS.msgs.push({ role: 'me', t: 'Corrigir' }); asPush('bot', rp('Claro! O que você quer corrigir? Diga, por exemplo: “o valor é R$ 400”, “categoria Acabamentos” ou “foi no Pix”.')); const l = AS.msgs[AS.msgs.length - 1]; l.chips = []; asRender(); asSpeak(l.t); return; }
});
document.addEventListener('submit', e => { if (e.target.id !== 'asForm') return; e.preventDefault(); const i = $('#asIn'), v = i.value; i.value = ''; asSend(v); });
document.addEventListener('input', e => { if (e.target.id === 'asIn' && window.speechSynthesis && speechSynthesis.speaking) asStopSpeak(); });

/* ---------- ícone do assistente no centro do menu ---------- */
(function () { const nav = $('#nav'); if (!nav || $('#astiBtn')) return; const b = document.createElement('button'); b.id = 'astiBtn'; b.type = 'button'; b.className = 'nav-asti'; b.setAttribute('aria-label', 'Abrir o assistente ASTI'); b.innerHTML = `<span class="nai">${asIc.bot}</span><em>ASTI</em>`; nav.insertBefore(b, nav.children[2] || null); })();
/* ===== fim do ASTI ===== */
