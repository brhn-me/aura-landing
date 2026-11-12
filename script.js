// Aura landing page: copy buttons, the Get started tabs, and the feature recordings (short silent loops of the real
// app). No animation loops: the clips play themselves (one at a time), everything else is a still or a CSS touch.
document.documentElement.classList.add('js')
const still = matchMedia('(prefers-reduced-motion: reduce)')

for (const button of document.querySelectorAll('.copy')) {
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

// Recordings: one moves at a time, and a clip has a file only while it shows (the others keep their poster and let
// the file go). With reduced motion or Save-Data no video loads at all: the posters stay.
const quiet = () => still.matches || !!navigator.connection?.saveData
const stop = (v) => {
  if (!v.getAttribute('src')) return
  v.pause()
  v.removeAttribute('src')
  v.load() // back to the poster, the file let go
}
const play = (v, name) => {
  if (name) {
    v.poster = `assets/rec/${name}.webp`
    v.dataset.src = `assets/rec/${name}.mp4`
    v.dataset.webm = `assets/rec/${name}.webm`
  }
  if (quiet() || document.hidden) return stop(v)
  const want = v.dataset.webm && v.canPlayType('video/webm; codecs="vp9"') ? v.dataset.webm : v.dataset.src
  if (v.getAttribute('src') !== want) v.src = want
  v.play().catch(() => {})
}

// The features. One step is "on": the one crossing the middle of the screen. From 900 px the pinned stage shows its
// clip (two layers in the window cross-fade; the phone fades in for the phone feature); below that the step's own
// clip plays. Scrolling is watched by an IntersectionObserver on a one-pixel line in the middle, no scroll handler.
const show = document.querySelector('.show')
if (show && 'IntersectionObserver' in window) {
  const steps = [...show.querySelectorAll('.step')]
  const box = show.querySelector('.stage-box')
  const layers = [...show.querySelectorAll('.stage-screen video')]
  const phone = show.querySelector('.stage-phone video')
  const dots = [...show.querySelectorAll('.show-dots button')]
  const wide = matchMedia('(min-width: 900px)')
  const own = steps.map((s) => s.querySelector('.step-media video'))
  let on = 0
  let front = 0
  let fade
  const render = () => {
    steps.forEach((s, i) => s.classList.toggle('on', i === on))
    dots.forEach((d, i) => d.setAttribute('aria-current', String(i === on)))
    if (!wide.matches) {
      layers.forEach(stop); stop(phone)
      own.forEach((v, i) => v && i !== on && stop(v))
      if (own[on]) play(own[on])
      return
    }
    own.forEach((v) => v && stop(v))
    const step = steps[on]
    const name = step.dataset.clip
    clearTimeout(fade)
    if (step.dataset.frame === 'phone') {
      box.dataset.frame = 'phone'
      play(phone, name)
      fade = setTimeout(() => layers.forEach(stop), 400)
      return
    }
    box.dataset.frame = 'desk'
    const cur = layers[front]
    if (cur.dataset.name !== name) {
      const next = layers[1 - front]
      next.dataset.name = name
      play(next, name)
      // the new clip fades in once it plays (its poster until then), so the fade never shows a stalled frame
      const swap = () => { next.classList.add('on'); cur.classList.remove('on') }
      if (next.getAttribute('src')) { next.addEventListener('playing', swap, { once: true }); setTimeout(swap, 700) } else swap()
      front = 1 - front
      fade = setTimeout(() => { stop(cur); stop(phone) }, 1100)
    } else {
      play(cur, name)
      fade = setTimeout(() => stop(phone), 400)
    }
  }
  layers[0].dataset.name = steps[0].dataset.clip
  const line = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { on = steps.indexOf(e.target); render() }
  }, { rootMargin: '-50% 0px -50% 0px' })
  steps.forEach((s) => line.observe(s))
  // while the section is off screen nothing plays
  let inView = false
  new IntersectionObserver(([e]) => {
    inView = e.isIntersecting
    if (inView) render()
    else { layers.forEach(stop); stop(phone); own.forEach((v) => v && stop(v)) }
  }).observe(show)
  const again = () => inView && render()
  document.addEventListener('visibilitychange', again)
  still.addEventListener('change', again)
  wide.addEventListener('change', again)
  dots.forEach((d, i) => d.addEventListener('click', () => {
    steps[i].scrollIntoView({ block: 'start', behavior: still.matches ? 'auto' : 'smooth' })
  }))

  // Music you can see: Aurora or Lyrics Cloud, in this step's own clip and on the stage
  const vizPick = show.querySelector('.viz-pick')
  if (vizPick) {
    const step = vizPick.closest('.step')
    const video = step.querySelector('.step-media video')
    const items = [...vizPick.querySelectorAll('[role="radio"]')]
    const choose = (b) => {
      items.forEach((x) => { x.setAttribute('aria-checked', String(x === b)); x.tabIndex = x === b ? 0 : -1 })
      step.dataset.clip = b.dataset.clip
      stop(video)
      video.poster = `assets/rec/${b.dataset.clip}.webp`
      video.dataset.src = `assets/rec/${b.dataset.clip}.mp4`
      video.dataset.webm = `assets/rec/${b.dataset.clip}.webm`
      video.setAttribute('aria-label', b.dataset.label)
      if (inView && steps[on] === step) render()
    }
    items.forEach((b, i) => {
      b.addEventListener('click', () => choose(b))
      b.addEventListener('keydown', (e) => {
        const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
        if (!d) return
        const n = items[(i + d + items.length) % items.length]
        n.focus()
        choose(n)
      })
    })
  }
}

// One scroll, one section: the features and the sections after them are snap stops (styles.css). Touch flicks and
// wheel ticks that the browser would snap back move on to the next stop (or back one); a trackpad's trailing
// momentum is held for a moment so it doesn't run on. Keyboard scrolling is the browser's own (it already steps).
const stops = [...document.querySelectorAll('.step, .rest > section')]
const hdr = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--hdr')) || 0
if (stops.length) {
  let lock = 0
  const here = () => {
    const tops = stops.map((s) => s.getBoundingClientRect())
    const top = hdr()
    const i = tops.findIndex((r) => Math.abs(r.top - top) < 4 && r.height <= innerHeight - top + 4)
    // at the very end (the footer) counts as one past the last stop, so back goes to it
    if (i < 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 2 && tops[tops.length - 1].bottom <= innerHeight) return stops.length
    return i
  }
  const inside = () => stops[0].getBoundingClientRect().top <= hdr() + 4 && stops[stops.length - 1].getBoundingClientRect().bottom >= innerHeight - 4
  const go = (dir) => {
    const i = here()
    const j = i + dir
    if (i < 0 || j < 0 || j > stops.length) return false
    lock = performance.now() + 800
    if (j === stops.length) { scrollTo({ top: document.documentElement.scrollHeight, behavior: still.matches ? 'auto' : 'smooth' }); return true } // the footer
    stops[j].scrollIntoView({ block: 'start', behavior: still.matches ? 'auto' : 'smooth' })
    return true
  }
  addEventListener('wheel', (e) => {
    if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX) || Math.abs(e.deltaY) < 2) return
    if (performance.now() < lock) { if (inside()) e.preventDefault(); return }
    if (go(Math.sign(e.deltaY))) e.preventDefault()
  }, { passive: false })
  let t0 = null
  addEventListener('touchstart', (e) => { t0 = e.touches.length === 1 ? { y: e.touches[0].clientY, i: here() } : null }, { passive: true })
  addEventListener('touchend', (e) => {
    if (!t0 || t0.i < 0) return
    const dy = t0.y - e.changedTouches[0].clientY
    const j = t0.i + Math.sign(dy)
    t0 = null
    if (Math.abs(dy) < 30 || j < 0 || j > stops.length) return // a tap, or above the first: the browser's own
    lock = performance.now() + 800
    if (j === stops.length) return scrollTo({ top: document.documentElement.scrollHeight, behavior: still.matches ? 'auto' : 'smooth' })
    stops[j].scrollIntoView({ block: 'start', behavior: still.matches ? 'auto' : 'smooth' })
  }, { passive: true })
}

// Reveal: headings, lines and cards below the first screen fade in and rise a little, once, as they come into view.
// Only with JS and without reduced motion; whatever is on screen at load shows at once (no wait for the hero).
if ('IntersectionObserver' in window && !still.matches) {
  const items = [...document.querySelectorAll('main .feature-text, main .step-media, main .try-band .wrap > *, main .platforms h2, main .platform-list > li, main .install .wrap > h2, main .install .friction, main .install .latest, main .install .tabs')]
    .filter((el) => el.getBoundingClientRect().top > innerHeight)
  if (items.length) {
    document.documentElement.classList.add('js-reveal')
    items.forEach((el) => el.classList.add('rv'))
    const io = new IntersectionObserver((entries) => {
      let n = 0
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.style.transitionDelay = `${Math.min(n++, 5) * 70}ms`
        e.target.classList.add('rv-in')
        setTimeout(() => { e.target.style.transitionDelay = '' }, 1000)
        io.unobserve(e.target)
      }
    }, { rootMargin: '0px 0px -8% 0px' })
    items.forEach((el) => io.observe(el))
  }
}

// Get started: tabs (arrow keys move between them)
const tabs = [...document.querySelectorAll('.tabs [role="tab"]')]
const pickTab = (t) => tabs.forEach((x) => {
  const on = x === t
  x.setAttribute('aria-selected', String(on))
  x.tabIndex = on ? 0 : -1
  document.getElementById(x.getAttribute('aria-controls')).hidden = !on
})
tabs.forEach((t, i) => {
  t.addEventListener('click', () => pickTab(t))
  t.addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]
    if (!d) return
    const n = tabs[(i + d + tabs.length) % tabs.length]
    n.focus()
    pickTab(n)
  })
})

// Phones: the header steps aside while scrolling down and comes back on the way up
{
  const top = document.querySelector('.top')
  const narrow = matchMedia('(max-width: 899px)')
  let last = scrollY, queued = false
  if (top) addEventListener('scroll', () => {
    if (queued) return
    queued = true
    requestAnimationFrame(() => {
      queued = false
      const y = scrollY
      if (!narrow.matches || y < 80) top.classList.remove('away')
      else if (y > last + 4) top.classList.add('away')
      else if (y < last - 4) top.classList.remove('away')
      last = y
    })
  }, { passive: true })
}

// The privacy line types itself in once, when it comes into view: the headline letter by letter with a caret, then
// the second line word by word, then the link. The text itself stays in the page as it is (screen readers read it
// normally); what types is an aria-hidden copy whose letters are only made visible, so nothing moves.
{
  const line = document.querySelector('.promise-line')
  const still2 = matchMedia('(prefers-reduced-motion: reduce)')
  if (line && 'IntersectionObserver' in window && !still2.matches) {
    const sub = line.querySelector('span')
    const link = document.querySelector('.promise .quiet-link')
    const head = line.firstChild
    const copy = (text, cls, split) => {
      const real = document.createElement('span'); real.className = 'vh'; real.textContent = text
      const shown = document.createElement('span'); shown.className = `tw ${cls}`; shown.setAttribute('aria-hidden', 'true')
      for (const part of split(text)) {
        if (part === ' ') { shown.append(' '); continue }
        const u = document.createElement('span'); u.className = 'u'; u.textContent = part; shown.append(u)
      }
      return [real, shown]
    }
    const [headReal, headShown] = copy(head.textContent, 'tw-head', (t) => [...t])
    head.replaceWith(headReal, headShown)
    const [subReal, subShown] = copy(sub.textContent, 'tw-sub', (t) => t.split(/( )/).filter(Boolean))
    sub.replaceChildren(subReal, subShown)
    line.classList.add('typing')
    link?.classList.add('tw-wait')
    const chars = [...headShown.querySelectorAll('.u')]
    const words = [...subShown.querySelectorAll('.u')]
    const run = () => {
      let i = 0
      const typeNext = () => {
        chars[i - 1]?.classList.remove('cur')
        if (i < chars.length) {
          chars[i].classList.add('on', 'cur')
          i++
          return setTimeout(typeNext, chars[i - 1].textContent === ' ' ? 20 : 40)
        }
        chars[chars.length - 1].classList.add('cur', 'end') // the caret blinks a moment, then goes
        setTimeout(() => chars[chars.length - 1].classList.remove('cur', 'end'), 1600)
        words.forEach((w, k) => setTimeout(() => w.classList.add('on'), 250 + k * 60))
        setTimeout(() => link?.classList.remove('tw-wait'), 250 + words.length * 60 + 200)
      }
      typeNext()
    }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { io.disconnect(); run() } }, { threshold: 0.6 })
    io.observe(line)
  }
}
