module.exports = (sequelize, Sequelize) => {
    const convinceAndCalm = sequelize.define('convinceAndCalm', {
        convinceAndCalm_Id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            required: true,
            unique: true,
            allowNull: false,
        },
        employeeId: {
            type: Sequelize.INTEGER
        },
        employeeName: {
            type: Sequelize.STRING(255)
        },
        // from: {
        //     type: Sequelize.STRING(500)
        // },
        // whereTo: {
        //     type: Sequelize.STRING(500)
        // },
        cdate: {
            type: Sequelize.DATE
        },
        udate: {
            type: Sequelize.DATE
        },
        // vehicleType: {
        //     type: Sequelize.STRING(500)
        // },
        status:{
            type: Sequelize.STRING(255)
        },
        // km:{
        //     type: Sequelize.INTEGER
        // },
        // comment:{
        //     type: Sequelize.STRING(1000)
        // },
        reason: {
            type: Sequelize.STRING(500)
        },
        totalAmount:{
            type: Sequelize.INTEGER
        },
        travelData:{
            type: Sequelize.JSON,
            default:[]
        },
        employeeManagerData:{
            type: Sequelize.JSON,
            default:[]
        }
    }, {
        timestamps: true,
    });
    convinceAndCalm.sync({alter:true});
    return convinceAndCalm;
}