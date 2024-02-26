let cron = require('node-cron');
const nodemailer = require('nodemailer')
const request = require('request')
const smtp = require('../../config/main');
const { Teams, Employees, ProjectMembers, notification, Tasks, Project, StoryTasks, Sprint } = require('../../config/db.config.js');
const db = require('../../config/db.config.js');
const weeklyDashboard = db.weeklyDashboard
const Sequelize = require('sequelize');
const _ = require('lodash');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config.js');
const Op = Sequelize.Op

// const { Tasks, notification } = require('./config/db.config.js');
let smtpAuth = {
  user: smtp.smtpuser,
  pass: smtp.smtppass
}
let smtpConfig = {
  host: smtp.smtphost,
  port: smtp.smtpport,
  secure: false,
  auth: smtpAuth
};
console.log("19", smtpConfig)
let transporter = nodemailer.createTransport(smtpConfig);
transporter.verify(function (error) {
  if (error) {
    console.log(error);
  }
});
module.exports = function (app) {
  // function mailer(transporter, email, subject, message) {
  //   // console.log(email, subject, message)
  //   transporter.sendMail({
  //     from: {
  //       name: 'Mckinsol Portal',
  //       address: 'support@timesofpeople.com'
  //     },
  //     to: email,
  //     subject: `${subject}`,
  //     html: `${message}`,
  //   }).then(resp => {
  //     console.log(resp)
  //   }, error => {
  //     console.log(error)
  //   });
  // }
  // cron.schedule('00 09 * * *', async function Send() {
  //   let date = new Date()
  //   date.setDate(date.getDate() - (5));
  //   let date1 = ("0" + date.getDate()).slice(-2);
  //   let month = ("0" + (date.getMonth() + 1)).slice(-2);
  //   let year = date.getFullYear();
  //   let newDate = year + "-" + month + "-" + date1
  //   let result = await Employees.findAll()
  //   // console.log("31", newDate, result.length)
  //   for (i = 0; i < result.length; i++) {
  //     let tasks = await Tasks.findAll({ where: { "employeeId": result[i].employeeId, "date": date } })
  //     // console.log("32", tasks)
  //     if (tasks.length == 0) {
  //       console.log(tasks.length)
  //       await notification.create({
  //         "employeeId": result[i].employeeId,
  //         "organisationId": result[i].organisationId,
  //         "date": newDate,
  //         "notification": `Today is your last date for due DSR, kindly fill all your dsr for ${newDate}. From tomorrow onward your dsr will be freeze for ${newDate}`
  //       }).then(resp => {
  //         console.log("96")
  //         // let email2 = "vyadav@mckinsol.com"
  //         let email2 = result[i].officialEmail
  //         let subject = "Last Day Reminder for DSR"
  //         let message = `Hello ${result[i].firstName} ${result[i].lastName},<br><br> This email is to inform you, Today is the last day to fill DSR for due Date: ${newDate}. Kindly Fill all your due DSR otherwise it will freeze from tomorrow onward.<br><br> Thanks,<br>HR Support`
  //         // console.log(email2, subject, message)
  //         mailer(transporter, email2, subject, message)
  //       }, error => {
  //         console.log(error)
  //       })
  //     }
  //   }
  // })

  // request('http://127.0.0.1:3000/dailyStatus', function (error, response, body) {
  //   console.error('error:', error); // Print the error if one occurred
  //   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  //   console.log('body:', body); // Print the HTML for the Google homepage.
  // });

  // cron.schedule('36 21 * * *', async function testing() {
  // cron.schedule('00 16 * * *', async function testing() {
  // request('http://127.0.0.1:3000/dailyStatus', function (error, response, body) {
  //   console.error('error:', error); // Print the error if one occurred
  //   console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
  //   console.log('body:', body); // Print the HTML for the Google homepage.
  // });
  // })

  // cron.schedule('53 19 * * *', async function testing() {
  cron.schedule('0 0 26 * *', async function testing() {
    request('http://127.0.0.1:3000/assignMonthlyLeaves', function (error, response, body) {
      console.error('error:', error); // Print the error if one occurred
      console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
      console.log('body:', body); // Print the HTML for the Google homepage.
    });
  })
  
};



// cron.schedule('* * * * *', async function WeeklyDashboard() {
//   console.log("hello")
// })
// WeeklyDashboardss()
async function WeeklyDashboardss() {
  await weeklyDashboard.findAll({ where: { isActive: 1 } }).then(resp => {
    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const date3 = `${year}-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day}`;
    for(i=0; i<resp.length; i++){
      sequelize.query(`select * from Sprints where  projectId = 2 and startDate < '${date3}' and dueDate >= '${date3}' and completionDate IS NULL`, {
        type: Sequelize.QueryTypes.SELECT
      }).then(result => {
        sequelize.query(`select * from StoryTasks where taskId in (${result[0].tasks})`).then(taskresp => {
  

        })
      })
    }
  })
}
