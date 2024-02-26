module.exports = (sequelize, Sequelize) => {
    const StoryTasks = sequelize.define('StoryTasks', {
        taskId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            required: true,
            unique: true,
            allowNull: false,
        },
        assignee: {
            type: Sequelize.INTEGER
        },
        assignor: {
            type: Sequelize.INTEGER
        },
        estimatedHours: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        date: {
            type: Sequelize.DATEONLY
        },
        organisationId: {
            type: Sequelize.INTEGER
        },
        columnId: {
            type: Sequelize.INTEGER
        },
        priority: {
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        taskName: {
            type: Sequelize.STRING(255)
        },
        from: {
            type: Sequelize.BIGINT
        },
        to: {
            type: Sequelize.BIGINT
        },
        projectId: {
            type: Sequelize.INTEGER
        },
        status:{
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        storyId:{
            type: Sequelize.INTEGER
        },
        order:{
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        description:{
            type: Sequelize.TEXT
        },
        reporter:{
            type: Sequelize.INTEGER
        },
        tester:{
            type: Sequelize.INTEGER
        },
        startDate:{
            type: Sequelize.DATEONLY
        },
        dueDate:{
            type: Sequelize.DATEONLY
        },
        completionDate:{
            type: Sequelize.DATE
        },
        taskType:{
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        projectTaskNumber:{
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        reOpened:{
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        onHold:{
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        actualHours:{
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        extraHours:{
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        testingEstimatedHours:{
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        testingActualHours:{
            type: Sequelize.INTEGER,
            defaultValue: 0
        },
        testingStartDate:{
            type: Sequelize.DATE
        },
        testingDueDate:{
            type: Sequelize.DATE
        },
        category:{
            type: Sequelize.INTEGER
        },
        testingDescription: {
            type: Sequelize.STRING(255)
        },
        totalHoursSpent: {
            type: Sequelize.FLOAT
        },
    }, {
        timestamps: true,
    });
    StoryTasks.sync();
    return StoryTasks;
}