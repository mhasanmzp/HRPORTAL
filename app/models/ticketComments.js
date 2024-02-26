module.exports = (sequelize, Sequelize) => {
    const ticketComments = sequelize.define('ticketComments', {
        ticketCommentId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            required: true,
            unique: true,
            allowNull: false,
        },
        ticketComment: {
            type: Sequelize.STRING(50)
        },
        date: {
            type: Sequelize.DATE
        },
        ticketId: {
            type: Sequelize.INTEGER,
            required: true,
            unique: true,
            allowNull: false
        }

    }, {
        timestamps: false,
    });
    ticketComments.sync();
    return ticketComments;
}