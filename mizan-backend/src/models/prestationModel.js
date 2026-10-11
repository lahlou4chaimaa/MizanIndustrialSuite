const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
    class Prestation extends Model {
        static associate(models) {

            // ====================================================
            // PRESTATION → CAMION
            // ====================================================

            Prestation.belongsTo(models.Camion, {
                foreignKey: "camion_id",
                as: "camion",
            });


            // ====================================================
            // PRESTATION → CHAUFFEUR
            // ====================================================

            Prestation.belongsTo(models.Chauffeur, {
                foreignKey: "chauffeur_id",
                as: "chauffeur",
            });


            // ====================================================
            // PRESTATION → MARCHANDISE
            // ====================================================

            Prestation.belongsTo(models.Marchandise, {
                foreignKey: "marchandise_id",
                as: "marchandise",
            });


            // ====================================================
            // PRESTATION → ZONE
            // ====================================================

            Prestation.belongsTo(models.Zone, {
                foreignKey: "zone_id",
                as: "zone",
            });


            // ====================================================
            // PRESTATION → TICKETS
            // ====================================================

            Prestation.hasMany(models.Ticket, {
                foreignKey: "prestation_id",
                as: "tickets",
            });


            // ====================================================
            // PRESTATION → PESEES
            // ====================================================

            Prestation.hasMany(models.Pesee, {
                foreignKey: "prestation_id",
                as: "pesees",
            });


            // ====================================================
            // PRESTATION → AUTORISATIONS
            // ====================================================

            Prestation.hasMany(models.PrestationAutorisation, {
                foreignKey: "prestation_id",
                as: "autorisations",
            });



            Prestation.hasMany(models.PrestationCamion, {
                foreignKey: "prestation_id",
                as: "camionsPrestation",
                onDelete: "CASCADE",
            });
            // ====================================================
            // PRESTATION → FACTURATIONS
            //
            // Une prestation peut avoir plusieurs lignes
            // de facturation.
            // ====================================================

            Prestation.hasMany(models.PrestationFacturation, {
                foreignKey: "prestation_id",
                as: "facturations",
                onDelete: "CASCADE",
            });
        }
    }


    Prestation.init(
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
            // NUMERO PRESTATION
            // ====================================================

            numero_prestation: {
                type: DataTypes.STRING(100),
                allowNull: false,
                unique: true,
            },


            // ====================================================
            // DUM
            // Déclaration Unique de Marchandise
            // ====================================================

            dum: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },


            // ====================================================
            // CAMION
            //
            // Conservé pour compatibilité.
            // La relation opérationnelle reste :
            //
            // Camion → Ticket → Prestation
            // ====================================================

            camion_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },


            // ====================================================
            // CHAUFFEUR
            // ====================================================

            chauffeur_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },


            // ====================================================
            // MARCHANDISE
            // ====================================================

            marchandise_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },


            // ====================================================
            // ZONE
            // ====================================================

            zone_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },


            // ====================================================
            // AGENT
            // ====================================================

            agent_id: {
                type: DataTypes.INTEGER,
                allowNull: true,
            },


            // ====================================================
            // TYPE OPERATION
            // ====================================================

            type_operation: {
                type: DataTypes.STRING(100),
                allowNull: true,
            },


            // ====================================================
            // STATUT
            // ====================================================

            statut: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: "CREEE",
            },


            // ====================================================
            // PRIORITE
            // ====================================================

            priorite: {
                type: DataTypes.INTEGER,
                allowNull: false,
                defaultValue: 0,
            },


            // ====================================================
            // QUANTITE PREVUE
            // ====================================================

            quantite_prevue: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true,
            },


            // ====================================================
            // QUANTITE REALISEE
            // ====================================================

            quantite_realisee: {
                type: DataTypes.DECIMAL(12, 2),
                allowNull: true,
                defaultValue: 0,
            },


            // ====================================================
            // UNITE
            // ====================================================

            unite: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },


            // ====================================================
            // EMPLACEMENT
            // ====================================================

            emplacement: {
                type: DataTypes.STRING(255),
                allowNull: true,
            },


            // ====================================================
            // OBSERVATIONS
            // ====================================================

            observations: {
                type: DataTypes.TEXT,
                allowNull: true,
            },


            // ====================================================
            // DATE CREATION
            // ====================================================

            date_creation: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },


            // ====================================================
            // DATE AFFECTATION
            // ====================================================

            date_affectation: {
                type: DataTypes.DATE,
                allowNull: true,
            },


            // ====================================================
            // DATE ARRIVEE CAMION
            // ====================================================

            date_arrivee_camion: {
                type: DataTypes.DATE,
                allowNull: true,
            },


            // ====================================================
            // DATE DEBUT
            // ====================================================

            date_debut: {
                type: DataTypes.DATE,
                allowNull: true,
            },


            // ====================================================
            // DATE FIN
            // ====================================================

            date_fin: {
                type: DataTypes.DATE,
                allowNull: true,
            },


            // ====================================================
            // CREATED AT
            // ====================================================

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },


            // ====================================================
            // UPDATED AT
            // ====================================================

            updated_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW,
            },
        },
        {
            sequelize,
            modelName: "Prestation",
            tableName: "prestations",
            timestamps: false,
        }
    );

    return Prestation;
};