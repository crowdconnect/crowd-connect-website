(function() {
  const burger = document.getElementById('navBurger');
  const mobileNav = document.getElementById('navMobile');
  if (!burger || !mobileNav) return;

  burger.addEventListener('click', function() {
    const open = mobileNav.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    mobileNav.setAttribute('aria-hidden', String(!open));
  });

  mobileNav.querySelectorAll('a').forEach(function(link) {
    link.addEventListener('click', function() {
      mobileNav.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      mobileNav.setAttribute('aria-hidden', 'true');
    });
  });
})();
