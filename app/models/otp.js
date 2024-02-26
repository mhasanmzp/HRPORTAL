module.exports = (sequelize, Sequelize) => {
    const Otp = sequelize.define('Otp', {
        otpId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            required: true,
            unique: true,
            allowNull: false,
        },
        otp:{
            type: Sequelize.INTEGER,
        },
        date:{
            type: Sequelize.DATE
        },
        employeeId:{
            type: Sequelize.STRING(50)
        },
    }, {
        timestamps: true,
    });
    Otp.sync();
    return Otp;
}