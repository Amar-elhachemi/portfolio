const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const touch = window.matchMedia('(pointer:coarse)').matches;

/* ================= PRELOADER (boot sequence) + GATE ================= */
document.documentElement.style.overflow = 'hidden';
(function boot(){
  const pre = document.getElementById('preloader');
  const lineEl = document.getElementById('preLine');
  const fill = document.getElementById('preFill');
  const pct = document.getElementById('prePct');
  const gate = document.getElementById('gateContent');
  const steps = [
    'establishing uplink...',
    'calibrating optics...',
    'compiling crosshair_generator.js...',
    'arming interface...',
    'target acquired.'
  ];
  let s = 0, p = 0;
  function showGate(){
    document.querySelector('.pre-term').style.display = 'none';
    gate.classList.add('show');
  }
  function tick(){
    if(reduced){ showGate(); return; }
    if(s < steps.length){
      lineEl.textContent = '> ' + steps[s];
      s++;
    }
    p = Math.min(100, p + Math.random()*28 + 12);
    fill.style.width = p + '%';
    pct.textContent = Math.floor(p) + '%';
    if(p >= 100){
      setTimeout(showGate, 300);
      return;
    }
    setTimeout(tick, 180);
  }
  tick();
})();

/* enter site: wipe transition then reveal main scroll experience */
document.getElementById('enterBtn').addEventListener('click', (e)=>{
  const btn = e.currentTarget;
  const pre = document.getElementById('preloader');
  const wipe = document.getElementById('wipe');

  // immediate press feedback so the click always reads as "registered"
  btn.classList.add('pressed');
  setTimeout(()=> btn.classList.remove('pressed'), 500);

  // fire the wipe outward from the button's actual position, not the dead center
  const r = btn.getBoundingClientRect();
  wipe.style.setProperty('--wipe-x', (r.left + r.width/2) + 'px');
  wipe.style.setProperty('--wipe-y', (r.top + r.height/2) + 'px');

  wipe.classList.add('fire');
  const revealDelay = reduced ? 250 : 550;
  const cleanupDelay = reduced ? 500 : 1400;
  setTimeout(()=>{
    pre.classList.add('hidden');
    document.documentElement.style.overflow = '';
    startHeroSequence();
  }, revealDelay);
  setTimeout(()=>{ wipe.classList.remove('fire'); }, cleanupDelay);
});

/* ================= RADAR BACKGROUND ================= */
(function radar(){
  const canvas = document.getElementById('radar');
  const ctx = canvas.getContext('2d');
  let w,h,dots=[];
  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    if(reduced) return;
    const count = Math.min(70, Math.floor((w*h)/22000));
    dots = Array.from({length:count}, ()=>({
      x: Math.random()*w, y: Math.random()*h,
      vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3,
      r: Math.random()*1.4+0.6
    }));
  }
  let mx = -1000, my = -1000;
  window.addEventListener('mousemove', e=>{ mx=e.clientX; my=e.clientY; });
  window.addEventListener('resize', resize);
  resize();
  if(reduced) return;
  const LINK_DIST = 130;
  let sweep = 0;
  function loop(){
    ctx.clearRect(0,0,w,h);
    const cx = w/2, cy = h/2;
    const maxR = Math.hypot(w,h)/1.6;

    ctx.strokeStyle = 'rgba(62,207,194,0.06)';
    ctx.lineWidth = 1;
    [0.25,0.5,0.75,1].forEach(f=>{
      ctx.beginPath(); ctx.arc(cx,cy,maxR*f,0,Math.PI*2); ctx.stroke();
    });

    sweep += 0.008;
    const steps = 46;
    for(let i=0;i<steps;i++){
      const a = sweep - i*0.012;
      const alpha = (1 - i/steps) * 0.10;
      ctx.strokeStyle = 'rgba(62,207,194,'+alpha+')';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(cx,cy);
      ctx.lineTo(cx + Math.cos(a)*maxR, cy + Math.sin(a)*maxR);
      ctx.stroke();
    }

    for(let i=0;i<dots.length;i++){
      for(let j=i+1;j<dots.length;j++){
        const a=dots[i], b=dots[j];
        const dx=a.x-b.x, dy=a.y-b.y;
        const dist = Math.hypot(dx,dy);
        if(dist < LINK_DIST){
          const alpha = (1 - dist/LINK_DIST) * 0.14;
          ctx.strokeStyle = 'rgba(62,207,194,'+alpha+')';
          ctx.lineWidth = 0.6;
          ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke();
        }
      }
    }
    dots.forEach(d=>{
      d.x += d.vx; d.y += d.vy;
      if(d.x<0) d.x=w; if(d.x>w) d.x=0;
      if(d.y<0) d.y=h; if(d.y>h) d.y=0;
      const dist = Math.hypot(d.x-mx, d.y-my);
      const pull = dist < 160 ? (160-dist)/160 : 0;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r + pull*2, 0, 7);
      ctx.fillStyle = pull>0 ? 'rgba(255,106,61,'+(0.3+pull*0.5)+')' : 'rgba(62,207,194,0.35)';
      ctx.fill();
      if(pull>0){
        ctx.strokeStyle = 'rgba(255,106,61,'+(pull*0.35)+')';
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(mx,my); ctx.stroke();
      }
    });
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ================= random logo glitch ================= */
if(!reduced){
  const logo = document.querySelector('.logo');
  setInterval(()=>{
    if(Math.random() < 0.35){ logo.classList.add('glitch'); setTimeout(()=>logo.classList.remove('glitch'), 250); }
  }, 4000);
}

/* ================= hero title periodic glitch ================= */
if(!reduced){
  const heroTitle = document.getElementById('heroTitle');
  setInterval(()=>{
    if(!heroTitle) return;
    if(Math.random() < 0.4){ heroTitle.classList.add('glitch'); setTimeout(()=>heroTitle.classList.remove('glitch'), 280); }
  }, 3400);
}

/* ================= live HUD clock + coords jitter ================= */
(function hud(){
  const clockEl = document.getElementById('hudClock');
  function tick(){
    const d = new Date();
    const t = d.toISOString().slice(11,19) + 'Z';
    if(clockEl) clockEl.textContent = t;
  }
  tick(); setInterval(tick, 1000);
})();

/* ================= scramble text reveal ================= */
function scrambleText(el, finalText, duration){
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!<>-_\\/[]{}—=+*^?#';
  const len = finalText.length;
  let frame = 0;
  const totalFrames = Math.round(duration/30);
  const iv = setInterval(()=>{
    let out = '';
    const revealCount = Math.floor((frame/totalFrames) * len);
    for(let i=0;i<len;i++){
      if(i < revealCount) out += finalText[i];
      else if(finalText[i] === ' ') out += ' ';
      else out += chars[Math.floor(Math.random()*chars.length)];
    }
    el.textContent = out;
    frame++;
    if(frame > totalFrames){ el.textContent = finalText; clearInterval(iv); }
  }, 30);
}
function startTitleScramble(){
  const p1 = document.getElementById('titlePart1');
  const acc = document.getElementById('titleAccent');
  const p2 = document.getElementById('titlePart2');
  if(p1 && acc && p2){
    const t1 = p1.textContent, ta = acc.textContent, t2 = p2.textContent;
    if(reduced) return;
    scrambleText(p1, t1, 500);
    scrambleText(acc, ta, 700);
    scrambleText(p2, t2, 600);
  }
}
function startAcquireLine(){
  const el = document.getElementById('acquireLine');
  if(!el) return;
  if(reduced){ el.textContent = '> TARGET LOCKED: AMAR ELHACHEMI CHERKI'; return; }
  const full = '> TARGET LOCKED: AMAR ELHACHEMI CHERKI';
  let i = 0;
  el.textContent = '> ACQUIRING TARGET...';
  setTimeout(()=>{
    const iv = setInterval(()=>{
      el.textContent = full.slice(0,i);
      i++;
      if(i > full.length){ clearInterval(iv); }
    }, 22);
  }, 500);
}

/* ================= progress bar ================= */
window.addEventListener('scroll', ()=>{
  const h = document.documentElement;
  const pct = (h.scrollTop)/(h.scrollHeight - h.clientHeight) * 100;
  document.getElementById('progress').style.width = pct + '%';
  document.getElementById('toTop').classList.toggle('show', h.scrollTop > 600);
});
document.getElementById('toTop').addEventListener('click', ()=> window.scrollTo({top:0, behavior: reduced ? 'auto' : 'smooth'}));

/* ================= mobile hamburger nav ================= */
(function mobileNav(){
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileNav');
  if(!toggle || !menu) return;
  function closeMenu(){
    toggle.classList.remove('open');
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open menu');
  }
  function openMenu(){
    toggle.classList.add('open');
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded','true');
    toggle.setAttribute('aria-label','Close menu');
  }
  toggle.addEventListener('click', ()=>{
    menu.classList.contains('open') ? closeMenu() : openMenu();
  });
  menu.querySelectorAll('a').forEach(a=> a.addEventListener('click', closeMenu));
  window.addEventListener('resize', ()=>{ if(window.innerWidth > 700) closeMenu(); });
})();

/* ================= custom cursor ================= */
if(!touch){
  const cc = document.getElementById('cross-cursor');
  const trail = document.getElementById('cursor-trail');
  let mx=0,my=0,cx=0,cy=0,tx=0,ty=0;

  window.addEventListener('mousemove', e=>{mx=e.clientX;my=e.clientY;});

  window.addEventListener('mousedown', e=>{
    cc.classList.add('clicked');
    setTimeout(()=>cc.classList.remove('clicked'),300);
    // spawn a glowing ripple right where the click actually landed
    const ripple = document.createElement('div');
    ripple.className = 'click-ripple';
    ripple.style.left = e.clientX + 'px';
    ripple.style.top = e.clientY + 'px';
    document.body.appendChild(ripple);
    ripple.addEventListener('animationend', ()=> ripple.remove());
  });

  // any clickable-feeling element lights the cursor up, so hover state is obvious before you click
  const HOVER_SEL = 'a, button, input, label, .card, .target, .tag, [role="button"], .copy-btn';
  document.addEventListener('mouseover', e=>{
    if(e.target.closest && e.target.closest(HOVER_SEL)){
      cc.classList.add('hover');
      trail.classList.add('hover');
    }
  });
  document.addEventListener('mouseout', e=>{
    if(e.target.closest && e.target.closest(HOVER_SEL)){
      cc.classList.remove('hover');
      trail.classList.remove('hover');
    }
  });

  function loop(){
    if(reduced){
      // skip the smoothing lag (that's the continuous "motion" reduced-motion users opt out of),
      // but still track the pointer so the glow itself stays visible
      cx = mx; cy = my; tx = mx; ty = my;
    } else {
      cx += (mx-cx)*0.35; cy += (my-cy)*0.35;   // tight crosshair follow
      tx += (mx-tx)*0.12; ty += (my-ty)*0.12;   // slower glow trail lag behind it
    }
    cc.style.left = cx+'px'; cc.style.top = cy+'px';
    trail.style.left = tx+'px'; trail.style.top = ty+'px';
    requestAnimationFrame(loop);
  }
  loop();
} else {
  document.body.style.cursor='auto';
  const trail = document.getElementById('cursor-trail');
  if(trail) trail.style.display='none';
}

const termLines = [
  { p:'$', t:'whoami' },
  { o:'amar_elhachemi — full-stack developer' },
  { p:'$', t:'cat role.txt' },
  { o:'Laravel / Python developer · EN-FR-AR translator' },
  { p:'$', t:'status --check' },
  { o:'[ok] portfolio compiled. crosshair_generator.js loaded.' },
];
function startTerminalBoot(){
  const body = document.getElementById('termBody');
  let i=0;
  function typeLine(){
    if(i>=termLines.length){ const c=document.createElement('span'); c.className='cursor-blink'; body.appendChild(c); return; }
    const l=termLines[i];
    const div=document.createElement('div'); div.className='term-line';
    if(l.p){
      div.innerHTML = '<span class="prompt">'+l.p+'</span> <span class="out"></span>';
      body.appendChild(div);
      const out=div.querySelector('.out'); let ci=0;
      const iv=setInterval(()=>{ out.textContent+=l.t[ci]; ci++; if(ci>=l.t.length){clearInterval(iv); i++; setTimeout(typeLine,150);} },26);
    } else {
      div.innerHTML = '<span class="out" style="color:var(--muted)">'+l.o+'</span>';
      body.appendChild(div); i++; setTimeout(typeLine,220);
    }
  }
  if(reduced){ body.innerHTML = termLines.map(l=> l.p? '<div class="term-line"><span class="prompt">'+l.p+'</span> <span class="out">'+l.t+'</span></div>' : '<div class="term-line"><span class="out" style="color:var(--muted)">'+l.o+'</span></div>').join(''); }
  else { typeLine(); }
}

function startHeroSequence(){
  startAcquireLine();
  startTerminalBoot();
  setTimeout(startTitleScramble, reduced ? 0 : 900);
}

/* ================= skill bars ================= */
const skillEls = document.querySelectorAll('.skill');
const io1 = new IntersectionObserver((entries)=>{ entries.forEach(e=>{ if(e.isIntersecting){ e.target.querySelector('.bar-fill').style.width = e.target.dataset.level+'%'; io1.unobserve(e.target);} }); }, {threshold:.4});
skillEls.forEach(s=>io1.observe(s));

/* ================= scroll reveals ================= */
const revealEls = document.querySelectorAll('.reveal');
const io2 = new IntersectionObserver((entries)=>{ entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io2.unobserve(e.target);} }); }, {threshold:.15});
revealEls.forEach(el=>io2.observe(el));

/* ================= target rail: active section lock-on ================= */
(function targetRail(){
  const targets = document.querySelectorAll('.target');
  const sectionMap = {};
  targets.forEach(t=>{
    const id = t.dataset.target;
    const sec = document.getElementById(id);
    if(sec) sectionMap[id] = sec;
    t.addEventListener('click', ()=>{
      const el = document.getElementById(id);
      if(el) el.scrollIntoView({behavior: reduced ? 'auto' : 'smooth'});
    });
  });
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{
      const match = document.querySelector('.target[data-target="'+e.target.id+'"]');
      if(!match) return;
      if(e.isIntersecting){
        if(!match.classList.contains('active') && !reduced){
          match.classList.add('ping');
          setTimeout(()=>match.classList.remove('ping'), 620);
        }
        match.classList.add('active');
      } else {
        match.classList.remove('active');
      }
    });
  }, {threshold:.4});
  Object.values(sectionMap).forEach(sec=>io.observe(sec));
})();

/* ================= tilt cards ================= */
if(!touch && !reduced){
  document.querySelectorAll('.card').forEach(card=>{
    card.addEventListener('mousemove', e=>{
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left)/r.width - 0.5;
      const py = (e.clientY - r.top)/r.height - 0.5;
      card.style.transform = 'rotateY('+(px*8)+'deg) rotateX('+(-py*8)+'deg) translateY(-3px)';
    });
    card.addEventListener('mouseleave', ()=>{ card.style.transform='rotateY(0) rotateX(0) translateY(0)'; });
  });
}

/* ================= magnetic buttons ================= */
if(!touch && !reduced){
  document.querySelectorAll('.btn').forEach(btn=>{
    btn.addEventListener('mousemove', e=>{
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2;
      const y = e.clientY - r.top - r.height/2;
      btn.style.transform = 'translate('+(x*0.25)+'px,'+(y*0.35)+'px)';
    });
    btn.addEventListener('mouseleave', ()=>{ btn.style.transform='translate(0,0)'; });
  });
}

/* ================= LIVE CROSSHAIR GENERATOR ================= */
const canvas = document.getElementById('xhairCanvas');
const ctx = canvas.getContext('2d');
const el = {
  color: document.getElementById('cColor'),
  length: document.getElementById('cLength'),
  thick: document.getElementById('cThick'),
  gap: document.getElementById('cGap'),
  outline: document.getElementById('cOutline'),
  alpha: document.getElementById('cAlpha'),
  dot: document.getElementById('cDot'),
  t: document.getElementById('cT'),
};
const vals = { length: document.getElementById('vLength'), thick: document.getElementById('vThick'), gap: document.getElementById('vGap'), outline: document.getElementById('vOutline'), alpha: document.getElementById('vAlpha') };
const codeOut = document.getElementById('codeOut');

function hexToRgb(hex){
  const h = hex.replace('#','');
  return { r: parseInt(h.substring(0,2),16), g: parseInt(h.substring(2,4),16), b: parseInt(h.substring(4,6),16) };
}

function drawCrosshair(){
  const W = canvas.width, H = canvas.height, cx = W/2, cy = H/2;
  ctx.clearRect(0,0,W,H);
  ctx.fillStyle = '#ffffff05';
  for(let x=20; x<W; x+=40){ for(let y=20; y<H; y+=40){ ctx.beginPath(); ctx.arc(x,y,1.2,0,7); ctx.fill(); } }

  const color = el.color.value;
  const alphaPct = parseInt(el.alpha.value)/255;
  const length = parseInt(el.length.value) * 2.2;
  const thick = parseInt(el.thick.value);
  const gapSlider = parseInt(el.gap.value);
  const gap = gapSlider * 1.8;
  const outline = parseInt(el.outline.value);
  const showDot = el.dot.checked;
  const tStyle = el.t.checked;

  ctx.globalAlpha = Math.max(alphaPct, 0.08);

  function seg(x1,y1,x2,y2){
    if(outline>0){ ctx.strokeStyle='#000'; ctx.lineWidth=thick+outline*2; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke(); }
    ctx.strokeStyle=color; ctx.lineWidth=thick; ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  }
  seg(cx-gap-length, cy, cx-gap, cy);
  seg(cx+gap, cy, cx+gap+length, cy);
  seg(cx, cy+gap, cx, cy+gap+length);
  if(!tStyle) seg(cx, cy-gap-length, cx, cy-gap);

  if(showDot){
    if(outline>0){ ctx.fillStyle='#000'; ctx.beginPath(); ctx.arc(cx,cy,thick/2+outline+1,0,7); ctx.fill(); }
    ctx.fillStyle=color; ctx.beginPath(); ctx.arc(cx,cy,thick/2+1,0,7); ctx.fill();
  }
  ctx.globalAlpha = 1;

  vals.length.textContent = el.length.value;
  vals.thick.textContent = el.thick.value;
  vals.gap.textContent = el.gap.value;
  vals.outline.textContent = el.outline.value;
  vals.alpha.textContent = el.alpha.value;

  const rgb = hexToRgb(color);
  const cs2Gap = (-(gapSlider * 0.733)).toFixed(1);
  const cs2Thick = parseFloat((thick * 0.25).toFixed(3)).toString();

  const cvars = [
    ['cl_crosshairgap', cs2Gap],
    ['cl_crosshair_outlinethickness', outline],
    ['cl_crosshaircolor_r', rgb.r],
    ['cl_crosshaircolor_g', rgb.g],
    ['cl_crosshaircolor_b', rgb.b],
    ['cl_crosshairalpha', el.alpha.value],
    ['cl_crosshair_dynamic_splitdist', 3],
    ['cl_crosshair_recoil', 'false'],
    ['cl_fixedcrosshairgap', gapSlider],
    ['cl_crosshaircolor', 5],
    ['cl_crosshair_drawoutline', outline>0 ? 'true' : 'false'],
    ['cl_crosshair_dynamic_splitalpha_innermod', 0],
    ['cl_crosshair_dynamic_splitalpha_outermod', 1],
    ['cl_crosshair_dynamic_maxdist_splitratio', 1],
    ['cl_crosshairthickness', cs2Thick],
    ['cl_crosshairdot', showDot ? 'true' : 'false'],
    ['cl_crosshairgap_useweaponvalue', 'false'],
    ['cl_crosshairusealpha', 'true'],
    ['cl_crosshair_t', tStyle ? 'true' : 'false'],
    ['cl_crosshairstyle', 4],
    ['cl_crosshairsize', el.length.value],
  ];
  codeOut.textContent = cvars.map(c => c[0]+' '+c[1]+';').join('\n');
  codeOut.classList.add('flash');
  setTimeout(()=>codeOut.classList.remove('flash'), 300);
}
Object.values(el).forEach(input => input.addEventListener('input', drawCrosshair));

/* copy config to clipboard */
const copyBtn = document.getElementById('copyBtn');
const copyLabel = document.getElementById('copyLabel');
if(copyBtn){
  copyBtn.addEventListener('click', async ()=>{
    try{
      await navigator.clipboard.writeText(codeOut.textContent);
    } catch(e){
      const ta = document.createElement('textarea');
      ta.value = codeOut.textContent; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); ta.remove();
    }
    copyBtn.classList.add('copied');
    copyLabel.textContent = 'copied';
    setTimeout(()=>{ copyBtn.classList.remove('copied'); copyLabel.textContent = 'copy config'; }, 1600);
  });
}

/* hitmarker on confirmed shot */
function hitmarker(x,y){
  if(reduced) return;
  const m = document.createElement('div');
  m.className = 'hitmarker';
  m.style.left = x+'px'; m.style.top = y+'px';
  m.innerHTML = '<i></i><i></i><i></i><i></i>';
  document.body.appendChild(m);
  setTimeout(()=>m.remove(), 400);
}

/* particle burst on randomize */
function burst(x, y, color){
  if(reduced) return;
  const c = document.createElement('canvas');
  c.width = window.innerWidth; c.height = window.innerHeight;
  c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:150;';
  document.body.appendChild(c);
  const bctx = c.getContext('2d');
  const parts = Array.from({length:26}, ()=>({
    x, y, vx:(Math.random()-0.5)*8, vy:(Math.random()-0.5)*8-2,
    life:1, r: Math.random()*3+1
  }));
  function frame(){
    bctx.clearRect(0,0,c.width,c.height);
    let alive = false;
    parts.forEach(p=>{
      if(p.life<=0) return;
      alive = true;
      p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.02;
      bctx.globalAlpha = Math.max(p.life,0);
      bctx.fillStyle = color;
      bctx.beginPath(); bctx.arc(p.x,p.y,p.r,0,7); bctx.fill();
    });
    if(alive) requestAnimationFrame(frame);
    else c.remove();
  }
  frame();
}

document.getElementById('randomize').addEventListener('click', (e)=>{
  const rand = (a,b)=> Math.floor(Math.random()*(b-a+1))+a;
  el.color.value = '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
  el.length.value = rand(4,18); el.thick.value = rand(1,6); el.gap.value = rand(0,12); el.outline.value = rand(0,3);
  el.dot.checked = Math.random()>0.5; el.t.checked = Math.random()>0.6;
  drawCrosshair();
  burst(e.clientX, e.clientY, el.color.value);
});
drawCrosshair();

/* ================= SHOOTING RANGE: click to fire ================= */
let shots = 0;
const shotCountEl = document.getElementById('shotCount');
const canvasBox = document.getElementById('canvasBox');
canvasBox.addEventListener('click', (e)=>{
  shots++;
  shotCountEl.textContent = shots;
  burst(e.clientX, e.clientY, el.color.value);
  hitmarker(e.clientX, e.clientY);
  canvasBox.classList.remove('shake');
  void canvasBox.offsetWidth; // restart animation
  canvasBox.classList.add('shake');
  setTimeout(()=>canvasBox.classList.remove('shake'), 260);
});
