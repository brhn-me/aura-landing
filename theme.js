// The site's light/dark toggle: dark unless the visitor chose light (kept in this browser only). The <head> script
// applies the choice before the page paints; this wires the header button.
for (const button of document.querySelectorAll('.theme-toggle')) {
  const sync = () => {
    const light = document.documentElement.dataset.theme === 'light'
    button.setAttribute('aria-pressed', String(light))
  }
  sync()
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light'
    document.documentElement.dataset.theme = next
    try { localStorage.setItem('aura.site.theme', next) } catch {}
    sync()
  })
}
