// The one switch for "the aura repository is public". While false, links into github.com/brhn-me/aura (source,
// docs, releases) are shown as coming with the public release, and the Download page shows its first-release note.
// Flip to true when the repository goes public; nothing else needs to change.
window.AURA_SITE = { repoPublic: false }

if (!window.AURA_SITE.repoPublic) {
  const REPO = 'https://github.com/brhn-me/aura'
  const NOTE = 'Source code (coming with the public release)'
  // the site's own licence page, from any page (this file is assets/site.js at the site's root)
  const LICENCE = new URL('../license.html', document.currentScript?.src || location.href).href
  const apply = () => {
    for (const a of document.querySelectorAll(`a[href="${REPO}"], a[href^="${REPO}/"]`)) {
      const href = a.getAttribute('href')
      if (/\/blob\/[^/]+\/LICENSE$/.test(href)) { a.setAttribute('href', LICENCE); continue } // the licence lives here too
      if (a.closest('.foot')) { a.remove(); continue } // the footer simply leaves it out
      // not a link while there is nowhere to go: a span with the same look and text (an icon gets a name and role)
      const span = document.createElement('span')
      span.className = `${a.className} soon`.trim()
      span.title = NOTE
      span.innerHTML = a.innerHTML
      if (a.textContent.trim() === 'GitHub') span.textContent = NOTE
      else if (a.classList.contains('icon-link')) { span.setAttribute('role', 'img'); span.setAttribute('aria-label', NOTE) }
      a.replaceWith(span)
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', apply)
  else apply()
}

// Back to top: a round button that shows once the page is scrolled past its first screen
{
  const add = () => {
    const b = document.createElement('button')
    b.type = 'button'
    b.className = 'to-top'
    b.setAttribute('aria-label', 'Back to top')
    b.title = 'Back to top'
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>'
    if (document.querySelector('[data-demo]')) b.classList.add('raised')
    document.body.append(b)
    const still = matchMedia('(prefers-reduced-motion: reduce)')
    b.addEventListener('click', () => {
      scrollTo({ top: 0, behavior: still.matches ? 'auto' : 'smooth' })
      document.querySelector('.brand')?.focus({ preventScroll: true })
    })
    let queued = false
    const check = () => { queued = false; b.classList.toggle('on', scrollY > innerHeight) }
    addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(check) } }, { passive: true })
    check()
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', add)
  else add()
}
