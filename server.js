import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

const URL = "https://www.fcf.cat/classificacio/2526/futbol-sala/lliga-divisio-honor-catalana-futbol-sala/bcn-gr-1";

// 🔥 CACHE
let cache = [];
let lastFetch = 0;

app.get("/api/classificacio", async (req, res) => {

  // 👉 si fa menys de 60s, retorna cache
  if (Date.now() - lastFetch < 60000 && cache.length > 0) {
    return res.json(cache);
  }

  try {
    const { data } = await axios.get(URL);
    const $ = cheerio.load(data);

    let equips = [];

    $("table tbody tr").each((i, el) => {
      const tds = $(el).find("td");

      const cols = tds.map((i, td) => $(td).text().trim()).get();
      const clean = cols.filter(c => c !== "");

      if (!clean[1]) return;

      const nums = clean.filter(c => /^\d+$/.test(c));
      if (nums.length < 6) return;

      // 🔥 ESCUT
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
        logo: escut   // 👈 AFEGIT
      });
    });

    // 👉 guardar cache
    cache = equips;
    lastFetch = Date.now();

    res.json(equips);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint dades" });
  }
});

app.listen(3000, () => {
  console.log("Servidor corrent a http://localhost:3000");
});