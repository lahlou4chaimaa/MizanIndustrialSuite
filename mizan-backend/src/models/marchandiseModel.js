const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize) => {
    class Marchandise extends Model {
        static associate(models) {
            Marchandise.hasMany(models.Pesee, {
                foreignKey: 'marchandise_id',
                as: 'pesees'
            });

            Marchandise.hasMany(models.Ticket, {
                foreignKey: 'marchandise_id',
                as: 'tickets'
            });
            Marchandise.hasMany(models.Prestation, {
                foreignKey: "marchandise_id",
                as: "prestations",
            });
        }
    }

    Marchandise.init(
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true
            },

            code: {
                type: DataTypes.STRING(50),
                allowNull: false,
                unique: true
            },

            nom: {
                type: DataTypes.STRING(150),
                allowNull: false
            },

            description: {
                type: DataTypes.TEXT,
                allowNull: true
            },

            unite: {
                type: DataTypes.STRING(30),
                allowNull: false,
                defaultValue: 'kg'
            },

            actif: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: true
            },

            created_at: {
                type: DataTypes.DATE,
                allowNull: false,
                defaultValue: DataTypes.NOW
            }
        },
        {
            sequelize,
            modelName: 'Marchandise',
            tableName: 'marchandises',
            timestamps: false
        }
    );

    return Marchandise;
};