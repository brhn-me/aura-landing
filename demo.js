// The demo page: the real web app built with the demo library (demo/, the same origin) in a window or a phone,
// loaded only when asked. Each feature opens it at a view; the demo's own settings (same origin) are set first, as a
// visitor would have chosen them. The app is shown at its real size (1280 × 800 or 390 × 844), scaled to fit.
// The tour rings the real control inside the app (found by the app's own labels) and explains it in a bubble.

const play = (d) => visible(d, 'button[aria-label="Play"], button[aria-label="Pause"]')
const settingsBtn = (d) => visible(d, 'button[aria-label="Playback settings"]')
// Each feature: where the app opens, the settings it opens with, and its own short tour (2–4 steps, a step whose
// control isn't there is skipped). The full tour is each feature's first step.
const FEATURES = [
  { key: 'devices', title: 'Device switching', text: 'Pick another device in the devices picker to move the music there.', hash: '#/listen/trk_windswept', settings: { visualizer: 'aurora', lyricsStyle: 'lines' },
    tour: [
      { target: (d) => visible(d, 'button[aria-label*="Devices"]'), tip: 'Tap here to choose a device. Pick Phone or Living Room TV.' },
      { target: play, tip: 'Play and pause from here, whichever device is playing.' },
      { target: (d) => visible(d, 'button[aria-label="Next"]'), tip: 'Skip ahead: the other device follows.' },
    ] },
  { key: 'video', title: 'Music Only', text: 'A music video, or just its sound: switch, and the song plays on.', hash: '#/listen/trk_forever-video', settings: {},
    tour: [
      { target: (d) => visible(d, 'button[aria-label*="Music Only"]') || play(d), tip: 'Press play, then the headphones button switches between the video and just its sound.' },
      { target: (d) => visible(d, 'button[aria-label*="Music Only"]'), tip: 'Music Only: the picture goes, the song plays on. Press it again for the video.' },
    ] },
  { key: 'aurora', title: 'Aurora', text: 'An aurora that moves with the song. Press play and watch.', hash: '#/listen/trk_windswept', settings: { visualizer: 'aurora', lyricsStyle: 'lines' },
    tour: [
      { target: play, tip: 'Press play: the aurora follows the music.' },
      { target: settingsBtn, tip: 'Other visualizers are here, under Visualizer: bars, a ring, a waveform.' },
    ] },
  { key: 'cloud', title: 'Lyrics Cloud', text: 'The words float in, the sung line in focus. Try Lyrics Cloud or Lyrics.', hash: '#/listen/trk_one-cute-leash', settings: { lyricsStyle: 'stage' }, query: 'lyrics&',
    tour: [
      { target: settingsBtn, tip: 'Open this, then pick Lyrics Cloud, Lyrics or a visualizer under Visualizer.' },
      { target: play, tip: 'Play: the sung line comes into focus, the next ones wait behind it.' },
    ] },
  { key: 'review', title: 'Smart Review', text: 'Messy tags, fixed. Accept a fix or discard it; the next card follows.', hash: '#/sources/suggestions', settings: {},
    tour: [
      { target: (d) => visibleText(d, 'button', /^\s*Accept\s*$/), tip: 'Accept this fix: the song is cleaned up and the next card comes.' },
      { target: (d) => visibleText(d, 'button', /^\s*Discard\s*$/), tip: 'Or discard it: that fix is not proposed again.' },
    ] },
  { key: 'stats', title: 'Stats', text: 'Your listening by week, month and year.', hash: '#/stats', settings: {},
    tour: [
      { target: (d) => visibleText(d, 'button, [role="radio"]', /^\s*All time\s*$/), tip: 'Switch between this week, this month and all time.' },
      { target: (d) => visible(d, '[data-testid="my-stats-range"] [role="img"]'), tip: 'Every day of the year: the darker, the more you listened.' },
    ] },
  { key: 'home', title: 'Library', text: 'Browse the albums, playlists and videos.', hash: '#/', settings: {},
    tour: [
      { target: (d) => visibleText(d, 'a', /^\s*Albums\s*$/), tip: 'Your albums, artists and videos are a click away.' },
      { target: (d) => visible(d, 'input[type="search"], [role="searchbox"], [role="combobox"]'), tip: 'Search by name, or by meaning: try “calm piano”.' },
    ] },
]
const byKey = Object.fromEntries(FEATURES.map((f) => [f.key, f]))
const stepsOf = (f) => f.tour.map((st) => ({ ...st, key: f.key, title: f.title }))
const FULL = FEATURES.map((f) => stepsOf(f)[0])
let TOUR = FULL

const shown = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 }
function visible(doc, selector) { return [...doc.querySelectorAll(selector)].find(shown) || null }
function visibleText(doc, selector, re) { return [...doc.querySelectorAll(selector)].find((el) => re.test(el.textContent) && shown(el)) || null }

const box = document.querySelector('[data-demo]')
const views = { desktop: box.querySelector('[data-device="desktop"]'), phone: box.querySelector('[data-device="phone"]') }
const asButtons = [...document.querySelectorAll('[data-as]')]
const list = document.querySelector('.features-panel ul')
const panel = document.querySelector('.features-panel')
const fbutton = document.querySelector('.features-button')
let as = matchMedia('(max-width: 699px)').matches ? 'phone' : 'desktop'
const KEEP = 'aura.site.demoFeature'
let current = (() => { try { const k = localStorage.getItem(KEEP); return byKey[k] ? k : FEATURES[0].key } catch { return FEATURES[0].key } })()

// the features panel: icon + name + one line each (icons in the style of the app's own)
const ICONS = {
  devices: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><circle cx="12" cy="14" r="3"/><path d="M12 6h.01"/>',
  video: '<path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1v-6h3zM3 19a2 2 0 0 0 2 2h1v-6H3z"/>',
  aurora: '<path d="M3 15c3-6 6-9 9-9s6 3 9 9"/><path d="M6 18c2-4 4-6 6-6s4 2 6 6"/>',
  cloud: '<path d="M4 7h10M4 12h16M8 17h8"/>',
  review: '<path d="M20 6 9 17l-5-5"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  home: '<path d="M3 11 12 3l9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
}
for (const f of FEATURES) {
  const li = document.createElement('li')
  li.innerHTML = `<button type="button" class="feature-pick" aria-current="false"><svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[f.key]}</svg><span><b></b><small></small></span></button>`
  const b = li.querySelector('button')
  b.dataset.open = f.key
  b.querySelector('b').textContent = f.title
  b.querySelector('small').textContent = f.text
  list.append(li)
}
const items = [...list.querySelectorAll('.feature-pick')]
const featLine = document.querySelector('.feat-line')
/** The selected feature: named on the menu button, described under the toolbar, kept for the next visit. */
const select = (key) => {
  current = key
  const f = byKey[key]
  fbutton.querySelector('.feat-name').textContent = f.title
  fbutton.querySelector('.feat-icon').innerHTML = ICONS[key]
  fbutton.setAttribute('aria-label', `Feature: ${f.title}`)
  featLine.textContent = f.text
  items.forEach((b) => b.setAttribute('aria-current', String(b.dataset.open === key)))
  try { localStorage.setItem(KEEP, key) } catch {}
}
select(current)
const openPanel = () => {
  panel.hidden = false
  fbutton.setAttribute('aria-expanded', 'true')
  ;(items.find((b) => b.dataset.open === current) || items[0]).focus()
}
const closePanel = (back = true) => {
  if (panel.hidden) return
  panel.hidden = true
  fbutton.setAttribute('aria-expanded', 'false')
  if (back) fbutton.focus()
}
fbutton.addEventListener('click', () => (panel.hidden ? openPanel() : closePanel()))
panel.querySelector('.features-close').addEventListener('click', () => closePanel())
document.addEventListener('pointerdown', (e) => { if (!panel.hidden && !panel.contains(e.target) && !fbutton.contains(e.target)) closePanel(false) })
panel.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') { e.stopPropagation(); closePanel() }
  const d = { ArrowDown: 1, ArrowUp: -1 }[e.key]
  if (d) { e.preventDefault(); const i = items.indexOf(document.activeElement); items[(i + d + items.length) % items.length].focus() }
})

const screenOf = (key) => (key === 'phone' ? views.phone.querySelector('.phone-screen') : views.desktop)
const frameOf = () => screenOf(as).querySelector('iframe')
const scale = () => (as === 'phone' ? screenOf('phone').clientWidth / 390 : views.desktop.clientWidth / 1280)
const prepare = (f) => {
  try {
    const kept = JSON.parse(localStorage.getItem('aura.settings') || 'null') || { state: {}, version: 9 }
    kept.state = { ...kept.state, theme: 'dark', ...f.settings }
    localStorage.setItem('aura.settings', JSON.stringify(kept))
    localStorage.setItem('aura.test.phoneLayout', as === 'phone' ? 'app' : 'web')
  } catch {}
}
const fit = () => {
  views.desktop.style.setProperty('--k', String(views.desktop.clientWidth / 1280))
  const s = screenOf('phone')
  s.style.setProperty('--k', String(s.clientWidth / 390))
  place()
}
/** Opens the app at a feature; resolves when the new page has loaded. */
const open = (key) => new Promise((resolve) => {
  select(key)
  const f = byKey[key]
  const screen = screenOf(as)
  prepare(f)
  let frame = screen.querySelector('iframe')
  if (!frame) {
    frame = document.createElement('iframe')
    frame.title = 'The Aura app with a demo library'
    frame.allow = 'autoplay; fullscreen'
    screen.append(frame)
    screen.classList.add('live')
  }
  frame.addEventListener('load', () => {
    try { frame.contentWindow.addEventListener('keydown', onKey) } catch {} // the tour's keys also while the app has the focus
    resolve(frame)
  }, { once: true })
  frame.src = `demo/index.html?${f.query || ''}t=${Date.now()}${f.hash}`
  fit()
})

// ---- the tour ----
const ring = document.querySelector('.tour-ring')
const bubble = document.querySelector('.tour-bubble')
const startButton = document.querySelector('.tour-start')
const tour = { on: false, i: 0, el: null, run: 0, poll: 0 }
const $ = (c) => bubble.querySelector(c)

const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches
const rectOf = (el) => { const r = el.getBoundingClientRect(); return `${Math.round(r.left)},${Math.round(r.top)},${Math.round(r.width)},${Math.round(r.height)}` }
/** The control in the app, polled until it exists and has stopped moving (the same box three looks in a row, the
 *  app loads and lays out its view first); null after 12 s. */
const waitFor = (f, run) => new Promise((resolve) => {
  const t0 = performance.now()
  let last = '', same = 0
  const look = () => {
    if (run !== tour.run) return resolve(null)
    let el = null
    try { el = f.target(frameOf().contentDocument) } catch {}
    if (el) {
      const r = rectOf(el)
      same = r === last ? same + 1 : 0
      last = r
      if (same >= 2) return resolve(el)
    }
    if (performance.now() - t0 > 12000) return resolve(null)
    setTimeout(look, 120)
  }
  look()
})
/** Moves an absolutely placed element to page coordinates with a transform (CSS eases it). */
const moveTo = (el, x, y) => { el.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)` }
/** Ring and bubble in page coordinates: the control's box in the app × the scale, from the frame's corner. The
 *  bubble goes beside the control, never over it: below, above, right or left, the first that fits the window. */
function place() {
  if (!tour.on) return
  const frame = frameOf()
  const fr = (frame?.parentElement || box).getBoundingClientRect()
  let t = null
  if (tour.el?.isConnected && frame) {
    const r = tour.el.getBoundingClientRect(), k = scale()
    t = { left: fr.left + r.left * k, top: fr.top + r.top * k, width: r.width * k, height: r.height * k }
  }
  ring.classList.toggle('on', !!t)
  if (t) {
    const pad = 6
    ring.style.width = `${t.width + pad * 2}px`
    ring.style.height = `${t.height + pad * 2}px`
    moveTo(ring, t.left + scrollX - pad, t.top + scrollY - pad)
  }
  const vw = document.documentElement.clientWidth, vh = innerHeight, m = 12, gap = 18
  const bw = Math.min(320, vw - 2 * m)
  bubble.style.width = `${bw}px`
  const bh = bubble.offsetHeight || 170
  const clampX = (x) => Math.min(Math.max(m, x), vw - bw - m)
  const clampY = (y) => Math.min(Math.max(m, y), vh - bh - m)
  let x, y
  if (t) {
    const cx = t.left + t.width / 2, cy = t.top + t.height / 2
    const tries = [
      [clampX(cx - bw / 2), t.top + t.height + gap, (x, y) => y + bh <= vh - m],
      [clampX(cx - bw / 2), t.top - gap - bh, (x, y) => y >= m],
      [t.left + t.width + gap, clampY(cy - bh / 2), (x) => x + bw <= vw - m],
      [t.left - gap - bw, clampY(cy - bh / 2), (x) => x >= m],
    ]
    const fit = tries.find(([x, y, ok]) => ok(x, y))
    ;[x, y] = fit || [clampX(cx - bw / 2), clampY(t.top + t.height + gap)]
  } else {
    x = clampX(fr.left + fr.width / 2 - bw / 2)
    y = clampY(Math.max(fr.top, 0) + Math.min(fr.height, vh) / 2 - bh / 2)
  }
  moveTo(bubble, x + scrollX, y + scrollY)
}
async function step(i, dir = 1) {
  tour.i = i
  const run = ++tour.run
  const f = TOUR[i]
  tour.el = null
  ring.classList.remove('on') // fades out where it was; moves on when the next control is ready
  $('.tour-step').textContent = `${i + 1} / ${TOUR.length}`
  $('#tour-title').textContent = f.title
  $('.tour-text').textContent = 'Opening…'
  $('.tour-back').disabled = i === 0
  $('.tour-next').textContent = i === TOUR.length - 1 ? 'Done' : 'Next'
  bubble.classList.add('busy')
  const first = bubble.hidden
  bubble.hidden = false
  if (first) { bubble.classList.add('still'); place(); bubble.offsetWidth; bubble.classList.remove('still') }
  if (!bubble.contains(document.activeElement)) bubble.focus({ preventScroll: true })
  if (current !== f.key || !frameOf()) await open(f.key)
  if (run !== tour.run) return
  let el = await waitFor(f, run)
  if (run !== tour.run) return
  if (!el) { // the control isn't there: go on to the next step (or back), or end
    const n = i + dir
    if (n >= 0 && n < TOUR.length) return step(n, dir)
    $('.tour-text').textContent = byKey[f.key].text
    bubble.classList.remove('busy')
    return place()
  }
  // into view: first inside the app, then the frame on the page
  try { el.scrollIntoView({ block: 'nearest', inline: 'nearest' }) } catch {}
  const fr = frameOf().getBoundingClientRect(), r = el.getBoundingClientRect(), k = scale()
  const yy = fr.top + (r.top + r.height / 2) * k
  if (yy < 80 || yy > innerHeight - 220) {
    scrollBy({ top: yy - innerHeight / 2, behavior: reduced() ? 'auto' : 'smooth' })
    await new Promise((res) => setTimeout(res, reduced() ? 0 : 350))
    if (run !== tour.run) return
  }
  tour.el = el
  $('.tour-text').textContent = f.tip
  bubble.classList.remove('busy')
  place()
  // the app may have taken the focus while loading: the tour's keys work from the bubble
  if (!bubble.contains(document.activeElement)) bubble.focus({ preventScroll: true })
}
function startTour(steps = FULL) {
  TOUR = steps
  tour.on = true
  document.querySelector('.demo-layout').scrollIntoView({ block: 'start', behavior: reduced() ? 'auto' : 'smooth' })
  clearInterval(tour.poll)
  tour.poll = setInterval(place, 250) // the app moves things as it settles; the ring follows, eased
  step(0)
}
function endTour() {
  if (!tour.on) return
  tour.on = false
  tour.run++
  clearInterval(tour.poll)
  ring.classList.remove('on')
  bubble.hidden = true
  startButton.focus()
}
startButton.addEventListener('click', () => startTour(stepsOf(byKey[current])))
// the split button's menu: the full tour, then each feature's own tour
const more = document.querySelector('.split-more')
const menu = document.getElementById('tour-menu')
for (const f of FEATURES) {
  const li = document.createElement('li')
  li.setAttribute('role', 'none')
  li.innerHTML = '<button type="button" role="menuitem"></button>'
  li.firstChild.textContent = `Tour: ${f.title}`
  li.firstChild.dataset.tour = f.key
  menu.append(li)
}
const menuItems = [...menu.querySelectorAll('[role="menuitem"]')]
const openMenu = (focusLast = false) => {
  menu.hidden = false
  more.setAttribute('aria-expanded', 'true')
  menuItems[focusLast ? menuItems.length - 1 : 0].focus()
}
const closeMenu = (back = true) => {
  if (menu.hidden) return
  menu.hidden = true
  more.setAttribute('aria-expanded', 'false')
  if (back) more.focus()
}
more.addEventListener('click', () => (menu.hidden ? openMenu() : closeMenu()))
more.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') { e.preventDefault(); openMenu() }
  if (e.key === 'ArrowUp') { e.preventDefault(); openMenu(true) }
})
menu.addEventListener('keydown', (e) => {
  const i = menuItems.indexOf(document.activeElement)
  const d = { ArrowDown: 1, ArrowUp: -1 }[e.key]
  if (d) { e.preventDefault(); menuItems[(i + d + menuItems.length) % menuItems.length].focus() }
  else if (e.key === 'Home') { e.preventDefault(); menuItems[0].focus() }
  else if (e.key === 'End') { e.preventDefault(); menuItems[menuItems.length - 1].focus() }
  else if (e.key === 'Escape') { e.stopPropagation(); closeMenu() }
  else if (e.key === 'Tab') closeMenu(false)
})
document.addEventListener('pointerdown', (e) => { if (!menu.hidden && !menu.contains(e.target) && !more.contains(e.target)) closeMenu(false) })
menuItems.forEach((b) => b.addEventListener('click', () => {
  closeMenu(false)
  const k = b.dataset.tour
  if (k === 'full') return startTour(FULL)
  select(k)
  startTour(stepsOf(byKey[k]))
}))
const next = () => (tour.i < TOUR.length - 1 ? step(tour.i + 1, 1) : endTour())
const back = () => tour.i > 0 && step(tour.i - 1, -1)
$('.tour-next').addEventListener('click', next)
$('.tour-back').addEventListener('click', back)
$('.tour-skip').addEventListener('click', endTour)
const onKey = (e) => {
  if (!tour.on || e.altKey || e.ctrlKey || e.metaKey) return
  if (e.target.closest?.('input, textarea, select, [contenteditable="true"]')) return
  if (e.key === 'Escape') endTour()
  else if (e.key === 'ArrowRight') { e.preventDefault(); next() }
  else if (e.key === 'ArrowLeft') { e.preventDefault(); back() }
}
addEventListener('keydown', onKey)

// ---- desktop or phone ----
const show = (which) => {
  const wasLive = !!box.querySelector('.live')
  // only one app runs at a time: the other view goes back to its picture
  for (const k of ['desktop', 'phone']) {
    if (k === which) continue
    const s = screenOf(k)
    s.querySelector('iframe')?.remove()
    s.classList.remove('live')
  }
  as = which
  asButtons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.as === which)))
  views.desktop.hidden = which !== 'desktop'
  views.phone.hidden = which !== 'phone'
  box.classList.add('ready') // from here the hidden attributes decide (before: the CSS guess by width, no shift)
  fit()
  if (tour.on) step(tour.i)
  else if (wasLive) open(current)
}
asButtons.forEach((b) => b.addEventListener('click', () => show(b.dataset.as)))
items.forEach((b) => b.addEventListener('click', () => { endTour(); closePanel(false); open(b.dataset.open) }))
box.querySelectorAll('.app-start').forEach((b) => b.addEventListener('click', () => open(current)))
new ResizeObserver(fit).observe(box)
addEventListener('scroll', place, { passive: true })
addEventListener('resize', place)

show(as)
