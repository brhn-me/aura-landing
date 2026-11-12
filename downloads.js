// The Download page: the files of the latest release and pre-release, from GitHub's public releases list (asked once
// per visit: kept in sessionStorage for 10 minutes). The visitor's own platform is highlighted; nothing is sent anywhere
// else and nothing else is stored. When GitHub can't be reached, a plain link to the releases page.
const REPO = 'https://github.com/brhn-me/aura'
const API = 'https://api.github.com/repos/brhn-me/aura/releases?per_page=30'
const KEY = 'aura.releases'
const box = document.getElementById('releases')

const FILES = [
  // [group, label, pattern, platform]
  ['android', 'Android app (APK)', /^aura-[\d.]+(-[\w.]+)?\.apk$/, 'android'],
  ['desktop', 'Linux: AppImage', /^aura-desktop-.+-linux-x86_64\.AppImage$/, 'linux'],
  ['desktop', 'Linux: .deb (Debian, Ubuntu)', /^aura-desktop_.+_amd64\.deb$/, 'linux'],
  ['desktop', 'Windows: installer', /^aura-desktop-setup-.+-x64\.exe$/, 'windows'],
  ['server', 'Linux: one file', /^aura-server-.+-linux-x64$/, 'server'],
  ['server', 'Linux: .deb (Debian, Ubuntu)', /^aura-server_.+_amd64\.deb$/, 'server'],
]
const GROUPS = {
  android: ['Android', 'Your library on your phone, offline too.'],
  desktop: ['Desktop', 'Linux and Windows.'],
  server: ['Server', 'Runs on a Linux computer or a home server.'],
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
const mb = (bytes) => (bytes >= 1e6 ? `${Math.round(bytes / 1e6)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`)
const versionOf = (r) => r.tag_name.replace(/^v/, '')

function platform() {
  const p = (navigator.userAgentData?.platform || navigator.userAgent || '').toLowerCase()
  if (p.includes('android')) return 'android'
  if (p.includes('win')) return 'windows'
  if (p.includes('linux') || p.includes('x11')) return 'linux'
  return ''
}

async function load() {
  try {
    const kept = JSON.parse(sessionStorage.getItem(KEY) || 'null')
    if (kept && Date.now() - kept.at < 10 * 60 * 1000) return kept.list
  } catch {}
  const res = await fetch(API, { headers: { Accept: 'application/vnd.github+json' } })
  // 404: the repository isn't public yet (no releases to list); anything else: try again later
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`GitHub answered ${res.status}`)
  const list = (await res.json()).filter((r) => !r.draft)
  try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), list })) } catch {}
  return list
}

function release(r, title, mine, only) {
  const v = versionOf(r)
  const groups = {}
  for (const a of r.assets) {
    const f = FILES.find(([, , re]) => re.test(a.name))
    if (!f || (only && f[0] !== only)) continue
    ;(groups[f[0]] ||= []).push(`<a class="dl-file${f[3] === mine ? ' mine' : ''}" href="${esc(a.browser_download_url)}"><b>${f[1]}</b><span>${mb(a.size)}</span></a>`)
  }
  if (!only) groups.server = (groups.server || []).concat(`<a class="dl-file" href="guide/getting-started/install-server.html"><b>Docker</b><span>3 steps</span></a>`)
  const sums = r.assets.find((a) => a.name === 'SHA256SUMS')
  const cards = Object.keys(GROUPS).filter((g) => groups[g]).map((g) =>
    `<section class="dl-group"><h3>${GROUPS[g][0]}</h3><p>${GROUPS[g][1]}</p><div class="dl-files">${groups[g].join('')}</div></section>`).join('')
  return `<section class="dl-release" aria-labelledby="rel-${esc(v)}">
    <div class="dl-release-head"><h2 id="rel-${esc(v)}">${esc(title)} ${esc(v)}</h2>
      <span class="muted">${esc(new Date(r.published_at).toLocaleDateString(undefined, { dateStyle: 'medium' }))}</span>
      <a href="changelog.html#${esc(v)}">What's new</a></div>
    <div class="dl-groups">${cards || '<p class="muted">No files for this platform in this release.</p>'}</div>
    <div class="dl-foot">${sums ? `<a href="${esc(sums.browser_download_url)}">Checksums (SHA256SUMS)</a>` : ''}<a href="${esc(r.html_url)}">This release on GitHub</a></div>
  </section>`
}

function fallback(soon) {
  const isPublic = !window.AURA_SITE || window.AURA_SITE.repoPublic
  box.innerHTML = `<div class="dl-fallback">
    <p>${soon ? 'Downloads will appear here with the first public release.' : "The list of releases can't be loaded right now."}</p>
    ${isPublic
      ? `<p class="muted">Every release and its files are on GitHub: the Android app, the desktop apps for Linux and Windows, and the server.</p>
    <a class="btn btn-primary" href="${REPO}/releases">Open the releases</a>`
      : '<p class="muted">The Android app, the desktop apps for Linux and Windows, and the server. Meanwhile, <a href="demo.html">try the demo</a>.</p>'}
  </div>`
}

// the repository isn't public yet (assets/site.js): no releases to list
if (window.AURA_SITE && !window.AURA_SITE.repoPublic) fallback(true)
else load().then((list) => {
  const final = list.find((r) => !r.prerelease)
  const pre = list.find((r) => r.prerelease && (!final || new Date(r.published_at) > new Date(final.published_at)))
  if (!final && !pre) return fallback(true)
  const mine = platform()
  box.innerHTML = (final ? release(final, 'Aura', mine) : '')
    + (pre ? `<h2 class="dl-pre-title">Pre-release</h2>
       <p class="muted dl-pre-lead">The newest test version, for the Android app. It may still have rough edges.</p>${release(pre, 'Aura', mine, 'android')}` : '')
    + `<p class="dl-foot dl-all"><a href="${REPO}/releases">All releases</a><a href="guide/getting-started/install-server.html">How to install</a></p>`
}).catch(() => fallback(false))
