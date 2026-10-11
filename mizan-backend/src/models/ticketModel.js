const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
    class Ticket extends Model {
        static associate(models) {

            // ====================================================
            // TICKET → PESEE
            // ====================================================

            Ticket.belongsTo(models.Pesee, {
                foreignKey: "pesee_id",
                as: "pesee",
            });


            // ====================================================
            // TICKET → CAMION
            // ====================================================

            Ticket.belongsTo(models.Camion, {
                foreignKey: "camion_id",
                as: "camion",
            });


            // ====================================================
            // TICKET → CHAUFFEUR
            // ====================================================

            Ticket.belongsTo(models.Chauffeur, {
                foreignKey: "chauffeur_id",
                as: "chauffeur",
            });


            // ====================================================
            // TICKET → MARCHANDISE
            // ====================================================

            Ticket.belongsTo(models.Marchandise, {
                foreignKey: "marchandise_id",
                as: "marchandise",
            });


            // ====================================================
            // TICKET → PRESTATION
            //
            // Un ticket peut être créé avant d'être affecté
            // à une prestation.
            //
            // tickets.prestation_id
            //        ↓
            // prestations.id
            // ====================================================

            Ticket.belongsTo(models.Prestation, {
                foreignKey: "prestation_id",
                as: "prestation",
            });
        }
    }


    Ticket.init(
        {
            // ====================================================
            // ID
            // ====================================================

            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },


            // ====================================================
            // NUMERO TICKET
            // ====================================================

            numero_ticket: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },


            // ====================================================
            // QR CODE
            // ====================================================

            qr_code: {
                type: DataTypes.STRING,
                allowNull: false,
                unique: true,
            },


            // ====================================================
            // PESEE
            // ====================================================

            pesee_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
                unique: true,

                references: {
                    model: "pesees",
                    key: "id",
                },

                onUpdate: "CASCADE",
                onDelete: "CASCADE",
            },


            // ====================================================
            // CAMION
            // ====================================================

            camion_id: {
                type: DataTypes.INTEGER,
                allowNull: false,

                references: {
                    model: "camions",
                    key: "id",
                },

                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            },


            // ====================================================
            // CHAUFFEUR
            // ====================================================

            chauffeur_id: {
                type: DataTypes.INTEGER,
                allowNull: true,

                references: {
                    model: "chauffeurs",
                    key: "id",
                },

                onUpdate: "CASCADE",
                onDelete: "SET NULL",
            },


            // ====================================================
            // MARCHANDISE
            // ====================================================

            marchandise_id: {
                type: DataTypes.INTEGER,
                allowNull: true,

                references: {
                    model: "marchandises",
                    key: "id",
                },

                onUpdate: "CASCADE",
                onDelete: "SET NULL",
            },


            // ====================================================
            // PRESTATION
            //
            // NULL AUTORISE
            //
            // Le ticket est créé à la pesée d'entrée.
            // La prestation sera choisie plus tard depuis le PDA.
            // ====================================================

            prestation_id: {
                type: DataTypes.INTEGER,
                allowNull: true,

                references: {
                    model: "prestations",
                    key: "id",
                },

                onUpdate: "CASCADE",
                onDelete: "SET NULL",
            },


            // ====================================================
            // MATRICULE TRACTEUR
            // ====================================================

            matricule_tracteur: {
                type: DataTypes.STRING,
                allowNull: false,
            },


            // ====================================================
            // MATRICULE REMORQUE
            // ====================================================

            matricule_remorque: {
                type: DataTypes.STRING,
                allowNull: true,
            },


            // ====================================================
            // NOM CHAUFFEUR
            // ====================================================

            nom_chauffeur: {
                type: DataTypes.STRING,
                allowNull: true,
            },


            // ====================================================
            // PRENOM CHAUFFEUR
            // ====================================================

            prenom_chauffeur: {
                type: DataTypes.STRING,
                allowNull: true,
            },


            // ====================================================
            // CIN CHAUFFEUR
            // ====================================================

            cin_chauffeur: {
                type: DataTypes.STRING,
                allowNull: true,
            },


            // ====================================================
            // POIDS TARE
            // ====================================================

            poids_tare: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: false,
            },


            // ====================================================
            // POIDS BRUT
            // ====================================================

            poids_brut: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true,
            },


            // ====================================================
            // POIDS NET
            // ====================================================

            poids_net: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true,
            },


            // ====================================================
            // STATUT
            // ====================================================

            statut: {
                type: DataTypes.ENUM(
                    "ENTREE",
                    "ENCOURS",
                    "VALIDE",
                    "ANNULE"
                ),
                allowNull: false,
                defaultValue: "ENTREE",
            },


            // ====================================================
            // DATE ENTREE
            // ====================================================

            date_entree: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },


            // ====================================================
            // DATE SORTIE
            // ====================================================

            date_sortie: {
                type: DataTypes.DATE,
                allowNull: true,
            },
        },
        {
            sequelize,
            modelName: "Ticket",
            tableName: "tickets",

            timestamps: true,
            underscored: true,
        }
    );

    return Ticket;
};