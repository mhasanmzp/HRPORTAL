module.exports = (sequelize, Sequelize) => {
    const Post = sequelize.define('Post', {
        postId: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            required: true,
            unique: true,
            allowNull: false,
        },
        postName: {
            type: Sequelize.TEXT
        },
        postDescription: {
            type: Sequelize.TEXT
        },
        organisationId: {
            type: Sequelize.INTEGER
        },
        creator: {
            type: Sequelize.INTEGER
        },
        likes: {
            type: Sequelize.JSON,
            defaultValue: []
        },
        image: {
            type: Sequelize.TEXT,
          },

    }, {
        timestamps: true,
    });
    Post.sync();
    return Post;
}