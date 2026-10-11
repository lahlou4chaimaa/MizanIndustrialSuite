const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const path = require("path");


const marchandiseRoutes =
    require("./routes/marchandiseRoutes");

const authRoutes =
    require("./routes/authRoutes");

const camionRoutes =
    require("./routes/camionRoutes");

const chauffeurRoutes =
    require("./routes/chauffeurRoutes");

const ticketRoutes =
    require("./routes/ticketRoutes");

const peseeRoutes =
    require("./routes/peseeRoutes");

const prestationRoutes =
    require("./routes/prestationRoutes");
const prestationAutorisationRoutes = require("./routes/prestationAutorisationRoutes");

const app = express();

app.use(
    cors({
        origin:
            process.env.FRONTEND_URL ||
            "http://localhost:5173",

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

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| UPLOADS
|--------------------------------------------------------------------------
*/

app.use(
    "/uploads",
    express.static(
        path.join(
            __dirname,
            "uploads"
        )
    )
);

/*
|--------------------------------------------------------------------------
| API
|--------------------------------------------------------------------------
*/


app.use(
    "/api/marchandises",
    marchandiseRoutes
);
app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/camions",
    camionRoutes
);

app.use(
    "/api/chauffeurs",
    chauffeurRoutes
);

app.use(
    "/api/tickets",
    ticketRoutes
);

app.use(
    "/api/pesee",
    peseeRoutes
);

app.use(
    "/api/prestations",
    prestationRoutes
);
app.use(
    "/api/prestation-autorisations",
    prestationAutorisationRoutes
);
/*
|--------------------------------------------------------------------------
| HEALTH
|--------------------------------------------------------------------------
*/

app.get(
    "/health",
    (req, res) => {
        res.status(200).json({
            status: "OK",

            service:
                "Mizan Backend System",

            timestamp:
                new Date(),
        });
    }
);

app.get(
    "/",
    (req, res) => {
        res.status(200).json({
            message:
                "Bienvenue sur API Mizan - Système Portuaire de Pesée",

            documentation:
                "/health",
        });
    }
);

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use(
    (req, res) => {
        res.status(404).json({
            error:
                "Route non trouvée",
        });
    }
);

module.exports = app;