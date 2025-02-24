const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('users', {
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

    role: {
      type: DataTypes.ENUM('0', '1', '2', '3'),
      allowNull: false,
      defaultValue: "0",
      comment: '0=>Admin,1=>Vender,2=>Users,3=>Managers'
    },
    vender_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "For role only"
    },
    gender: {
      type: DataTypes.ENUM('0', '1', '2', '3'),
      allowNull: false,
      defaultValue: "0",
      comment: "0=>undeine,1=>male,2=>female, 3=>other"
    },
    user_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    first_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    last_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ""
    },
    password: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ""
    },
    country_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ""
    },
    phone: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ""
    },
    status: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "1",
      comment: "0=>incative,1=>active"
    },
    login_time: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ""
    },
    country_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    postal_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: ""
    },
    time_zone: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: ""
    },

    social_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    social_type: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "1",
      comment: "1=>google,2=>facebook,3=>apple"
    },
    otp: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: "0101MP"
    },
    otp_verify: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "0",
      comment: "1=> verified,0=>not verified"
    },
    commission: {
      type: DataTypes.DOUBLE(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },

    location: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ""
    },
    latitude: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ""
    },
    longitude: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: ""
    },
    image: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    stripe_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    stripeAccountId: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    hasAccountId: {
      type: DataTypes.ENUM('0','1'),
      allowNull: false,
      defaultValue: "0",
      comment: "1=> verified,0=>not complete"
    },

    bio: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ""
    },
    is_notification: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "1",
      comment: "0=>off,1=>on"
    },
    is_complete: {
      type: DataTypes.ENUM('0', '1'),
      allowNull: false,
      defaultValue: "0",
      comment: '0=>inComplete,1=>Complete'
    },
    socket_id: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ""
    },
    device_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    device_type: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "1=>iOS, 2=>android"
    }
  }, {
    sequelize,
    tableName: 'users',
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
