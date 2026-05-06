import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

// 🔥 CACHE SEPARAT
let cacheClass = {};
let cacheRes = {};
let lastFetchClass = {};
let lastFetchRes = {};


// ===============================
// 📊 CLASSIFICACIÓ
// ===============================
app.get("/api/classificacio", async (req, res) => {

  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "Falta URL" });
  }

  if (!url.includes("fcf.cat")) {
    return res.status(403).json({ error: "URL no permesa" });
  }

  // 🔥 CACHE
  if (cacheClass[url] && Date.now() - (lastFetchClass[url] || 0) < 60000) {
    return res.json(cacheClass[url]);
  }

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let equips = [];

$("table tbody tr").each((i, el) => {

  const tds = $(el).find("td");

  const cols = tds.map((i, td) => $(td).text().trim()).get();
  const clean = cols.filter(c => c !== "");

  if (!clean[1]) return;

  // 🔥 nums
  const nums = clean.filter(c => /^\d+$/.test(c));

  if (nums.length < 8) return;

  // 🔥 ESCUT
  const img = $(el).find("img").attr("src");

  let escut = "";

  if (img) {
    escut = img.startsWith("http")
      ? img
      : "https://www.fcf.cat" + img;
  }

const teCoeficient = nums.length >= 8;

equips.push({

  pos: clean[0],
  team: clean[1],

  pts: nums[1],

  coef: teCoeficient ? nums[2] : "-",

  j: teCoeficient ? nums[3] : nums[2],
  g: teCoeficient ? nums[4] : nums[3],
  e: teCoeficient ? nums[5] : nums[4],
  p: teCoeficient ? nums[6] : nums[5],

  f: teCoeficient
    ? nums[nums.length - 3]
    : nums[nums.length - 2],

  c: teCoeficient
    ? nums[nums.length - 2]
    : nums[nums.length - 1],

  logo: escut

});

    cacheClass[url] = equips;
    lastFetchClass[url] = Date.now();

    res.json(equips);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint dades" });
  }
});


// ===============================
// ⚽ RESULTATS
// ===============================
app.get("/api/resultats", async (req, res) => {

  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "Falta URL" });
  }

  if (!url.includes("fcf.cat")) {
    return res.status(403).json({ error: "URL no permesa" });
  }

  // 🔥 CACHE
  if (cacheRes[url] && Date.now() - (lastFetchRes[url] || 0) < 60000) {
    return res.json(cacheRes[url]);
  }

  try {
    const { data } = await axios.get(url);
    const $ = cheerio.load(data);

    let partits = [];

    $("tbody tr").each((i, el) => {

      const tds = $(el).find("td");

      if (tds.length < 3) return;

      const local = $(tds[1]).text().trim();
      const visitant = $(tds[3]) ? $(tds[3]).text().trim() : "";

      if (!local || !visitant) return;

      // 🔥 LOGOS
      const imgs = $(el).find("img");

      let logoLocal = "";
      let logoVisitant = "";

      if (imgs.eq(0).attr("src")) {
        const src = imgs.eq(0).attr("src");
        logoLocal = src.startsWith("http")
          ? src
          : "https://www.fcf.cat" + src;
      }

      if (imgs.eq(1).attr("src")) {
        const src = imgs.eq(1).attr("src");
        logoVisitant = src.startsWith("http")
          ? src
          : "https://www.fcf.cat" + src;
      }

      let resultat = "";
      let data = "";
      let hora = "";

      tds.each((i, td) => {

        const txt = $(td).text().replace(/\s+/g, " ").trim();

        // 🔥 RESULTAT
        const resMatch = txt.match(/\b\d{1,2}\s*-\s*\d{1,2}\b/);
        if (resMatch) {
        // 🔥 evitar dates tipus 10-05
        if (!txt.match(/\d{2}-\d{2}-\d{4}/)) {
        resultat = resMatch[0];
        }
      }

        // 🔥 DATA
        const dataMatch = txt.match(/\d{2}-\d{2}-\d{4}/);
        if (dataMatch) data = dataMatch[0].slice(0, 5);

        // 🔥 HORA
        const horaMatch = txt.match(/\b\d{1,2}:\d{2}\b/);
        if (horaMatch) hora = horaMatch[0];

      });

      partits.push({
        local,
        visitant,
        resultat,
        data,
        hora,
        logoLocal,
        logoVisitant
      });

    });

    if (partits.length > 0) {
      cacheRes[url] = partits;
      lastFetchRes[url] = Date.now();
    }

    res.json(partits);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint resultats" });
  }
});


// ROOT
app.get("/", (req, res) => {
  res.send("API classificació activa 🚀");
});

// PORT
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corrent al port " + PORT);
});