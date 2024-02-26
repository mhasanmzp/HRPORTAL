module.exports = (sequelize, Sequelize) => {
    const Appraisal = sequelize.define('Appraisal', {
        appraisalId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            required: true,
            unique: true,
            allowNull: false,
        },
        employeeId: {
            type: Sequelize.INTEGER,
            required:true,
            allowNull:false
        },
        createdAt: {
            type: Sequelize.DATE
        },
        communicationSkill: {
            type:Sequelize.INTEGER
        },
        communicationSkillRemarks: {
            type:Sequelize.STRING(255)
        },
        interpersonalSkill: {
            type:Sequelize.INTEGER
        },
        interpersonalSkillRemarks: {
            type:Sequelize.STRING(255)
        },
        abilityToPlanTheWork: {
            type:Sequelize.INTEGER
        },
        abilityToPlanTheWorkRemarks: {
            type:Sequelize.STRING(255)
        },
        problemSolving: {
            type:Sequelize.INTEGER
        },
        problemSolvingRemarks: {
            type:Sequelize.STRING(255)
        },
        adaptability: {
            type:Sequelize.INTEGER
        },
        adaptabilityRemarks: {
            type:Sequelize.STRING(255)
        },
        willingnessToShoulderAdditional: {
            type:Sequelize.INTEGER
        },
        willingnessToShoulderAdditionalRemarks: {
            type:Sequelize.STRING(255)
        },
        commitmentToDoAPerfectJob: {
            type:Sequelize.INTEGER
        },
        commitmentToDoAPerfectJobRemarks: {
            type:Sequelize.STRING(255)
        },
        habitsAndManners: {
            type:Sequelize.INTEGER
        },
        habitsAndMannersRemarks: {
            type:Sequelize.STRING(255)
        },
        presentation: {
            type:Sequelize.INTEGER
        },
        presentationRemarks: {
            type:Sequelize.STRING(255)
        },
        punctuality: {
            type:Sequelize.INTEGER
        },
        punctualityRemarks: {
            type:Sequelize.STRING(255)
        },
        confidentialityOfInfo: {
            type:Sequelize.INTEGER
        },
        confidentialityOfInfoRemarks: {
            type:Sequelize.STRING(255)
        },
        trustworthiness: {
            type:Sequelize.INTEGER
        },
        trustworthinessRemarks: {
            type:Sequelize.STRING(255)
        },
        teamSpirit: {
            type:Sequelize.INTEGER
        },
        teamSpiritRemarks: {
            type:Sequelize.STRING(255)
        },
        relationshipWithColleagues: {
            type:Sequelize.INTEGER
        },
        relationshipWithColleaguesRemarks: {
            type:Sequelize.STRING(255)
        },
        decisionMaking: {
            type:Sequelize.INTEGER
        },
        decisionMakingRemarks: {
            type:Sequelize.STRING(255)
        },
        computerskills: {
            type:Sequelize.INTEGER
        },
        computerskillsRemarks: {
            type:Sequelize.STRING(255)
        },
        L2FSQoW_1: {     //At level 2 FUNCTIONAL SKILLS Quality of Work Field-1-Accuracy, neatness and timeliness of work
            type:Sequelize.INTEGER
        },
        L2FSQoW_2: {
            type:Sequelize.INTEGER
        },
        L2FSQoW_3: {
            type:Sequelize.INTEGER
        },
        L2FSWH_1: {
            type:Sequelize.INTEGER
        },
        L2FSWH_2: {
            type:Sequelize.INTEGER
        },
        L2FSWH_3: {
            type:Sequelize.INTEGER
        },
        L2FSWH_4: {
            type:Sequelize.INTEGER
        },
        L2FSJK_1: {
            type:Sequelize.INTEGER
        },
        L2FSJK_2: {
            type:Sequelize.INTEGER
        },
        L2FSJK_3: {
            type:Sequelize.INTEGER
        },
        L2FSRemarks: {
            type:Sequelize.STRING(255)
        },
        L2ISIR_1: {
            type:Sequelize.INTEGER
        },
        L2ISIR_2: {
            type:Sequelize.INTEGER
        },
        L2ISIR_3: {
            type:Sequelize.INTEGER
        },
        L2ISIR_4: {
            type:Sequelize.INTEGER
        },
        L2ISIR_5: {
            type:Sequelize.INTEGER
        },
        L2ISIRRemarks: {
            type:Sequelize.STRING(255)
        },
        L2LSL_1:{
            type:Sequelize.INTEGER
        },
        L2LSL_2:{
            type:Sequelize.INTEGER
        },
        L2LSL_3:{
            type:Sequelize.INTEGER
        },
        L2LSLRemarks:{
            type:Sequelize.STRING(255)
        },
        L3FSQoW_1: {     //At level 3 FUNCTIONAL SKILLS Quality of Work Field-1-Accuracy, neatness and timeliness of work
            type:Sequelize.INTEGER
        },
        L3FSQoW_2: {
            type:Sequelize.INTEGER
        },
        L3FSQoW_3: {
            type:Sequelize.INTEGER
        },
        L3FSWH_1: {
            type:Sequelize.INTEGER
        },
        L3FSWH_2: {
            type:Sequelize.INTEGER
        },
        L3FSWH_3: {
            type:Sequelize.INTEGER
        },
        L3FSWH_4: {
            type:Sequelize.INTEGER
        },
        L3FSJK_1: {
            type:Sequelize.INTEGER
        },
        L3FSJK_2: {
            type:Sequelize.INTEGER
        },
        L3FSJK_3: {
            type:Sequelize.INTEGER
        },
        L3FSRemarks: {
            type:Sequelize.STRING(255)
        },
        L3ISIR_1: {
            type:Sequelize.INTEGER
        },
        L3ISIR_2: {
            type:Sequelize.INTEGER
        },
        L3ISIR_3: {
            type:Sequelize.INTEGER
        },
        L3ISIR_4: {
            type:Sequelize.INTEGER
        },
        L3ISIR_5: {
            type:Sequelize.INTEGER
        },
        L3ISIRRemarks: {
            type:Sequelize.STRING(255)
        },
        L3LSL_1:{
            type:Sequelize.INTEGER
        },
        L3LSL_2:{
            type:Sequelize.INTEGER
        },
        L3LSL_3:{
            type:Sequelize.INTEGER
        },
        L3LSLRemarks:{
            type:Sequelize.STRING(255)
        },
        status:{
            type: Sequelize.STRING(255)
        },
        employeeOverallPercentage:{
            type: Sequelize.INTEGER
        },
        L2_ManagersOverallPercentage:{
            type: Sequelize.INTEGER
        },
        L3_OverallPercentage:{
            type: Sequelize.INTEGER
        },
        employeeOverallRating:{
            type: Sequelize.STRING(255)
        },
        L2_ManagersOverallRating:{
            type: Sequelize.STRING(255)
        },
        L3_OverallRating:{
            type: Sequelize.STRING(255)
        },
        employeeTotalScore:{
            type: Sequelize.INTEGER
        },
        L2_ManagersTotalScore:{
            type: Sequelize.INTEGER
        },
        L3_TotalScore:{
            type: Sequelize.INTEGER
        },
        isEditedByEmp:{
            type:Sequelize.BOOLEAN,
            defaultValue: false
        },
        isEditedByL2Manager:{
            type:Sequelize.BOOLEAN,
            defaultValue: false
        },
        isEditedByL3Manager:{
            type:Sequelize.BOOLEAN,
            defaultValue: false
        },
        
    }, {
        timestamps: false,
    });
    Appraisal.sync({alter:false});
    return Appraisal;
}