function initHeader() {
  const header = document.getElementById("header-container");

  if (!header) return;

  const navToggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('.main-nav');

  if (!navToggle || !nav) {
    console.log("Header no trobat");
    return;
  }

  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('open');
    nav.classList.toggle('open');
  });

  header.querySelectorAll('.main-nav a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.classList.remove('open');
    });
  });
}