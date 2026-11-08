// Configuração do Supabase: arquivo config.js
const APP_VERSION = '2026.10.21-17'; // mostrada no Perfil; acompanha o ?v= dos arquivos no index.html
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
function wState(w) { const start = new Date(w.start_date + 'T00:00'), end = addMonths(w.start_date, w.months), left = end - new Date(), total = end - start;   // vigente; próxima do vencimento = resta 1/4 do prazo ou menos; expirada
  return left <= 0 ? ['Expirada', 'bad', end] : left <= total / 4 ? ['Próxima do vencimento', 'warn', end] : ['Vigente', 'ok', end]; }
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
  maintenance_tasks: { label: 'Manutenção preventiva', order: 'next_due', f: [['name','Tarefa'],['system','Sistema'],['frequency','Periodicidade'],['last_done','Última execução','date'],['next_due','Próxima data','date'],['interval_months','Repetir a cada (meses)','number'],['status','Situação',['Pendente','Em andamento','Concluída','Cancelada']],['instructions','Instruções','textarea']],
    row: r => { const st = r.status || 'Pendente', late = r.next_due && new Date(r.next_due + 'T00:00') < new Date() && !['Concluída', 'Cancelada'].includes(st); return `<b>${esc(r.name)}</b> <span class="badge ${late ? 'bad' : st === 'Concluída' ? 'ok' : ''}">${late ? 'Atrasada' : st}</span><p class="mute">${esc(r.system)} · ${esc(r.frequency)}</p>Última: ${fmt(r.last_done)} · Próxima: ${fmt(r.next_due)}<p class="mute">${esc(r.instructions)}</p>`; } },
  equipment: { label: 'Equipamentos', f: [['name','Nome'],['category','Categoria'],['maker','Fabricante'],['model','Modelo'],['serial','Nº de série'],['location','Localização']],
    row: r => `<b>${esc(r.name)}</b><span class="mute">${esc(r.category)} · ${esc(r.location)}</span><p>${esc(r.maker)} ${esc(r.model)} ${r.serial ? '· Série ' + esc(r.serial) : ''}</p>` },
};
const REQ_CATS = ['Elétrica','Hidráulica','Cobertura','Esquadrias','Revestimentos','Pintura','Steel Frame','Equipamentos','Outros'];
const STATUS = ['Recebida','Em análise','Aguardando informações','Agendada','Em atendimento','Concluída','Encerrada'];
const DOC_CATS = ['Projeto arquitetônico','Projeto estrutural','Projeto elétrico','Projeto hidráulico','Projeto sanitário','Climatização','Cobertura','Memorial descritivo','Manuais','Notas e comprovantes','Termo de entrega','Garantia','Outros'];

const PT_CATS = ['Elétrica','Hidráulica','Gás','Climatização','Estrutura','Paredes','Equipamentos'];
const ico = (d, c = '') => `<svg class="ico ${c}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d.split('|').map(p => `<path d="${p}"/>`).join('')}</svg>`;
const IC = { home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z|M9 22V12h6v10', casa: 'M4 21V8l8-5 8 5v13|M9 21v-6h6v6', drop: 'M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z', layers: 'M12 2L2 7l10 5 10-5-10-5z|M2 17l10 5 10-5|M2 12l10 5 10-5', shield: 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z|M9 12l2 2 4-4', wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z', phones: 'M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3', doc: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z|M14 2v6h6|M8 13h8|M8 17h8', user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2|M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', chev: 'M9 18l6-6-6-6', check: 'M22 11.08V12a10 10 0 1 1-5.93-9.14|M22 4L12 14.01l-3-3', bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9|M10.3 21a1.94 1.94 0 0 0 3.4 0', pin: 'M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0|M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5', chevd: 'M6 9l6 6 6-6', bolt: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z', image: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z|M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3|M21 15l-5-5L5 21', calendar: 'M8 2v4|M16 2v4|M3 10h18|M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z|M8 14h.01|M12 14h.01|M16 14h.01|M8 18h.01|M12 18h.01', dl: 'M12 3v12|M7 11l5 5 5-5|M5 21h14', folder: 'M3 6a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', usr: 'M20 21a8 8 0 0 0-16 0|M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8', tick: 'M5 12.5l4.5 4.5L19 7.5' };
const TILES = [['estrutura', 'Estrutura', 'Steel Frame', 'layers'], ['sistemas', 'Instalações', 'Elétrica e hidráulica', 'bolt'], ['garantias', 'Garantias', 'Prazos e condições', 'shield'], ['manutencao', 'Manutenção', 'Cuidados da sua casa', 'wrench']];
const BCAT = { estrutura: 'Estrutura', sistemas: 'Sistemas', materiais: 'Materiais' };
const NAV = [['home', 'Início', 'home', ['home']], ['casa', 'Minha Casa', 'layers', ['casa', 'estrutura', 'sistemas', 'materiais', 'garantias', 'manutencao', 'equipamentos', 'planta', 'midias', 'cronograma', 'detalhe']], ['documentos', 'Documentos', 'folder', ['documentos']], ['assistencia', 'Suporte', 'phones', ['assistencia']]];
$('#nav').innerHTML = NAV.map(([h, l, i, g]) => `<a href="#${h}" data-g="${g.join(' ')}">${ico(IC[i])}<span>${l}</span></a>`).join('');
$('#top .bico').innerHTML = ico(IC.casa, 'brandico'); $('#bell').innerHTML = ico(IC.bell); $('#avatar').innerHTML = ico(IC.usr);
async function refreshBell() {   // número de solicitações de assistência ainda em andamento
  const b = $('#bell'); if (!b || !S.cur) return;
  const { data } = await sb.from('service_requests').select('status').eq('residence_id', S.cur.id), n = (data || []).filter(x => !['Concluída', 'Encerrada'].includes(x.status)).length;
  b.innerHTML = ico(IC.bell) + (n ? `<i class="bdg">${n > 9 ? '9+' : n}</i>` : '');
}
function vsrc(u) { return String(u).replace('/upload/', '/upload/f_mp4,vc_h264,q_auto/').replace(/\.\w+$/, '.mp4'); }
function vposter(u) { return String(u).replace('/upload/', '/upload/w_480,c_limit,so_0/').replace(/\.\w+$/, '.jpg'); }
const isVidUrl = u => /\/video\/upload\//.test(u);
function carousel(urls) {
  if (!urls.length) return '<img class="heroimg" src="img/casa.jpg" alt="Foto da residência">';
  S.groups.home = urls;
  const slide = (u, i, clone) => `<img src="${esc(cld(u, 1200))}" alt="Foto ${i + 1} de ${urls.length} da residência" data-lb="home|${i}"${clone ? ' aria-hidden="true"' : ''}>`, many = urls.length > 1;
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
const REQ_ST = { 'Recebida': 's-pend', 'Em análise': 's-ana', 'Agendada': 's-agd', 'Em atendimento': 's-and', 'Concluída': 's-conc' }, REQ_UR = { 'Crítica': 'u-crit', 'Alta': 'u-alta', 'Média': 'u-med', 'Baixa': 'u-baixa' };
async function cldPost(file, folder) {
  const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', CLD_PRESET); fd.append('folder', folder);
  const resp = await fetch(`https://api.cloudinary.com/v1_1/${CLD_NAME}/auto/upload`, { method: 'POST', body: fd });
  const j = await resp.json(); if (!resp.ok) throw new Error((j.error && j.error.message) || 'erro no envio'); return j;
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
const reqCard = r => { const fotos = (r.media || []).filter(x => x.url).map(x => x.url); return `<div class="card"><b>${esc(r.protocol)}</b> <span class="badge ${REQ_ST[r.status] || ''}">${esc(r.status)}</span> <span class="badge ${REQ_UR[r.urgency] || 'u-med'}">${esc(r.urgency || 'Média')}</span><p>${esc(r.category)} · ${esc(r.place)}</p><p>${esc(r.description)}</p>${r.scheduled_for ? `<p class="sched">${ico(IC.calendar)}<span>Data prevista de atendimento: <b>${fmt(r.scheduled_for)}</b></span></p>` : ''}${fotos.length ? grp('req' + r.id, fotos) : ''}${r.staff_note ? `<div class="astnote"><span class="lbl">Assistência que será feita</span><p>${esc(r.staff_note)}</p></div>` : ''}
      ${staff() ? `<form data-form="upd" data-id="${r.id}">${sel('status', 'Situação', STATUS).replace(`<option>${r.status}`, `<option selected>${r.status}`)}<label>Comentário<input name="staff_note" value="${esc(r.staff_note || '')}"></label><button>Atualizar</button></form>` : ''}</div>`; };
const warCard = r => { const w = wInfo(r); return `<div class="card"><b>${esc(r.system)}</b><div class="wbox w-${w.kind}">${w.kind === 'warn' ? `<p class="wwarn">Garantia próxima do vencimento - faltam ${w.txt}</p>` : w.kind === 'bad' ? `<p class="wexp">Garantia expirada em ${w.end.toLocaleDateString('pt-BR')}</p>` : ''}<div class="wfig"><div><span class="wnum wtot">${w.total}</span><span class="wlbl">Prazo total</span></div><div><span class="wnum wrem">${w.kind === 'bad' ? 'Expirada' : w.big}</span><span class="wlbl">${w.kind === 'bad' ? 'Vencida' : 'Restantes'}</span></div></div><div class="wbar" role="img" aria-label="Tempo restante da garantia"><i style="width:${w.pct.toFixed(1)}%"></i></div><span class="wpill">${w.s}</span></div>${r.coverage ? `<p>${esc(r.coverage)}</p>` : ''}<span class="mute">${fmt(r.start_date)} até ${w.end.toLocaleDateString('pt-BR')}</span>${r.notes ? `<p class="mute">${esc(r.notes)}</p>` : ''}${staff() ? `<button class="link" data-del="warranties:${r.id}">Excluir</button>` : ''}</div>`; };
async function garantiasView() {
  const { data } = await sb.from('warranties').select('*').eq('residence_id', S.cur.id).order('start_date');
  const per = m => m % 12 ? `${m} meses` : `${m / 12} ${m === 12 ? 'ano' : 'anos'}`;
  app.innerHTML = `<div class="gtitle">${ico(IC.shield, 'big')}<h1>Garantias</h1><p class="mute">Mais segurança para o seu investimento.</p></div>
  <div class="card"><b>Resumo da garantia</b><p class="mute">Sua casa conta com garantia de acordo com o contrato e a legislação vigente.</p></div>` +
    (staff() ? formOf('warranties', 'Adicionar garantia', T.warranties.f.map(input).join('')) : '') +
    `<h3>Prazos por sistema</h3>${(data || []).map(warCard).join('') || '<p class="empty">Nenhuma garantia cadastrada ainda.</p>'}` +
    linkrow('assistencia', 'Solicitar assistência', 'Precisa de suporte? Fale com a nossa equipe.', 'phones') + `<p class="notice">${T.warranties.note}</p>`;
}
const DEFREQ = ['system', 'name', 'description', 'months', 'start_date', 'event_date'];
const fld = ([k, l, t = 'text', req], v = {}) => {
  const val = v[k] ?? '', r = (req ?? DEFREQ.includes(k)) ? 'required' : '';
  if (Array.isArray(t)) return `<label>${l}<select name="${k}">${t.map(o => `<option ${o === val ? 'selected' : ''}>${o}</option>`).join('')}</select></label>`;
  return `<label>${l}${t === 'textarea' ? `<textarea name="${k}" rows="3" ${r}>${esc(val)}</textarea>` : `<input name="${k}" type="${t}" value="${esc(val)}" ${r}${t === 'number' && /months/.test(k) ? ' min="0" step="1" inputmode="numeric" data-nonneg' : ''}>`}</label>`;
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
    const [{ data: hi }, evs, { data: docs }] = await Promise.all([
      sb.from('images').select('*').eq('residence_id', r.id).eq('kind', 'residence').order('created_at', { ascending: false }).limit(30),
      calEvents(r.id),
      sb.from('documents').select('title,category,path').eq('residence_id', r.id).order('created_at', { ascending: false })]);
    const pics = (hi || []).filter(x => (x.media_type || 'image') === 'image').sort((a, b) => String(b.created_at).localeCompare(String(a.created_at))).slice(0, 5).map(x => x.url);
    const hj = new Date().toISOString().slice(0, 10), nx = (evs || []).find(x => String(x.d) >= hj);
    const hr = new Date().getHours(), sau = hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite', nome = String((S.profile && S.profile.name) || '').trim().split(/\s+/)[0];
    const man = (docs || []).find(d => d.category === 'Manuais'), prj = (docs || []).find(d => /^Projeto/.test(d.category || ''));
    const chip = (d, t) => d ? `<button type="button" class="dchip" data-open="${esc(d.path)}">${ico(IC.doc)}<span>${t}</span>${ico(IC.dl)}</button>` : `<a class="dchip" href="#documentos">${ico(IC.doc)}<span>${t}</span>${ico(IC.dl)}</a>`;
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
    <div class="dchips">${chip(man, 'Manual do Proprietário')}${chip(prj, 'Projetos da Residência')}</div>`;
    initCarousel();
  },
  async casa() {
    const { data: im0 } = await sb.from('images').select('*').eq('residence_id', S.cur.id).eq('kind', 'residence').order('created_at');
    const r = S.cur, rows = [['Código', r.code], ['Endereço', r.address], ['Área construída', r.area_m2 && r.area_m2 + ' m²'], ['Pavimentos', r.floors], ['Sistema construtivo', r.build_system], ['Nº do projeto', r.project_no], ['Início da obra', fmt(r.start_date)], ['Entrega', fmt(r.delivery_date)], ['Responsável técnico', r.tech_lead], ['Observações', r.notes]];
    const CARDS = [['documentos', 'Documentos', 'doc'], ['midias', 'Mídias', 'image'], ['estrutura', 'Estrutura', 'layers'], ['sistemas', 'Instalações', 'bolt'], ['garantias', 'Garantias', 'shield'], ['manutencao', 'Manutenções', 'wrench'], ['assistencia', 'Assistências', 'phones'], ['cronograma', 'Cronograma', 'calendar']];
    app.innerHTML = `<h2>${esc(r.name)}</h2><div class="card">${rows.map(([a, b]) => `<p><span class="mute">${a}</span><br>${esc(b || '—')}</p>`).join('')}</div><div class="cgrid">${CARDS.map(([h, t, i]) => `<a class="card ccard" href="#${h}">${ico(IC[i])}<b>${t}</b></a>`).join('')}</div>`;
  },
  async midias() {
    const { data } = await sb.from('images').select('*').eq('residence_id', S.cur.id).eq('kind', 'residence').order('created_at');
    S.media = data || []; S.casaTab = 'all'; app.innerHTML = `<h2>Mídias</h2><div id="mb">${mediaBlock() || '<p class="empty">Nenhuma mídia cadastrada ainda.</p>'}</div>`;
  },
  async cronograma() { const ev = await calEvents(S.cur.id), n = new Date(); S.cal = { y: n.getFullYear(), m: n.getMonth(), ev }; app.innerHTML = '<h2>Cronograma</h2><div id="cal"></div>'; calPaint(); },
  async detalhe() {
    const [k, id] = S.q.split(':'), tb = { man: 'maintenance_tasks', ast: 'service_requests', gar: 'warranties' }[k], { data: r } = tb ? await sb.from(tb).select('*').eq('id', id).maybeSingle() : { data: null };
    if (!r) return app.innerHTML = '<p class="empty">Não foi possível encontrar este item.</p>';
    if (k === 'ast') return app.innerHTML = `<h2>Assistência</h2>${reqCard(r)}`;
    if (k === 'gar') return app.innerHTML = `<h2>Garantia</h2>${warCard(r)}`;
    const { data: ii } = await sb.from('images').select('url').eq('residence_id', S.cur.id).eq('kind', 'maintenance').eq('ref_id', r.id).order('created_at'), im = (ii || []).map(x => x.url);
    app.innerHTML = `<h2>Manutenção</h2><div class="card">${T.maintenance_tasks.row(r)}${im.length ? grp('m' + r.id, im) : ''}</div>`;
  },
  manutencao: () => listView('maintenance_tasks'), garantias: garantiasView, estrutura: () => itemsView('estrutura'), sistemas: () => itemsView('sistemas'), materiais: () => itemsView('materiais'), equipamentos: () => listView('equipment'),
  async documentos() {
    const { data } = await sb.from('documents').select('*').eq('residence_id', S.cur.id).order('created_at', { ascending: false });
    S.rows = S.rows || {}; S.rows.documents = data;
    const up = staff() ? formOf('doc', 'Enviar documento', `<label>Título<input name="title" required></label>${sel('category', 'Categoria', DOC_CATS)}<label>Versão<input name="version"></label><label>Descrição<input name="description"></label><label>Arquivo<input name="file" type="file" required></label>`, 'Enviar') : '';
    app.innerHTML = `<h2>Documentos</h2>${up}` + ((data || []).map(d => `<div class="card"><b>${esc(d.title)}</b><span class="mute">${esc(d.category)} · v${esc(d.version || '1')} · ${fmt(d.created_at.slice(0, 10))}</span><p>${esc(d.description)}</p><button data-open="${esc(d.path)}">Abrir</button>${staff() ? `<button class="link" data-vis="documents:${d.id}">${d.visible ? 'Ocultar do cliente' : 'Mostrar ao cliente'}</button> <button class="link" data-deldoc="${d.id}|${esc(d.path)}">Excluir</button>` : ''}</div>`).join('') || '<p class="empty">Nenhum documento disponível ainda.</p>');
  },
  async assistencia() {
    const fields = `${sel('category', 'Categoria', REQ_CATS)}<label>Local da casa<input name="place" required></label><label>Descreva a assistência de que você precisa<textarea name="description" rows="6" required placeholder="Conte o que aconteceu, onde, desde quando e qualquer detalhe que ajude a equipe."></textarea></label>${CLOUD_OK ? '<label>Fotos e vídeos do problema (opcional)<input name="photos" type="file" accept="image/*,video/*" multiple></label><p class="mute">Até 8 arquivos: imagens de até 10 MB e vídeos de até 100 MB cada.</p>' : ''}<label>Melhor horário para contato<input name="contact_time"></label>`;
    if (S.nova) { app.innerHTML = `<h2>Nova solicitação de assistência</h2><p class="notice">Esta é uma solicitação formal. Em risco imediato (gás, fogo, choque), afaste-se e ligue 193 ou 192.</p><form class="card" data-form="req">${fields}<button>Enviar solicitação</button><a class="btn-cancel" href="#assistencia">Cancelar</a></form>`; return; }
    const { data } = await sb.from('service_requests').select('*').eq('residence_id', S.cur.id).order('created_at', { ascending: false });
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
  mais() {
    const l = [['documentos', 'Documentos'], ['garantias', 'Garantias'], ['equipamentos', 'Equipamentos'], ['planta', 'Planta técnica']];
    app.innerHTML = `<div class="perfil"><h2>Perfil</h2><div class="card"><b>${esc(S.profile.name || '')}</b><span class="mute">${esc(S.profile.email || '')}</span></div><div class="menu">${l.map(([h, t]) => `<a href="#${h}">${t}</a>`).join('')}</div><p class="notice">Pendentes nesta versão: camadas construtivas, emergência, auditoria, PWA e notificações.</p><p class="notice ver">Astell Home · versão ${APP_VERSION}</p><button class="sair" data-out>Sair da conta</button></div>`;
  },
};

// Eventos
app.addEventListener('submit', async e => {
  e.preventDefault(); const f = e.target, id = f.dataset.form, o = clean(Object.fromEntries(new FormData(f))), rid = S.cur?.id; let r;
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
  else if (id === 'upd') { r = await sb.from('service_requests').update(o).eq('id', f.dataset.id); if (!r.error) await sb.from('history_events').insert({ residence_id: rid, category: 'Assistência', description: 'Solicitação atualizada: ' + o.status }); }
  else if (id === 'bitem') r = await sb.from('building_items').insert({ ...o, residence_id: rid });
  else if (id === 'plan') { const file = f.file.files[0], path = `${rid}/planta_${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;
    r = await sb.storage.from('documents').upload(path, file); if (!r.error) r = await sb.from('floorplans').insert({ residence_id: rid, title: o.title, path }); }
  else if (id === 'pt') { r = await sb.from('plan_points').insert({ ...o, residence_id: rid, floorplan_id: S.planId, x: S.pend.x, y: S.pend.y }); S.pend = null; }
  else if (id === 'newres') { r = await sb.from('residences').insert(o).select().single(); if (!r.error) { await loadRes(r.data.id); return toast('Residência cadastrada.'); } }
  else if (id === 'doc') { const file = f.file.files[0], path = `${rid}/${Date.now()}_${file.name.replace(/[^\w.-]/g, '_')}`;
    r = await sb.storage.from('documents').upload(path, file); if (!r.error) { r = await sb.from('documents').insert({ residence_id: rid, title: o.title, category: o.category, version: o.version, description: o.description, path }); } }
  if (r?.error) return toast('Não foi possível salvar: ' + r.error.message, 1);
  if (id === 'req') history.replaceState(null, '', '#assistencia');
  toast(id === 'req' ? 'Solicitação enviada.' : 'Salvo com sucesso.'); route();
});
app.addEventListener('click', async e => {
  const d = e.target.dataset;
  if (d.cn && S.carGo) { S.carHold = Date.now() + 8000; S.carGo(S.carIdx() + +d.cn); }
  if (d.cal && S.cal) { const x = new Date(S.cal.y, S.cal.m + +d.cal, 1); S.cal.y = x.getFullYear(); S.cal.m = x.getMonth(); calPaint(); }
  if (d.ct) { S.casaTab = d.ct; $('#mb').innerHTML = mediaBlock(); }
  if (d.lb) { const [g, i] = d.lb.split('|'); S.lb = { g, i: +i }; showLb(); }
  if (d.out !== undefined) sb.auth.signOut();
  if (d.print !== undefined) print();
  if (d.place !== undefined) { S.place = !S.place; S.pend = null; route(); }
  if (d.plan && S.place) { const b = e.target.getBoundingClientRect(); S.pend = { x: +((e.clientX - b.left) / b.width * 100).toFixed(2), y: +((e.clientY - b.top) / b.height * 100).toFixed(2) };
    $('#ptbox').innerHTML = `<form class="card" data-form="pt"><b>Novo ponto</b>${sel('category', 'Categoria', PT_CATS)}<label>Identificação<input name="label" required></label><label>Detalhes<textarea name="description" rows="3"></textarea></label><button>Salvar ponto</button></form>`; }
  if (d.pt) { const p = S.pts.find(x => x.id === d.pt); $('#ptbox').innerHTML = `<div class="card"><b>${esc(p.label)}</b><span class="mute">${esc(p.category)}</span><p>${esc(p.description)}</p>${staff() ? `<button class="link" data-del="plan_points:${p.id}">Excluir ponto</button>` : ''}</div>`; }
  if (d.dl) { const [p, n] = d.dl.split('|'), { data, error } = await sb.storage.from('documents').createSignedUrl(p, 60, { download: n || true }); error ? toast('Acesso negado.', 1) : window.open(data.signedUrl, '_blank', 'noopener'); }
  if (d.v3d) { const [p, n] = d.v3d.split('|'), { data, error } = await sb.storage.from('documents').createSignedUrl(p, 3600); if (error) return toast('Acesso negado.', 1); loadMV(); const lb = $('#lb'); lb.hidden = false; lb.innerHTML = `<button class="lbx" data-lbx aria-label="Fechar">×</button><model-viewer src="${esc(data.signedUrl)}" alt="${esc(n)}" camera-controls touch-action="pan-y" shadow-intensity="1" auto-rotate></model-viewer>`; }
  if (d.open) { const { data, error } = await sb.storage.from('documents').createSignedUrl(d.open, 60); error ? toast('Acesso negado.', 1) : window.open(data.signedUrl, '_blank', 'noopener'); }
  if (d.del && confirm('Excluir este registro?')) { const [t, id] = d.del.split(':'); await sb.from(t).delete().eq('id', id); route(); }
  if (d.deldoc && confirm('Excluir este documento?')) { const [id, p] = d.deldoc.split('|'); await sb.storage.from('documents').remove([p]); await sb.from('documents').delete().eq('id', id); route(); }
});

function route() {
  if (!S.profile) return;
  clearInterval(S.carTimer);
  const [h, q] = (location.hash.slice(1) || 'home').split('?'); S.nova = q === 'nova'; S.q = q || '';
  document.querySelectorAll('nav a').forEach(a => a.classList.toggle('on', (a.dataset.g || '').split(' ').includes(h)));
  $('#avatar').classList.toggle('on', h === 'mais'); refreshBell();
  if (!S.cur) return app.innerHTML = '<p class="empty">Nenhuma residência vinculada à sua conta. Fale com a Astell.</p>';
  const v = views[h] || views.home, go = location.hash;
  Promise.resolve(v()).finally(() => { if (location.hash === go) crumbs(h); });
}
// Caminho de navegação (breadcrumb) no alto de todas as telas, exceto o Início
const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
async function calEvents(rid) {   // tudo que tem data no cronograma da residência
  const [{ data: mt }, { data: sr }, { data: wr }] = await Promise.all([
    sb.from('maintenance_tasks').select('id,name,next_due,status').eq('residence_id', rid).not('next_due', 'is', null),
    sb.from('service_requests').select('id,protocol,category,status,scheduled_for').eq('residence_id', rid),
    sb.from('warranties').select('id,system,start_date,months').eq('residence_id', rid)]);
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'), ev = [];
  (mt || []).filter(x => !['Concluída', 'Cancelada'].includes(x.status || 'Pendente')).forEach(x => ev.push({ d: x.next_due, k: 'man', id: x.id, t: x.name }));
  (sr || []).filter(x => x.scheduled_for && !['Concluída', 'Encerrada'].includes(x.status)).forEach(x => ev.push({ d: x.scheduled_for, k: 'ast', id: x.id, t: `${x.category || 'Assistência'} (${x.protocol})` }));
  (wr || []).filter(x => x.start_date && x.months != null).forEach(x => { const e = addMonths(x.start_date, +x.months); if (!isNaN(e)) ev.push({ d: iso(e), k: 'gar', id: x.id, t: x.system }); });
  return ev.sort((a, b) => String(a.d).localeCompare(String(b.d)));
}
const CAL_K = { man: ['Manutenção', 'cm'], ast: ['Assistência', 'ca'], gar: ['Garantia', 'cg'] };
function calPaint() {
  const { y, m, ev } = S.cal, el = $('#cal'); if (!el) return;
  const pre = y + '-' + String(m + 1).padStart(2, '0') + '-', first = new Date(y, m, 1).getDay(), nd = new Date(y, m + 1, 0).getDate(), t = new Date(), hoje = t.getFullYear() === y && t.getMonth() === m ? t.getDate() : 0;
  const by = {}; ev.filter(e => String(e.d).startsWith(pre)).forEach(e => (by[+String(e.d).slice(8, 10)] = by[+String(e.d).slice(8, 10)] || []).push(e));
  let cells = ''; for (let i = 0; i < first; i++) cells += '<span class="cd0"></span>';
  for (let d = 1; d <= nd; d++) cells += `<span class="cday${d === hoje ? ' hoje' : ''}${by[d] ? ' has' : ''}"><b>${d}</b>${by[d] ? `<i class="dots2">${[...new Set(by[d].map(e => e.k))].map(k => `<u class="${CAL_K[k][1]}"></u>`).join('')}</i>` : ''}</span>`;
  const list = Object.keys(by).map(Number).sort((a, b) => a - b).flatMap(d => by[d].map(e => ({ ...e, day: d })));
  const msg = e => { const dd = String(e.day).padStart(2, '0') + '/' + String(m + 1).padStart(2, '0'); return e.k === 'man' ? `Dia <b>${dd}</b>: deve ser feita a manutenção <b>${esc(e.t)}</b>.` : e.k === 'ast' ? `Dia <b>${dd}</b>: será atendida a assistência <b>${esc(e.t)}</b>.` : `Dia <b>${dd}</b>: expira a garantia de <b>${esc(e.t)}</b>.`; };
  el.innerHTML = `<div class="calhead"><button type="button" data-cal="-1" aria-label="Mês anterior">‹</button><b>${MESES[m]} ${y}</b><button type="button" data-cal="1" aria-label="Próximo mês">›</button></div>
  <div class="calgrid">${['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(x => `<span class="cwd">${x}</span>`).join('')}${cells}</div>
  <div class="callegend">${Object.values(CAL_K).map(([l, c]) => `<span><u class="${c}"></u>${l}</span>`).join('')}</div>
  <h3>Avisos de ${MESES[m].toLowerCase()}</h3>${list.length ? list.map(e => `<a class="card calnote" href="#detalhe?${e.k}:${e.id}"><u class="${CAL_K[e.k][1]}"></u><p>${msg(e)}</p>${ico(IC.chev)}</a>`).join('') : '<p class="empty">Nada agendado para este mês.</p>'}`;
}
const CR = { midias: [['casa', 'Minha Casa'], ['', 'Mídias']], cronograma: [['casa', 'Minha Casa'], ['', 'Cronograma']], casa: [['casa', 'Minha Casa']], estrutura: [['casa', 'Minha Casa'], ['', 'Estrutura']], sistemas: [['casa', 'Minha Casa'], ['', 'Instalações']], materiais: [['casa', 'Minha Casa'], ['', 'Materiais']], garantias: [['casa', 'Minha Casa'], ['', 'Garantias']], manutencao: [['casa', 'Minha Casa'], ['', 'Manutenção']], equipamentos: [['casa', 'Minha Casa'], ['', 'Equipamentos']], planta: [['casa', 'Minha Casa'], ['', 'Planta técnica']], documentos: [['documentos', 'Documentos']], assistencia: [['assistencia', 'Suporte']], mais: [['mais', 'Perfil']] };
function crumbs(h) {
  const c = h === 'detalhe' ? [['casa', 'Minha Casa'], ['cronograma', 'Cronograma'], ['', 'Detalhe']] : h === 'assistencia' && S.nova ? [['assistencia', 'Suporte'], ['', 'Nova solicitação']] : CR[h]; if (!c || !app.firstElementChild || app.querySelector('.crumbs')) return;
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

// logo cadastrada no painel (menu Logo); sem ela, continua o texto ASTELL
async function loadLogo() {
  try {
    const { data } = await sb.from('app_settings').select('value').eq('key', 'logo_url').maybeSingle(); if (!data || !data.value) return;
    $('#top').classList.add('haslogo'); document.querySelectorAll('.logo').forEach(el => { const sp = (/<span[\s\S]*<\/span>/.exec(el.innerHTML) || [''])[0]; el.innerHTML = `<img class="logoimg" src="${esc(String(data.value).replace('/upload/', '/upload/w_360,c_limit,q_auto,f_auto/'))}" alt="Astell">${sp}`; });
  } catch (e) { /* sem logo: fica o texto */ }
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
  loadLogo();
  await loadRes();
}
sb.auth.getSession().then(({ data }) => start(data.session));
sb.auth.onAuthStateChange((ev, s) => { if (ev === 'SIGNED_IN' && S.profile && s && S.profile.id === s.user.id) return;
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
addEventListener('input', e => { const t = e.target; if (t.matches && t.matches('input[data-nonneg]') && t.value !== '' && !/^\d+$/.test(t.value)) t.value = t.value.replace(/\D/g, ''); });
