module.exports = (sequelize, Sequelize) => {
    const Document = sequelize.define('Document', {
        documentId: {
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
        organisationId: {
            type: Sequelize.INTEGER
        },
        date:{
            type:Sequelize.DATEONLY
        },
        filename:{
            type:Sequelize.STRING(50)
        },
        projectId:{
            type:Sequelize.INTEGER
        },
        originalname:{
            type:Sequelize.STRING(50)
        },
        destination:{
            type:Sequelize.STRING(50)
        },
        size:{
            type:Sequelize.INTEGER
        },
        mimetype:{
            type:Sequelize.STRING(50)
        },
    }, {
        timestamps: false,
    });
    Document.sync();
    return Document;
}