const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
    class PrestationCamion extends Model {
        static associate(models) {

            // ====================================================
            // PRESTATION
            // ====================================================

            PrestationCamion.belongsTo(models.Prestation, {
                foreignKey: "prestation_id",
                as: "prestation",
            });


            // ====================================================
            // CAMION
            // ====================================================

            PrestationCamion.belongsTo(models.Camion, {
                foreignKey: "camion_id",
                as: "camion",
            });
        }
    }


    PrestationCamion.init(
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
            // PRESTATION
            // ====================================================

            prestation_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },


            // ====================================================
            // CAMION
            // ====================================================

            camion_id: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },


            // ====================================================
            // QUANTITE PREVUE POUR CE CAMION
            // ====================================================

            quantite_prevue: {
                type: DataTypes.DECIMAL(12, 3),
                allowNull: false,
                defaultValue: 0,
            },


            // ====================================================
            // QUANTITE REALISEE PAR CE CAMION
            // ====================================================

            quantite_realisee: {
                type: DataTypes.DECIMAL(12, 3),
                allowNull: false,
                defaultValue: 0,
            },


            // ====================================================
            // STATUT
            // ====================================================

            statut: {
                type: DataTypes.STRING(50),
                allowNull: false,
                defaultValue: "PLANIFIE",
            },


            // ====================================================
            // DATE AFFECTATION
            // ====================================================

            date_affectation: {
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
            // OBSERVATIONS
            // ====================================================

            observations: {
                type: DataTypes.TEXT,
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
            modelName: "PrestationCamion",
            tableName: "prestation_camions",
            timestamps: false,

            indexes: [
                {
                    unique: true,
                    fields: ["prestation_id", "camion_id"],
                },
            ],
        }
    );

    return PrestationCamion;
};