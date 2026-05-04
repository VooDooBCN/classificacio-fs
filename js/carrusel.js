function initCarousel() {
  const track = document.getElementById("track");
  const carrusel = document.querySelector(".carrusel-sponsors");

  if (!track || !carrusel) return;

  // duplicar contingut (1 cop)
  track.innerHTML += track.innerHTML;

  let position = 0;
  let speed = 0.5; // velocitat (puja/baixa si vols)

  function animate() {
    position += speed;

    if (position >= track.scrollWidth / 2) {
      position = 0;
    }

    track.style.transform = `translateX(-${position}px)`;

    requestAnimationFrame(animate);
  }

  animate();

  // PAUSA HOVER
  carrusel.addEventListener("mouseenter", () => speed = 0);
  carrusel.addEventListener("mouseleave", () => speed = 0.5);

  // TOUCH (mòbil)
  let startX = 0;

  carrusel.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
    speed = 0;
  });

  carrusel.addEventListener("touchmove", (e) => {
    const moveX = e.touches[0].clientX;
    const diff = startX - moveX;

    position += diff;
    startX = moveX;

    track.style.transform = `translateX(-${position}px)`;
  });

  carrusel.addEventListener("touchend", () => {
    speed = 0.5;
  });
}