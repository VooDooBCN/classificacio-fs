import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

// 🔥 CACHE
let cache = {};
let lastFetch = {};

app.get("/api/classificacio", async (req, res) => {

  const url = req.query.url;

  if (!url) {
    return res.status(400).json({ error: "Falta URL" });
  }

  // 🔒 SEGURETAT
  if (!url.includes("fcf.cat")) {
    return res.status(403).json({ error: "URL no permesa" });
  }

  // 🔥 CACHE
  if (cache[url] && Date.now() - (lastFetch[url] || 0) < 60000) {
    return res.json(cache[url]);
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

    // 👉 guardar cache
    cache[url] = equips;
    lastFetch[url] = Date.now();

    res.json(equips);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint dades" });
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