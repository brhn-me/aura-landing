// The guide (guide/index.html, guide/<group>/<topic>.html): the "On this page" rail follows the heading in view, the
// drawer on phones and tablets, the Copy buttons, and the search on the guide's home.
const nav = document.getElementById('docs-nav')
const railLinks = [...document.querySelectorAll('.rail-list a')]
const heads = railLinks.map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1)))).filter(Boolean)

const mark = (id) => {
  for (const a of railLinks) a.hash === '#' + id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')
}
if (heads.length) {
  const spy = () => {
    // the last heading above a line a fifth down the window
    let cur = heads[0]
    for (const h of heads) if (h.getBoundingClientRect().top < innerHeight * 0.2) cur = h
    mark(cur.id)
  }
  addEventListener('scroll', spy, { passive: true })
  spy()
}

// the drawer (phones and tablets)
const menuBtn = document.querySelector('.docs-menu-btn')
const scrim = document.querySelector('.docs-scrim')
const drawer = (open, focusBack = true) => {
  nav.classList.toggle('open', open)
  scrim.hidden = !open
  menuBtn.setAttribute('aria-expanded', String(open))
  if (open) (nav.querySelector('[aria-current]') || nav.querySelector('a')).focus()
  else if (focusBack) menuBtn.focus()
}
menuBtn.addEventListener('click', () => drawer(true))
nav.querySelector('.docs-close').addEventListener('click', () => drawer(false))
scrim.addEventListener('click', () => drawer(false))
nav.addEventListener('click', (e) => { if (e.target.closest('a') && nav.classList.contains('open')) drawer(false, false) })
addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) drawer(false) })

for (const button of document.querySelectorAll('.copy')) {
  button.setAttribute('aria-label', 'Copy the command')
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(button.previousElementSibling.textContent)
      button.textContent = 'Copied'
    } catch {
      button.textContent = 'Select it'
    }
    setTimeout(() => { button.textContent = 'Copy' }, 1600)
  })
}

// Search on the guide's home: page titles and headings (search.json, loaded on first use); "/" focuses it, the arrow
// keys move through the results.
const search = document.getElementById('guide-search')
if (search) {
  const results = document.getElementById('guide-results')
  let index = null
  const load = async () => { if (!index) index = await fetch('search.json').then((r) => r.json()).catch(() => []) }
  const render = () => {
    const words = search.value.toLowerCase().split(/\s+/).filter(Boolean)
    if (!words.length || !index) { results.hidden = true; results.innerHTML = ''; return }
    const hits = index.filter((e) => words.every((w) => `${e.t} ${e.p || ''} ${e.g}`.toLowerCase().includes(w))).slice(0, 8)
    results.innerHTML = ''
    for (const e of hits) {
      const li = document.createElement('li')
      const a = document.createElement('a')
      a.href = e.u
      a.innerHTML = '<span class="r-where"></span><span class="r-title"></span>'
      a.querySelector('.r-where').textContent = e.p ? `${e.g} › ${e.p}` : e.g
      a.querySelector('.r-title').textContent = e.t
      li.append(a)
      results.append(li)
    }
    if (!hits.length) results.innerHTML = '<li class="r-none">Nothing found. Try another word.</li>'
    results.hidden = false
  }
  search.addEventListener('focus', load, { once: true })
  search.addEventListener('input', async () => { await load(); render() })
  const links = () => [...results.querySelectorAll('a')]
  search.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown' && links().length) { e.preventDefault(); links()[0].focus() }
    if (e.key === 'Escape') { search.value = ''; render() }
  })
  results.addEventListener('keydown', (e) => {
    const all = links(), i = all.indexOf(document.activeElement)
    if (e.key === 'ArrowDown') { e.preventDefault(); all[Math.min(i + 1, all.length - 1)]?.focus() }
    if (e.key === 'ArrowUp') { e.preventDefault(); (i > 0 ? all[i - 1] : search).focus() }
    if (e.key === 'Escape') search.focus()
  })
  addEventListener('keydown', (e) => {
    if (e.key === '/' && !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '')) { e.preventDefault(); search.focus() }
  })
}
