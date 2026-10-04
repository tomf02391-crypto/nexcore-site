(() => {
  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const setMenu = (open) => {
    toggle?.setAttribute('aria-expanded', String(open));
    mobileNav?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  };
  toggle?.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
  mobileNav?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 16);
  updateHeader(); window.addEventListener('scroll', updateHeader, {passive:true});

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {threshold: 0.12, rootMargin: '0px 0px -24px 0px'});
    revealItems.forEach((item, i) => { item.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`; revealObserver.observe(item); });
  } else revealItems.forEach(item => item.classList.add('is-visible'));

  const sections = [...document.querySelectorAll('main section[id]')];
  const navLinks = [...document.querySelectorAll('.nav-link')];
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`));
    }), {rootMargin:'-42% 0px -48% 0px'});
    sections.forEach(section => navObserver.observe(section));
  }
  const cosmos = document.querySelector('.cosmos');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (cosmos && !reduceMotion && window.matchMedia('(pointer:fine)').matches) {
    let frame = null;
    document.addEventListener('pointermove', e => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const dx = (e.clientX / window.innerWidth - .5) * 8;
        const dy = (e.clientY / window.innerHeight - .5) * 6;
        cosmos.style.marginLeft = `${dx}px`;
        cosmos.style.marginTop = `${dy}px`;
      });
    }, {passive:true});
  }
})();