const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('events', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    hash_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    vender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    event_category_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    time: {
      type: DataTypes.TIME,
      allowNull: false
    },
    utc_date_time: {
      type: DataTypes.DATE,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    venue_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    address: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    latitude: {
      type: DataTypes.DOUBLE(10, 6),
      allowNull: false,
      defaultValue: 0.000000
    },
    longitude: {
      type: DataTypes.DOUBLE(10, 6),
      allowNull: false,
      defaultValue: 0.000000
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0=>pendind,1=>ongoing,2=>complete,3=>cancel"
    }
  }, {
    sequelize,
    tableName: 'events',
    timestamps: true,
    paranoid: true,
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
