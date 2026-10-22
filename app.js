// Configuração do Supabase: arquivo config.js
const APP_VERSION = '2026.10.21-4'; // mostrada no Perfil; acompanha o ?v= dos arquivos no index.html
let sb; try { sb = supabase.createClient(new URL(SUPABASE_URL.trim()).origin, SUPABASE_KEY.trim()); } catch (e) { sb = null; }
const $ = s => document.querySelector(s); let app = $('#app');
const fail = m => { app.innerHTML = '<div class="card" style="margin:16px"><b>Não foi possível iniciar o Astell Home</b><p class="mute">' + m + '</p></div>'; };
if (!sb || /COLE_AQUI/.test(SUPABASE_URL + SUPABASE_KEY)) { fail('Abra o arquivo config.js e preencha SUPABASE_URL e SUPABASE_KEY (Supabase > Project Settings > API).'); throw new Error('Supabase não configurado'); }
addEventListener('error', e => { if (!app.innerHTML.trim()) fail('Erro: ' + e.message); });
addEventListener('unhandledrejection', e => { if (!app.innerHTML.trim()) fail('Erro: ' + (e.reason?.message || e.reason)); });
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = d => d ? new Date(d + 'T00:00').toLocaleDateString('pt-BR') : '—';
const S = { profile: null, res: [], cur: null, groups: {} };
const staff = () => false; // este app é somente de consulta do cliente
function toast(m, err) { const t = $('#toast'); t.textContent = m; t.className = 'show' + (err ? ' err' : ''); setTimeout(() => t.className = '', 3500); }
const addMonths = (d, m) => { const x = new Date(d + 'T00:00'); x.setMonth(x.getMonth() + m); return x; };
function wState(w) { const end = addMonths(w.start_date, w.months), days = (end - new Date()) / 864e5;
  return days < 0 ? ['Encerrada', 'bad', end] : days < 90 ? ['Próxima do vencimento', 'warn', end] : ['Vigente', 'ok', end]; }

// Módulos genéricos: f = [coluna, rótulo, tipo]
const T = {
  warranties: { label: 'Garantias', order: 'start_date', f: [['system','Sistema ou componente'],['coverage','Descrição da cobertura'],['start_date','Data inicial','date'],['months','Prazo (meses)','number'],['notes','Condições e exclusões','textarea']],
    row: r => { const [s, c, end] = wState(r); return `<b>${esc(r.system)}</b> <span class="badge ${c}">${s}</span><p>${esc(r.coverage)}</p><span class="mute">${fmt(r.start_date)} até ${end.toLocaleDateString('pt-BR')}</span><p class="mute">${esc(r.notes)}</p>`; },
    note: 'Os prazos valem conforme contrato, fabricante e lei. As condições contratuais e legais prevalecem sobre estes indicadores.' },
  maintenance_tasks: { label: 'Manutenção preventiva', order: 'next_due', f: [['name','Tarefa'],['system','Sistema'],['frequency','Periodicidade'],['last_done','Última execução','date'],['next_due','Próxima data','date'],['interval_months','Repetir a cada (meses)','number'],['status','Situação',['Pendente','Em andamento','Concluída','Cancelada']],['instructions','Instruções','textarea']],
    row: r => { const st = r.status || 'Pendente', late = r.next_due && new Date(r.next_due + 'T00:00') < new Date() && !['Concluída', 'Cancelada'].includes(st); return `<b>${esc(r.name)}</b> <span class="badge ${late ? 'bad' : st === 'Concluída' ? 'ok' : ''}">${late ? 'Atrasada' : st}</span><p class="mute">${esc(r.system)} · ${esc(r.frequency)}</p>Última: ${fmt(r.last_done)} · Próxima: ${fmt(r.next_due)}<p class="mute">${esc(r.instructions)}</p>`; } },
  equipment: { label: 'Equipamentos', f: [['name','Nome'],['category','Categoria'],['maker','Fabricante'],['model','Modelo'],['serial','Nº de série'],['location','Localização']],
    row: r => `<b>${esc(r.name)}</b><span class="mute">${esc(r.category)} · ${esc(r.location)}</span><p>${esc(r.maker)} ${esc(r.model)} ${r.serial ? '· Série ' + esc(r.serial) : ''}</p>` },
  history_events: { label: 'Histórico da residência', order: 'event_date', f: [['event_date','Data','date'],['category','Categoria'],['description','Descrição','textarea']],
    row: r => `<b>${fmt(r.event_date)}</b><span class="mute">${esc(r.category)}</span><p>${esc(r.description)}</p>` },
  contacts: { label: 'Contatos', f: [['name','Nome / empresa'],['specialty','Especialidade'],['phone','Telefone'],['whatsapp','WhatsApp'],['email','E-mail'],['hours','Horário de atendimento'],['notes','Instruções','textarea']],
    row: r => `<b>${esc(r.name)}</b><span class="mute">${esc(r.specialty)}</span><p>${esc(r.phone)} ${esc(r.whatsapp)} ${esc(r.email)}</p><span class="mute">${esc(r.hours)} ${esc(r.notes)}</span>` },
};
const REQ_CATS = ['Elétrica','Hidráulica','Cobertura','Esquadrias','Revestimentos','Pintura','Steel Frame','Equipamentos','Outros'];
const STATUS = ['Recebida','Em análise','Aguardando informações','Agendada','Em atendimento','Concluída','Encerrada'];
const DOC_CATS = ['Projeto arquitetônico','Projeto estrutural','Projeto elétrico','Projeto hidráulico','Projeto sanitário','Climatização','Cobertura','Memorial descritivo','Manuais','Notas e comprovantes','Termo de entrega','Garantia','Outros'];

const QR_T = { 'Minha casa': 'casa', 'Documentos e manuais': 'documentos', 'Equipamentos': 'equipamentos', 'Manutenção': 'manutencao', 'Planta técnica': 'planta', 'Assistência técnica': 'assistencia' };
const PT_CATS = ['Elétrica','Hidráulica','Gás','Climatização','Estrutura','Paredes','Equipamentos'];
const ico = (d, c = '') => `<svg class="ico ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d.split('|').map(p => `<path d="${p}"/>`).join('')}</svg>`;
const IC = { home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M9 22V12h6v10', casa: 'M4 21V8l8-5 8 5v13|M9 21v-6h6v6', drop: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z', layers: 'M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5', shield: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z|M9 12l2 2 4-4', wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', phones: 'M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3', doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M8 13h8|M8 17h8', user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', chev: 'M9 18l6-6-6-6', check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14|M22 4L12 14.01l-3-3' };
const TILES = [['estrutura', 'Estrutura', 'Steel Frame', 'home'], ['sistemas', 'Sistemas', 'Elétrica | Hidráulica', 'drop'], ['materiais', 'Materiais', 'Especificações', 'layers'], ['garantias', 'Garantias', 'Prazos e coberturas', 'shield'], ['manutencao', 'Manutenção', 'Cuidados e dicas', 'wrench'], ['assistencia', 'Assistência', 'Suporte e contato', 'phones']];
const BCAT = { estrutura: 'Estrutura', sistemas: 'Sistemas', materiais: 'Materiais' };
$('#nav').innerHTML = [['home', 'Início', 'home'], ['casa', 'Casa', 'casa'], ['documentos', 'Documentos', 'doc'], ['mais', 'Perfil', 'user']].map(([h, l, i]) => `<a href="#${h}">${ico(IC[i])}<span>${l}</span></a>`).join('');
function vsrc(u) { return String(u).replace('/upload/', '/upload/f_mp4,vc_h264,q_auto/').replace(/\.\w+$/, '.mp4'); }
function vposter(u) { return String(u).replace('/upload/', '/upload/w_480,c_limit,so_0/').replace(/\.\w+$/, '.jpg'); }
const isVidUrl = u => /\/video\/upload\//.test(u);
function carousel(urls) {
  if (!urls.length) return '<img class="heroimg" src="img/casa.jpg" alt="Foto da residência">';
  S.groups.home = urls;
  return `<div class="carousel" aria-roledescription="carrossel" aria-label="Fotos recentes da residência"><div class="slides">${urls.map((u, i) => `<img src="${esc(cld(u, 1200))}" alt="Foto ${i + 1} de ${urls.length} da residência" data-lb="home|${i}">`).join('')}</div>${urls.length > 1 ? `<button class="cn l" data-cn="-1" aria-label="Foto anterior">‹</button><button class="cn r" data-cn="1" aria-label="Próxima foto">›</button><button class="cp" data-cp aria-label="Pausar a troca automática" aria-pressed="false">❚❚</button><div class="dots">${urls.map((_, i) => `<span class="dot ${i ? '' : 'on'}"></span>`).join('')}</div>` : ''}</div>`;
}
// Troca automática a cada 4,5 s. Se o aparelho pede "reduzir movimento", a troca continua, mas sem animação (corte seco).
function initCarousel() {
  clearInterval(S.carTimer);
  const el = app.querySelector('.slides'); if (!el || el.children.length < 2) return;
  const n = el.children.length, dots = [...app.querySelectorAll('.dot')], idx = () => Math.round(el.scrollLeft / el.clientWidth);
  const reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  S.carPaused = false; S.carHold = 0;
  S.carGo = i => el.scrollTo({ left: (((i % n) + n) % n) * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  S.carIdx = idx;
  el.addEventListener('scroll', () => dots.forEach((d, k) => d.classList.toggle('on', k === idx())));
  const hold = () => { S.carHold = Date.now() + 8000; };   // depois de o usuário mexer, espera 8 s para voltar a trocar
  el.addEventListener('touchstart', hold, { passive: true }); el.addEventListener('pointerdown', hold);
  S.carTimer = setInterval(() => {
    if (!document.contains(el)) return clearInterval(S.carTimer);
    if (S.carPaused || document.hidden || Date.now() < S.carHold) return;
    S.carGo(idx() + 1);
  }, 4500);
}
function cld(u, w) { return String(u).replace('/upload/', `/upload/w_${w},c_limit,q_auto,f_auto/`); }
function grp(key, urls, cls = 'thumbs') {
  S.groups[key] = urls;
  return `<div class="${cls}">${urls.map((u, i) => isVidUrl(u) ? `<span class="vt"><img src="${esc(vposter(u))}" alt="Vídeo ${i + 1}" loading="lazy" data-lb="${key}|${i}"><i>▶</i></span>` : `<img src="${esc(cld(u, cls === 'thumbs' ? 240 : 500))}" alt="Imagem ${i + 1}" loading="lazy" data-lb="${key}|${i}">`).join('')}</div>`;
}
function showLb() {
  const u = S.groups[S.lb.g], cur = u[S.lb.i], lb = $('#lb'); lb.hidden = false;
  const media = isVidUrl(cur) ? `<video controls autoplay playsinline src="${esc(vsrc(cur))}" poster="${esc(vposter(cur))}"></video>` : `<img src="${esc(cld(cur, 1400))}" alt="Imagem ${S.lb.i + 1} de ${u.length}">`;
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
async function itemsView(k) {
  const cat = BCAT[k];
  const { data } = await sb.from('building_items').select('*').eq('residence_id', S.cur.id).eq('category', cat).order('created_at');
  app.innerHTML = (k === 'estrutura' ? '<div class="banner"><img src="img/estrutura.jpg" alt="Ilustração de estrutura em Steel Frame"><small>Imagem ilustrativa</small></div>' : '') + `<p class="eyebrow">${cat}</p>` +
    (staff() ? formOf('bitem', 'Adicionar item', `<input type="hidden" name="category" value="${cat}"><label>Título<input name="title" required></label><label>Descrição<textarea name="description" rows="3"></textarea></label><label>Destaques (um por linha)<textarea name="highlights" rows="4"></textarea></label>`) : '') +
    ((data || []).map(r => `<section class="item"><h2>${esc(r.title)}</h2><p class="mute">${esc(r.description)}</p><ul class="checks">${(r.highlights || '').split('\n').filter(Boolean).map(h => `<li>${ico(IC.check)}${esc(h)}</li>`).join('')}</ul>${staff() ? `<button class="link" data-del="building_items:${r.id}">Excluir</button>` : ''}</section>`).join('') || '<p class="empty">A Astell ainda não publicou as informações desta seção.</p>') +
    linkrow('documentos', 'Documentação técnica', 'Confira os documentos da sua casa.', 'doc') + linkrow('planta', 'Ver planta técnica', 'Pontos e detalhes da planta.', 'doc');
}
async function garantiasView() {
  const { data } = await sb.from('warranties').select('*').eq('residence_id', S.cur.id).order('start_date');
  const per = m => m % 12 ? `${m} meses` : `${m / 12} ${m === 12 ? 'ano' : 'anos'}`;
  app.innerHTML = `<div class="gtitle">${ico(IC.shield, 'big')}<h1>Garantias</h1><p class="mute">Mais segurança para o seu investimento.</p></div>
  <div class="card"><b>Resumo da garantia</b><p class="mute">Sua casa conta com garantia de acordo com o contrato e a legislação vigente.</p></div>` +
    (staff() ? formOf('warranties', 'Adicionar garantia', T.warranties.f.map(input).join('')) : '') +
    `<h3>Prazos por sistema</h3><div class="card rows">${(data || []).map(w => { const [s, c, end] = wState(w); return `<div class="row"><span>${esc(w.system)}<br><span class="badge ${c}">${s}</span> <small class="mute">até ${end.toLocaleDateString('pt-BR')}</small>${w.coverage ? `<br><small class="mute">${esc(w.coverage)}</small>` : ''}${staff() ? `<br><button class="link" data-del="warranties:${w.id}">Excluir</button>` : ''}</span><b>${per(w.months)}</b></div>`; }).join('') || '<p class="empty">Nenhuma garantia cadastrada ainda.</p>'}</div>` +
    linkrow('assistencia', 'Solicitar assistência', 'Precisa de suporte? Fale com a nossa equipe.', 'phones') + `<p class="notice">${T.warranties.note}</p>`;
}
const DEFREQ = ['system', 'name', 'description', 'months', 'start_date', 'event_date'];
const fld = ([k, l, t = 'text', req], v = {}) => {
  const val = v[k] ?? '', r = (req ?? DEFREQ.includes(k)) ? 'required' : '';
  if (Array.isArray(t)) return `<label>${l}<select name="${k}">${t.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
  return `<label>${l}${t === 'textarea' ? `<textarea name="${k}" rows="3" ${r}>${esc(val)}</textarea>` : `<input name="${k}" type="${t}" value="${esc(val)}" ${r}>`}</label>`;
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
  async home() {
    const r = S.cur;
    const { data: hi } = await sb.from('images').select('*').eq('residence_id', r.id).eq('kind', 'residence').order('created_at', { ascending: false }).limit(30);
    const pics = (hi || []).filter(x => (x.media_type || 'image') === 'image').sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 5).map(x => x.url);
    const { data: m } = await sb.from('maintenance_tasks').select('name,next_due').eq('residence_id', r.id).not('next_due', 'is', null).order('next_due').limit(3);
    app.innerHTML = `<p class="eyebrow">Bem-vindo</p><h1 class="welcome">Sua casa,<br>do seu jeito.</h1>
    <a class="rescard" href="#casa">${ico(IC.home)}<span><b>${esc(r.name)}</b><small>${esc(r.address || r.code)}</small></span>${ico(IC.chev)}</a>
    ${carousel(pics)}
    <div class="tiles">${TILES.map(([h, t, s, i]) => `<a class="tile" href="#${h}">${ico(IC[i])}<b>${t}</b><small>${s}</small></a>`).join('')}</div>
    <h3>Próximos cuidados</h3>${(m || []).map(x => `<div class="card"><b>${esc(x.name)}</b>${fmt(x.next_due)}</div>`).join('') || '<p class="empty">Nenhum cuidado agendado.</p>'}`;
    initCarousel();
  },
  async casa() {
    const { data: im0 } = await sb.from('images').select('*').eq('residence_id', S.cur.id).eq('kind', 'residence').order('created_at');
    S.media = im0 || []; S.casaTab = 'all';
    const r = S.cur, rows = [['Código', r.code], ['Endereço', r.address], ['Área construída', r.area_m2 && r.area_m2 + ' m²'], ['Pavimentos', r.floors], ['Sistema construtivo', r.build_system], ['Nº do projeto', r.project_no], ['Início da obra', fmt(r.start_date)], ['Entrega', fmt(r.delivery_date)], ['Responsável técnico', r.tech_lead], ['Observações', r.notes]];
    app.innerHTML = `<h2>${esc(r.name)}</h2><div class="card">${rows.map(([a, b]) => `<p><span class="mute">${a}</span><br>${esc(b || '—')}</p>`).join('')}</div><div id="mb">${mediaBlock()}</div>`;
  },
  manutencao: () => listView('maintenance_tasks'), garantias: garantiasView, estrutura: () => itemsView('estrutura'), sistemas: () => itemsView('sistemas'), materiais: () => itemsView('materiais'), equipamentos: () => listView('equipment'),
  historico: () => listView('history_events'), contatos: () => listView('contacts'),
  async documentos() {
    const { data } = await sb.from('documents').select('*').eq('residence_id', S.cur.id).order('created_at', { ascending: false });
    S.rows = S.rows || {}; S.rows.documents = data;
    const up = staff() ? formOf('doc', 'Enviar documento', `<label>Título<input name="title" required></label>${sel('category', 'Categoria', DOC_CATS)}<label>Versão<input name="version"></label><label>Descrição<input name="description"></label><label>Arquivo<input name="file" type="file" required></label>`, 'Enviar') : '';
    app.innerHTML = `<h2>Documentos</h2>${up}` + ((data || []).map(d => `<div class="card"><b>${esc(d.title)}</b><span class="mute">${esc(d.category)} · v${esc(d.version || '1')} · ${fmt(d.created_at.slice(0, 10))}</span><p>${esc(d.description)}</p><button data-open="${esc(d.path)}">Abrir</button>${staff() ? `<button class="link" data-vis="documents:${d.id}">${d.visible ? 'Ocultar do cliente' : 'Mostrar ao cliente'}</button> <button class="link" data-deldoc="${d.id}|${esc(d.path)}">Excluir</button>` : ''}</div>`).join('') || '<p class="empty">Nenhum documento disponível ainda.</p>');
  },
  async assistencia() {
    const { data } = await sb.from('service_requests').select('*').eq('residence_id', S.cur.id).order('created_at', { ascending: false });
    const f = formOf('req', 'Nova solicitação', `${sel('category', 'Categoria', REQ_CATS)}<label>Local da casa<input name="place" required></label><label>Descrição<textarea name="description" rows="4" required></textarea></label>${sel('urgency', 'Urgência percebida', ['Baixa', 'Média', 'Alta'])}<label>Melhor horário para contato<input name="contact_time"></label>`, 'Enviar solicitação');
    app.innerHTML = `<h2>Assistência técnica</h2><p class="notice">Esta é uma solicitação formal. Em risco imediato (gás, fogo, choque), afaste-se e ligue 193 ou 192.</p>${f}` +
      ((data || []).map(r => `<div class="card"><b>${esc(r.protocol)}</b> <span class="badge">${esc(r.status)}</span><p>${esc(r.category)} · ${esc(r.place)} · ${esc(r.urgency)}</p><p>${esc(r.description)}</p>${r.staff_note ? `<p class="mute">Astell: ${esc(r.staff_note)}</p>` : ''}
      ${staff() ? `<form data-form="upd" data-id="${r.id}">${sel('status', 'Situação', STATUS).replace(`<option>${r.status}`, `<option selected>${r.status}`)}<label>Comentário<input name="staff_note" value="${esc(r.staff_note || '')}"></label><button>Atualizar</button></form>` : ''}</div>`).join('') || '<p class="empty">Você ainda não abriu solicitações.</p>');
  },
  async qr() {
    const { data } = await sb.from('qr_codes').select('*').eq('residence_id', S.cur.id).order('created_at');
    const base = location.href.split('#')[0];
    const svg = t => { const q = qrcode(0, 'M'); q.addData(base + '#qr/' + t); q.make(); return q.createSvgTag(5, 0); };
    app.innerHTML = '<h2>QR Codes</h2>' + (staff() ? formOf('qr', 'Novo QR Code', `<label>Nome da etiqueta<input name="label" required></label>${sel('target', 'Ao ler, abre', Object.keys(QR_T))}`, 'Gerar') + '<button data-print>Imprimir etiquetas</button>' : '') +
      '<div class="grid">' + ((data || []).map(q => `<div class="card qr">${svg(q.token)}<b>${esc(q.label)}</b><span class="mute">Astell Home · ${esc(S.cur.code)}</span>${staff() ? `<button class="link" data-del="qr_codes:${q.id}">Excluir</button>` : ''}</div>`).join('') || '<p class="empty">Nenhum QR Code gerado ainda.</p>') + '</div>' +
      '<p class="notice">O QR Code só leva a um link. Para ver qualquer informação, quem lê precisa entrar com a conta vinculada à casa.</p>';
  },
  async planta() {
    const rid = S.cur.id;
    const [{ data: fp }, { data: pts }] = await Promise.all([sb.from('floorplans').select('*').eq('residence_id', rid).order('created_at'), sb.from('plan_points').select('*').eq('residence_id', rid)]);
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
  mais() {
    const l = [['documentos', 'Documentos'], ['garantias', 'Garantias'], ['equipamentos', 'Equipamentos'], ['historico', 'Histórico'], ['contatos', 'Contatos'], ['qr', 'QR Codes'], ['planta', 'Planta técnica']];
    app.innerHTML = `<div class="perfil"><h2>Perfil</h2><div class="card"><b>${esc(S.profile.name || '')}</b><span class="mute">${esc(S.profile.email || '')}</span></div><div class="menu">${l.map(([h, t]) => `<a href="#${h}">${t}</a>`).join('')}</div><p class="notice">Pendentes nesta versão: camadas construtivas, emergência, auditoria, PWA e notificações.</p><p class="notice ver">Astell Home · versão ${APP_VERSION}</p><button class="ghost2 sair" data-out>Sair da conta</button></div>`;
  },
};

// Eventos
app.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, id = f.dataset.form, o = clean(Object.fromEntries(new FormData(f))), rid = S.cur?.id; let r;
  if (id === 'hf') { S.hf = o; return route(); }
  if (id.startsWith('edit:')) { r = await sb.from(id.slice(5)).update(o).eq('id', f.dataset.id); S.edit = null; }
  else if (id === 'editres') { r = await sb.from('residences').update(o).eq('id', rid); if (!r.error) { await loadRes(rid); return toast('Dados da residência salvos.'); } }
  else if (T[id]) r = await sb.from(id).insert({ ...o, residence_id: rid });
  else if (id === 'req') r = await sb.from('service_requests').insert({ ...o, residence_id: rid, protocol: 'AST-' + Date.now().toString(36).toUpperCase() });
  else if (id === 'upd') { r = await sb.from('service_requests').update(o).eq('id', f.dataset.id); if (!r.error) await sb.from('history_events').insert({ residence_id: rid, category: 'Assistência', description: 'Solicitação atualizada: ' + o.status }); }
  else if (id === 'bitem') r = await sb.from('building_items').insert({ ...o, residence_id: rid });
  else if (id === 'qr') r = await sb.from('qr_codes').insert({ residence_id: rid, label: o.label, target_hash: QR_T[o.target] });
  else if (id === 'plan') { const file = f.file.files[0], path = `${rid}/planta_${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;
    r = await sb.storage.from('documents').upload(path, file); if (!r.error) r = await sb.from('floorplans').insert({ residence_id: rid, title: o.title, path }); }
  else if (id === 'pt') { r = await sb.from('plan_points').insert({ ...o, residence_id: rid, floorplan_id: S.planId, x: S.pend.x, y: S.pend.y }); S.pend = null; }
  else if (id === 'newres') { r = await sb.from('residences').insert(o).select().single(); if (!r.error) { await loadRes(r.data.id); return toast('Residência cadastrada.'); } }
  else if (id === 'doc') { const file = f.file.files[0], path = `${rid}/${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;
    r = await sb.storage.from('documents').upload(path, file); if (!r.error) { r = await sb.from('documents').insert({ residence_id: rid, title: o.title, category: o.category, version: o.version, description: o.description, path }); } }
  if (r?.error) return toast('Não foi possível salvar: ' + r.error.message, 1);
  toast('Salvo com sucesso.'); route();
});
app.addEventListener('click', async e => {
  const d = e.target.dataset;
  if (d.cn && S.carGo) { S.carHold = Date.now() + 8000; S.carGo(S.carIdx() + +d.cn); }
  if (d.cp !== undefined) { S.carPaused = !S.carPaused; e.target.setAttribute('aria-pressed', S.carPaused); e.target.setAttribute('aria-label', S.carPaused ? 'Retomar a troca automática' : 'Pausar a troca automática'); e.target.textContent = S.carPaused ? '▶' : '❚❚'; }
  if (d.ct) { S.casaTab = d.ct; $('#mb').innerHTML = mediaBlock(); }
  if (d.lb) { const [g, i] = d.lb.split('|'); S.lb = { g, i: +i }; showLb(); }
  if (d.out !== undefined) sb.auth.signOut();
  if (d.print !== undefined) print();
  if (d.place !== undefined) { S.place = !S.place; S.pend = null; route(); }
  if (d.plan && S.place) { const b = e.target.getBoundingClientRect(); S.pend = { x: +((e.clientX - b.left) / b.width * 100).toFixed(2), y: +((e.clientY - b.top) / b.height * 100).toFixed(2) };
    $('#ptbox').innerHTML = `<form class="card" data-form="pt"><b>Novo ponto</b>${sel('category', 'Categoria', PT_CATS)}<label>Identificação<input name="label" required></label><label>Detalhes<textarea name="description" rows="3"></textarea></label><button>Salvar ponto</button></form>`; }
  if (d.pt) { const p = S.pts.find(x => x.id === d.pt); $('#ptbox').innerHTML = `<div class="card"><b>${esc(p.label)}</b><span class="mute">${esc(p.category)}</span><p>${esc(p.description)}</p>${staff() ? `<button class="link" data-del="plan_points:${p.id}">Excluir ponto</button>` : ''}</div>`; }
  if (d.open) { const { data, error } = await sb.storage.from('documents').createSignedUrl(d.open, 60); error ? toast('Acesso negado.', 1) : window.open(data.signedUrl, '_blank', 'noopener'); }
  if (d.del && confirm('Excluir este registro?')) { const [t, id] = d.del.split(':'); await sb.from(t).delete().eq('id', id); route(); }
  if (d.deldoc && confirm('Excluir este documento?')) { const [id, p] = d.deldoc.split('|'); await sb.storage.from('documents').remove([p]); await sb.from('documents').delete().eq('id', id); route(); }
});

function route() {
  if (!S.profile) return;
  clearInterval(S.carTimer);
  const h = location.hash.slice(1) || 'home';
  if (h.startsWith('qr/')) return openQr(h.slice(3));
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + h));
  if (!S.cur) return app.innerHTML = '<p class="empty">Nenhuma residência vinculada à sua conta. Fale com a Astell.</p>';
  (views[h] || views.home)();
}
addEventListener('hashchange', () => { S.edit = null; route(); });

async function loadRes(selectId) {
  const { data } = await sb.from('residences').select('*').order('created_at');
  S.res = data || []; $('#resSel').hidden = S.res.length < 2; S.cur = S.res.find(r => r.id === selectId) || S.res.find(r => r.id === S.cur?.id) || S.res[0] || null;
  $('#resSel').innerHTML = S.res.map(r => `<option value="${r.id}" ${r.id === S.cur?.id ? 'selected' : ''}>${esc(r.name)} — ${esc(r.code)}</option>`).join('');
  route();
}
$('#resSel').onchange = e => { S.cur = S.res.find(r => r.id === e.target.value); route(); };

const GOOGLE_SVG = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';
function cpfDigits(v) { return String(v || '').replace(/\D/g, '').slice(0, 11); }
function cpfMask(v) { return cpfDigits(v).replace(/^(\d{3})(\d)/, '$1.$2').replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1-$2'); }
function cpfOk(d) { if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false; for (let t = 9; t < 11; t++) { let s = 0; for (let i = 0; i < t; i++) s += d[i] * (t + 1 - i); if ((s * 10) % 11 % 10 != d[t]) return false; } return true; }
const PW_RULES = [['Mínimo de 8 caracteres', p => p.length >= 8], ['Letra maiúscula', p => /[A-Z]/.test(p)], ['Letra minúscula', p => /[a-z]/.test(p)], ['Número', p => /\d/.test(p)], ['Caractere especial (! @ # $ ...)', p => /[^A-Za-z0-9]/.test(p)]];
const pwList = p => PW_RULES.map(([t, f]) => `<li class="${f(p) ? 'ok' : ''}">${f(p) ? '✓' : '○'} ${t}</li>`).join('');
const strongPw = p => PW_RULES.every(([, f]) => f(p));
const CPF_INPUT = id => `<label>CPF<input id="${id}" class="cpf" inputmode="numeric" maxlength="14" placeholder="000.000.000-00" required autocomplete="off"></label>`;

function loginScreen(mode = 'login') {
  $('#top').hidden = $('#nav').hidden = true;
  const su = mode === 'signup', back = location.origin + location.pathname;
  app.innerHTML = `<div class="login"><form id="lf">
    <h1>ASTELL<span>HOME</span></h1><p class="tag">Sua casa. Sua história. Tudo em um só lugar.</p>
    <h2>${su ? 'Crie sua conta' : 'Bem-vindo à sua casa Astell'}</h2>
    <button type="button" class="btn-google" id="gg">${GOOGLE_SVG}<span>${su ? 'Cadastrar com o Google' : 'Entrar com o Google'}</span></button>
    <div class="or"><span>ou</span></div>
    ${su ? '<label>Nome completo<input id="nm" required autocomplete="name"></label>' + CPF_INPUT('cp') : ''}
    <label>E-mail<input id="em" type="email" required autocomplete="username"></label>
    <label>Senha<input id="pw" type="password" required autocomplete="${su ? 'new-password' : 'current-password'}"></label>
    ${su ? `<ul class="pwrules" id="pr">${pwList('')}</ul><label>Confirmar senha<input id="pw2" type="password" required autocomplete="new-password"></label>` : ''}
    <button class="btn-main">${su ? 'Criar conta' : 'Entrar na minha casa'}</button>
    ${su ? '<p class="fine">Você usará o e-mail e a senha para entrar. O CPF serve para localizar a residência cadastrada pela Astell.</p>' : '<button type="button" id="rs" class="btn-text">Esqueci minha senha</button>'}
    <p class="switch">${su ? 'Já tem conta?' : 'Ainda não tem conta?'} <button type="button" id="sw" class="btn-text">${su ? 'Entrar' : 'Cadastre-se'}</button></p>
  </form></div>`;
  $('#sw').onclick = () => loginScreen(su ? 'login' : 'signup');
  $('#gg').onclick = async () => { if (location.protocol === 'file:') return toast('O login com Google não funciona com o arquivo aberto direto. Abra o app por um endereço http ou https.', 1); const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: back } }); if (error) toast('Não foi possível entrar com o Google. Confira se ele está ativado no Supabase.', 1); };
  $('#lf').onsubmit = async e => {
    e.preventDefault(); const email = $('#em').value.trim(), password = $('#pw').value;
    if (!su) { const { error } = await sb.auth.signInWithPassword({ email, password }); if (error) toast(/confirm/i.test(error.message) ? 'Confirme seu e-mail antes de entrar.' : 'E-mail ou senha incorretos.', 1); return; }
    const cpf = cpfDigits($('#cp').value);
    if (!cpfOk(cpf)) return toast('CPF inválido. Confira os números.', 1);
    if (!strongPw(password)) return toast('A senha não atende a todos os requisitos.', 1);
    if (password !== $('#pw2').value) return toast('As senhas não são iguais.', 1);
    const { data, error } = await sb.auth.signUp({ email, password, options: { data: { name: $('#nm').value.trim(), cpf }, emailRedirectTo: back } });
    if (error) return toast('Não foi possível criar a conta: ' + error.message, 1);
    if (data.user && data.user.identities && data.user.identities.length === 0) return toast('Este e-mail já tem cadastro. Entre ou recupere a senha.', 1);
    if (!data.session) { loginScreen('login'); toast('Conta criada! Enviamos um e-mail para você confirmar o cadastro.'); }
  };
  if (!su) $('#rs').onclick = async () => { const v = $('#em').value.trim(); if (!v) return toast('Digite seu e-mail primeiro.', 1); await sb.auth.resetPasswordForEmail(v, { redirectTo: back }); toast('Se o e-mail existir, enviamos um link de recuperação.'); };
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

async function start(session) {
  if (!session) { S.profile = null; S.cur = null; return loginScreen(); }
  const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
  if (!data) return fail('Sua conta existe, mas ainda não tem perfil no banco. Peça à Astell para conferir se o schema.sql foi executado antes da criação do usuário.');
  S.profile = data;
  if (data.role === 'client' && !data.cpf_claimed) {
    const { data: rs } = await sb.from('residences').select('id').limit(1);
    if (!(rs || []).length) {
      const pend = (session.user.user_metadata || {}).cpf;
      if (pend) { const r = await claim(pend); if (r.ok) { const { data: s2 } = await sb.auth.getSession(); return start(s2.session); } return cpfScreen(r.msg); }
      return cpfScreen();
    }
  }
  $('#top').hidden = $('#nav').hidden = false;
  await loadRes();
}
sb.auth.getSession().then(({ data }) => start(data.session));
sb.auth.onAuthStateChange((ev, s) => { if (ev === 'SIGNED_IN' && S.profile && s && S.profile.id === s.user.id) return;
  if (ev === 'SIGNED_IN' || ev === 'SIGNED_OUT') setTimeout(() => start(s), 0); });

async function openQr(t) {
  const { data } = await sb.from('qr_codes').select('*').eq('token', t).maybeSingle();
  if (!data) return app.innerHTML = '<p class="empty">Este QR Code não existe ou a sua conta não tem acesso a ele. Entre com a conta vinculada à casa.</p>';
  const r = S.res.find(x => x.id === data.residence_id);
  if (r) { S.cur = r; $('#resSel').value = r.id; }
  location.hash = '#' + data.target_hash;
}
app.addEventListener('change', e => { if (e.target.id === 'planSel') { S.planId = e.target.value; route(); } });

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
