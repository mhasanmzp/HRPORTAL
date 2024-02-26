module.exports =  (sequelize, Sequelize) => {
    const Project = sequelize.define('Project', {
        projectId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            required: true,
            unique: true,
            allowNull: false,
        },
        startDate: {
            type: Sequelize.DATE
        },
        projectName: {
            type: Sequelize.STRING(255)
        },
        projectDescription: {
            type: Sequelize.STRING(255)
        },
        projectType: {
            type: Sequelize.STRING(255)
        },
        projectStatus: {
            type: Sequelize.STRING(255)
        },
        clientName: {
            type: Sequelize.STRING(255)
        },
        projectStage: {
            type: Sequelize.STRING(255)
        },
        projectCost: {
            type: Sequelize.INTEGER
        },
        projectEstimatedCost: {
            type: Sequelize.INTEGER
        },
        projectManager: {
            type: Sequelize.JSON,
            defaultValue: []
        },
        sendDailyStatus: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        sendWeeklyStatus: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        sendMonthlyStatus: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        organisationId:{
            type: Sequelize.INTEGER
        },
        customerId:{
            type: Sequelize.INTEGER
        },
        estimatedHours:{
            type: Sequelize.INTEGER
        }
    }, {
        timestamps: true,
    });
    Project.sync();
    return Project;
}
