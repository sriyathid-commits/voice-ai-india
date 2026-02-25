import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("bharat.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS schemes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT NOT NULL,
    eligibility TEXT NOT NULL,
    benefits TEXT NOT NULL,
    state TEXT DEFAULT 'Central',
    language TEXT DEFAULT 'English'
  );

  CREATE TABLE IF NOT EXISTS portal_status (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    status TEXT DEFAULT 'Online',
    last_checked DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed data if empty
const schemeCount = db.prepare("SELECT count(*) as count FROM schemes").get() as { count: number };
if (schemeCount.count === 0) {
  const insertScheme = db.prepare("INSERT INTO schemes (name, category, description, eligibility, benefits, state) VALUES (?, ?, ?, ?, ?, ?)");
  
  insertScheme.run(
    "PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)",
    "Agriculture",
    "A central sector scheme to provide income support to all landholding farmers' families in the country to supplement their financial needs for procuring various inputs related to agriculture and allied activities.",
    "All landholding farmers' families.",
    "₹6,000 per year in three equal installments.",
    "Central"
  );

  insertScheme.run(
    "Ayushman Bharat (PM-JAY)",
    "Healthcare",
    "The world's largest health insurance/ assurance scheme fully financed by the government. It provides a cover of ₹5 lakhs per family per year for secondary and tertiary care hospitalization.",
    "Poor and vulnerable families based on SECC 2011 data.",
    "₹5 lakh health cover per family per year.",
    "Central"
  );

  insertScheme.run(
    "Pradhan Mantri Awas Yojana (PMAY)",
    "Housing",
    "An initiative by the Government of India in which affordable housing will be provided to the urban poor with a target of building 2 crore affordable houses by 31 March 2022.",
    "Economically Weaker Section (EWS), Low Income Group (LIG), and Middle Income Group (MIG).",
    "Interest subsidy on home loans.",
    "Central"
  );

  insertScheme.run(
    "Janani Suraksha Yojana (JSY)",
    "Healthcare",
    "A safe motherhood intervention under the National Health Mission (NHM). It is being implemented with the objective of reducing maternal and neonatal mortality by promoting institutional delivery among poor pregnant women.",
    "All pregnant women delivering in government health centers.",
    "Cash assistance for institutional delivery.",
    "Central"
  );

  insertScheme.run(
    "Kanya Sumangala Yojana",
    "Education",
    "A conditional cash transfer scheme to ensure social security to the girl child and prevent female foeticide.",
    "Residents of Uttar Pradesh with a girl child.",
    "₹15,000 in six stages from birth to graduation.",
    "Uttar Pradesh"
  );

  insertScheme.run(
    "Rythu Bandhu",
    "Agriculture",
    "A welfare program to support farmer's investment for two crops a year by the Government of Telangana.",
    "All land-owning farmers in Telangana.",
    "₹5,000 per acre per season.",
    "Telangana"
  );

  insertScheme.run(
    "Magalir Urimai Thogai",
    "Social Welfare",
    "A monthly financial assistance scheme for women heads of households in Tamil Nadu.",
    "Women heads of families with annual income below ₹2.5 lakh.",
    "₹1,000 per month.",
    "Tamil Nadu"
  );

  insertScheme.run(
    "Orunodoi Scheme",
    "Poverty Alleviation",
    "A major scheme of the Government of Assam to provide financial assistance to the indigent families of the state.",
    "Permanent residents of Assam with annual income less than ₹2 lakh.",
    "₹1,250 per month transferred directly to the bank account of the female head of the family.",
    "Assam"
  );
}

const portalCount = db.prepare("SELECT count(*) as count FROM portal_status").get() as { count: number };
if (portalCount.count === 0) {
  const insertPortal = db.prepare("INSERT INTO portal_status (name, url, status) VALUES (?, ?, ?)");
  insertPortal.run("National Portal of India", "https://india.gov.in", "Online");
  insertPortal.run("DBT Bharat", "https://dbtbharat.gov.in", "Online");
  insertPortal.run("MyGov", "https://mygov.in", "Online");
  insertPortal.run("Digital India", "https://digitalindia.gov.in", "Online");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/schemes", (req, res) => {
    const { state, category } = req.query;
    let query = "SELECT * FROM schemes WHERE 1=1";
    const params = [];

    if (state) {
      query += " AND (state = ? OR state = 'Central')";
      params.push(state);
    }
    if (category) {
      query += " AND category = ?";
      params.push(category);
    }

    const schemes = db.prepare(query).all(...params);
    res.json(schemes);
  });

  app.get("/api/portals", (req, res) => {
    const portals = db.prepare("SELECT * FROM portal_status").all();
    res.json(portals);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
