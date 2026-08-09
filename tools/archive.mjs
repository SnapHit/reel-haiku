/* Builds the archive: one page per past day, an index, and the sitemap.

   Run by .github/workflows/archive.yml once a day, and by anybody with node
   and a checkout. It is idempotent and it catches up: it writes every page
   that ought to exist, not only yesterday's, so a missed run is a non event
   and running it twice changes nothing.

   The schedule is not reimplemented here. It is lifted out of index.html
   between the archive:schedule markers and run as it is, so there is one
   definition of which puzzles fall on which day and this file cannot drift
   from the game.

   Usage: node tools/archive.mjs [--today YYYY-MM-DD] [--out DIR] */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const arg = n => { const i = process.argv.indexOf(n); return i > 0 ? process.argv[i + 1] : null; };
const OUT = path.resolve(ROOT, arg('--out') || '.');
const HOME = 'https://reelhaiku.com';

/* A day is only published once it is eight days old. Trailing by a week means
   somebody catching up can never overtake the people playing daily. */
const HOLD = 8;

const html = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad = n => String(n).padStart(2, '0');
const iso = ms => { const d = new Date(ms); return d.getUTCFullYear() + '-' + pad(d.getUTCMonth()+1) + '-' + pad(d.getUTCDate()); };
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const longDate = ms => { const d = new Date(ms); return d.getUTCDate() + ' ' + MONTHS[d.getUTCMonth()] + ' ' + d.getUTCFullYear(); };

/* ---- the game, read rather than copied ---- */

const page = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const grab = (open, close) => {
  const a = page.indexOf(open), b = page.indexOf(close, a);
  if (a < 0 || b < 0) throw new Error('index.html no longer contains ' + open);
  return page.slice(a + open.length, b);
};
const CSS = grab('<style>', '</style>');
const JS = grab('<script>', '</script>');
const SCHEDULE_SRC = grab('/* archive:schedule:start */', '/* archive:schedule:end */');
/* The sheet rule the poster rewrites. Without it save as poster has nothing
   to write to and throws on the first click. */
const PAGE_RULE = page.slice(page.indexOf('<style id="pagesize">'), page.indexOf('</style>', page.indexOf('<style id="pagesize">')) + 8);

const PUZZLES = JSON.parse(fs.readFileSync(path.join(ROOT, 'puzzles.json'), 'utf8')).puzzles
  .filter(z => z.y >= 1940);

const scope = { PUZZLES, Math, Date, Number, String, Array, Object, JSON };
const load = new Function(...Object.keys(scope),
  SCHEDULE_SRC + '\n;return { EPOCH, DAY, schedule };')(...Object.values(scope));
const { EPOCH, DAY } = load;
const SCHED = load.schedule();
const DAYS = Math.floor(SCHED.length / 3);

/* ---- which days may be published ---- */

const now = arg('--today') ? Date.parse(arg('--today') + 'T12:00:00Z') : Date.now();
const todayN = Math.max(0, Math.floor((now - EPOCH) / DAY));       /* zero based */
const last = todayN - HOLD;                                        /* newest publishable, zero based */

const days = [];
for (let n = 0; n <= last; n++){
  const at = (n % DAYS) * 3;
  days.push({
    n,                                    /* zero based index into the schedule */
    number: n + 1,                        /* what the share card calls it */
    date: iso(EPOCH + n * DAY),
    pretty: longDate(EPOCH + n * DAY),
    puzzles: SCHED.slice(at, at + 3).map(i => PUZZLES[i])
  });
}
days.reverse();                                                    /* newest first */

/* ---- the pages ---- */

const HEAD = (title, desc, url, extra = '') => `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${html(title)}</title>
<meta name="description" content="${html(desc)}">
<link rel="canonical" href="${html(url)}">
<meta name="theme-color" content="#E6140F">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="article">
<meta property="og:site_name" content="Reel Haiku">
<meta property="og:title" content="${html(title)}">
<meta property="og:description" content="${html(desc)}">
<meta property="og:url" content="${html(url)}">
<meta property="og:image" content="${HOME}/og.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${html(title)}">
<meta name="twitter:description" content="${html(desc)}">
<meta name="twitter:image" content="${HOME}/og.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600&display=swap" rel="stylesheet">
<style>${CSS}${extra}</style>
${PAGE_RULE}
</head>`;

/* Read below the poster on every archive page: the three films, their years
   and all nine lines, as ordinary markup. It is what makes the page worth
   indexing, and on a day this old the answers are not a secret. */
const PROSE = `
html,body{overflow:auto;}
.read{max-width:900px;margin:0 auto;padding:0 max(18px,4.5vw) max(28px,5vh);}
.read h1{font:600 clamp(19px,4.4vw,26px) 'Archivo',sans-serif;letter-spacing:.02em;margin-bottom:.2em;}
.read .when{font-size:clamp(10px,2.4vw,12px);letter-spacing:.09em;text-transform:uppercase;opacity:.7;margin-bottom:1.6em;}
.read article{margin-bottom:1.9em;}
.read h2{font:600 clamp(14px,3.2vw,17px) 'Archivo',sans-serif;letter-spacing:.01em;margin-bottom:.5em;}
.read p{font-size:clamp(12px,2.9vw,15px);line-height:1.65;opacity:.92;}
.read .go{display:inline-block;margin-top:.6em;font-size:clamp(10px,2.4vw,12px);
  letter-spacing:.09em;text-transform:uppercase;color:inherit;}
.read nav{margin-top:2.4em;font-size:clamp(10px,2.4vw,12px);letter-spacing:.09em;text-transform:uppercase;}
.read nav a{color:inherit;margin-right:1.4em;}
.crumbs{max-width:900px;margin:0 auto;padding:max(16px,3vh) max(18px,4.5vw) 0;
  font-size:clamp(10px,2.4vw,12px);letter-spacing:.09em;text-transform:uppercase;opacity:.7;}
.crumbs a{color:inherit;}
`;

/* The poster shell, taken from index.html so an archive puzzle plays, prints
   and goes clean exactly as a daily one does. */
const SHELL = grab('<div class="poster">', '\n</div>\n\n<script>');

function dayPage(d){
  const names = d.puzzles.map(z => z.t);
  const title = `Reel Haiku day ${d.number}, ${d.pretty}`;
  const desc = `The three Reel Haiku puzzles from ${d.pretty}: ${names.join(', ')}.`;
  const url = `${HOME}/archive/${d.date}`;
  return HEAD(title, desc, url, PROSE) + `
<body>
<div class="poster">${SHELL}</div>
<div class="read">
<h1>Day ${d.number}</h1>
<p class="when">${html(d.pretty)}</p>
${d.puzzles.map((z, i) => `<article>
<h2>${html(z.t)} (${z.y})</h2>
<p>${z.l.map(html).join('<br>')}</p>
<a class="go" href="#" data-play="${i}">Play this one</a>
</article>`).join('\n')}
<nav><a href="/archive">All days</a><a href="/">Today's puzzles</a></nav>
</div>
<script>self.ARCHIVE = ${JSON.stringify({ date: d.date, number: d.number, puzzles: d.puzzles })};</script>
<script>${JS}</script>
<script>${BOOT}</script>
</body>
</html>
`;
}

/* The archive's own boot. It reuses every part of the game that plays a
   puzzle and none of the parts that keep a day: no streak, no share card, no
   countdown, and its own corner of storage, so nothing here can reach the
   daily record. */
const BOOT = `
const A = self.ARCHIVE, KEY = 'reelhaiku.archive';
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch(e){ return {}; } };
const write = s => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} };

PUZZLES = A.puzzles;
order = [0,1,2];
res = (read()[A.date] || [null,null,null]).slice();
/* So the hero never decides the day has rolled and tries to reboot it. */
today = dayNumber();

/* Replaces the daily recorder. Nothing on an archive page writes the daily
   key or the streak, because the only writer is this one. */
record = (slot, mark) => { res[slot] = mark; const s = read(); s[A.date] = res; write(s); };

/* The hero's last step is the archive rather than a share card. */
share = () => { location.href = '/archive'; };

/* No countdown here. It belongs to the day that is running. */
dayline = () => {
  hintEl.classList.remove('gone');
  if(!over){ hintEl.textContent = 'Type a film title, then choose it from the list'; return; }
  const left = res.filter(v => v === null).length;
  hintEl.textContent = left ? (left === 2 ? 'Two more on this day' : 'One more on this day')
                            : 'That is this day played. The answers are below.';
};
controls = () => {
  const done = res.every(v => v !== null);
  document.body.classList.toggle('daydone', done);
  nextBtn.textContent = done ? 'All days' : 'Next puzzle';
  nextBtn.classList.toggle('gone', !over);
};

document.querySelectorAll('[data-play]').forEach(a => a.addEventListener('click', e => {
  e.preventDefault();
  oi = +a.dataset.play;
  res[oi] = null;
  start();
  scrollTo({ top: 0, behavior: 'smooth' });
}));

fetch('/titles.json', {cache: 'no-cache'}).then(r => r.json()).then(t => {
  FILMS = t;
  oi = Math.max(0, res.indexOf(null));
  start();
}).catch(() => say('Could not load titles'));
`;

function indexPage(){
  const title = 'Reel Haiku archive';
  const desc = days.length
    ? `Every past day of Reel Haiku, ${days.length} so far, each with three film haiku and their answers.`
    : 'Past days of Reel Haiku will appear here, a week after they are played.';
  const url = `${HOME}/archive`;
  const body = days.length
    ? `<ul class="days">${days.map(d => `<li><a href="/archive/${d.date}"><b>Day ${d.number}</b>` +
        `<span>${html(d.pretty)}</span></a><em>${html(d.puzzles.map(z => z.t).join(', '))}</em></li>`).join('')}</ul>`
    : `<p class="none">Nothing here yet. A day joins the archive a week after it is played,
        so the first one arrives on ${html(longDate(EPOCH + HOLD * DAY))}.</p>`;
  return HEAD(title, desc, url, PROSE + `
.days{list-style:none;}
.days li{padding:1.05em 0;border-bottom:1px solid rgba(255,255,255,.22);}
.days a{color:inherit;display:flex;gap:.9em;align-items:baseline;text-decoration:none;}
.days b{font:600 clamp(13px,3vw,16px) 'Archivo',sans-serif;letter-spacing:.02em;}
.days span{font-size:clamp(10px,2.4vw,12px);letter-spacing:.09em;text-transform:uppercase;opacity:.7;}
.days em{display:block;font-style:normal;font-size:clamp(11px,2.7vw,13px);opacity:.72;margin-top:.35em;}
.none{font-size:clamp(12px,2.9vw,15px);line-height:1.65;opacity:.92;max-width:34em;}
`) + `
<body style="background:#E6140F">
<div class="crumbs"><a href="/">Reel Haiku</a></div>
<div class="read">
<h1>The archive</h1>
<p class="when">${days.length ? days.length + (days.length === 1 ? ' day' : ' days') : 'Empty for now'}</p>
${body}
<nav><a href="/">Today's puzzles</a></nav>
</div>
</body>
</html>
`;
}

function sitemap(){
  const url = (loc, mod) => `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${mod}</lastmod>\n  </url>`;
  const today = iso(now);
  const rows = [url(HOME + '/', today), url(HOME + '/archive', today)]
    .concat(days.map(d => url(`${HOME}/archive/${d.date}`, d.date)));
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join('\n')}\n</urlset>\n`;
}

/* ---- write only what changed, so a run with nothing to do is a no op ---- */

let wrote = 0;
const put = (rel, body) => {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && fs.readFileSync(file, 'utf8') === body) return;
  fs.writeFileSync(file, body);
  wrote++;
  console.log('wrote ' + rel);
};

for (const d of days) put(`archive/${d.date}/index.html`, dayPage(d));
put('archive/index.html', indexPage());
put('sitemap.xml', sitemap());
put('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${HOME}/sitemap.xml\n`);

/* A day inside the held back week has no page, so the file is simply not
   there and the content cannot leak. This gives that a civil answer rather
   than a bare 404. It only shows if not_found_handling is set to 404-page on
   the Cloudflare side; without that the request still fails closed. */
put('404.html', HEAD('Not in the archive', 'That page is not in the Reel Haiku archive.',
  HOME + '/archive', PROSE) + `
<body style="background:#E6140F">
<div class="crumbs"><a href="/">Reel Haiku</a></div>
<div class="read">
<h1>Not in the archive</h1>
<p class="when">Nothing here</p>
<p>A day joins the archive a week after it is played, so the most recent ones are
not here yet, and today's three are only at the front page.</p>
<nav><a href="/archive">All days</a><a href="/">Today's puzzles</a></nav>
</div>
</body>
</html>
`);

console.log(`today is day ${todayN + 1}, ${days.length} day${days.length === 1 ? '' : 's'} publishable, ${wrote} file${wrote === 1 ? '' : 's'} changed`);
