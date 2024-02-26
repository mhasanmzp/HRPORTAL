const express = require('express');
const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const { sequelize, Teams, Employees, ProjectMembers } = require('../../config/db.config.js');
const Op = Sequelize.Op
const db = require('../../config/db.config.js');
// const smtp = require('../../config/main');
const notification = require('../models/notification.js');
const ColumnBoard = db.columnBoard
const smtp = require('../../config/main.js');
const fs = require('fs')
const _ = require('lodash')
const Tasks = db.Tasks
const Epic = db.Epic
const Story = db.Story
const StoryTasks = db.StoryTasks
const Project = db.Project
const Notification = db.notification
const Sprint = db.Sprint
const Notes = db.Notes
const Report = db.Report
const requestTicket = db.requestTicket
const clientDetail = db.clientDetails
const apiRoutes = express.Router();
const nodemailer = require('nodemailer');
const storyTasks = require('../models/storyTasks.js');
const columnBoard = require('../models/columnBoard.js');
const projectMembers = require('../models/projectMembers.js');
const logs = require('../middleware/logs')
// let smtpAuth = {
//     user: "support@timesofpeople.com",
//     pass: "qwerty@12!Mckinsol"
// }
// let smtpConfig = {
//     host: 'smtp.1and1.com',
//     port: 587,
//     secure: false,
//     auth: smtpAuth
//     //auth:cram_md5
// };
let smtpAuth = {
    user: smtp.smtpuser,
    pass: smtp.smtppass
}
let smtpConfig = {
    host: smtp.smtphost,
    port: smtp.smtpport,
    secure: false,
    auth: smtpAuth
    //auth:cram_md5
};
let transporter = nodemailer.createTransport(smtpConfig);

transporter.verify(function (error, success) {
    if (error) {
        console.log(error);
    }
    // else {
    //     console.log('Server is ready to take our messages');
    // }
});
module.exports = function (app) {

    function mailer(transporter, email, subject, message) {
        // console.log(email, subject, message)
        transporter.sendMail({
            from: {
                name: 'Mckinsol Portal',
                address: 'support@timesofpeople.com'
            },
            to: email,
            subject: `${subject}`,
            html: `${message}`,
        }).then(resp => {
            console.log(resp)
        }, error => {
            console.log(error)
        });
    }
    apiRoutes.post('/createProject', async function (req, res) {
        await Project.create(req.body).then(async result => {
            req.body.members.forEach(p => { p.projectId = result.projectId });

            let projectColumns = [{
                projectId: result.projectId,
                columnName: 'To Do'
            }, {
                projectId: result.projectId,
                columnName: 'In Progress'
            }, {
                projectId: result.projectId,
                columnName: 'Testing'
            }, {
                projectId: result.projectId,
                columnName: 'Done'
            }, {
                projectId: result.projectId,
                columnName: 'Hold'
            }]
            await ColumnBoard.bulkCreate(projectColumns).then(resp => {
            }, error => {
            })

            await ProjectMembers.bulkCreate(req.body.members).then(resp => {
                res.status(200).send(result)
            }, error => {
                res.status(400).send(error)
            })
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/updateProject', async function (req, res) {
        await Project.update(req.body, {
            where: { projectId: req.body.projectId }
        }).then(async result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })

    })

    apiRoutes.post('/fetchAllProjects', async function (req, res) {
        await Project.findAll({ where: { organisationId: req.body.organisationId } }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/getOneProject', async function (req, res) {
        await Project.findOne({ where: { projectId: req.body.projectId } }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/getProjectMembers', async function (req, res) {
        sequelize.query(`SELECT *
          FROM Employees
          INNER JOIN ProjectMembers
          ON Employees.employeeId = ProjectMembers.employeeId AND ProjectMembers.projectId = '${req.body.projectId}' `,
            {
                type: Sequelize.QueryTypes.SELECT
            }).then(resp => {
                res.send(resp)
            }, err => {
                res.status(400).send(err)
            })
    })

    apiRoutes.get('/downloadProjectExcel', async function (req, res) {
        let query = `
        SELECT distinct
        s.projectTaskNumber as 'Task_ID',
        Epics.name as 'Epic_Name',
        Stories.name as 'User_Story',
        Stories.epicId as 'epicId',
        s.taskName as 'Task_Name',
        e.firstName as 'Assigned To',
        c.columnName as 'Status',
        s.estimatedHours as 'Estimated_Hours',
        s.actualHours as 'Actual_Hours',
        s.startDate as 'Planned_Start_Date',
        s.dueDate as 'Planned_End_Date',
        s.description as 'Comments',
        CASE WHEN s.taskType = 0 THEN 'New_Feature'
        WHEN  s.taskType = 1 THEN 'BUG'
        END AS 'Task Type',
        CASE WHEN s.priority = 0 THEN 'LOW'
        WHEN s.priority = 1 THEN 'MEDIUM'
        WHEN s.priority = 2 THEN 'HIGH'
        WHEN s.priority = 3 THEN 'ON HOLD'
        END as 'Priority',
        CAST(s.completionDate AS DATE) as 'Completed_Date'
        FROM Employees as e
        RIGHT JOIN StoryTasks as s ON e.employeeId = s.assignee
        JOIN columnBoards as c ON s.columnId = c.columnId
        JOIN Stories ON Stories.id = s.storyId
        JOIN Epics ON Epics.id = Stories.epicId
        WHERE s.projectId = '${req.query.projectId}' ORDER BY epicId ASC`;
        // console.log(query)
        sequelize.query(query,
            {
                type: Sequelize.QueryTypes.SELECT
            }).then(resp => {

                let newArray = []

                // console.log(resp)

                resp.forEach(line => {
                    delete line.epicId;
                })
                // resp.forEach(async(v,i)=>{
                //     let newDate
                //     if(v.Completed_Date != null){
                //         let newd = new Date(v.Completed_Date)
                //         let day = newd.getDate()
                //         let month = newd.getMonth() + 1
                //         let year = newd.getFullYear()
                //         console.log(v,day, month, year)
                //         newDate =  `"${day}-${month}-${year}"`
                //     }

                //     console.log(newDate)
                //     newArray.push({"Task_Id":v.Task_Id, "Epic_Name":v.Epic_Name, "User_Story":v.User_Story, "Task_Name":v.Task_Name,"Status":v.Status, "Estimated_Hours":v.Estimated_Hours, "Actual_Hours":v.Actual_Hours, "Planned_Start_Date":v.Planned_Start_Date, "Planned_End_Date":v.Planned_End_Date, "Comments":v.Comments, " Priority":v.Priority, "Completed_Date":newDate})
                // })
                Project.findOne({ where: { projectId: req.query.projectId } }).then(p => {
                    let fileName = p.projectName + '.xlsx';
                    res.xls(fileName, resp);
                })
            }, err => {
                console.log(err)
                res.status(400).send(err)
            })
    })

    // apiRoutes.post('/addProjectMember', async function (req, res) {
    //     let projectId = req.body.projectId
    //     await Project.findAll({ where: { projectId: projectId } }).then(result => {
    //         let projectName = result[0].projectName
    //         ProjectMembers.create(req.body)
    //         res.status(200).send({ "msg": "Team Added" })
    //     }, error => {
    //         res.status(400).send({ "msg": "Server Error" })
    //     })
    // })

    apiRoutes.post('/addProjectMember', async function (req, res) {
        // let projectId = req.body.projectId
        await ProjectMembers.create(req.body).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/updateProjectMember', async function (req, res) {
        // let projectId = req.body.projectId
        await ProjectMembers.update(req.body, {
            where: {
                id: req.body.memberId
            }
        }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/removeProjectMember', async function (req, res) {
        let employeeId = parseInt(req.body.employeeId);
        let projectId = parseInt(req.body.projectId);
        await ProjectMembers.destroy({ where: { employeeId, projectId } }).then(result => {
            res.status(200).send({ success: true })
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/fetchTeamColumns', async function (req, res) {
        await ColumnBoard.findAll({ where: { teamId: req.body.teamId } }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/createTask', async function (req, res) {

        // const count = await User.Tasks({
        //     where: { projectId: req.body.projectId }
        //   });

        //   req.body.projectTaskNumber = count + 1;

        Tasks.create(req.body).then(resp => {
            let employeeId = req.body.employeeId
            let taskName = req.body.taskName
            let event = "Create Task"
            logs.createTask(employeeId, taskName, event)
            res.status(200).send(resp)
        }, err => {
            res.status(400).send(err)
        })
    })

    apiRoutes.post('/updateTask', async function (req, res) {
        if (req.body.status == 2) {
            console.log("294")
            sequelize.query(`SELECT b.officialEmail,a.organisationId, a.employeeId, b.firstName, b.lastName, a.taskName, a.date, a.projectName FROM Tasks a , Employees b WHERE a.taskId = ${req.body.taskId} AND a.employeeId = b.employeeId`,
                { type: Sequelize.QueryTypes.SELECT }).then(resp => {
                    Notification.create({
                        "employeeId": resp[0].employeeId,
                        "taskId": req.body.taskId,
                        "date": resp[0].date,
                        "organisationId": resp[0].organisationId,
                        "notification": `Your DSR is Rejected by you respective Manager. Task Name - ${resp[0].taskName}`
                    })
                    Tasks.update(req.body, { where: { taskId: req.body.taskId } })
                    // logs.createTask(employeeId, taskName, event)
                    let email2 = `${resp[0].officialEmail}`
                    let subject = "DSR Notification"
                    let message = `Hello ${resp[0].firstName} ${resp[0].lastName}<br><br> Your DSR is Rejected By your Respective manager, Kindly Check the Details and Resubmit Your Rejected DSR.<br><br> 
                    Project Name : ${resp[0].projectName}<br>Task Name : ${resp[0].taskName}<br> Date : ${resp[0].date}`
                    mailer(transporter, email2, subject, message)
                    console.log(req.body.status)
                    res.status(200).send(resp)
                }, error => {
                    res.status(400).send(error)
                })
        } else {
            console.log("319")
            await Tasks.update(req.body, { where: { taskId: req.body.taskId } }).then(async result => {
                // let employeeId = req.body.employeeId
                // let taskName = req.body.taskName
                // let event = "Update Task"
                // logs.createTask(employeeId, taskName, event)
                // let tasksDetails = await Tasks.findAll({where:{projectId:req.body.projectId, taskId: req.body.taskId}})
                // let sum = 0
                // for(i=0; i<tasksDetails.length;i++){
                //     sum+=tasksDetails[i].hours
                // }
                // await StoryTasks.update({
                //     "totalHoursSpent":sum
                // },{
                //     where:{taskId:req.body.projectTaskId}
                // })
                // console.log("324",tasksDetails)
                res.status(200).send(result)
                console.log("218", result)
            }, error => {
                res.status(400).send(error)
            })
        }
    })

    apiRoutes.post('/deleteTask', async function (req, res) {
        let data = await Tasks.findOne({ where: { taskId: req.body.taskId } })
        let employeeId = data.employeeId
        let taskName = data.taskName
        let event = "Delete Task"
        logs.createTask(employeeId, taskName, event)
        await Tasks.destroy({ where: { taskId: req.body.taskId } }).then(result => {
            res.status(200).send({ status: true })
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/getUserTasks', async function (req, res) {
        await Tasks.findAll({
            where: { columnId: req.body.columnId, teamId: req.body.teamId, employeeId: req.body.employeeId, date: req.body.date }, order: [
                ['order', 'ASC'],
            ]
        }).then(result => {
            console.log("350")
            console.log(result)
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/taskTypeFilter', async function (req, res) {
        //     let employeeId = req.body.employeeId
        //     let data = []
        //     for (i = 0; i < employeeId.length; i++) {
        //         await sequelize.query(`SELECT * FROM Tasks INNER JOIN Employees
        // ON Tasks.employeeId = Employees.employeeId AND Tasks.employeeId = ${employeeId[i]} AND Tasks.projectId = ${req.body.projectId} AND (date BETWEEN '${req.body.from}' AND '${req.body.to}')`,
        //             {
        //                 type: Sequelize.QueryTypes.SELECT
        //             }).then(resp => {
        //                 let billablehours = 0
        //                 let nonbillable = 0
        //                 let employeeName
        //                 resp.forEach(async (v, i) => {
        //                     employeeName = v.firstName + ' ' + v.lastName
        //                     if (v.billable == 1) {
        //                         billablehours = v.hours + billablehours
        //                     }
        //                     if (v.billable == 0) {
        //                         nonbillable = v.hours + nonbillable
        //                     }
        //                 })
        //                 console.log("181", billablehours, nonbillable)
        //                 data.push({ employeeId: employeeId[i], employeeName: employeeName, "billable": billablehours, "nonBillable": nonbillable})
        //})
        //}

        let employeeId = req.body.employeeId
        let projectId = req.body.projectId
        let data = []
        if (employeeId.length > 0) {
            employeeId.forEach(emp => {
                data.push({ employeeId: emp, billable: 0, nonBillable: 0 })
            })
            sequelize.query(`SELECT Employees.employeeId, Employees.firstName, Employees.lastName, Tasks.hours, Tasks.billable FROM Tasks INNER JOIN Employees
        ON Tasks.employeeId = Employees.employeeId AND Tasks.employeeId IN (${employeeId.join(',')}) AND Tasks.projectId = ${projectId} AND (Tasks.date BETWEEN '${req.body.from}' AND '${req.body.to}')`,
                { type: Sequelize.QueryTypes.SELECT }).then(resp => {
                    resp.forEach(async (r, i) => {
                        console.log("r ", r);
                        let fData = (data.filter(emp => emp.employeeId == r.employeeId))[0];
                        console.log(fData);
                        if (r.billable == 1) {
                            fData.billable += r.hours
                        }
                        if (r.billable == 0) {
                            fData.nonBillable += r.hours
                        }
                    })
                    res.send(data)
                })
        } else {
            res.send([])
        }
    })

    apiRoutes.post('/filterByTeam', async function (req, res) {
        let employeeId = req.body.employeeId
        let data = []
        if (employeeId.length > 0) {
            employeeId.forEach(emp => {
                data.push({ employeeId: emp, billable: 0, nonBillable: 0, firstName: '', lastName: '' })
            })
            sequelize.query(`SELECT Employees.employeeId, Employees.firstName, Employees.lastName, Employees.imageExists, Tasks.hours, Tasks.billable FROM Tasks INNER JOIN Employees
        ON Tasks.employeeId = Employees.employeeId AND Tasks.employeeId IN (${employeeId.join(',')}) AND (Tasks.date BETWEEN '${req.body.from}' AND '${req.body.to}')`,
                { type: Sequelize.QueryTypes.SELECT }).then(resp => {
                    resp.forEach(async (r, i) => {
                        console.log("r ", r);
                        let fData = (data.filter(emp => emp.employeeId == r.employeeId))[0];
                        fData.firstName = r.firstName
                        fData.lastName = r.lastName
                        fData.imageExists = r.imageExists
                        console.log(fData);
                        if (r.billable == 1) {
                            fData.billable += r.hours
                        }
                        if (r.billable == 0) {
                            fData.nonBillable += r.hours
                        }
                    })
                    res.send(data)
                })
        } else {
            res.send([])
        }
    })

    apiRoutes.post('/getMemberProjects', async function (req, res) {
        let query = `SELECT Projects.projectId, Projects.projectId, Members.employeeId, Members.billable, Members.type, Members.id, Projects.projectName, (SELECT SUM(estimatedHours) FROM StoryTasks WHERE projectId=Projects.projectId AND status=1) as totalHours
        from Projects inner join (select distinct projectId, employeeId, billable, type, id from ProjectMembers where employeeId = '${req.body.employeeId}') as Members where Projects.projectId = Members.projectId AND (Projects.projectStatus = 'Ongoing' OR Projects.projectStatus = 'Upcoming') order by Projects.projectName`
        // console.log("getMemberProjects ", query)
        sequelize.query(query,
            {
                type: Sequelize.QueryTypes.SELECT
            }).then(resp => {
                res.send(resp)
            }, err => {
                res.status(400).send(err)
            })
    })

    apiRoutes.post('/createEpic', async function (req, res) {
        await Epic.create(req.body).then(resp => {
            res.status(200).send(resp)
        }, err => {
            res.status(400).send(err)
        })
    })

    apiRoutes.post('/epicUpdate', async function (req, res) {
        await Epic.update(req.body, { where: { id: req.body.id } }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/deleteEpic', async function (req, res) {
        await Epic.destroy({ where: { id: req.body.id } }).then(result => {
            res.status(200).send({ status: true })
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/getProjectEpics', async function (req, res) {
        await Epic.findAll({ where: { projectId: req.body.projectId } }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/createStory', async function (req, res) {
        await Story.create(req.body).then(resp => {
            res.status(200).send(resp)
        }, err => {
            res.status(400).send(err)
        })
    })

    apiRoutes.post('/storyUpdate', async function (req, res) {
        await Story.update(req.body, { where: { id: req.body.id } }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/deleteStory', async function (req, res) {
        await Story.destroy({ where: { id: req.body.id } }).then(result => {
            res.status(200).send({ status: true })
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/getStories', async function (req, res) {
        await Story.findAll({ where: { epicId: req.body.epicId } }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/createStoryTask', async function (req, res) {

        let count = await sequelize.query(`select Max(projectTaskNumber) projectTaskNumber FROM StoryTasks where projectId = ${req.body.projectId}`, {
            type: Sequelize.QueryTypes.SELECT
        });
        req.body["projectTaskNumber"] = count[0].projectTaskNumber + 1;
        await StoryTasks.create(req.body).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/regeneratProjectTaskNumbers', async function (req, res) {

        StoryTasks.findAll({
            where: { projectId: req.body.projectId }, order: [
                ['projectTaskNumber', 'ASC'],
            ]
        }).then(result => {
            result.forEach(async (task, index) => {
                await StoryTasks.update({ projectTaskNumber: index + 1 }, { where: { taskId: task.taskId } });
                console.log("task ", task.taskId, " ", index + 1)
            })
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })

    })

    apiRoutes.post('/getStoryTasks', async function (req, res) {
        await StoryTasks.findAll({
            where: { storyId: req.body.storyId }, order: [
                ['order', 'ASC'],
            ]
        }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
        // sequelize.query(`SELECT e.image, e.firstName, e.lastName, s.taskName, s.status, s.createdAt, s.updatedAt, s.order
        //   FROM Employees as e
        //   INNER JOIN StoryTasks as s
        //   ON e.employeeId = s.assignee AND s.storyId = '${req.body.storyId}' `,
        //     {
        //         type: Sequelize.QueryTypes.SELECT
        //     }).then(resp => {
        //         res.send(resp)
        //     }, err => {
        //         res.status(400).send(err)
        //     })


    })

    apiRoutes.post('/deleteStoryTask', async function (req, res) {
        await StoryTasks.destroy({ where: { taskId: req.body.taskId } }).then(result => {
            res.status(200).send({ status: true })
        }, error => {
            res.status(400).send(error)
        })
    })

    apiRoutes.post('/updateProjectTask', async function (req, res) {
        // console.log(req.body.taskId)
        let storyTaskdata = await StoryTasks.findAll({ where: { taskId: req.body.taskId } })
        let employeeData;
        if (req.body.assignee)
            employeeData = await Employees.findOne({ where: { employeeId: req.body.assignee } })

        let projectdata = await Project.findOne({ where: { projectId: req.body.projectId } })
        console.log("563", projectdata)
        let taskAssignee;
        let taskTester;

        if (storyTaskdata[0] && storyTaskdata[0].assignee) {
            taskAssignee = storyTaskdata[0].assignee;
        }
        if (storyTaskdata[0] && storyTaskdata[0].tester) {
            taskTester = storyTaskdata[0].tester;
        }


        if (req.body.assignee && taskAssignee != req.body.assignee) {
            // console.log(taskAssignee, req.body.assignee)
            let date = new Date()
            let date1 = ("0" + date.getDate()).slice(-2);
            let month = ("0" + (date.getMonth() + 1)).slice(-2);
            let year = date.getFullYear();
            let newDate = year + "-" + month + "-" + date1
            let message;

            let email2 = `${employeeData.officialEmail}`
            let subject = `New Task Assigned - ${projectdata.projectName}` // - ${storyTaskdata.taskName}
            // if (req.body.startDate == null || undefined && req.body.dueDate == null || undefined) {
            //     message = `Hello ${employeeData.firstName} ${employeeData.lastName}<br><br> You Have Been Assigned a Task on Project -<b> ${projectdata.projectName}</b>. Task Details are mention below please find.<br><br> <b>Project Name :</b> ${projectdata.projectName}<br><b>Epic Name : </b>${req.body.epicName}<br><b>Story Name :</b> ${req.body.storyName}<br><b>Task Name : </b>${storyTaskdata.taskName}<br> <b>Start Date :</b> Please enter the start date for this task<br><b> End Date : </b> Please enter the due date for this task <br> <b>Estimated Hours :</b> ${req.body.estimatedHours}`
            // } else {
            message = `Hello ${employeeData.firstName} ${employeeData.lastName}<br><br> You Have Been Assigned a Task on Project -<b> ${projectdata.projectName}</b>. Task Details are mention below please find.<br><br> <b>Project Name :</b> ${projectdata.projectName}<br><b>Epic Name : </b>${req.body.epicName}<br><b>Story Name :</b> ${req.body.storyName}<br><b>TaskId : ${req.body.projectTaskNumber} </br></br>Task Name : </b>${req.body.taskName}<br>`
            // }
            mailer(transporter, email2, subject, message)
            // if (req.body.assigneeUpdated == true) {

            await Notification.create({
                "employeeId": req.body.assignee,
                "taskId": req.body.taskId,
                "taskName": storyTaskdata.taskName,
                "date": newDate,
                "organisationId": req.body.organisationId,
                "notification": `You have assigned a new task on - ${projectdata.projectName}`
            })
        } else if (req.body.assignee && req.body.description != null || "") {
            let date = new Date()
            let date1 = ("0" + date.getDate()).slice(-2);
            let month = ("0" + (date.getMonth() + 1)).slice(-2);
            let year = date.getFullYear();
            let newDate = year + "-" + month + "-" + date1

            let employeeData = await Employees.findOne({ where: { employeeId: req.body.tester } })
            let assigneEmail = employeeData.officialEmail
            let name = employeeData.firstName + " " + employeeData.lastName
            if (req.body.tester)
                email2 = assigneEmail
            subject = "New Task Update"
            message = `Hello ${name} <br><br> New comments added in the below task -<br>Task Name: ${req.body.taskName}<br>Epic Name:${req.body.epicName}<br>Comments:${req.body.description}.<br><br>Thanks<br>Team Mckinsol`
            mailer(transporter, email2, subject, message)
            Notification.create({
                "employeeId": req.body.assignee,
                "taskId": req.body.taskId,
                "taskName": req.body.taskName,
                "date": newDate,
                "organisationId": req.body.organisationId,
                "notification": `New Comment added on Task Please check - ${req.body.description}`
            }).then(resp => {
                // res.send(resp)
            }, error => {
                // res.send(error)
            })

        } else if (req.body.assignee && req.body.tester != taskTester && req.body.tester != 0) {
            console.log("628", projectdata)
            let date = new Date()
            let date1 = ("0" + date.getDate()).slice(-2);
            let month = ("0" + (date.getMonth() + 1)).slice(-2);
            let year = date.getFullYear();
            let newDate = year + "-" + month + "-" + date1
            let projectName = projectdata.projectName
            let employeeData1 = await Employees.findOne({ where: { employeeId: req.body.tester } })
            let assigneEmail = employeeData1.officialEmail
            let name = employeeData1.firstName + " " + employeeData1.lastName
            email2 = assigneEmail
            subject = "New testing task assigned to you: " + req.body.taskName
            message = `Hello ${name} <br><br>One more task development is done now, Task is ready for testing, So please test this feature/bug and submit report ASAP.<br><br>Project Name: ${projectName}<br>Epic Name:${req.body.epicName}<br>Task Name: ${req.body.taskName}<br><br>Thanks<br>Team Mckinsol`
            mailer(transporter, email2, subject, message)
            Notification.create({
                "employeeId": req.body.tester,
                "taskId": req.body.taskId,
                "taskName": req.body.taskName,
                "date": newDate,
                "organisationId": req.body.organisationId,
                "notification": `Task is ready to test, Task Name - ${req.body.taskName}`
            }).then(resp => {
                // res.send(resp)
            }, error => {
                // res.send(error)
            })

        }
        console.log(req.body)
        StoryTasks.update(req.body, { where: { taskId: req.body.taskId } }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })

    })

    apiRoutes.post('/storystatus', async function (req, res) {
        let epicId = req.body.epicId
        let data = []

        for (i = 0; i < epicId.length; i++) {
            let storyName
            let storyId
            let total0 = 0
            let total1 = 0
            let total2 = 0
            let hours0 = 0
            let hours1 = 0
            let hours2 = 0
            await sequelize.query(`SELECT * FROM Stories a, Tasks b WHERE a.projectId = b.projectId AND a.storyId = b.storyId AND a.epicId = ${epicId[i]} AND b.projectId=${req.body.projectId}`,
                {
                    type: Sequelize.QueryTypes.SELECT
                }).then(resp => {

                    console.log("loop318", resp)
                    resp.forEach(async (v, i) => {
                        // console.log(v)
                        storyName = v.storyName
                        storyId = v.storyId
                        if (v.status == 0) {
                            hours0 = hours0 + v.hours
                            total0 = total0 + 1
                        } else if (v.status == 1) {
                            hours1 = hours1 + v.hours
                            total1 = total1 + 1
                        } else if (v.status == 2) {
                            hours2 = hours2 + v.hours
                            total2 = total2 + 1
                        }
                    })
                })
            let statusSum = total0 + total1 + total2
            let average = (statusSum - (total0 + total2)) * 100 / statusSum
            data.push({ "storyId": storyId, "storyName": storyName, "statusPerc": average, "approvedTotalHours": hours1, "rejectedTotalHours": hours2, "approved": total1, "rejected": total2 })
        }
        console.log(data)
        res.send(data)

    })



    apiRoutes.post('/getProjectColumns', async function (req, res) {
        await ColumnBoard.findAll({ where: { projectId: req.body.projectId } }).then(result => {
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })


    apiRoutes.post('/filterDsr', async function (req, res) {
        await sequelize.query(`SELECT a.employeeId, a.date, b.firstName, b.lastName ,SUM(a.hours) AS Hours FROM Tasks a, Employees b WHERE a.employeeId = b.employeeId AND a.employeeId IN (${req.body.employeeIds}) AND (MONTH(a.date) = ${parseInt(req.body.month)}) GROUP BY a.employeeId, a.date`, {
            type: Sequelize.QueryTypes.SELECT
        }).then(resp => {
            let data = []
            let ids = []
            resp.forEach(async (v, i) => {
                let employeeId = v.employeeId
                ids.push(employeeId)
            })
            const uniqueId = ids.filter((x, i, a) => a.indexOf(x) == i)
            uniqueId.forEach(async (v, i) => {
                let id = uniqueId[i]
                let name;
                let result = [];
                resp.forEach(async (v, i) => {
                    let employeeId = v.employeeId
                    let hours = v.Hours
                    let date = v.date
                    let dsrStatus
                    if (hours >= 9) {
                        dsrStatus = "Completed"
                    } else if (hours < 9) {
                        dsrStatus = "In-Complete"
                    }
                    if (id == employeeId) {
                        name = v.firstName + ' ' + v.lastName
                        result.push({ "date": date, "dsrStatus": dsrStatus })
                    }
                })
                data.push({ name: name, employeeId: id, result: result })
            })
            res.send(data)
        })
    })

    apiRoutes.post('/createNotes', async function (req, res) {
        await Notes.create(req.body).then(data => {
            res.send(data)
        }, error => {
            res.send(error)
        })
    })

    apiRoutes.post('/updateNotes', async function (req, res) {
        await Notes.update(req.body, { where: { NoteId: req.body.NoteId } }).then(resp => {
            res.send(resp)
        }, error => {
            res.send(error)
        })
    })

    apiRoutes.post('/fetchNotes', async function (req, res) {
        await Notes.findAll({ where: { projectId: req.body.projectId } }).then(resp => {
            res.send(resp)
        }, error => {
            res.send(error)
        })
    })
    apiRoutes.post('/deleteNotes', async function (req, res) {
        await Notes.destroy({ where: { NoteId: req.body.id } }).then(resp => {
            res.send({ code: 1, "msg": "Note Deleted" })
        }, error => {
            res.send({ code: 0, error })
        })
    })

    apiRoutes.post('/createSprint', async function (req, res) {
        await Sprint.create(req.body).then(data => {
            res.send(data)
        }, error => {
            res.send(error)
        })
    })

    apiRoutes.post('/getActiveSprints', async function (req, res) {
        let date = new Date();
        const where = {
            projectId: req.body.projectId,
            startDate: { [Op.lte]: date },
            [Op.or]: [{ completionDate: null }, { completionDate: { [Op.gte]: date } }]
        };
        // console.log(where)
        await Sprint.findAll({ where }).then(data => {
            res.send(data)
        }, error => {
            res.send(error)
        })
    })

    apiRoutes.post('/getInactiveSprints', async function (req, res) {
        let date = new Date();
        const where = {
            projectId: req.body.projectId,
            [Op.or]: [{ startDate: null }, { dueDate: null }, { startDate: { [Op.gt]: date } }]
        }

        await Sprint.findAll({ where }).then(data => {
            res.send(data)
        }, error => {
            res.send(error)
        })
    })

    apiRoutes.post('/getPastSprints', async function (req, res) {
        let date = new Date();
        const where = {
            projectId: req.body.projectId,
            dueDate: { [Op.lt]: date }
        }

        await Sprint.findAll({ where, order: [['completionDate','DESC']] }).then(data => {
            res.send(data)
        }, error => {
            res.send(error)
        })
    })

    apiRoutes.post('/updateSprint', async function (req, res) {
        await Sprint.update(req.body, { where: { sprintId: req.body.sprintId } }).then(data => {
            res.send(data)
        }, error => {
            res.send(error)
        })
    })

    apiRoutes.get('/downloadSprint', async function (req, res) {
        await sequelize.query(`select e.sprintName as Sprint_Name, e.sprintGoal as Sprint_Goal, e.startDate as Sprint_Start_Date,
        e.dueDate as Sprint_Due_Date, e.completionDate as Sprint_Completion_Date, g.name as Epic_Name, f.name as Story_Name, a.projectTaskNumber as Project_Task_Number,
        c.projectName as Project_Name, a.taskName as Task_Name, a.estimatedHours as Estimated_Hours, a.actualHours as Actual_Hours,
        a.extraHours as Extra_Hours, a.startDate as Start_Date, a.dueDate as Due_Date, a.completionDate as Completion_Date,
        a.description as Remarks, b.firstName as Assignee_FirstName, b.lastName as Assignee_LastName,
        d.columnName as Status from StoryTasks a, Employees b, Projects c, columnBoards d, Sprints e, Stories f, Epics g
        where a.assignee = b.employeeId and a.projectId = c.projectId and a.storyId = f.id and f.epicId = g.id
        and a.columnId = d.columnId and e.sprintId = ${req.query.sprintId} and a.taskId in (${req.query.tasks})`, {
        // await sequelize.query(`select e.sprintName as Sprint_Name, e.sprintGoal as Sprint_Goal, e.startDate as Sprint_Start_Date, e.dueDate as Sprint_Due_Date, e.completionDate as Sprint_Completion_Date, a.projectTaskNumber as Project_Task_Number, c.projectName as Project_Name, a.taskName as Task_Name, a.estimatedHours as Estimated_Hours, a.actualHours as Actual_Hours, a.extraHours as Extra_Hours, a.startDate as Start_Date, a.dueDate as Due_Date, a.completionDate as Completion_Date,a.description as Remarks, b.firstName as Assignee_FirstName, b.lastName as Assignee_LastName, d.columnName as Status from StoryTasks a, Employees b, Projects c, columnBoards d, Sprints e where a.assignee = b.employeeId and a.projectId = c.projectId and a.columnId = d.columnId and e.sprintId = ${req.query.sprintId} and a.taskId in (${req.query.tasks})`, {
        // ${req.body.sprintId} and a.taskId in (${req.body.tasks})`, {
            type: Sequelize.QueryTypes.SELECT
        }).then(resp => {
            // let fileName = p.projectName + '.xlsx';
            let fileName = 'SprintStatus.xlsx';
            res.xls(fileName, resp);


        })
        
    })


    apiRoutes.get('/dailyStatus', async function (req, res) {
        // console.log("hello")
        // let project = await Project.findAll()
        let projects = await sequelize.query(`SELECT a.projectName, a.projectId, b.employeeId, c.firstName, c.lastName, c.officialEmail  FROM Projects a, ProjectMembers b, Employees c WHERE a.projectId = b.projectId AND b.employeeId = c.employeeId AND a.sendDailyStatus=true`, {
            type: Sequelize.QueryTypes.SELECT
        })
        // AND a.projectId = 13
        var groupedProjects = _.mapValues(_.groupBy(projects, 'projectId'),
            clist => clist.map(project => _.omit(project, 'projectId')));

        // console.log("groupedProjects ",groupedProjects);
        let projectIds = Object.keys(groupedProjects);

        // console.log("projectIds ", projectIds)
        let allData = []
        for (k = 0; k < projectIds.length; k++) {

            let users = groupedProjects[projectIds[k]];
            let userEmails = [];
            users.forEach(user => userEmails.push(user.officialEmail))
            // console.log("userEmails ",userEmails)

            // let projectTasks = await sequelize.query(`SELECT * from StoryTasks INNER JOIN Stories INNER JOIN Epics WHERE StoryTasks.projectId = '8' AND StoryTasks.organisationId IS NOT NULL AND Stories.id = StoryTasks.storyId AND Epics.id = Stories.epicId`, {
            let projectTasks = await sequelize.query(`SELECT * from StoryTasks INNER JOIN Stories INNER JOIN Epics WHERE StoryTasks.projectId = ${projectIds[k]} AND StoryTasks.organisationId IS NOT NULL AND Stories.id = StoryTasks.storyId AND Epics.id = Stories.epicId`, {
                type: sequelize.QueryTypes.SELECT
            })
            // console.log("projectTasks ",projectTasks[0])
            let projectBoard = await sequelize.query(`SELECT * from columnBoards WHERE projectId = ${projectIds[k]}`, {
                type: sequelize.QueryTypes.SELECT
            })
            // console.log("projectBoard ",projectBoard[0])
            let boardData = [];
            projectBoard.forEach(column => {
                boardData.push({
                    columnName: column.columnName,
                    tasks: projectTasks.filter(task => task.columnId == column.columnId),
                    taskCount: projectTasks.filter(task => task.columnId == column.columnId).length
                })
            })

            let completedTodayTasks = projectTasks.filter(task => new Date(task.completionDate).setHours(0, 0, 0, 0) == new Date().setHours(0, 0, 0, 0))
            boardData.push({
                columnName: 'Completed Today',
                tasks: completedTodayTasks,
                taskCount: completedTodayTasks.length
            })


            let columnIDs = []
            projectTasks.forEach((v, i) => {
                columnIDs.push(v.columnId)
            })

            let uniqueData = ([...new Set(columnIDs)]).sort()
            // console.log(uniqueData, uniqueData[0])



            let todayCompleted = completedTodayTasks.length
            let date = formatDate(new Date());
            let newTasksToday = projectTasks.filter(task => formatDate(task.createdAt) == date)
            let getTasksCreatedToday = newTasksToday.length;


            let date_time = new Date();
            date_time.setDate(date_time.getDate() - (0));
            let newDateforCurrentDay = date_time.getFullYear() + "-" + ("0" + (date_time.getMonth() + 1)).slice(-2) + "-" + ("0" + date_time.getDate()).slice(-2) + " " + date_time.getHours() + ":" + date_time.getMinutes() + ":" + date_time.getSeconds();
            let newDateOnly = date_time.getFullYear() + "-" + ("0" + (date_time.getMonth() + 1)).slice(-2) + "-" + ("0" + date_time.getDate()).slice(-2)
            // let newOpenedTasks = await sequelize.query(`SELECT * from StoryTasks INNER JOIN Stories INNER JOIN Epics WHERE StoryTasks.projectId = '${projectIds[k]}' AND StoryTasks.columnId = '${uniqueData[0]}' AND CAST(StoryTasks.createdAt AS DATE) = '2023-03-20' AND StoryTasks.organisationId IS NOT NULL AND Stories.id = StoryTasks.storyId AND Epics.id = Stories.epicId`, {
            let newOpenedTasks = await sequelize.query(`SELECT * from StoryTasks INNER JOIN Stories INNER JOIN Epics WHERE StoryTasks.projectId ='${projectIds[k]}' AND StoryTasks.columnId = '${uniqueData[0]}' AND CAST(StoryTasks.createdAt AS DATE) = '${newDateOnly}' AND StoryTasks.organisationId IS NOT NULL AND Stories.id = StoryTasks.storyId AND Epics.id = Stories.epicId`, {
                type: sequelize.QueryTypes.SELECT
            })

            date_time.setDate(date_time.getDate() - (7));
            let newDateforsevenDay = date_time.getFullYear() + "-" + ("0" + (date_time.getMonth() + 1)).slice(-2) + "-" + ("0" + date_time.getDate()).slice(-2) + " " + date_time.getHours() + ":" + date_time.getMinutes() + ":" + date_time.getSeconds();
            let pendingTaskCountforSevenday = await sequelize.query(`SELECT * from StoryTasks INNER JOIN Stories INNER JOIN Epics WHERE StoryTasks.projectId = ${projectIds[k]} AND StoryTasks.columnId = ${uniqueData[0]} AND (StoryTasks.createdAt BETWEEN "${newDateforsevenDay}" AND "${newDateforCurrentDay}") AND StoryTasks.organisationId IS NOT NULL AND Stories.id = StoryTasks.storyId AND Epics.id = Stories.epicId`, {
                type: sequelize.QueryTypes.SELECT
            })

            date_time.setDate(date_time.getDate() - (30));
            let newDateforThirtyDay = date_time.getFullYear() + "-" + ("0" + (date_time.getMonth() + 1)).slice(-2) + "-" + ("0" + date_time.getDate()).slice(-2) + " " + date_time.getHours() + ":" + date_time.getMinutes() + ":" + date_time.getSeconds();
            let pendingTaskCountforthirtyDays = await sequelize.query(`SELECT * from StoryTasks INNER JOIN Stories INNER JOIN Epics WHERE StoryTasks.projectId = ${projectIds[k]} AND StoryTasks.columnId = ${uniqueData[0]} AND (StoryTasks.createdAt BETWEEN "${newDateforThirtyDay}" AND "${newDateforCurrentDay}") AND StoryTasks.organisationId IS NOT NULL AND Stories.id = StoryTasks.storyId AND Epics.id = Stories.epicId`, {
                type: sequelize.QueryTypes.SELECT
            })


            date_time.setDate(date_time.getDate() - (60));
            let newDateforSixtyDay = date_time.getFullYear() + "-" + ("0" + (date_time.getMonth() + 1)).slice(-2) + "-" + ("0" + date_time.getDate()).slice(-2) + " " + date_time.getHours() + ":" + date_time.getMinutes() + ":" + date_time.getSeconds();
            let pendingTaskCountforsixtyDays = await sequelize.query(`SELECT * from StoryTasks INNER JOIN Stories INNER JOIN Epics WHERE StoryTasks.projectId = ${projectIds[k]} AND StoryTasks.columnId = ${uniqueData[0]} AND (StoryTasks.createdAt BETWEEN "${newDateforSixtyDay}" AND "${newDateforCurrentDay}") AND StoryTasks.organisationId IS NOT NULL AND Stories.id = StoryTasks.storyId AND Epics.id = Stories.epicId`, {
                type: sequelize.QueryTypes.SELECT
            })

            date_time.setDate(date_time.getDate() - (90));
            let newDateforNintyDay = date_time.getFullYear() + "-" + ("0" + (date_time.getMonth() + 1)).slice(-2) + "-" + ("0" + date_time.getDate()).slice(-2) + " " + date_time.getHours() + ":" + date_time.getMinutes() + ":" + date_time.getSeconds();
            let pendingTaskCountforNintyDays = await sequelize.query(`SELECT * from StoryTasks INNER JOIN Stories INNER JOIN Epics WHERE StoryTasks.projectId = ${projectIds[k]} AND StoryTasks.columnId = ${uniqueData[0]} AND (StoryTasks.createdAt BETWEEN "${newDateforNintyDay}" AND "${newDateforCurrentDay}") AND StoryTasks.organisationId IS NOT NULL AND Stories.id = StoryTasks.storyId AND Epics.id = Stories.epicId`, {
                type: sequelize.QueryTypes.SELECT
            })

            let lastColumnId = uniqueData[uniqueData.length - 1]
            // console.log("953",uniqueData.length, uniqueData.length+1, lastColumnId)
            let newDate2 = new Date()
            newDate2.setDate(newDate2.getDate() - (7));
            // console.log("956", newDate2)
            let newDateforsevenDays = newDate2.getFullYear() + "-" + ("0" + (newDate2.getMonth() + 1)).slice(-2) + "-" + ("0" + newDate2.getDate()).slice(-2) + " " + newDate2.getHours() + ":" + newDate2.getMinutes() + ":" + newDate2.getSeconds();
            let closedTaskCountforNintyDays = await sequelize.query(`SELECT * from StoryTasks INNER JOIN Stories INNER JOIN Epics WHERE StoryTasks.projectId = '${projectIds[k]}' AND StoryTasks.columnId = '${lastColumnId}' AND (StoryTasks.createdAt BETWEEN "${newDateforsevenDays}" AND "${newDateforCurrentDay}") AND StoryTasks.organisationId IS NOT NULL AND Stories.id = StoryTasks.storyId AND Epics.id = Stories.epicId`, {
                type: sequelize.QueryTypes.SELECT
            })




            let toDoCount = boardData.filter(board => board.columnName == 'To Do')[0]['tasks'].length;
            // let toDoCount1 = boardData.filter(board => board.columnName == 'To Do')[0]['tasks'].length;
            let toDoTasks = boardData.filter(board => board.columnName == 'To Do')[0]['tasks'];

            let inProgress = boardData.filter(board => board.columnName == 'In Progress')[0]['tasks'];
            let testing = boardData.filter(board => board.columnName == 'Testing')[0]['tasks'];
            let completedCount = boardData.filter(board => board.columnName == 'Done')[0]['tasks'].length;

            let toDoNotStarted = toDoTasks.filter(task => task.onHold == false && task.reOpened == false).length;
            let toDoOnHold = toDoTasks.filter(task => task.onHold == true).length;
            let toDoReOpened = toDoTasks.filter(task => task.reOpened == true).length;

            let subject = `Daily Project Status - ${groupedProjects[projectIds[k]][0].projectName}`
            let todayTasks = ''
            let tasksInProgress = ''
            let tasksInTesting = ''
            let taskRow = `
            
            <tr>
            <td align="center" valign="top">
                [ID]
            </td>
            <td align="center" valign="top">
                [TASK]
            </td>
            <td align="center" valign="top">
                [ASSIGNEE]
            </td>
            <td align="center" valign="top">
                [ESTHOURS]
            </td>
            <td align="center" valign="top">
                [STARTDATE]
            </td>
            <td align="center" valign="top">
                [ENDDATE]
            </td>
            <td align="center" valign="top">
                [TASKTYPE]
            </td>
            </tr>`
            completedTodayTasks.forEach(task => {
                // console.log("948", task.taskType)
                let taskType
                if (task.taskType == 0) {
                    taskType = "New Features"
                } else {
                    taskType = "Bug"
                }
                let filterAssignee = projects.filter(p => p.employeeId == task.assignee)[0]
                let tDataRow = taskRow.replace('[ID]', task.projectTaskNumber).replace('[TASK]', task.taskName)
                if (filterAssignee && filterAssignee.firstName)
                    tDataRow = tDataRow.replace('[ASSIGNEE]', filterAssignee.firstName)
                        .replace('[ESTHOURS]', task.estimatedHours)
                        .replace('[STARTDATE]', task.startDate ? task.startDate : '')
                        .replace('[ENDDATE]', new Date(task.dueDate).toISOString().split('T')[0])
                        .replace('[TASKTYPE]', taskType ? taskType : '');
                todayTasks += tDataRow
            });
            // console.log("todayTasks ", projectTaskNumber);
            inProgress.forEach(task => {
                // console.log(task)
                let taskType
                if (task.taskType == 0) {
                    taskType = "New Features"
                } else {
                    taskType = "Bug"
                }
                let filterAssignee = projects.filter(p => p.employeeId == task.assignee)[0] || { firstName: '' }
                let tDataRow =

                    taskRow.replace('[ID]', task.projectTaskNumber)
                        .replace('[TASK]', task.taskName)
                if (filterAssignee)
                    tDataRow = tDataRow.replace('[ASSIGNEE]', filterAssignee.firstName)
                        .replace('[ESTHOURS]', task.estimatedHours)
                        .replace('[STARTDATE]', task.startDate ? task.startDate : '')
                        .replace('[ENDDATE]', new Date(task.dueDate).toISOString().split('T')[0])
                        .replace('[TASKTYPE]', taskType ? taskType : '');

                tasksInProgress += tDataRow
            });
            testing.forEach(task => {
                let taskType
                if (task.taskType == 0) {
                    taskType = "New Features"
                } else {
                    taskType = "Bug"
                }
                // console.log(task)
                let filterAssignee = projects.filter(p => p.employeeId == task.assignee)[0]
                let tDataRow = taskRow.replace('[ID]', task.projectTaskNumber).replace('[TASK]', task.taskName)
                if (filterAssignee)
                    tDataRow = tDataRow.replace('[ASSIGNEE]', filterAssignee.firstName)
                        .replace('[ESTHOURS]', task.estimatedHours)
                        .replace('[STARTDATE]', task.startDate ? task.startDate : '')
                        .replace('[ENDDATE]', new Date(task.dueDate).toISOString().split('T')[0])
                        .replace('[TASKTYPE]', taskType ? taskType : '');
                tasksInTesting += tDataRow
            });

            let message2 = `<table style="font-size:14px" border="0" cellpadding="0" cellspacing="0" height="100%" width="100%" id="bodyTable">
            <tr>
                <td align="center" valign="top">
                    <table border="0" cellpadding="5" cellspacing="0" width="90%"" id="emailContainer">

                        <tr>
                            <td align="center" valign="top">
                                <table border="1" cellpadding="5" cellspacing="0" width="100%" id="emailBody">
                                <tr border="0">
                                <td border="0" colspan="16" style="color:#3498db">Project Health
                                </td>
                                </tr>
                                <tr>
                                <th align="center" valign="top">
                                    Date
                                </th>
                                <th align="center" valign="top" style="background: #2ecc71">
                                    Total Defects
                                </th>
                                <th align="center" valign="top">
                                Total Closed
                                </th>
                                <th align="center" valign="top" style="background: #2ecc71">
                                Total Open
                                </th>
                                <th align="center" valign="top">
                                Re-Opened
                                </th>
                                <th align="center" valign="top">
                                Not Started
                                </th>
                                <th align="center" valign="top">
                                In Progress
                                </th>
                                <th align="center" valign="top" style="background: #f39c12">
                                Ready for Testing
                                </th>
                                <th align="center" valign="top">
                                On Hold
                                </th>
                                <th align="center" valign="top" style="background: #f39c12">
                                New Opened Today
                                </th>
                                <th align="center" valign="top" style="background: #f39c12">
                                Total Closed Today
                                </th>
                                <th align="center" valign="top">
                                Task Opened(7 Days)
                                </th>
                                <th align="center" valign="top">
                                Task Closed(7 Days)
                                </th>
                                <th align="center" valign="top">
                                Pending Task(30 Days)
                                </th>
                                <th align="center" valign="top">
                                Pending Task(60 Days)
                                </th>
                                <th align="center" valign="top">
                                Pending Task(90 Days)
                                </th>
                                </tr>
                                [STATUSTABLE]
                                </table>
                            </td>
                        </tr>
               
                        <tr>
                            <td align="center" valign="top">
                                <table border="1" cellpadding="5" cellspacing="0" width="100%" id="emailBody">
                                <tr border="0">
                                <td border="0" colspan="7" style="color:#2ecc71">Tasks Completed Today
                                </td>
                                </tr>
                                <tr>
                                <th align="center" valign="top">
                                    Id
                                </th>
                                <th align="center" valign="top">
                                    Task
                                </th>
                                <th align="center" valign="top">
                                    Assignee
                                </th>
                                <th align="center" valign="top">
                                    Est. Hrs
                                </th>
                                <th align="center" valign="top">
                                    Start Date
                                </th>
                                <th align="center" valign="top">
                                    Due Date
                                </th>
                                <th align="center" valign="top">
                                    Task Type
                                </th>
                                </tr>
                                ${todayTasks}
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" valign="top">
                                <table border="1" cellpadding="5" cellspacing="0" width="100%" id="emailBody">
                                <tr border="0">
                                <td border="0" colspan="7" style="color:#e67e22">Tasks In Progress
                                </td>
                                </tr>
                                <tr>
                                <th align="center" valign="top">
                                    Id
                                </th>
                                <th align="center" valign="top">
                                    Task
                                </th>
                                <th align="center" valign="top">
                                    Assignee
                                </th>
                                <th align="center" valign="top">
                                    Est. Hrs
                                </th>
                                <th align="center" valign="top">
                                    Start Date
                                </th>
                                <th align="center" valign="top">
                                    Due Date
                                </th>
                                <th align="center" valign="top">
                                    Task Type
                                </th>
                                </tr>
                                ${tasksInProgress}
                                </table>
                            </td>
                        </tr>
                        <tr>
                            <td align="center" valign="top">
                                <table border="1" cellpadding="5" cellspacing="0" width="100%" id="emailBody">
                                <tr border="0">
                                <td border="0" colspan="7" style="color:#34495e">Tasks In Testing
                                </td>
                                </tr>
                                <tr>
                                <th align="center" valign="top">
                                    Id
                                </th>
                                <th align="center" valign="top">
                                    Task
                                </th>
                                <th align="center" valign="top">
                                    Assignee
                                </th>
                                <th align="center" valign="top">
                                    Est. Hrs
                                </th>
                                <th align="center" valign="top">
                                    Start Date
                                </th>
                                <th align="center" valign="top">
                                    Due Date
                                </th>
                                <th align="center" valign="top">
                                    Task Type
                                </th>
                                </tr>
                                ${tasksInTesting}
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>`
            // console.log("subject ", subject)
            let report = {
                total: projectTasks.length,
                projectId: projectIds[k],
                closed: completedCount,
                open: projectTasks.length - completedCount,
                toDoReOpened: toDoReOpened,
                toDoOnHold: toDoOnHold,
                toDoNotStarted: toDoNotStarted,
                inProgress: inProgress.length,
                testing: testing.length,
                openedToday: newOpenedTasks.length,
                closedToday: todayCompleted,
                pendingsixtyDaysTask: pendingTaskCountforsixtyDays.length,
                pendingsevenDaysTask: pendingTaskCountforSevenday.length,
                pendingThirtyDaysTask: pendingTaskCountforthirtyDays.length,
                pendingNintyDaysTasks: pendingTaskCountforNintyDays.length,
                closedBugsinSevenDays: closedTaskCountforNintyDays.length
            }


            Report.create(report).then(result => {
                // res.status(200).send(result)
            }, error => {
                // res.status(400).send(error)
            })

            let statusRow = ''
            Report.findAll({
                where: { projectId: projectIds[k] },
                order: [
                    ['createdAt', 'DESC']
                ], limit: 5
            }).then(result => {
                // console.log("1260",result.length)
                result = JSON.parse(JSON.stringify(result))
                result.forEach(r => {
                    r['date'] = formatDate(new Date(r.createdAt));
                })

                result = getUniqueListBy(result, 'date')

                let tableRow = `
                <tr>
                <td align="center" valign="top">
                    [Date]
                </td>
                <td align="center" valign="top">
                    [Total]
                </td>
                <td align="center" valign="top">
                    [TotalClosed]
                </td>
                <td align="center" valign="top">
                    [TotalOpen]
                </td>
                <td align="center" valign="top">
                    [Re-Opened]
                </td>
                <td align="center" valign="top">
                    [NotStarted]
                </td>
                <td align="center" valign="top">
                    [InProgress]
                </td>
                <td align="center" valign="top">
                    [ReadyforTesting]
                </td>
                <td align="center" valign="top">
                    [OnHold]
                </td>
                <td align="center" valign="top">
                    [NewOpenedToday]
                </td>
                <td align="center" valign="top">
                    [TotalClosedToday]
                </td>
                <td align="center" valign="top">
                    [TaskPending7Days]
                </td>
                <td align="center" valign="top">
                    [TaskClosed7Days]
                </td>
                <td align="center" valign="top">
                    [TaskPending30Days]
                </td>
                <td align="center" valign="top">
                    [TaskPending60Days]
                </td>
                <td align="center" valign="top">
                    [TaskPending90Days]
                </td>
                </tr>`
                console.log("1371", newOpenedTasks.length)
                statusRow += tableRow.replace('[Date]', formatDate(new Date())).replace('[Total]', projectTasks.length).replace('[TotalClosed]', completedCount).replace('[TotalOpen]', projectTasks.length - completedCount).replace('[Re-Opened]', toDoReOpened).replace('[NotStarted]', toDoNotStarted).replace('[InProgress]', inProgress.length).replace('[ReadyforTesting]', testing.length).replace('[OnHold]', toDoOnHold).replace('[NewOpenedToday]', newOpenedTasks.length).replace('[TotalClosedToday]', todayCompleted).replace('[TaskPending7Days]', pendingTaskCountforSevenday.length).replace('[TaskClosed7Days]', closedTaskCountforNintyDays.length).replace('[TaskPending30Days]', pendingTaskCountforthirtyDays.length).replace('[TaskPending60Days]', pendingTaskCountforsixtyDays.length).replace('[TaskPending90Days]', pendingTaskCountforNintyDays.length,)
                // message2 = message2.replace('[STATUSTABLE]',statusRow)
                result.forEach(r => {
                    statusRow += tableRow.replace('[Date]', formatDate(new Date(r.createdAt))).replace('[Total]', r.total).replace('[TotalClosed]', r.closed).replace('[TotalOpen]', r.open).replace('[Re-Opened]', r.toDoReOpened).replace('[NotStarted]', r.toDoNotStarted).replace('[InProgress]', r.inProgress).replace('[ReadyforTesting]', r.testing).replace('[OnHold]', r.toDoOnHold).replace('[NewOpenedToday]', r.openedToday).replace('[TotalClosedToday]', r.closedToday).replace('[TaskPending7Days]', r.pendingsevenDaysTask).replace('[TaskClosed7Days]', r.closedBugsinSevenDays).replace('[TaskPending30Days]', r.pendingThirtyDaysTask).replace('[TaskPending60Days]', r.pendingsixtyDaysTask).replace('[TaskPending90Days]', r.pendingNintyDaysTasks)
                })

                message2 = message2.replace('[STATUSTABLE]', statusRow)
                email2 = "vkumar@mckinsol.com"
                mailer(transporter, email2, subject, message2)
                // mailer(transporter, userEmails.join(','), subject, message2)
            }, error => {
                // res.status(400).send(error)
            })

            // console.log("total ", projectTasks.length)
            // console.log("projectId ", projectIds[k])
            // console.log("closed ", completedCount)
            // console.log("open ", projectTasks.length - completedCount)
            // console.log("toDoNotStarted ", toDoNotStarted)
            // console.log("toDoOnHold ", toDoOnHold)
            // console.log("toDoReOpened ",  toDoReOpened)
            // console.log("inProgress ", inProgress.length)
            // console.log("testing ", testing.length)
            // console.log("openedToday ", getTasksCreatedToday)
            // console.log("closedToday ", todayCompleted)
            // mailer(transporter, email2, subject, message2)
        }
        res.send(allData)
    })


    function getUniqueListBy(arr, key) {
        return [...new Map(arr.map(item => [item[key], item])).values()]
    }

    apiRoutes.post('/getTasksAssigned', async function (req, res) {
        let employeeId = req.body.employeeId
        await sequelize.query(`SELECT a.*, c.projectName FROM StoryTasks a, columnBoards b, Projects c  WHERE a.assignee = ${employeeId} AND a.columnId = b.columnId AND b.columnName = "To Do" AND a.projectId = c.projectId`, {
            type: Sequelize.QueryTypes.SELECT
        }).then(resp => {
            res.send(resp)
        }, error => {
            res.send(error)
        })
    })

    apiRoutes.post('/getTestingTasksAssigned', async function (req, res) {
        let employeeId = req.body.employeeId
        await sequelize.query(`SELECT a.*, c.projectName, a.dueDate FROM StoryTasks a, columnBoards b, Projects c  WHERE a.tester = ${employeeId} AND a.columnId = b.columnId AND b.columnName = "Testing" AND a.projectId = c.projectId`, {
            // await sequelize.query(`SELECT a.*, a.taskName,c.projectName, a.startDate, a.dueDate FROM StoryTasks a, columnBoards b, Projects c  WHERE a.tester = ${employeeId} AND a.columnId = b.columnId AND b.columnName = "Testing" AND a.projectId = c.projectId`, {
            type: Sequelize.QueryTypes.SELECT
        }).then(resp => {
            res.send(resp)
        }, error => {
            res.send(error)
        })
    })

    apiRoutes.post('/getProjectByClientId', async function (req, res) {
        await Project.findAll({ where: { clientId: req.body.clientId } }).then(resp => {
            res.send(resp)
        }, error => {
            res.send(error)
        })
    })


    apiRoutes.post('/getClientList', async function (req, res) {
        await clientDetail.findAll({ where: { organisationId: req.body.organisationId } }).then(resp => {
            res.send(resp)
        }, error => {
            res.send(error)
        })
    })
    apiRoutes.post('/getTesterTasks', async function (req, res) {
        await StoryTasks.findAll({ where: { tester: req.body.tester, projectId: req.body.projectId } }).then(resp => {
            res.send(resp)
        }, error => {
            res.send(error)
        })
    })


    apiRoutes.post('/getAllProjectReport', async function (req, res) {
        await StoryTasks.findAll({ where: { projectId: req.body.projectId } }).then(resp => {
            let assignee = []
            for (i = 0; i < resp.length; i++) {
                assignee.push(resp[i].assignee)
            }
            let unique = [...new Set(assignee)];
            let realData = []
            for (j = 0; j < unique.length; j++) {
                let assineeDetails = []
                let actualHours = 0
                let plannedhours = 0
                for (k = 0; k < resp.length; k++) {
                    if (unique[j] != null && unique[j] == resp[k].assignee) {
                        assineeDetails.push(resp[k])
                        let actHours = resp[k].actualHours
                        let estimatedHours = resp[k].estimatedHours
                        actualHours += actHours
                        plannedhours += estimatedHours
                    }
                }
                realData.push({ "employeeId": unique[j], "actualHours": actualHours, "plannedhours": plannedhours, "TaskCount": assineeDetails.length, "Tasks": assineeDetails })
            }
            res.send(realData)
        }, error => {
            res.send(error)
        })
    })

    apiRoutes.post('/getallprojectwholedetails', async function (req, res) {
        await sequelize.query(`SELECT StoryTasks.projectId, columnBoards.columnId,columnBoards.columnName, COUNT(StoryTasks.columnId) AS counts, Projects.projectName,Projects.organisationId,Projects.projectStatus, SUM(StoryTasks.estimatedHours) AS estHours, SUM(StoryTasks.actualHours) AS actHurs
        FROM StoryTasks 
        JOIN Projects ON StoryTasks.projectId = Projects.projectId
        JOIN columnBoards ON StoryTasks.columnId = columnBoards.columnId
        WHERE Projects.organisationId = ${req.body.organisationId}
        GROUP BY StoryTasks.projectId, columnBoards.columnId
        ORDER BY StoryTasks.projectId ASC;`, {
            type: Sequelize.QueryTypes.SELECT
        }).then(resp => {
            let projects = []
            for (i = 0; i < resp.length; i++) {
                projects.push(resp[i].projectId)
            }
            let unique = [...new Set(projects)];
            console.log(unique)
            let newData = []
            for (j = 0; j < unique.length; j++) {
                let SimilarProjectData = []
                for (k = 0; k < resp.length; k++) {
                    if (unique[j] == resp[k].projectId) {
                        SimilarProjectData.push(resp[k])
                    }
                }
                newData.push(SimilarProjectData)
            }
            res.send(newData)
        }, error => {
            res.send(error)
        })
    })


    apiRoutes.post('/getAllProjectHrs', async function (req, res) {
        await sequelize.query(`SELECT a.projectId, a.projectName,a.organisationId,a.projectStatus,a.projectType, SUM(b.estimatedHours) AS estHours, SUM(b.actualHours) AS actHurs FROM Projects a, StoryTasks b  WHERE a.projectId = b.projectId AND a.organisationId = ${req.body.organisationId} GROUP BY b.projectId`, {
            type: Sequelize.QueryTypes.SELECT
        }).then(resp => {
            res.send(resp)
        }, error => {
            res.send(error)
        })

    })

    apiRoutes.post('/getTasksforDsr', async function (req, res) {
        sequelize.query(`select a.projectId, c.projectName, a.projectTaskNumber, a.taskName, a.taskId as projectTaskId, b.columnName, a.estimatedHours 
        from StoryTasks a, columnBoards b, Projects c where a.projectId = b.projectId and a.columnId = b.columnId and a.projectId = c.projectId and 
        b.columnName in ("In progress", "Testing") and a.projectId in (${req.body.projectId}) and a.assignee = ${req.body.employeeId} order by c.projectId ASC`,{
            type: Sequelize.QueryTypes.SELECT
        }).then(resp => {
            res.send(resp)
        }, error => {
            res.send(error)
        })
    })


    // ProjectManagement Request Ticket Feature Apis Start from down below ---------------------------------------
    apiRoutes.post('/requestTicket', async function (req, res) {
        requestTicket.create(req.body).then(resp=>{
            res.send(resp)
        }, error=>{
            res.send(error)
        })
    })

    apiRoutes.post('/getAllTicketsforuser', async function (req, res) {
        sequelize.query(`
        select a.requestId, a.projectId, b.projectName, a.requestdBy, c.firstName, c.lastName, a.taskId, a.taskName, a.requestdate, a.status, a.requestComment, a.approvedBy,a.approverName,  a.approvedDate, a.createdAt, a.updatedAt from requestTickets a, Projects b, Employees c where a.projectId = b.projectId and a.requestdBy = c.employeeId and a.requestdBy = ${req.body.employeeId}`,{
            type: Sequelize.QueryTypes.SELECT
        }).then(resp => {
            res.send(resp)
        }, error => {
            res.send(error)
        })

        // requestTicket.findAll({where:{requestdBy:req.body.employeeId}}).then(resp=>{
        //     res.send(resp)
        // }, error=>{
        //     res.send(error)
        // })
    })

    apiRoutes.post('/getAllTicketsforManager', async function (req, res) {
        sequelize.query(`select c.firstName, c.lastName,a.requestId, a.projectId, b.projectName, a.taskName, a.requestdBy, a.requestdate, a.status, a.requestComment,
        a.createdAt, a.updatedAt, a.approvedBy,a.approverName, a.approvedDate 
        from requestTickets a, Projects b, Employees c
        where a.projectId = b.projectId and a.requestdBy = c.employeeId and a.projectId in (${req.body.projectId});`,{
            type: Sequelize.QueryTypes.SELECT
        }).then(resp => {
            res.send(resp)
        }, error => {
            res.send(error)
        })
        // sequelize.query(`select * from requestTickets where projectId in (${req.body.projectId})`,{
        //     type: Sequelize.QueryTypes.SELECT
        // }).then(resp => {
        //     res.send(resp)
        // }, error => {
        //     res.send(error)
        // })
    })

    apiRoutes.post('/actionTicketbyProjectManager', async function (req, res) {
        await requestTicket.update({
            "approvedBy":req.body.approvedBy,
            "approvedDate":req.body.approvedDate,
            "status":req.body.status,
            "approverName":req.body.approverName
        }, {
            where: { requestId: req.body.requestId}
        }).then(result => {
                StoryTasks.update({extraHours:req.body.extraHours},{
                    where: { projectTaskNumber: req.body.taskId, projectId:req.body.projectId}
                })
            res.status(200).send(result)
        }, error => {
            res.status(400).send(error)
        })
    })

    function formatDate(date) {
        var d = new Date(date),
            month = '' + (d.getMonth() + 1),
            day = '' + d.getDate(),
            year = d.getFullYear();

        if (month.length < 2)
            month = '0' + month;
        if (day.length < 2)
            day = '0' + day;

        return [year, month, day].join('-');
    }

    app.use('/', apiRoutes);
};
