const express = require('express');
const { callbackPromise } = require('nodemailer/lib/shared/index.js');
const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config.js');
const Op = Sequelize.Op
const db = require('../../config/db.config.js');
const Employees = db.Employees;
const Teams = db.Teams;
const XLSX = require('xlsx');
let json2xls = require("json2xls");
const Organisation = db.organisation
const UserGroups = db.UserGroups
const Customer = db.Customer
// const httpRequest = require('request');
const cors = require('cors')({ origin: true });
const api_key = 'key-a14dbfed56acf890771e7d1f3d372a82';
const domain = 'mail.aftersale.in';
const mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });
let moment = require('moment');

module.exports = function (app) {

  const apiRoutes = express.Router();

  //   apiRoutes.post('/login', async function (req, res) {
  //     console.log("Login....");
  //     var { email, pwd } = req.body;
  //     console.log(email, pwd);

  //     Organisation.findAll({  where: {
  //         organisationEmail: req.body.email,
  //         password: req.body.password
  //       }}).then(resp => {
  //         res.send(resp);

  //         // console.log("resp ", resp)
  //         // if (resp && Object.keys(resp).length > 0) {
  //         //     res.send(resp);
  //         // } else {
  //         //     User.findOne({ email: email, password: pwd }).then(result => {
  //         //         console.log("result")
  //         //         console.log(result)
  //         //         res.send(result);
  //         //     }, err => {
  //         //         console.log("err")
  //         //         console.log(err)
  //         //         res.send(err);
  //         //     })
  //         // }
  //     }, err => {
  //         res.status(400).send(err)
  //     })
  // })

  apiRoutes.post('/getUserDetails', async function (req, res) {
    // console.log("getUserDetails ", req.body.userId)

    if (req.body.type == 'customer') {
      Customer.findOne({
        where: {
          customerId: req.body.userId
        }
      }).then(resp => {
        res.send(resp);
      })
    } else {
      Organisation.findOne({
        where: {
          organisationId: req.body.userId
        }
      }).then(resp => {
        if (resp && Object.keys(resp).length > 0) {
          res.send(resp);
        } else {
          sequelize.query(`SELECT Employees.firstName, Employees.lastName,Employees.image, Employees.officialEmail, Employees.organisationId, userGroups.modules, userGroups.permissions, Employees.employeeId
            FROM Employees
            INNER JOIN userGroups ON Employees.userGroup = userGroups.userGroupId AND Employees.employeeId = '${req.body.userId}'`, {
            type: Sequelize.QueryTypes.SELECT
          }).then(data => {
            res.send(data[0])
          }, err => {
            res.status(400).send(err)
          })
        }
      }, err => {
        res.status(400).send(err)
      })
    }

  })


  apiRoutes.post('/searchEmployees', async function (req, res) {
    await Employees.findAll({
      where: {
        firstName: {
          [Op.like]: '%' + req.body.searchTerm + '%'
        }
      },
      attributes: ['employeeId', 'firstName', 'lastName', 'imageExists']
    }).then(c => {
      res.status(200).send(c)
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/getEmployeesByIds', async function (req, res) {
    await Employees.findAll({
      where: {
        employeeID: req.body.employeeIds
      },
      attributes: ['employeeId', 'firstName', 'lastName', 'imageExists']
    }).then(resp => {
      res.status(200).send(resp)
    }, error => {
      res.status(401).send(error)
    })

    // let q = `SELECT employeeId, firstName, lastName, image from Employees WHERE employeeId = '${req.body.employeeIds}'`;

    // console.log(q)

    // sequelize.query(q,
    //   {
    //     type: Sequelize.QueryTypes.SELECT
    //   }).then(resp => {
    //     res.send(resp)
    //   }, err => {
    //     res.status(400).send(err)
    //   })

  })



  apiRoutes.post('/getUserTeams', async function (req, res) {

    sequelize.query(`SELECT * from Teams WHERE JSON_CONTAINS(users, '${req.body.userId}', '$');`,
      {
        type: Sequelize.QueryTypes.SELECT
      }).then(resp => {
        res.send(resp)
      }, err => {
        res.status(400).send(err)
      })

  })

  apiRoutes.post('/createUserGroup', async function (req, res) {
    await UserGroups.create(req.body).then(c => {
      res.status(200).send(c)
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/fetchAllUserGroups', async function (req, res) {
    await UserGroups.findAll({
      where: {
        organisationId: req.body.organisationId,
      }
    }).then(c => {
      res.status(200).send(c)
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/updateUserGroup', async function (req, res) {
    await UserGroups.update(req.body, {
      where: { userGroupId: req.body.userGroupId }
    }).then(result => {
      res.status(200).send({ "msg": "User Details Updated!" })
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/deleteUserGroup', async function (req, res) {
    await UserGroups.destroy({ where: { userGroupId: req.body.userGroupId } }).then(c => {
      res.status(200).send({ "msg": "Group Deleted" })
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/getTeamsReporting', async function (req, res) {
    sequelize.query(`SELECT * from Teams WHERE JSON_CONTAINS(managers, '${req.body.userId}', '$');`,
      {
        type: Sequelize.QueryTypes.SELECT
      }).then(resp => {
        res.send(resp)
      }, err => {
        res.status(400).send(err)
      })
  })

  apiRoutes.get('/downloadDsr', async function (req, res) {
    await sequelize.query(`select
    tab1.*,
    (
      case
        when (Projects.projectName is not null) then Projects.projectName
        else 'No Project Assigned'
      end
    ) as projectName
  from
    (
      select
        Employees.lastName,
        Employees.firstName,
        Employees.employeeId,
        Tasks.to,
        Tasks.date,
        Tasks.from,
        Tasks.hours,
        Tasks.taskName,
        Tasks.projectId,
        CASE
          WHEN Tasks.status = 0 THEN 'New Task'
          WHEN Tasks.status = 1 THEN 'Approved'
          ELSE 'Rejected'
        END AS status1,
        CASE
          WHEN Tasks.billable = 0 THEN 'Non-Billable'
          ELSE 'Billable'
        END AS billable
      from
        Employees
        Inner join Tasks on Employees.employeeId = Tasks.employeeId
      where
        Employees.employeeId in (${req.query.employeeIds})
        and Tasks.date between '${req.query.from}' and '${req.query.to}'
    ) as tab1
    left join Projects on tab1.projectId = Projects.projectId`, {
      type: Sequelize.QueryTypes.SELECT
    }).then(resp => {
      if (resp.length > 0) {
        let data = []
        resp.forEach(async (v, i) => {
          let from = moment(v.from).tz(req.query.timezone).format('LTS');
          let to = moment(v.to).tz(req.query.timezone).format('LTS');
          data.push({ "First_Name": v.firstName, "Last_Name": v.lastName, "Date": v.date, "Task_Name": v.taskName, "Project_Name": v.projectName, "Type": v.billable, "Hours": v.hours, "From": from, "To": to, "Status": v.status1 })
        })
        let abc = data.sort(function (a, b) { return b.date - a.date })
        let dsrName = `DSR ${new Date()}.xlsx`
        res.xls(dsrName, abc)
      } else {
        res.send("No DSRs are available for this date range.")
      }
    })
  })


  apiRoutes.get('/dowmloadAllEmployeeList', async function (req, res) {
    await Employees.findAll({ where: { organisationId: req.query.organisationId } }).then(resp => {
      if (resp.length > 0) {
        let data = []
        resp.forEach(async (v, i) => {
          data.push({ "employeeId": v.employeeId, "First_Name": v.firstName, "Last_Name": v.lastName, "Designation": v.designation, "Father_Name": v.fatherName, "Personal_Email": v.personalEmail, "Official_Email": v.officialEmail, "Phone_Number": v.phoneNo, "Present_Address": v.presentAddress, "Permanent_Address": v.permanentAddress, "Pan_Number": v.panNumber, "Adhar_Number": v.adharNumber, "Gender": v.gender, "DOJ": v.DOJ, "Company_Name": v.companyName, "Company_Branch": v.companyBranch, "Is_Active": v.isActive })
        })
        let abc = data.sort(function (a, b) { return a.DOJ - b.DOJ })
        let EmployeeList = `EmployeeList ${new Date()}.xlsx`
        res.xls(EmployeeList, abc)
      }
    })
  })

  //   apiRoutes.post('/sendemail', (req, res) => {

  //   apiRoutes.post('/sendemail', (req, res) => {

  //     let subject = req.body.subject;
  //     let name = req.body.name;
  //     let email = req.body.email;
  //     let message = req.body.message;

  //     res.set('Access-Control-Allow-Origin', '*');
  //     res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, GET, POST');

  //     var data = {
  //       from: 'Aftersale CRM <sales@aftersale.in>',
  //       to: 'info@elvento.com',
  //       subject: 'Aftersale CRM Form - ' + subject,
  //       html: name + '<br>' + email + '<br>' + message // html body
  //     };

  //     mailgun.messages().send(data, function (error, body) {
  //       res.send({ status: true });
  //     });
  //   });

  // apiRoutes.post('/createCustomer', function(req, res) {
  //   var options = {
  //     url: 'https://books.zoho.com/api/v3/contacts?organization_id=648777151',
  //     headers: {
  //       'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
  //       'Authorization': 'Zoho-authtoken 0f7d951d5cda1d97721e22307200d34e'
  //     }
  //   };


  //   httpRequest(options, function(error, response, body) {
  //     if (!error && response.statusCode == 200) {
  //       var info = JSON.parse(body);
  //       console.log(info + " info");
  //       res.send(info)
  //     }
  //   });

  // });

  apiRoutes.get('/', function (req, res) {
    res.send({ status: true })
  });

  app.use('/', apiRoutes);
};
