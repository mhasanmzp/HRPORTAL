module.exports = (sequelize, Sequelize) => {
    const Department = sequelize.define('Department', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            required: true,
            unique: true,
            allowNull: false,
        },
        name: {
            type: Sequelize.STRING(250)
        }
    },{
        timestamps: false,
    });
    Department.sync({alter:false});
    return Department;
}