// --- FUNCIONS COOKIES ---

function acceptarCookies() {
  localStorage.setItem("cookiesAccepted", "true");
  document.getElementById("cookie-banner").style.display = "none";
  carregarIframes();
}

function rebutjarCookies() {
  localStorage.setItem("cookiesAccepted", "false");
  document.getElementById("cookie-banner").style.display = "none";
}

// --- CARREGAR IFRAMES ---

function carregarIframes() {
  const iframes = document.querySelectorAll(".iframe-consent");

  iframes.forEach(el => {
    const src = el.getAttribute("data-src");
    const clase = el.getAttribute("data-class");

    el.innerHTML = `
      <iframe
        src="${src}"
        class="${clase}"
        frameborder="0"
        scrolling="no">
      </iframe>
    `;
  });
}

// --- INICI ---

window.addEventListener("DOMContentLoaded", function() {

  const consent = localStorage.getItem("cookiesAccepted");

  // Mostrar banner si no ha decidit
  if (!consent) {
    document.getElementById("cookie-banner").style.display = "block";
  }

  // Si ha acceptat → carregar iframes
  if (consent === "true") {
  carregarIframes();
} else {
  mostrarMissatge();
}

function mostrarMissatge() {
  const iframes = document.querySelectorAll(".iframe-consent");

  iframes.forEach(el => {
    el.innerHTML = `
      <div style="text-align:center; padding:20px;">
        <p>Accepta cookies per veure aquest contingut.</p>
        <button onclick="acceptarCookies()">Acceptar</button>
      </div>
    `;
  });
}
});