
// ---------- Configuración ----------
const CONTACT_EMAIL = 'franciscofigff12@gmail.com';
const GITHUB_USER = 'JavierFig0';
// Repositorios que no se muestran en Proyectos (el del portafolio, porque el visitante ya está aquí)
const EXCLUDED_REPOS = [`${GITHUB_USER}.github.io`];
// Frases que se escriben solas en el inicio)
const TYPED_WORDS = ['páginas web', 'sistemas a la medida', 'apps para celular'];

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---------- Texto que se escribe y borra solo ----------
async function runTyped() {
  const el = document.getElementById('typed');
  if (reduceMotion) return;
  for (let i = 1; ; i = (i + 1) % TYPED_WORDS.length) {
    await sleep(1800);
    while (el.textContent.length) {
      el.textContent = el.textContent.slice(0, -1);
      await sleep(35);
    }
    for (const ch of TYPED_WORDS[i]) {
      el.textContent += ch;
      await sleep(60 + Math.random() * 50);
    }
  }
}
runTyped();

// ---------- Foto: si no existe img/foto-avatar.png, muestra las iniciales ----------
const avatar = document.getElementById('avatar');
const showFallback = () => {
  avatar.hidden = true;
  document.getElementById('avatar-fallback').hidden = false;
};
avatar.addEventListener('error', showFallback);
if (avatar.complete && avatar.naturalWidth === 0) showFallback();

// ---------- Imágenes de vista previa con respaldo ----------
// Cada <img class="preview-img"> prueba sus fuentes en orden (src y luego data-fallbacks, separadas por "|").
// Si ninguna carga, se oculta y queda visible el icono que está detrás.
function tryNextPreview(img) {
  const rest = (img.dataset.fallbacks || '').split('|').filter(Boolean);
  if (rest.length) {
    img.dataset.fallbacks = rest.slice(1).join('|');
    img.src = rest[0];
  } else {
    img.hidden = true;
  }
}
document.addEventListener('error', (e) => {
  if (e.target instanceof HTMLImageElement && e.target.classList.contains('preview-img')) tryNextPreview(e.target);
}, true);
// Imágenes que ya fallaron antes de que este script se cargara
document.querySelectorAll('.preview-img').forEach((img) => {
  if (img.complete && img.naturalWidth === 0) tryNextPreview(img);
});

// ---------- Proyectos desde GitHub ----------
// Busca la primera imagen del README del repositorio (ignorando insignias tipo shields.io)
async function readmeImage(r) {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${r.name}/readme`, {
      headers: { Accept: 'application/vnd.github.raw+json' },
    });
    if (!res.ok) return '';
    const md = await res.text();
    const imgPattern = /<img[^>]+src=["']([^"']+)["']|!\[[^\]]*\]\(\s*<?([^)\s>]+)/gi;
    for (const m of md.matchAll(imgPattern)) {
      const url = m[1] || m[2];
      if (/shields\.io|badge/i.test(url)) continue;
      if (/^https?:\/\//i.test(url)) return url;
      // Ruta relativa: se resuelve contra la rama principal del repositorio
      return `https://raw.githubusercontent.com/${GITHUB_USER}/${r.name}/${r.default_branch}/${url.replace(/^\.?\//, '')}`;
    }
  } catch (err) {}
  return '';
}

// Todos los lenguajes del repositorio, del que tiene más código al que tiene menos
async function repoLanguages(r) {
  try {
    const res = await fetch(r.languages_url);
    if (!res.ok) throw new Error(res.status);
    return Object.entries(await res.json()).sort((a, b) => b[1] - a[1]).map(([lang]) => lang);
  } catch (err) {
    return r.language ? [r.language] : [];
  }
}

// Imagen de cada repositorio, en orden: la primera imagen de su README, un preview.png en la raíz
// y, si no tiene ninguna, la tarjeta automática que genera GitHub.
function repoPreviewSources(r) {
  const raw = `https://raw.githubusercontent.com/${GITHUB_USER}/${r.name}/${r.default_branch}`;
  return [r.readmeImage, `${raw}/preview.png`, `https://opengraph.githubassets.com/1/${GITHUB_USER}/${r.name}`].filter(Boolean);
}

function repoCard(r) {
  const demoUrl = r.homepage || (r.has_pages ? `https://${GITHUB_USER.toLowerCase()}.github.io/${r.name}/` : '');
  const [first, ...fallbacks] = repoPreviewSources(r);
  return `
    <article class="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition hover:-translate-y-1 hover:border-accent">
      <div class="avatar-bg relative aspect-[19/10] overflow-hidden border-b border-line">
        <div class="absolute inset-0 flex items-center justify-center text-accent"><svg class="h-12 w-12 opacity-80" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12"/></svg></div>
        <img src="${esc(first)}" data-fallbacks="${esc(fallbacks.join('|'))}" alt="Vista previa de ${esc(r.name)}"
          class="preview-img relative h-full w-full object-cover object-top transition duration-500 group-hover:scale-105" />
      </div>
      <div class="flex flex-1 flex-col p-6">
      <h3 class="text-xl font-bold text-fg">${esc(r.name.replace(/[-_]/g, ' '))}</h3>
      <p class="mt-2 flex-1 text-muted">${esc(r.description || 'Proyecto personal publicado en GitHub.')}</p>
      ${r.languages.length ? `<div class="mt-5 flex flex-wrap gap-2 text-xs font-medium">${r.languages
        .map((lang) => `<span class="rounded-full border border-line px-2.5 py-1 text-muted">${esc(lang)}</span>`).join('')}</div>` : ''}
      <div class="mt-5 flex gap-3 border-t border-line pt-4 text-sm font-semibold">
        ${demoUrl ? `<a href="${esc(demoUrl)}" target="_blank" rel="noopener"
          class="flex-1 rounded-lg bg-accent py-2 text-center text-onaccent transition hover:opacity-90">Verlo en vivo</a>` : ''}
        <a href="${esc(r.html_url)}" target="_blank" rel="noopener"
          class="flex-1 rounded-lg border border-line py-2 text-center transition hover:border-accent hover:text-accent">Ver código</a>
      </div>
      </div>
    </article>`;
}

async function loadRepos() {
  const status = document.getElementById('repos-status');
  try {
    const res = await fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&per_page=100`);
    if (!res.ok) throw new Error(res.status);
    // Excluye forks, el repositorio de perfil (el que se llama igual que el usuario) y los de EXCLUDED_REPOS
    const hidden = [GITHUB_USER, ...EXCLUDED_REPOS].map((n) => n.toLowerCase());
    const repos = (await res.json())
      .filter((r) => !r.fork && !hidden.includes(r.name.toLowerCase()));
    await Promise.all(repos.map(async (r) => {
      [r.readmeImage, r.languages] = await Promise.all([readmeImage(r), repoLanguages(r)]);
    }));
    document.getElementById('repos-grid').innerHTML = repos.map(repoCard).join('');
  } catch (err) {
    status.innerHTML = `Más proyectos en <a class="font-semibold text-accent underline" href="https://github.com/${GITHUB_USER}" target="_blank" rel="noopener">mi GitHub</a>.`;
  }
}
loadRepos();

// ---------- Animaciones al hacer scroll ----------
const revealEls = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('is-visible'));
}

// ---------- Modo claro / oscuro: alterna la clase "dark" y recuerda la elección ----------
const themeBtn = document.getElementById('theme-btn');
const syncThemeLabel = () => {
  const dark = document.documentElement.classList.contains('dark');
  themeBtn.setAttribute('aria-label', dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
};
themeBtn.addEventListener('click', () => {
  const dark = document.documentElement.classList.toggle('dark');
  try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
  syncThemeLabel();
});
// Si nunca se eligió un tema a mano, sigue los cambios del sistema
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  let saved = null;
  try { saved = localStorage.getItem('theme'); } catch (err) {}
  if (!saved) {
    document.documentElement.classList.toggle('dark', e.matches);
    syncThemeLabel();
  }
});
syncThemeLabel();

// ---------- Menú: marca la sección visible ----------
const navLinks = document.querySelectorAll('.nav-link');
const sections = [...document.querySelectorAll('main section[id]')];
function markActiveSection() {
  const offset = 120; // alto de la barra + margen
  let current = '';
  for (const sec of sections) {
    if (sec.getBoundingClientRect().top <= offset) current = sec.id;
  }
  // Al llegar al final de la página, la última sección es la activa
  if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
    current = sections[sections.length - 1].id;
  }
  navLinks.forEach((link) => {
    const active = link.getAttribute('href') === '#' + current;
    if (active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}
window.addEventListener('scroll', markActiveSection, { passive: true });
window.addEventListener('resize', markActiveSection);
markActiveSection();

// ---------- Menú móvil: abrir/cerrar y cerrarlo al elegir una sección ----------
const menuBtn = document.getElementById('menu-btn');
const mobileMenu = document.getElementById('mobile-menu');
menuBtn.addEventListener('click', () => {
  mobileMenu.hidden = !mobileMenu.hidden;
  menuBtn.setAttribute('aria-expanded', String(!mobileMenu.hidden));
});
mobileMenu.querySelectorAll('a').forEach((link) =>
  link.addEventListener('click', () => {
    mobileMenu.hidden = true;
    menuBtn.setAttribute('aria-expanded', 'false');
  })
);

// ---------- Formulario: arma un mailto con los datos ingresados ----------
document.getElementById('contact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const data = new FormData(e.target);
  const body = `${data.get('mensaje')}\n\n— ${data.get('nombre')} (${data.get('email')})`;
  window.location.href =
    `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(data.get('asunto'))}&body=${encodeURIComponent(body)}`;
});

// ---------- Años de experiencia, contados desde la contratación (30 de octubre de 2023) ----------
const EXPERIENCE_START = new Date(2023, 9, 30);
const now = new Date();
let years = now.getFullYear() - EXPERIENCE_START.getFullYear();
if (now < new Date(now.getFullYear(), EXPERIENCE_START.getMonth(), EXPERIENCE_START.getDate())) years--;
document.getElementById('exp-years').textContent = years;

// ---------- Año actual en el pie de página ----------
document.getElementById('year').textContent = new Date().getFullYear();
