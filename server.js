import express from "express";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";

const app = express();
app.use(cors());

// 🔥 LLIGUES
const URLS = {
  masculi: "https://www.fcf.cat/classificacio/2526/futbol-sala/lliga-divisio-honor-catalana-futbol-sala/bcn-gr-1",
  femeni: "https://www.fcf.cat/classificacio/2526/futbol-sala-femeni/lliga-primera-divisio-femeni-futbol-sala/bcn-gr-1"
};

// 🔥 CACHE per cada lliga
let cache = {};
let lastFetch = {};

// 🔥 ENDPOINT DINÀMIC
app.get("/api/classificacio/:lliga", async (req, res) => {

  const lliga = req.params.lliga;
  const URL = URLS[lliga];

  if (!URL) {
    return res.status(404).json({ error: "Lliga no trobada" });
  }

  // 👉 cache per lliga
  if (
    cache[lliga] &&
    Date.now() - (lastFetch[lliga] || 0) < 60000
  ) {
    return res.json(cache[lliga]);
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
        logo: escut
      });
    });

    // 👉 guardar cache per lliga
    cache[lliga] = equips;
    lastFetch[lliga] = Date.now();

    res.json(equips);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error obtenint dades" });
  }
});

// 👇 ROOT (opcional)
app.get("/", (req, res) => {
  res.send("API classificació activa 🚀");
});

// 👇 PORT (Render)
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Servidor corrent al port " + PORT);
});