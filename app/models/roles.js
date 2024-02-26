module.exports = (sequelize, Sequelize) => {
    const roles = sequelize.define('roles', {
        id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
            required: true,
            unique: true
        },
        roleName: {
            type: Sequelize.STRING
        },
    }, {
        timestamps: true,
    });
    roles.sync();
    return roles;
}