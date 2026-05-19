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

const CACHE_TIME = 0; // 15 min

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
    url: ""
  },

  {
    equip: "Infantil A",
    url: "https://www.fcf.cat/calendari-equip/2526/futbol-sala/lliga-segona-divisio-infantil-futbol-sala/bcn-gr1/parets-fs-a"
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
    url: ""
  },

  {
    equip: "Prebenjamí A",
    url: ""
  },

  {
    equip: "Miniprebenjamí A",
    url: ""
  }

];

// =====================================
// OBTENIR PARTIT
// =====================================

async function obtenirPartitEquip(url, equipNom) {

  try {

    const { data } = await axios.get(url, {
      timeout: 10000
    });

    const $ = cheerio.load(data);
    
    console.log(data.substring(0, 5000));

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
// RESULTATS
// =====================================

async function obtenirPartitResultats(url, equipNom) {

  return await obtenirPartitEquip(
    url,
    equipNom
  );

}

// =====================================
// CALENDARI
// =====================================

async function obtenirPartitCalendari(url, equipNom) {

  try {

    const { data } = await axios.get(url, {
      timeout: 10000
    });

    const $ = cheerio.load(data);

    const files =
      $(".table_resultats tr");

    if (!files.length) return [];

    const partits = [];

    for (const el of files) {

      const equips = $(el)
        .find("a");

      if (equips.length < 2)
        continue;

      const local = equips.eq(0)
        .text()
        .trim();

      const visitant = equips.eq(1)
        .text()
        .trim();

      const esParets =
        local.toLowerCase().includes("parets") ||
        visitant.toLowerCase().includes("parets");

      if (!esParets)
        continue;

      const marcador = $(el)
        .find(".fs-17, .resultat")
        .text()
        .trim()
        .toUpperCase();

      const dataPartit = $(el)
        .find(".lh-data")
        .text()
        .trim();

      const imgs = $(el)
        .find("img");

      const logoLocal =
        imgs.eq(0).attr("src") || "";

      const logoVisitant =
        imgs.eq(1).attr("src") || "";

      const esResultat =
        /\d+\s*-\s*\d+/.test(marcador);

      const esCasa =
        local.toLowerCase()
        .includes("parets");

      partits.push({

        equip: equipNom,

        competicio: "Calendari",

        local,
        visitant,

        hora: marcador,

        data: dataPartit,

        jugat: esResultat,

        esCasa,

        logoLocal,
        logoVisitant

      });

    }

    // =====================================
    // ORDENAR PER PROXIMITAT
    // =====================================

    const ara = new Date();

    partits.sort((a, b) => {

      const parseData = (partit) => {

        if (!partit.data)
          return Infinity;

        const match =
          partit.data.match(
            /(\d{2})[\/-](\d{2})[\/-](\d{4})/
          );

        if (!match)
          return Infinity;

        const [, d, m, y] = match;

        return new Date(
          `${y}-${m}-${d}`
        ).getTime();

      };

      return Math.abs(
        parseData(a) - ara
      ) - Math.abs(
        parseData(b) - ara
      );

    });

    return [partits[0]];

  } catch (err) {

    console.log(
      "Error calendari:",
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
let partitsInicials = [];

if (cat.url.includes("/resultats/")) {

  partitsInicials =
    await obtenirPartitResultats(
      cat.url,
      cat.equip
    );

}

else if (
  cat.url.includes("/calendari-equip/")
) {

  partitsInicials =
    await obtenirPartitCalendari(
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
  await obtenirPartitResultats(
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
    txt.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/)

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