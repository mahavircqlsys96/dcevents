const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('bookings', {
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    vender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
     random_ticket: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    booking_status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment:"0=Pending,1=Ongoing,2=Completed ,3=Rejected , 4= Cancel"
    },
    cancel_status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0=>no,1=>yes"
    },
    booking_type: {
      type: DataTypes.ENUM('0','1','2'),
      allowNull: false,
      defaultValue: "0",
      comment: "1= cart, 2 = booking"
    },
    
    date: {
      type: DataTypes.DATE,
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(9,2),
      allowNull: false,
      defaultValue: 0.00
    },
    payment_status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "0=>pending,1=>done"
    }
  }, {
    sequelize,
    tableName: 'bookings',
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
      {
        name: "coach_user",
        using: "BTREE",
        fields: [
          { name: "vender_id" },
        ]
      },
      {
        name: "student_user",
        using: "BTREE",
        fields: [
          { name: "user_id" },
        ]
      },
    ]
  });
};
