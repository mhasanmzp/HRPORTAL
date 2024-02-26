module.exports = (sequelize, Sequelize) => {
    const ManagerEvaluation = sequelize.define('ManagerEvaluation', {
        appraisalId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            required: true,
            unique: true,
            allowNull: false,
        },
        ManagerId: {
            type: Sequelize.INTEGER,
            required:true,
            allowNull:true
        },
        createdAt: {
            type: Sequelize.DATE
        },
        FSQoW_1: {     //At level 2 FUNCTIONAL SKILLS Quality of Work Field-1-Accuracy, neatness and timeliness of work
            type:Sequelize.INTEGER
        },
        FSQoW_2: {
            type:Sequelize.INTEGER
        },
        FSQoW_3: {
            type:Sequelize.INTEGER
        },
        FSWH_1: {
            type:Sequelize.INTEGER
        },
        FSWH_2: {
            type:Sequelize.INTEGER
        },
        FSWH_3: {
            type:Sequelize.INTEGER
        },
        FSWH_4: {
            type:Sequelize.INTEGER
        },
        FSJK_1: {
            type:Sequelize.INTEGER
        },
        FSJK_2: {
            type:Sequelize.INTEGER
        },
        FSJK_3: {
            type:Sequelize.INTEGER
        },
        FSRemarks: {
            type:Sequelize.STRING(255)
        },
        ISIR_1: {
            type:Sequelize.INTEGER
        },
        ISIR_2: {
            type:Sequelize.INTEGER
        },
        ISIR_3: {
            type:Sequelize.INTEGER
        },
        ISIR_4: {
            type:Sequelize.INTEGER
        },
        ISIR_5: {
            type:Sequelize.INTEGER
        },
        ISIRRemarks: {
            type:Sequelize.STRING(255)
        },
        LSL_1:{
            type:Sequelize.INTEGER
        },
        LSL_2:{
            type:Sequelize.INTEGER
        },
        LSL_3:{
            type:Sequelize.INTEGER
        },
        LSLRemarks:{
            type:Sequelize.STRING(255)
        },
        lastLevelMaxMarks:{
            type: Sequelize.INTEGER
        },
        lastLevelScoredMarks:{
            type: Sequelize.INTEGER
        },
        managersOverallPercentage:{
            type: Sequelize.INTEGER
        },
        managersOverallRating:{
            type: Sequelize.STRING(255)
        },
        managersTotalScore:{
            type: Sequelize.INTEGER
        },
        isEditedByManager:{
            type:Sequelize.BOOLEAN,
            defaultValue: false
        }
        
    }, {
        timestamps: false,
    });
    ManagerEvaluation.sync({alter:true});
    return ManagerEvaluation;
}