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

      const nums = clean.filter(c => /^\d+$/.test(c));
      if (nums.length < 6) return;

      const img = $(el).find("img").attr("src");

      let escut = "";
      if (img) {
        escut = img.startsWith("http")
          ? img
          : "https://www.fcf.cat" + img;
      }

      equips.push({
        pos: clean[0],
        team: clean[1],
        pts: nums[1],
        j: nums[2],
        g: nums[3],
        e: nums[4],
        p: nums[5],
        f: nums[nums.length - 3],
        c: nums[nums.length - 2],
        logo: escut
      });
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

  const text = $(el).text().replace(/\s+/g, " ").trim();
  const tds = $(el).find("td");

  if (tds.length < 3) return;

  const local = $(tds[1]).text().trim();
  const visitant = $(tds[3]).text().trim();

  if (!local || !visitant) return;

  // 🔥 RESULTAT (6 - 1)
  const resultatMatch = text.match(/\d+\s*-\s*\d+/);

  // 🔥 DATA (07-05-2026)
  const dataMatch = text.match(/\d{2}-\d{2}-\d{4}/);

  // 🔥 HORA (21:45)
  const horaMatch = text.match(/\d{2}:\d{2}/);

  partits.push({
    local,
    visitant,
    resultat: resultatMatch ? resultatMatch[0] : "",
    data: dataMatch ? dataMatch[0] : "",
    hora: horaMatch ? horaMatch[0] : ""
  });
});

    // 👉 només guardar si hi ha dades
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