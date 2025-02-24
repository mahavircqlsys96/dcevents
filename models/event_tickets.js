const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('event_tickets', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    type: {
      type: DataTypes.ENUM('0','1','2','3'),
      allowNull: false,
      defaultValue: 0,
      comment: "0=>normal ticket,1=>VIP Ticket,2=>VVIP Ticket"
    },
 
    amount: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
      defaultValue: 0.00
    },
    no_of_tickets: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0.00
    }
  }, {
    sequelize,
    tableName: 'event_tickets',
    timestamps: true,
    indexes: [
      {
        name: "PRIMARY",
        unique: true,
        using: "BTREE",
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};
