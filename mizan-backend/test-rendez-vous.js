const {
    sequelize,
    RendezVous,
    Chauffeur,
    Camion,
} = require("./src/models");

async function test() {
    try {
        await sequelize.authenticate();

        console.log("Connexion PostgreSQL réussie");

        const rendezVous = await RendezVous.findAll({
            include: [
                {
                    model: Chauffeur,
                    as: "chauffeur",
                    attributes: ["id", "nom", "prenom", "cin"],
                },
                {
                    model: Camion,
                    as: "camion",
                    attributes: [
                        "id",
                        "immatriculation",
                        "immatriculation_remorque",
                        "societe_transport",
                    ],
                },
            ],
            order: [["date_creation", "DESC"]],
        });

        console.log(
            JSON.stringify(rendezVous, null, 2)
        );

        await sequelize.close();
    } catch (error) {
        console.error("Erreur test rendez-vous :", error);
        process.exit(1);
    }
}

test();