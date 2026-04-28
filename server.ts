import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Mock Remote Sites Data (36 sites for Parliament of Tasmania)
  const sitePrefixes = ["Hobart", "Launceston", "Devonport", "Burnie", "Kingston", "Ulverstone", "Sorell", "George Town", "Wynyard", "New Norfolk"];
  const sites = Array.from({ length: 36 }).map((_, i) => ({
    id: `gateway-${i + 1}`,
    name: `${sitePrefixes[i % sitePrefixes.length]} Gateway ${Math.floor(i / sitePrefixes.length) + 1}`,
    url: "https://google.com", // Simplified for demo
    location: i < 5 ? "Metropolitan" : "Regional Tasmania"
  }));

  app.get("/api/sites", async (req, res) => {
    const siteStatuses = await Promise.all(
      sites.map(async (site) => {
        try {
          const start = Date.now();
          await axios.get(site.url, { timeout: 3000 });
          return { ...site, status: "online", latency: Date.now() - start };
        } catch (error) {
          return { ...site, status: "offline", latency: null };
        }
      })
    );
    res.json(siteStatuses);
  });

  // Freshservice API Proxy
  app.get("/api/freshservice/analytics", async (req, res) => {
    const { FRESHSERVICE_DOMAIN, FRESHSERVICE_API_KEY } = process.env;

    if (!FRESHSERVICE_DOMAIN || !FRESHSERVICE_API_KEY) {
      // Mock data if credentials are missing
      return res.json({
        mock: true,
        summary: {
          open: 28,
          pending: 14,
          resolved: 42,
          closed: 35,
          overdue: 5,
          avg_response_time: "2.4h"
        },
        agents: [
          { id: "a1", name: "Sarah Connor", resolved: 12, open: 3, avatar: "SC" },
          { id: "a2", name: "John Doe", resolved: 8, open: 5, avatar: "JD" },
          { id: "a3", name: "Ellen Ripley", resolved: 15, open: 2, avatar: "ER" },
          { id: "a4", name: "Arthur Dent", resolved: 4, open: 8, avatar: "AD" },
        ],
        trends: [
          { name: "Mon", tickets: 12 },
          { name: "Tue", tickets: 19 },
          { name: "Wed", tickets: 15 },
          { name: "Thu", tickets: 22 },
          { name: "Fri", tickets: 30 },
          { name: "Sat", tickets: 5 },
          { name: "Sun", tickets: 8 },
        ]
      });
    }

    try {
      const authHeader = `Basic ${Buffer.from(`${FRESHSERVICE_API_KEY}:X`).toString("base64")}`;
      const domain = FRESHSERVICE_DOMAIN.replace(/\/$/, "");
      
      // Note: In a real app, you'd fetch real metrics from Freshservice endpoints
      // like /api/v2/tickets?filter=all_tickets
      // For this demo, we'll fetch a small snippet and aggregate if possible, 
      // but usually Freshservice analytics might need multiple calls.
      const ticketsResponse = await axios.get(`https://${domain}/api/v2/tickets?per_page=100`, {
        headers: { Authorization: authHeader }
      });

      res.json({
        mock: false,
        tickets: ticketsResponse.data.tickets
      });
    } catch (error) {
      console.error("Freshservice API Error:", error);
      res.status(500).json({ error: "Failed to fetch Freshservice data" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
