(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- Truck artwork (matches the logo's green cab + yellow box) ---------- */
  const TRUCK = `
    <rect x="2" y="4" width="76" height="42" rx="4" fill="#f6b81a" stroke="#1d1a16" stroke-width="2.5"/>
    <g class="ttext"><text x="40" y="22" text-anchor="middle" font-family="Bricolage Grotesque, Arial Black" font-weight="800" font-size="12" fill="#1d1a16">TRUNKS</text>
    <text x="40" y="38" text-anchor="middle" font-family="Bricolage Grotesque, Arial Black" font-weight="800" font-size="12" fill="#1d1a16">2 BUNKS</text></g>
    <path d="M78 16 h22 l15 17 v15 h-37 z" fill="#2b4d32" stroke="#1d1a16" stroke-width="2.5" stroke-linejoin="round"/>
    <path d="M84 21 h13 l10 11 h-23 z" fill="#cfe6ee" stroke="#1d1a16" stroke-width="2"/>
    <rect x="2" y="45" width="114" height="6" rx="2" fill="#2a2a2a"/>
    <g class="wheel"><circle cx="24" cy="54" r="9" fill="#222" stroke="#555" stroke-width="2"/><path d="M24 47v14M17 54h14" stroke="#888" stroke-width="2"/></g>
    <g class="wheel"><circle cx="96" cy="54" r="9" fill="#222" stroke="#555" stroke-width="2"/><path d="M96 47v14M89 54h14" stroke="#888" stroke-width="2"/></g>
    <rect x="112" y="38" width="5" height="5" fill="#ffe680"/>`;
  $('#heroTruck').innerHTML = TRUCK;
  $('#jtruckBody').innerHTML = TRUCK;

  /* ---------- Split hero headline into animated words ---------- */
  const title = $('[data-split]');
  if (title) {
    let i = 0;
    const out = [];
    title.childNodes.forEach(n => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach(t => {
          if (!t) return;
          if (/^\s+$/.test(t)) out.push(' ');
          else out.push(`<span class="w"><span style="--i:${i++}">${t}</span></span>`);
        });
      } else {
        out.push(`<span class="w"><span class="${n.className}" style="--i:${i++}">${n.textContent}</span></span>`);
      }
    });
    title.innerHTML = out.join('');
  }

  /* ---------- Nav: scrolled state + mobile menu ---------- */
  const nav = $('#nav'), burger = $('#burger');
  burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .15, rootMargin: '0px 0px -40px 0px' });
  $$('.reveal').forEach(el => io.observe(el));

  /* ---------- Count-up numbers ---------- */
  const countIO = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      countIO.unobserve(e.target);
      const el = e.target, end = +el.dataset.count, pre = el.dataset.prefix || '';
      if (reduce || end === 0) { el.textContent = pre + end; return; }
      const t0 = performance.now(), dur = 1400;
      const tick = now => {
        const k = clamp((now - t0) / dur);
        el.textContent = pre + Math.round(end * (1 - Math.pow(1 - k, 3)));
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: .6 });
  $$('[data-count]').forEach(el => countIO.observe(el));

  /* ---------- Journey scene: build trees ---------- */
  const NS = 'http://www.w3.org/2000/svg';
  const pine = (x, y, s, fill) => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('transform', `translate(${x} ${y}) scale(${s})`);
    g.innerHTML = `<rect x="-3" y="-4" width="6" height="12" fill="#4a230f"/><path d="M0 -60 L18 -24 L9 -24 L22 -4 L-22 -4 L-9 -24 L-18 -24Z" fill="${fill}"/>`;
    return g;
  };
  let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  const back = $('#treesBack'), mid = $('#treesMid');
  for (let x = -500; x < 1700; x += 34 + rnd() * 30) back.appendChild(pine(x, 222, .7 + rnd() * .4, '#2f5a39'));
  [[-60, 330], [250, 330], [560, 335], [700, 230], [930, 330], [1000, 300], [380, 250], [620, 330], [1180, 325], [1300, 320], [-200, 320]]
    .forEach(([x, y]) => mid.appendChild(pine(x, y, 1 + rnd() * .5, '#1f4a2a')));

  /* ---------- Journey scroll logic ---------- */
  const journey = $('#how'), road = $('#road'), trail = $('#trail');
  const truck = $('#jtruck'), flip = $('#jtruckFlip'), truckSvg = $('#jtruckBody');
  const steps = $$('#steps .step'), bar = $('#journeyBar'), seasonEl = $('#season b');
  const sun = $('#sun'), mail = $('#mail'), trunksHome = $('#trunksHome'), trunksCamp = $('#trunksCamp');
  const skyA = $('.sky-stop-a'), skyB = $('.sky-stop-b');
  const roadLen = road.getTotalLength();
  const truckText = $('.ttext', truckSvg);
  trail.style.strokeDasharray = roadLen;
  const seasons = ['Spring', 'May', 'June', 'Opening day', 'August'];
  const skies = [['#86c9ea', '#eaf6ef'], ['#7cc0ea', '#f2f7e6'], ['#4ea8e0', '#d7f0fb'], ['#3f9ad8', '#cdeefa'], ['#f08a5d', '#ffd88a']];
  let lastStep = -1;

  const placeTruck = (t, reverse) => {
    const L = clamp(t) * roadLen;
    const p = road.getPointAtLength(L);
    const p2 = road.getPointAtLength(Math.min(roadLen, L + 1));
    const p0 = road.getPointAtLength(Math.max(0, L - 1));
    let ang = Math.atan2(p2.y - p0.y, p2.x - p0.x) * 180 / Math.PI;
    truck.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${ang})`);
    flip.setAttribute('transform', reverse ? 'scale(-1 1)' : '');
    truckText.setAttribute('transform', reverse ? 'translate(80 0) scale(-1 1)' : '');
    trail.style.strokeDashoffset = roadLen - L;
  };

  const updateJourney = () => {
    const r = journey.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    const step = Math.min(4, Math.floor(p * 5));
    const local = p * 5 - step; // 0..1 within the step

    // truck position: parked at home (0-.4), drive (.4-.6), parked at camp (.6-.8), drive home (.8-1)
    let t = 0, reverse = false, moving = false;
    if (step === 2) { t = local; moving = local > .02 && local < .98; }
    else if (step === 3) t = 1;
    else if (step === 4) { t = 1 - local; reverse = true; moving = local > .02 && local < .98; }
    placeTruck(t, reverse);
    truckSvg.classList.toggle('moving', moving);

    // props
    trunksHome.style.opacity = (p < .4 || p > .985) ? 1 : 0;
    trunksCamp.style.opacity = (step === 3) ? 1 : 0;
    const mailOn = step === 1;
    mail.style.opacity = mailOn ? 1 : 0;
    mail.setAttribute('transform', `translate(${80 + local * 0} ${60 + (mailOn ? local * 110 : 0)}) rotate(${mailOn ? Math.sin(local * 12) * 8 : 0})`);

    // sun arcs across the summer
    sun.setAttribute('cx', 120 + p * 900);
    sun.setAttribute('cy', 120 - Math.sin(p * Math.PI) * 70 + (step === 4 ? local * 30 : 0));
    sun.setAttribute('fill', step === 4 ? '#ffb347' : '#ffd966');
    $('#clouds').setAttribute('transform', `translate(${-p * 140} 0)`);
    $('#mtns').setAttribute('transform', `translate(${-p * 60} 0)`);
    back.setAttribute('transform', `translate(${-p * 100} 0)`);

    bar.style.transform = `scaleX(${p})`;
    if (step !== lastStep) {
      lastStep = step;
      steps.forEach((s, i) => { s.classList.toggle('active', i === step); s.classList.toggle('done', i < step); });
      seasonEl.textContent = seasons[step];
      skyA.setAttribute('stop-color', skies[step][0]);
      skyB.setAttribute('stop-color', skies[step][1]);
    }
  };

  /* ---------- Parallax + progress + nav state, one rAF loop ---------- */
  const progress = $('#progress');
  const parallax = $$('[data-parallax]');
  let ticking = false;
  const onScroll = () => {
    const y = scrollY;
    progress.style.transform = `scaleX(${clamp(y / (document.documentElement.scrollHeight - innerHeight))})`;
    nav.classList.toggle('scrolled', y > 40);
    if (!reduce) parallax.forEach(el => {
      const r = el.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      el.style.transform = `translate3d(0, ${(r.top) * -+el.dataset.parallax}px, 0)`;
    });
    updateJourney();
    ticking = false;
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll);
  addEventListener('load', onScroll);
  addEventListener('pageshow', onScroll);
  onScroll();

  /* ---------- Magnetic buttons ---------- */
  if (!reduce && matchMedia('(hover: hover)').matches) {
    $$('.magnetic').forEach(b => {
      b.addEventListener('mousemove', e => {
        const r = b.getBoundingClientRect();
        b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .25}px, ${(e.clientY - r.top - r.height / 2) * .35}px)`;
      });
      b.addEventListener('mouseleave', () => { b.style.transform = ''; });
    });

    /* tilt */
    $$('[data-tilt]').forEach(el => {
      el.style.transition = 'transform .25s';
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    /* glow cards */
    $$('[data-glow]').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    });
  }

  /* ---------- Tabs + checklists ---------- */
  const tabs = $$('.tab');
  tabs.forEach(tab => tab.addEventListener('click', () => {
    tabs.forEach(t => {
      const on = t === tab;
      t.setAttribute('aria-selected', on);
      const panel = $('#' + t.getAttribute('aria-controls'));
      panel.hidden = !on;
      panel.classList.toggle('show', on);
    });
  }));
  $$('.panel').forEach(panel => {
    const boxes = $$('input', panel), label = $('.meter span', panel), fill = $('.meter b', panel);
    boxes.forEach(b => b.addEventListener('change', () => {
      const n = boxes.filter(x => x.checked).length;
      label.textContent = `${n}/${boxes.length}`;
      fill.style.width = `${n / boxes.length * 100}%`;
      if (n === boxes.length && b.checked) confetti(panel);
    }));
  });
  function confetti(panel) {
    if (reduce) return;
    const layer = document.createElement('div');
    layer.className = 'confetti';
    const colors = ['#f6b81a', '#2b4d32', '#7a3f1d', '#3f7048', '#e2513a'];
    for (let i = 0; i < 60; i++) {
      const c = document.createElement('i');
      c.style.left = Math.random() * 100 + '%';
      c.style.background = colors[i % colors.length];
      c.style.animationDelay = Math.random() * .4 + 's';
      c.style.animationDuration = 1.2 + Math.random() * .9 + 's';
      layer.appendChild(c);
    }
    panel.appendChild(layer);
    setTimeout(() => layer.remove(), 2600);
  }

  /* ---------- Luggage tag flip ---------- */
  const lug = $('#lugTag');
  const flipTag = () => lug.classList.toggle('flipped');
  lug.addEventListener('click', flipTag);
  lug.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flipTag(); } });

  /* ---------- FAQ search ---------- */
  const qas = $$('#faqList .qa');
  qas.forEach(q => { q.dataset.html = $('.ans', q).innerHTML; q.dataset.q = $('summary', q).textContent; });
  $('#faqSearch').addEventListener('input', e => {
    const term = e.target.value.trim().toLowerCase();
    let hits = 0;
    qas.forEach(q => {
      const ans = $('.ans', q);
      ans.innerHTML = q.dataset.html;
      const match = !term || (q.dataset.q + ' ' + ans.textContent).toLowerCase().includes(term);
      q.style.display = match ? '' : 'none';
      if (match) hits++;
      if (term && match) {
        q.open = true;
        const walker = document.createTreeWalker(ans, NodeFilter.SHOW_TEXT);
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);
        const re = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        nodes.forEach(n => {
          if (!re.test(n.textContent)) return;
          const span = document.createElement('span');
          span.innerHTML = n.textContent.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(re, '<mark>$1</mark>');
          n.replaceWith(span);
        });
      } else if (!term) q.open = false;
    });
    $('#noResults').style.display = hits ? 'none' : 'block';
  });

  /* ---------- Copy email ---------- */
  const toast = $('#toast');
  $$('[data-copy]').forEach(a => a.addEventListener('click', e => {
    if (!navigator.clipboard) return;
    e.preventDefault();
    navigator.clipboard.writeText(a.dataset.copy).then(() => {
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2200);
    }, () => { location.href = a.href; });
  }));

  /* ---------- Fireflies ---------- */
  const cv = $('#fireflies');
  if (cv && !reduce) {
    const ctx = cv.getContext('2d');
    let w, h, flies = [], running = false;
    const size = () => {
      const dpr = Math.min(2, devicePixelRatio || 1);
      w = cv.offsetWidth; h = cv.offsetHeight;
      cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      flies = Array.from({ length: Math.round(w / 22) }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4, r: 1 + Math.random() * 2.2, ph: Math.random() * 6.28 }));
    };
    const draw = t => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      flies.forEach(f => {
        f.vx += (Math.random() - .5) * .04; f.vy += (Math.random() - .5) * .04;
        f.vx *= .98; f.vy *= .98;
        f.x = (f.x + f.vx + w) % w; f.y = (f.y + f.vy + h) % h;
        const a = .35 + .65 * Math.abs(Math.sin(t / 900 + f.ph));
        const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.r * 6);
        g.addColorStop(0, `rgba(255,230,120,${a})`); g.addColorStop(1, 'rgba(255,200,60,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f.x, f.y, f.r * 6, 0, 6.28); ctx.fill();
      });
      requestAnimationFrame(draw);
    };
    new IntersectionObserver(([e]) => {
      running = e.isIntersecting;
      if (running) { size(); requestAnimationFrame(draw); }
    }).observe(cv);
    addEventListener('resize', () => running && size());
  }

  $('#year').textContent = new Date().getFullYear();
})();
