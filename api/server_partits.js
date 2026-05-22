import express from "express";
import cors from "cors";
import * as cheerio from "cheerio";
import axios from "axios";

const app = express();

app.use(cors());

const PORT = 3001;

// =====================================
// CACHE
// =====================================

let cachePartits = [];
let lastFetch = 0;
const logosEquips = {};

const CACHE_TIME = 1000 * 60 * 15; // 15 min

// =====================================
// CATEGORIES DEL CLUB
// =====================================

const categories = [

  {
    equip: "Sènior A",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-divisio-honor-catalana-futbol-sala/bcn-gr-1"
  },

  {
    equip: "Sènior Femení",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala-femeni/lliga-primera-divisio-femeni-futbol-sala/bcn-gr-1"
  },

  {
    equip: "Sènior B",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-tercera-divisio-catalana-futbol-sala/bcn-gr4"
  },

  {
    equip: "Juvenil A",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-segona-divisio-juvenil-futbol-sala/bcn-gr1"
  },

  {
    equip: "Juvenil B",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-segona-divisio-juvenil-futbol-sala/bcn-gr2"
  },

  {
    equip: "Juvenil C",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-tercera-divisio-juvenil-futbol-sala/bcn-gr-2"
  },

  {
    equip: "Cadet A",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-primera-divisio-cadet-futbol-sala/bcn-gr-1"
  },

  {
    equip: "Cadet B",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-segona-divisio-cadet-futbol-sala/bcn-gr1"
  },

  {
    equip: "Cadet Femení",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala-femeni/lliga-promocio-cadet-femeni-futbol-sala-3a-fase/grup-2"
  },

  {
    equip: "Infantil A",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-segona-divisio-infantil-futbol-sala/bcn-gr1"
  },

  {
    equip: "Infantil B",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-tercera-divisio-infantil-futbol-sala/bcn-gr-3"
  },

  {
    equip: "Aleví A",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-primera-divisio-alevi-futbol-sala/bcn-gr-1"
  },

  {
    equip: "Aleví B",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-segona-divisio-alevi-futbol-sala/bcn-gr2"
  },

  {
    equip: "Benjamí A",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/lliga-promocio-benjami-futbol-sala/bcn-gr-2"
  },

  {
    equip: "Prebenjamí A",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/segona-fase-lliga-promocio-prebenjami-futbol-sala/grup-2"
  },

  {
    equip: "Miniprebenjamí A",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala/copa-catalunya-miniprebenjami-futbol-sala/grup-3"
  }

];

// =====================================
// OBTENIR PARTIT
// =====================================

async function obtenirPartitEquip(
  url,
  equipNom,
  jornada = null
) {

  try {

    const { data } = await axios.get(url, {
      timeout: 4000
    });

    const $ = cheerio.load(data);
    
    const esPaginaEquip =
      url.includes("/equip/");

// =====================================
// COMPETICIÓ
// =====================================

let competicio = $(".fs-20.va-t")
  .first()
  .text()
  .trim();

// fallback per pàgines /resultats/
if (!competicio) {

  competicio = $("select option:selected")
    .first()
    .text()
    .trim();

}

    // =====================================
    // TAULA PARTITS
    // =====================================

    const files = $(".table_resultats tr");

    if (!files.length) return [];

    // =====================================
    // ORDRE FILES
    // =====================================

const filesArray = esPaginaEquip
  ? files.get()
  : files.get().reverse();

    // =====================================
    // BUSCAR PARTIT
    // =====================================

    const futursPartits = [];
    
    for (const el of filesArray) {

      const equips = $(el)
        .find(".resultats-w-equip a");

      if (equips.length < 1) continue;

const local = equips.eq(0)
  .text()
  .trim() || "";

const visitant = equips.eq(1)
  .text()
  .trim() || "";

      // =====================================
      // NOMÉS PARETS
      // =====================================

      const esParets =
        local.toLowerCase().includes("parets") ||
        visitant.toLowerCase().includes("parets");

      if (!esParets) continue;

      // =====================================
      // HORA / RESULTAT
      // =====================================

      const marcador = $(el)
        .find(".fs-17, .resultat")
        .text()
        .trim()
        .toUpperCase();
      

      // =====================================
      // DATA
      // =====================================

      const dataPartit = $(el)
        .find(".lh-data")
        .text()
        .trim();
      
// =====================================
// MANTENIR RESULTATS 24H
// =====================================

if (marcador.match(/\d+\s*-\s*\d+/)) {

  const match =
    dataPartit.match(
      /(\d{2})[\/-](\d{2})[\/-](\d{4})/
    );

  if (match) {

    const [, d, m, y] = match;

    const dataPartitObj =
      new Date(`${y}-${m}-${d}`);

    const ara =
      new Date();

    const diferenciaDies =
      (ara - dataPartitObj) /
      (1000 * 60 * 60 * 24);

    // si han passat més de 2 dies
    if (diferenciaDies > 1) {

      continue;

    }

  }

}

      // =====================================
      // RESULTAT
      // =====================================

const esResultat =
  marcador.match(/\d+\s*-\s*\d+/);

      const jugat = esResultat;

      // =====================================
      // ESTATS ESPECIALS
      // =====================================

const esRetirat =
  marcador === "R";

if (esRetirat) {
  continue;
}

const esDescansa =
  marcador === "D";

      // IMPORTANT:
      // a /equip/ buit = partit futur
      const esSuspes =
        marcador === "" && !esPaginaEquip;

      // =====================================
      // LOGOS
      // =====================================

      const imgs = $(el).find("img");

      const logoLocal =
        imgs.eq(0).attr("src") || "";

      const logoVisitant =
        imgs.eq(1).attr("src") || "";
      
      if (logoLocal) {
  logosEquips[local] = logoLocal;
}

if (logoVisitant) {
  logosEquips[visitant] = logoVisitant;
}

      // =====================================
      // CASA / FORA
      // =====================================

      const esCasa = local
        .toLowerCase()
        .includes("parets");

// =====================================
// GUARDAR PARTIT FUTUR
// =====================================

futursPartits.push({

  equip: equipNom,

  competicio,
  
  jornada,

  local,
  
  visitant,

  hora: esRetirat
    ? "RETIRAT"
    : esDescansa
    ? "DESCANSA"
    : esSuspes
    ? "SUSPÈS"
    : marcador,

  data: (
    esRetirat ||
    esDescansa ||
    esSuspes
  )
    ? ""
    : dataPartit,

  jugat,

  esCasa,

  logoLocal,
  logoVisitant

});

    }

return futursPartits;

} catch (err) {

  console.log(
    "Error obtenint partit:",
    equipNom
  );

  console.log(
    err.message
  );

  return [];

  }

}

// =====================================
// RESULTATS
// =====================================

async function obtenirPartitResultats(
  url,
  equipNom,
  jornada = null
) {
  
return await obtenirPartitEquip(
  url,
  equipNom,
  jornada
);

}

// =====================================
// PRECARREGAR LOGOS
// =====================================

async function precarregarLogos() {

//  console.log("🔄 Precarregant logos...");

  for (const cat of categories) {

    if (!cat.url.includes("/resultats/"))
      continue;

try {

await obtenirPartitResultats(
  urlJornada,
  cat.equip,
  jornada
);

} catch (err) {

      console.log(
        "Error logos:",
        cat.equip
      );

    }

  }

//  console.log(
//    "LOGOS TOTALS:",
//    Object.keys(logosEquips).length
//  );

// console.log("✅ Logos precarregats");

}

// =====================================
// API PARTITS
// =====================================

app.get("/api/partits", async (req, res) => {

  try {

    // =====================================
    // RETORNAR CACHE
    // =====================================

    if (
      cachePartits.length > 0 &&
      Date.now() - lastFetch < CACHE_TIME
    ) {

      console.log("⚡ Cache partits");

      return res.json(cachePartits);

    }

    // =====================================
    // CARREGAR PARTITS
    // =====================================

    const resultats = await Promise.all(

      categories.map(async (cat) => {

        try {

// =====================================
// OBTENIR TOTS ELS PARTITS
// =====================================

let totsPartits = [];

// jornada principal
let partitsInicials = [];

if (cat.url.includes("/resultats/")) {

  partitsInicials =
    await obtenirPartitResultats(
      cat.url,
      cat.equip
    );

}

else {

  partitsInicials =
    await obtenirPartitEquip(
      cat.url,
      cat.equip
    );

}

totsPartits.push(...partitsInicials);

// =====================================
// JORNADES EXTRA
// =====================================

if (cat.url.includes("/resultats/")) {

  const esLligaCurta =

    cat.equip.includes("Cadet Femení") ||
    cat.equip.includes("Benjamí A") ||
    cat.equip.includes("Prebenjamí A") ||
    cat.equip.includes("Miniprebenjamí");

  let inici;
  let final;

  // =====================================
  // LLIGUES CURTES
  // =====================================

  if (esLligaCurta) {

    inici = 2;
    final = 15;

  }

  // =====================================
  // LLIGUES NORMALS
  // =====================================

  else {

    const avui = new Date();

    const mes =
      avui.getMonth() + 1;

    inici = 2;
    final = 5;

    // gener-febrer
    if (mes >= 1) {
      inici = 6;
      final = 12;
    }

    // març-abril
    if (mes >= 3) {
      inici = 13;
      final = 18;
    }

    // maig-juny
    if (mes >= 5) {
      inici = 16;
      final = 26;
    }

  }

const promises = [];

for (
  let jornada = inici;
  jornada <= final;
  jornada++
) {

  const urlBase =
    cat.url.replace(/\/jornada-\d+/, "");

  const urlJornada =
    `${urlBase}/jornada-${jornada}`;

//  console.log(
//    `➡️ Provant jornada ${jornada}:`,
//    urlJornada
//  );

  promises.push(

    obtenirPartitResultats(
      urlJornada,
      cat.equip,
      jornada
    )

  );

}
  
const resultats =
  await Promise.all(promises);

resultats.forEach(partits => {

  if (partits.length) {

    totsPartits.push(...partits);

  }

});

}

// si no hi ha partits
if (!totsPartits.length) {
  return null;
}


// =====================================
// ORDENAR PER DATA
// =====================================

totsPartits = totsPartits.filter(
  (partit, index, self) => {

    const id =
      `${partit.local}-${partit.visitant}-${partit.data}`;

    return index === self.findIndex(p =>

      `${p.local}-${p.visitant}-${p.data}` === id

    );

  }
);

totsPartits.sort((a, b) => {

  const parseData = (partit) => {

    const txt = partit.data || "";

    const hora =
      /^\d{2}:\d{2}$/.test(partit.hora)
        ? partit.hora
        : "00:00";

    const match =
      txt.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);

    if (!match) return Infinity;

    const [, d, m, y] = match;

    return new Date(
      `${y}-${m}-${d}T${hora}`
    ).getTime();

  };

  const ara = Date.now();

  return Math.abs(
    parseData(a) - ara
  ) - Math.abs(
    parseData(b) - ara
  );

});

// =====================================
// RETORNAR EL MÉS PROPER
// =====================================

return totsPartits[0];

        } catch (err) {

          console.log(
            "Error categoria:",
            cat.equip
          );

          return [];

        }

      })

    );

    // =====================================
    // FILTRAR NULLS
    // =====================================

    const totsPartits =
      resultats.filter(Boolean);

    // =====================================
    // GUARDAR CACHE
    // =====================================

    cachePartits = totsPartits;

    lastFetch = Date.now();

    res.json(totsPartits);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Error carregant partits"
    });

  }

});

// =====================================
// START SERVER
// =====================================

precarregarLogos();

app.listen(PORT, () => {

  console.log(
    `Servidor partits actiu a port ${PORT}`
  );

});