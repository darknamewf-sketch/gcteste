/* GC Studio Mobile — Vale TV | app.js
   Seções: 1 Config • 2 Geometria/margens • 3 Animação • 4 Desenho • 5 Loop • 6 UI • 7 Exportação */
(() => {
'use strict';
const $ = id => document.getElementById(id);
const c = $('canvas'), ctx = c.getContext('2d', { alpha: true });
const v = id => { const e = $(id); return e.type === 'checkbox' ? e.checked : e.value; };
const num = id => Number(v(id));
const say = m => { $('status').textContent = m; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));

/* ===== 1. CONFIGURAÇÃO ===== */
const FIELDS = ['template','ratio','safe','showGuides','headline','sub','tagline','style','position','offsetX','offsetY','primary','accent','scale','duration','tIn','tOut','animIn','animOut','idle','quality','bgMode','bgColor','showAccent','showBadge','showLogoText'];
const ANIMS = [['slide','Deslizar da esquerda'],['slideR','Deslizar da direita'],['fade','Aparecer / desaparecer'],['rise','Subir / descer'],['zoom','Zoom suave'],['wipe','Revelar (cortina)'],['none','Sem animação']];
const TEMPLATES = {
 'vale-news':   {headline:'NOME DO APRESENTADOR',sub:'JORNALISTA • VALE TV',tagline:'AO VIVO',style:'news',position:'bottom',primary:'#0879d9',accent:'#42c5ff',showAccent:true,showBadge:true,animIn:'slide',animOut:'slide',idle:'none',safe:'auto'},
 'vale-urgent': {headline:'PLANTÃO VALE TV',sub:'ACOMPANHE AS ÚLTIMAS NOTÍCIAS',tagline:'URGENTE',style:'breaking',position:'bottom',primary:'#d71932',accent:'#ffcc36',showAccent:true,showBadge:true,animIn:'wipe',animOut:'fade',idle:'pulse',safe:'auto'},
 'vale-sport':  {headline:'DESTAQUE ESPORTIVO',sub:'RESULTADOS • ANÁLISES • AO VIVO',tagline:'ESPORTES',style:'sport',position:'bottom',primary:'#0b263c',accent:'#00d8a4',showAccent:true,showBadge:true,animIn:'slideR',animOut:'slideR',idle:'shine',safe:'auto'},
 'vale-minimal':{headline:'NOME E SOBRENOME',sub:'CARGO • VALE TV',tagline:'',style:'minimal',position:'bottom',primary:'#123c65',accent:'#55c8ff',showAccent:false,showBadge:false,animIn:'fade',animOut:'fade',idle:'none',safe:'auto'},
 'social':      {headline:'ACONTECE NA REGIÃO',sub:'INFORMAÇÃO EM TEMPO REAL',tagline:'VALE TV',style:'social',position:'bottom',primary:'#0b4c93',accent:'#ffd23f',showAccent:true,showBadge:true,animIn:'rise',animOut:'rise',idle:'none',safe:'reels',ratio:'portrait'}};
const DEFAULTS = Object.assign({}, TEMPLATES['vale-news'], {template:'vale-news',ratio:'landscape',showGuides:false,offsetX:0,offsetY:0,scale:100,duration:5,tIn:0.8,tOut:0.8,quality:8,bgMode:'transparent',bgColor:'#00ff00',showLogoText:true});

/* Margens de segurança [esq, dir, topo, base] em fração do quadro (valores aproximados).
   L = 16:9, P = 9:16. Nos modos de redes sociais, 16:9 usa a margem de TV. */
const TVL = [.05,.05,.05,.05];
const SAFE = {
 tv:{L:TVL,P:TVL}, youtube:{L:[.04,.04,.05,.12],P:[.06,.06,.10,.22]},
 reels:{L:TVL,P:[.06,.06,.13,.20]}, shorts:{L:TVL,P:[.06,.06,.10,.22]}, stories:{L:TVL,P:[.06,.06,.14,.14]}};

/* ===== 2. GEOMETRIA E MARGENS ===== */
function safeRect(W, H) {
  const vert = H > W; let k = v('safe');
  if (k === 'none') return { x:0, y:0, w:W, h:H };
  if (k === 'auto') k = vert ? 'reels' : 'tv';
  const [l, r, t, b] = SAFE[k][vert ? 'P' : 'L'];
  return { x:W*l, y:H*t, w:W*(1-l-r), h:H*(1-t-b) };
}
/* Caixa do GC já limitada à área segura, com ajuste fino X/Y. */
function geometry(W, H) {
  const s = num('scale') / 100, vert = H > W, sf = safeRect(W, H);
  const w = Math.min((vert ? W*.88 : W*.72) * s, sf.w);
  const h = Math.min((vert ? H*.105 : H*.145) * s, H*.28, sf.h);
  const pad = (v('showBadge') && v('tagline')) ? h*.25*.35 : 0; // espaço do selo acima da caixa
  let x = sf.x + (sf.w - w)/2, y;
  const pos = v('position');
  y = pos === 'top' ? sf.y + pad : pos === 'center' ? sf.y + (sf.h - h)/2 : sf.y + sf.h - h;
  x = clamp(x + num('offsetX')/100*W, 0, W - w);
  y = clamp(y + num('offsetY')/100*H, 0, H - h);
  return { x, y, w, h, s };
}

/* ===== 3. ANIMAÇÃO E LINHA DO TEMPO ===== */
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
/* Tempos em segundos; entrada+saída nunca passam da duração total. */
function timing() {
  const total = num('duration'); let a = num('tIn'), o = num('tOut');
  const lim = Math.max(.2, total - .2);
  if (a + o > lim) { const k = lim/(a + o); a *= k; o *= k; }
  return { total, a, o };
}
/* Fase no instante t: p = progresso de visibilidade (0 invisível → 1 pleno). */
function phaseAt(t) {
  const T = timing();
  if (t < T.a) return { phase:'in', p:easeOut(t/T.a) };
  if (t > T.total - T.o) return { phase:'out', p:easeOut((T.total - t)/T.o) };
  return { phase:'hold', p:1 };
}
function motion(kind, p, b, W) {
  const m = { dx:0, dy:0, sc:1, al:1, clip:1 };
  switch (kind) {
    case 'slide':  m.dx = -(1-p)*(b.x + b.w); break;
    case 'slideR': m.dx = (1-p)*(W - b.x); break;
    case 'fade':   m.al = p; break;
    case 'rise':   m.dy = (1-p)*b.h*1.6; m.al = p; break;
    case 'zoom':   m.sc = .85 + .15*p; m.al = p; break;
    case 'wipe':   m.clip = p; break;
  }
  return m;
}

/* ===== 4. DESENHO ===== */
let logo = null;
function rrPath(x, y, w, h, r) { // retângulo arredondado compatível com Safari antigo (sem roundRect)
  ctx.beginPath(); ctx.moveTo(x+r, y); ctx.arcTo(x+w, y, x+w, y+h, r); ctx.arcTo(x+w, y+h, x, y+h, r);
  ctx.arcTo(x, y+h, x, y, r); ctx.arcTo(x, y, x+w, y, r); ctx.closePath();
}
const fillRR = (x, y, w, h, r) => { rrPath(x, y, w, h, r); ctx.fill(); };
/* Manchete: reduz a fonte até 72%; se ainda não couber, quebra em até 2 linhas. */
function headlineLayout(text, avail, base) {
  const font = f => `850 ${f}px system-ui,sans-serif`;
  let f = base; ctx.font = font(f);
  while (ctx.measureText(text).width > avail && f > base*.72) { f -= 2; ctx.font = font(f); }
  if (ctx.measureText(text).width <= avail) return { lines:[text], f };
  f = Math.round(base*.72); ctx.font = font(f);
  const rest = text.split(/\s+/), l1 = [];
  while (rest.length && ctx.measureText(l1.concat(rest[0]).join(' ')).width <= avail) l1.push(rest.shift());
  if (!l1.length) l1.push(rest.shift());
  let l2 = rest.join(' ');
  if (ctx.measureText(l2).width > avail) { while (l2.length > 1 && ctx.measureText(l2 + '…').width > avail) l2 = l2.slice(0,-1); l2 += '…'; }
  return { lines:[l1.join(' '), l2].filter(Boolean), f };
}
function drawBox(b, m, t, phase, W, H) {
  const { x, y, w, h, s } = b, primary = v('primary'), accent = v('accent'), style = v('style');
  ctx.save(); ctx.globalAlpha = clamp(m.al);
  if (m.clip < 1) { ctx.beginPath(); ctx.rect(x - 20*s, 0, (w + 40*s)*m.clip, H); ctx.clip(); }
  ctx.translate(m.dx + x + w/2, m.dy + y + h/2); ctx.scale(m.sc, m.sc); ctx.translate(-(x + w/2), -(y + h/2));
  // Placa de fundo com sombra
  ctx.shadowColor = 'rgba(0,0,0,.30)'; ctx.shadowBlur = 26*s; ctx.shadowOffsetY = 10*s;
  ctx.fillStyle = {breaking:'#8e1020', sport:'#071522', minimal:'rgba(9,20,34,.92)', social:'#081c38'}[style] || '#071c35';
  fillRR(x, y, w, h, 20*s); ctx.shadowColor = 'transparent';
  // Painel colorido inclinado (lado do logotipo)
  const r = 18*s; ctx.fillStyle = primary; ctx.beginPath(); ctx.moveTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.lineTo(x + w*.29, y); ctx.lineTo(x + w*.235, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.closePath(); ctx.fill();
  // Linha de destaque (pulsa na permanência, se escolhido)
  if (v('showAccent')) {
    ctx.save(); if (v('idle') === 'pulse' && phase === 'hold') ctx.globalAlpha *= .65 + .35*Math.sin(t*5);
    ctx.fillStyle = accent; ctx.fillRect(x, y + h - 9*s, w, 9*s); ctx.restore();
  }
  // Brilho deslizante (somente na permanência)
  if (v('idle') === 'shine' && phase === 'hold') {
    ctx.save(); rrPath(x, y, w, h, 20*s); ctx.clip();
    const gx = x + (((t % 3)/3)*1.6 - .3)*w, gw = w*.18, g = ctx.createLinearGradient(gx, 0, gx + gw, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(.5, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(gx, y, gw, h); ctx.restore();
  }
  // Textos
  const tx = x + w*.275, avail = w*.68;
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = '#fff';
  const L = headlineLayout(v('headline') || 'SUA MANCHETE', avail, Math.round(h*(H > W ? .25 : .29)));
  ctx.font = `850 ${L.f}px system-ui,sans-serif`;
  const two = L.lines.length > 1;
  L.lines.forEach((ln, i) => ctx.fillText(ln, tx, y + h*(two ? .26 + i*.24 : .39), avail));
  ctx.fillStyle = '#d8efff'; ctx.font = `650 ${Math.round(h*.155)}px system-ui,sans-serif`;
  ctx.fillText(v('sub') || '', tx, y + h*(two ? .80 : .72), avail);
  // Logotipo (PNG transparente preservado) ou marca de texto
  if (logo) {
    const maxW = w*.16, maxH = h*.7, ratio = logo.width/logo.height;
    let lw = Math.min(maxW, maxH*ratio), lh = lw/ratio; if (lh > maxH) { lh = maxH; lw = lh*ratio; }
    ctx.drawImage(logo, x + w*.045, y + (h - lh)/2, lw, lh);
  } else if (v('showLogoText')) {
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.font = `950 ${Math.round(h*.22)}px system-ui,sans-serif`; ctx.fillText('VALE', x + w*.13, y + h*.43);
    ctx.font = `800 ${Math.round(h*.13)}px system-ui,sans-serif`; ctx.fillText('TV', x + w*.13, y + h*.65);
  }
  // Selo
  const tag = v('tagline');
  if (v('showBadge') && tag) {
    ctx.font = `900 ${Math.round(h*.12)}px system-ui,sans-serif`;
    const bw = Math.max(w*.13, ctx.measureText(tag).width + 34*s), bh = h*.25, bx = x + w - bw - 18*s, by = y - bh*.35;
    ctx.fillStyle = accent; fillRR(bx, by, bw, bh, 9*s);
    ctx.fillStyle = '#07111f'; ctx.textAlign = 'center'; ctx.fillText(tag, bx + bw/2, by + bh/2, bw - 12*s);
  }
  ctx.restore();
}
function drawGuides(W, H) { // apenas na prévia; nunca exportado
  const sf = safeRect(W, H); ctx.save(); ctx.strokeStyle = '#ff2d55'; ctx.lineWidth = Math.max(2, W/640);
  ctx.setLineDash([14, 10]); ctx.strokeRect(sf.x, sf.y, sf.w, sf.h);
  ctx.setLineDash([]); ctx.beginPath(); ctx.moveTo(W/2, 0); ctx.lineTo(W/2, H); ctx.moveTo(0, H/2); ctx.lineTo(W, H/2);
  ctx.globalAlpha = .35; ctx.stroke(); ctx.restore();
}
/* Renderiza o quadro no instante t. o.bg = cor sólida ou null (transparente). */
function render(t, o) {
  const W = c.width, H = c.height; ctx.clearRect(0, 0, W, H);
  if (o.bg) { ctx.fillStyle = o.bg; ctx.fillRect(0, 0, W, H); }
  const b = geometry(W, H), ph = phaseAt(t);
  drawBox(b, motion(v(ph.phase === 'out' ? 'animOut' : 'animIn'), ph.p, b, W), t, ph.phase, W, H);
  if (o.guides) drawGuides(W, H);
}

/* ===== 5. LOOP DE ANIMAÇÃO (um único requestAnimationFrame) ===== */
let mode = 'play', t0 = performance.now(), pausedT = 0, lastT = 0, last = 0, dirty = true;
let recorder = null, recT0 = 0, stopping = false, prevMode = 'play';
const bgValue = () => ({ transparent:null, green:'#00ff00', black:'#000000', custom:v('bgColor') }[v('bgMode')]);
function frame(now) {
  requestAnimationFrame(frame);
  const T = timing(); let t;
  if (mode === 'rec') { t = (now - recT0)/1000; if (t >= T.total) { t = T.total; finishRec(); } }
  else if (mode === 'play') { if (!dirty && now - last < 30) return; t = ((now - t0)/1000) % T.total; } // ~30 fps na prévia poupa o celular
  else { if (!dirty) return; t = pausedT; }
  last = now; dirty = false; lastT = t;
  render(t, { guides: v('showGuides') && mode !== 'rec', bg: mode === 'rec' ? bgValue() : null });
  $('scrub').value = t; $('tlTime').textContent = t.toFixed(1) + ' s / ' + T.total.toFixed(1) + ' s';
  $('tlPhase').textContent = { in:'Entrada', hold:'Permanência', out:'Saída' }[phaseAt(t).phase];
}

/* ===== 6. INTERFACE ===== */
function fitCanvas() {
  const vert = v('ratio') === 'portrait';
  c.width = vert ? 1080 : 1920; c.height = vert ? 1920 : 1080;
  $('preview').classList.toggle('vertical', vert); dirty = true;
}
function refresh() { // rótulos, linha do tempo e acessibilidade
  document.querySelectorAll('[data-val]').forEach(e => { e.textContent = v(e.dataset.val) + e.dataset.unit; });
  const T = timing(), a = T.a/T.total*100, b = (T.total - T.o)/T.total*100;
  $('tlbar').style.background = `linear-gradient(90deg,#39b6ff 0 ${a}%,#2ecc8f ${a}% ${b}%,#ff9f43 ${b}% 100%)`;
  $('scrub').max = T.total;
  c.setAttribute('aria-label', 'Prévia do GC: ' + v('headline') + ' — ' + v('sub'));
  dirty = true;
}
function applyValues(o) {
  if (o.animation && !o.animIn) { o.animIn = o.animation; o.animOut = o.animation; } // configs antigas (v2)
  FIELDS.forEach(k => {
    if (!(k in o)) return; const e = $(k), val = o[k];
    if (e.type === 'checkbox') e.checked = !!val;
    else if (e.type === 'color') { if (/^#[0-9a-f]{6}$/i.test(val)) e.value = val; }
    else { const prev = e.value; e.value = val; if (e.tagName === 'SELECT' && e.value !== String(val)) e.value = prev; }
  });
  fitCanvas(); refresh();
}
function download(blob, name) {
  const u = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000);
}
function loadLogo(f) {
  if (!f) return;
  if (!/^image\//.test(f.type)) return say('Arquivo inválido: escolha uma imagem (PNG transparente recomendado).');
  if (f.size > 10e6) return say('Logotipo muito grande (máximo 10 MB).');
  const u = URL.createObjectURL(f), im = new Image();
  im.onload = () => {
    URL.revokeObjectURL(u); let w = im.naturalWidth, h = im.naturalHeight;
    if (!w || !h) return say('Não foi possível ler as dimensões do logotipo.');
    if (Math.max(w, h) > 1024) { // reduz imagens enormes para manter o desempenho (mantém o alfa)
      const k = 1024/Math.max(w, h), cv = document.createElement('canvas'); cv.width = Math.round(w*k); cv.height = Math.round(h*k);
      cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); logo = cv;
    } else logo = im;
    dirty = true; say(f.type === 'image/png' ? 'Logotipo carregado.' : 'Logotipo carregado. Dica: PNG com fundo transparente dá o melhor resultado.');
  };
  im.onerror = () => { URL.revokeObjectURL(u); say('Não foi possível abrir o logotipo.'); };
  im.src = u;
}
function init() {
  ['animIn', 'animOut'].forEach(id => { $(id).innerHTML = ANIMS.map(([k, n]) => `<option value="${k}">${n}</option>`).join(''); });
  FIELDS.forEach(id => $(id).addEventListener('input', () => { if (id === 'ratio') fitCanvas(); refresh(); }));
  $('template').addEventListener('change', () => { applyValues(TEMPLATES[v('template')]); say('Modelo aplicado.'); });
  $('logo').addEventListener('change', e => { loadLogo(e.target.files && e.target.files[0]); });
  $('clearLogo').onclick = () => { logo = null; $('logo').value = ''; dirty = true; say('Logotipo removido.'); };
  $('play').onclick = () => { mode = 'play'; t0 = performance.now(); $('pause').textContent = '⏸ Pausar'; say('Reproduzindo.'); };
  $('pause').onclick = () => {
    if (mode === 'pause') { mode = 'play'; t0 = performance.now() - pausedT*1000; $('pause').textContent = '⏸ Pausar'; }
    else if (mode === 'play') { pausedT = lastT; mode = 'pause'; dirty = true; $('pause').textContent = '▶ Continuar'; }
  };
  $('scrub').addEventListener('input', e => { if (mode === 'rec') return; mode = 'pause'; pausedT = Number(e.target.value); $('pause').textContent = '▶ Continuar'; dirty = true; });
  $('png').onclick = exportPNG; $('webm').onclick = exportVideo;
  $('reset').onclick = () => { applyValues(DEFAULTS); logo = null; $('logo').value = ''; t0 = performance.now(); say('Modelo Vale TV restaurado.'); };
  $('saveSettings').onclick = () => {
    download(new Blob([JSON.stringify({ version:3, settings:Object.fromEntries(FIELDS.map(id => [id, v(id)])) }, null, 2)], { type:'application/json' }), 'gc-studio-config.json');
    say('Configuração JSON salva (o logotipo não é incluído).');
  };
  $('loadSettings').onclick = () => $('settingsFile').click();
  $('settingsFile').addEventListener('change', e => {
    const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader();
    r.onload = () => { try { const d = JSON.parse(r.result); applyValues(Object.assign({}, d.settings || d)); say('Configuração carregada.'); } catch (err) { say('Arquivo de configuração inválido.'); } };
    r.onerror = () => say('Não foi possível ler o arquivo.'); r.readAsText(f); e.target.value = '';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'rec') say('Mantenha esta aba aberta e visível durante a gravação.'); });
  showCaps(); applyValues(DEFAULTS);
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) { pausedT = timing().total/2; mode = 'pause'; $('pause').textContent = '▶ Continuar'; }
  requestAnimationFrame(frame);
}

/* ===== 7. EXPORTAÇÃO ===== */
const MIME_ALPHA = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
const MIME_SOLID = ['video/mp4;codecs=avc1', 'video/mp4'].concat(MIME_ALPHA);
const canRec = () => !!(window.MediaRecorder && c.captureStream);
const supp = m => canRec() && MediaRecorder.isTypeSupported(m);
function showCaps() { // a API não informa alfa com certeza: ele é verificado depois da gravação
  const y = b => b ? 'sim' : 'não';
  $('caps').textContent = 'Capacidades deste navegador — gravação de vídeo: ' + y(canRec()) + ' • WebM VP9: ' + y(supp('video/webm;codecs=vp9')) +
    ' • WebM VP8: ' + y(supp('video/webm;codecs=vp8')) + ' • MP4: ' + y(supp('video/mp4')) +
    ' • Transparência em vídeo: não dá para confirmar antes; o app testa o arquivo gerado.';
}
function exportPNG() {
  const T = timing(); render(T.a + (T.total - T.a - T.o)/2, { guides:false, bg:null }); // quadro em plena permanência
  c.toBlob(b => {
    dirty = true; if (!b) return say('Não foi possível criar o PNG neste navegador.');
    download(b, 'gc-transparente-' + v('ratio') + '.png'); say('PNG transparente salvo.');
  }, 'image/png');
}
function exportVideo() {
  if (mode === 'rec') return;
  if (!canRec()) return say('Este navegador não oferece gravação de vídeo. Use Chrome/Edge atualizado ou salve PNG.');
  const solid = v('bgMode') !== 'transparent', mime = (solid ? MIME_SOLID : MIME_ALPHA).find(supp);
  if (!mime) return say('Nenhum formato de vídeo suportado neste navegador.');
  let stream, chunks = [];
  try { stream = c.captureStream(30); recorder = new MediaRecorder(stream, { mimeType:mime, videoBitsPerSecond:num('quality')*1e6 }); }
  catch (e) { if (stream) stream.getTracks().forEach(t => t.stop()); return say('Falha ao iniciar a gravação neste aparelho.'); }
  recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
  recorder.onerror = () => say('Erro durante a gravação.');
  recorder.onstop = async () => {
    stream.getTracks().forEach(t => t.stop()); mode = prevMode; t0 = performance.now(); stopping = false; recorder = null; $('webm').disabled = false; dirty = true;
    const blob = new Blob(chunks, { type:mime }), ext = mime.includes('mp4') ? 'mp4' : 'webm';
    download(blob, 'gc-vale-tv-' + v('ratio') + (solid ? '-fundo' : '') + '.' + ext);
    if (solid) return say('Vídeo ' + ext.toUpperCase() + ' com fundo sólido exportado. Remova a cor no editor (Chroma Key).');
    say('Vídeo exportado. Verificando transparência…');
    const a = await probeAlpha(blob);
    say(a === true ? 'WebM exportado com canal alfa detectado. Confirme no seu editor antes de usar em produção.'
      : a === false ? 'Atenção: este navegador gravou o vídeo SEM transparência. Use "Fundo do vídeo" → Verde chroma, ou o PNG.'
      : 'WebM exportado. Não foi possível verificar o alfa automaticamente; teste no seu editor ou use fundo sólido.');
  };
  prevMode = mode === 'rec' ? 'play' : mode; stopping = false; $('webm').disabled = true;
  render(0, { guides:false, bg:bgValue() }); recT0 = performance.now(); mode = 'rec'; recorder.start();
  say('Gravando ' + timing().total + ' s em ' + (v('ratio') === 'portrait' ? '9:16' : '16:9') + '. Mantenha a aba aberta…');
  setTimeout(() => { if (recorder && recorder.state === 'recording') finishRec(); }, timing().total*1000 + 1500); // segurança
}
function finishRec() { if (stopping || !recorder) return; stopping = true; if (recorder.state === 'recording') recorder.stop(); }
/* Decodifica o vídeo gravado e lê o alfa do canto superior esquerdo: true/false, ou null se não deu para verificar. */
function probeAlpha(blob) {
  return new Promise(res => {
    const vd = document.createElement('video'), u = URL.createObjectURL(blob); let done = false;
    const end = r => { if (done) return; done = true; URL.revokeObjectURL(u); res(r); };
    vd.muted = true; vd.playsInline = true; vd.preload = 'auto';
    vd.onerror = () => end(null); vd.onloadeddata = () => { vd.currentTime = 0.1; };
    vd.onseeked = () => {
      try { const k = document.createElement('canvas'); k.width = k.height = 1; const x = k.getContext('2d', { willReadFrequently:true });
        x.drawImage(vd, 0, 0, 8, 8, 0, 0, 1, 1); end(x.getImageData(0, 0, 1, 1).data[3] < 250); } catch (e) { end(null); }
    };
    setTimeout(() => end(null), 5000); vd.src = u;
  });
}

init();
})();
