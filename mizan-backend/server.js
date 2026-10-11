require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const { sequelize } = require("./src/models");

const peseeRoutes = require("./src/routes/peseeRoutes");
const ticketRoutes = require("./src/routes/ticketRoutes");
const marchandiseRoutes = require("./src/routes/marchandiseRoutes");
const chauffeurRoutes = require("./src/routes/chauffeurRoutes");
const camionRoutes = require("./src/routes/camionRoutes");
const prestationRoutes = require("./src/routes/prestationRoutes");
const authRoutes = require("./src/routes/authRoutes");
const prestationAutorisationRoutes =
  require("./src/routes/prestationAutorisationRoutes");
const rdvRoutes = require("./src/routes/rdvRoutes");
const app = express();

const server = http.createServer(app);

const PORT = Number(process.env.PORT) || 5000;

/*
 * ============================================================
 * SOCKET.IO
 * ============================================================
 */

const io = new Server(server, {
  cors: {
    origin: true,
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(
    `[SOCKET] Client connecté : ${socket.id}`
  );

  socket.on("weight-update", (data) => {
    if (
      !data ||
      data.poids === undefined ||
      data.poids === null
    ) {
      return;
    }

    const poids = Number(data.poids);

    if (!Number.isFinite(poids)) {
      return;
    }

    const payload = {
      poids,
      statut: data.statut || "STABLE",
      timestamp:
        data.timestamp || new Date().toISOString(),
    };

    console.log(
      "[PONT-BASCULE] Poids reçu :",
      payload
    );

    /*
     * Redistribution à tous les clients React.
     */
    io.emit("weight-update", payload);
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `[SOCKET] Client déconnecté : ${socket.id} (${reason})`
    );
  });
});

/*
 * ============================================================
 * MIDDLEWARES
 * ============================================================
 */

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);


/*
 * ============================================================
 * UPLOADS
 * ============================================================
 */

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

/*
 * ============================================================
 * HEALTH CHECK
 * ============================================================
 */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "MIZAN Backend opérationnel.",
  });
});

app.get("/api/health", async (req, res) => {
  try {
    await sequelize.authenticate();

    return res.json({
      success: true,
      database: "connected",
      server: "running",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      database: "error",
      error: error.message,
    });
  }
});

/*
 * ============================================================
 * ROUTES API
 * ============================================================
 */
app.use(
  "/api/auth",
  authRoutes
);
app.use(
  "/api/pesee",
  peseeRoutes
);

app.use(
  "/api/tickets",
  ticketRoutes
);

app.use(
  "/api/marchandises",
  marchandiseRoutes
);

app.use(
  "/api/chauffeurs",
  chauffeurRoutes
);

app.use(
  "/api/camions",
  camionRoutes
);
app.use(
  "/api/prestations",
  prestationRoutes
);
app.use(
  "/api/prestation-autorisations",
  prestationAutorisationRoutes
);
app.use("/api/rendez-vous", rdvRoutes);

/*
 * ============================================================
 * 404
 * ============================================================
 */

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route introuvable.",
    path: req.originalUrl,
  });
});

/*
 * ============================================================
 * ERROR HANDLER
 * ============================================================
 */

app.use((error, req, res, next) => {
  console.error(
    "Erreur serveur :",
    error
  );

  return res.status(500).json({
    success: false,
    message: "Erreur interne du serveur.",
    error: error.message,
  });
});

/*
 * ============================================================
 * START
 * ============================================================
 */

async function startServer() {
  try {
    await sequelize.authenticate();

    console.log(
      "========================================"
    );

    console.log(
      " PostgreSQL + Sequelize"
    );

    console.log(
      " Connexion établie avec succès"
    );

    console.log(
      "========================================"
    );


    server.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `MIZAN Backend : http://localhost:${PORT}`
        );

        console.log(
          `MIZAN réseau  : http://10.20.30.11:${PORT}`
        );

        console.log(
          `Socket.IO     : http://10.20.30.11:${PORT}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Impossible de démarrer le serveur."
    );

    console.error(error);

    process.exit(1);
  }
}

startServer();

module.exports = {
  app,
  server,
  io,
};