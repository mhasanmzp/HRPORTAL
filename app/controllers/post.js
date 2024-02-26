const express = require('express');
const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
let moment = require('moment')
const { sequelize, Teams } = require('../../config/db.config.js');
const Op = Sequelize.Op
const db = require('../../config/db.config.js');
const Employees = db.Employees;
const Post = db.Post
const postComments = db.postComments
var multer = require('multer')
const path = require('path')

const storage = multer.diskStorage({
    destination: './images',
    filename: (req, file, cb) => {
        return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
    }
})
const upload = multer({ storage: storage })



module.exports = function (app) {
    const apiRoutes = express.Router();

    apiRoutes.post('/createPost', upload.single('file'), async function (req, res) {
        await Post.create(req.body).then(resp => {
            res.status(200).send(resp)
        }, err => {
            res.status(400).send(err)
        })
    })

    apiRoutes.post('/postUpdate', async function (req, res) {
        await Post.update(req.body, { where: { postId: req.body.postId } }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/deletePost', async function (req, res) {
        await Post.destroy({ where: { postId: req.body.postId } }).then(result => {
            res.status(200).send({ "msg": "Post Deleted" })
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/getAllPost', async function (req, res) {
        sequelize.query(`SELECT e.employeeId, e.imageExists, e.firstName, e.lastName, e.designation, p.createdAt, p.postId, p.postDescription, p.likes
          FROM Employees as e
          INNER JOIN Posts as p
          ON e.employeeId = p.creator AND p.organisationId = '${req.body.organisationId}' ORDER BY createdAt DESC limit 1`,
            {
                type: Sequelize.QueryTypes.SELECT
            }).then(resp => {
                res.send(resp)
            }, err => {
                res.status(400).send(err)
            })
    })

    apiRoutes.post('/createComment', async function (req, res) {
        await postComments.create(req.body).then(resp => {
            res.status(200).send({ "msg": "Comment Created" })
        }, err => {
            res.status(400).send(err)
        })
    })

    apiRoutes.post('/CommentUpdate', async function (req, res) {
        await postComments.update(req.body, { where: { commentId: req.body.commentId } }).then(result => {
            res.status(200).send({ "msg": "Comment Updated" })
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/deleteComment', async function (req, res) {
        await postComments.destroy({ where: { commentId: req.body.commentId } }).then(result => {
            res.status(200).send({ "msg": "Comment Deleted" })
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/getComment', async function (req, res) {
        await postComments.findAll({ where: { postId: req.body.postId } }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })


    app.use('/', apiRoutes);
}