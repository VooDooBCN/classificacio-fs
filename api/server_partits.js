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

const CACHE_TIME = 1000 * 60 * 15; // 15 min

// =====================================
// CATEGORIES DEL CLUB
// =====================================

const categories = [

  {
    equip: "Sènior A",
    url: "https://www.fcf.cat/equip/2526/dh/parets-fs-a"
  },

  {
    equip: "Sènior Femení",
    url: "https://www.fcf.cat/equip/2526/1sf/parets-fs-a"
  },

  {
    equip: "Sènior B",
    url: "https://www.fcf.cat/equip/2526/as3/parets-fs-b"
  },

  {
    equip: "Juvenil A",
    url: "https://www.fcf.cat/equip/2526/2js/parets-fs-a"
  },

  {
    equip: "Juvenil B",
    url: "https://www.fcf.cat/equip/2526/2js/parets-fs-b"
  },

  {
    equip: "Juvenil C",
    url: "https://www.fcf.cat/equip/2526/3js/parets-fs-c"
  },

  {
    equip: "Cadet A",
    url: "https://www.fcf.cat/equip/2526/1cs/parets-fs-a"
  },

  {
    equip: "Cadet B",
    url: "https://www.fcf.cat/equip/2526/2cs/parets-fs-b"
  },

  {
    equip: "Cadet Femení",
    url: "https://www.fcf.cat/resultats/2526/futbol-sala-femeni/lliga-promocio-cadet-femeni-futbol-sala-3a-fase/grup-2"
  },

  {
    equip: "Infantil A",
    url: "https://www.fcf.cat/equip/2526/2is/parets-fs-a"
  },

  {
    equip: "Infantil B",
    url: "https://www.fcf.cat/equip/2526/3is/parets-fs-b"
  },

  {
    equip: "Aleví A",
    url: "https://www.fcf.cat/equip/2526/1sa/parets-fs-a"
  },

  {
    equip: "Aleví B",
    url: "https://www.fcf.cat/equip/2526/2sa/parets-fs-b"
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

async function obtenirPartit(url, equipNom) {

  try {

    const { data } = await axios.get(url, {
      timeout: 10000
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

      if (equips.length < 2) continue;

      const local = equips.eq(0)
        .text()
        .trim();

      const visitant = equips.eq(1)
        .text()
        .trim();

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
// /EQUIP/
// IGNORAR PARTITS JA JUGATS
// =====================================

if (
  esPaginaEquip &&
  /\d+\s*-\s*\d+/.test(marcador)
) {
  continue;
}

      // =====================================
      // SI ÉS /RESULTATS/
      // IGNORAR PARTITS JUGATS
      // =====================================

if (
  marcador.match(/\d+\s*-\s*\d+/)
) {
  continue;
}

      // =====================================
      // DATA
      // =====================================

      const dataPartit = $(el)
        .find(".lh-data")
        .text()
        .trim();

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

    return [];

  }

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
const partitsInicials =
  await obtenirPartit(
    cat.url,
    cat.equip
  );

totsPartits.push(...partitsInicials);

// jornades extra
if (cat.url.includes("/resultats/")) {

  for (let jornada = 2; jornada <= 15; jornada++) {

 const urlBase =
  cat.url.replace(/\/jornada-\d+/, "");

const urlJornada =
  `${urlBase}/jornada-${jornada}`;

    console.log(
      `➡️ Provant jornada ${jornada}:`,
      urlJornada
    );

    const partitsJornada =
      await obtenirPartit(
        urlJornada,
        cat.equip
      );

    if (partitsJornada.length) {

      totsPartits.push(...partitsJornada);

    }

  }

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
    txt.match(/(\d{2})\/(\d{2})\/(\d{4})/);

  if (!match) return Infinity;

  const [, d, m, y] = match;

  return new Date(
    `${y}-${m}-${d}T${hora}`
  ).getTime();

};

return parseData(a) - parseData(b);

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

app.listen(PORT, () => {

  console.log(
    `Servidor partits actiu a port ${PORT}`
  );

});