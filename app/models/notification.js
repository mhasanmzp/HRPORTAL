module.exports = (sequelize, Sequelize) => {
    const notification = sequelize.define('notification', {
        notificationId: {
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
        date: {
            type: Sequelize.DATEONLY
        },
        taskId: {
            type: Sequelize.INTEGER
        },
        taskName: {
            type: Sequelize.STRING(255)
        },
        notification: {
            type: Sequelize.STRING(255)
        },
        organisationId: {
            type: Sequelize.INTEGER
        }
    }, {
        timestamps: true,
    });
    notification.sync();
    return notification;
}
