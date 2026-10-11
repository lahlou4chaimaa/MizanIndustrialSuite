const { DataTypes, Model } = require("sequelize");

module.exports = (sequelize) => {
    class Zone extends Model {
        static associate(models) {
            Zone.hasMany(models.Prestation, {
                foreignKey: "zone_id",
                as: "prestations",
            });
        }
    }

    Zone.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },

            code: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true,
            },

            nom: {
                type: DataTypes.STRING(150),
                allowNull: false,
            },

            type: {
                type: DataTypes.STRING(50),
                allowNull: true,
            },

            description: {
                type: DataTypes.TEXT,
                allowNull: true,
            },

            actif: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true,
            },
        },
        {
            sequelize,
            modelName: "Zone",
            tableName: "zones",
            timestamps: false,
        }
    );

    return Zone;
};