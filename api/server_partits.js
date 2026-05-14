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

    const competicio = $(".fs-20.va-t")
      .first()
      .text()
      .trim();

    // =====================================
    // TAULA PARTITS
    // =====================================

    const files = esPaginaEquip
      ? $(".table_resultats tr").slice(1, 3)
      : $(".table_resultats tr");

    if (!files.length) return null;

    // =====================================
    // ORDRE FILES
    // =====================================

    const filesArray = esPaginaEquip
      ? files.get()
      : files.get().reverse();

    // =====================================
    // BUSCAR PARTIT
    // =====================================

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
      // SI ÉS /RESULTATS/
      // IGNORAR PARTITS JUGATS
      // =====================================

      if (
        !esPaginaEquip &&
        /\d+\s*-\s*\d+/.test(marcador)
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
        /\d+\s*-\s*\d+/.test(marcador);

      const jugat = esResultat;

      // =====================================
      // ESTATS ESPECIALS
      // =====================================

      const esRetirat =
        marcador === "R";

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
      // RETORNAR PARTIT
      // =====================================

      return {

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

      };

    }

    return null;

  } catch (err) {

    console.log(
      "Error obtenint partit:",
      equipNom
    );

    return null;

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
          // PRIMER SCRAPING
          // =====================================

          let partit =
            await obtenirPartit(
              cat.url,
              cat.equip
            );

          // =====================================
          // SI NO TROBA PARTIT FUTUR
          // PROVAR JORNADA 2
          // =====================================

          if (
            !partit &&
            cat.url.includes("/resultats/")
          ) {

            const urlSeguent =
              `${cat.url}/jornada-2`;

            console.log(
              "➡️ Provant següent jornada:",
              urlSeguent
            );

            partit = await obtenirPartit(
              urlSeguent,
              cat.equip
            );

          }

          if (!partit) return null;

          return partit;

        } catch (err) {

          console.log(
            "Error categoria:",
            cat.equip
          );

          return null;

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