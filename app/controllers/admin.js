const express = require('express');
const Sequelize = require('sequelize');
const nodemailer = require('nodemailer');
const path = require('path')
const os = require('os')
const db = require('../../config/db.config.js');
const smtp = require('../../config/main.js');
const moment = require('moment');
const { sequelize } = require('../../config/db.config');
const _ = require('lodash')
let multer = require('multer')
// let path = require('path')
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("15", file)
    // console.log(__dirname)
    // console.log()
    let paths = path.resolve("images/documents")


    cb(null, paths)
    // cb(null, './images/documents')
  },
  filename: (req, file, cb) => {
    // console.log(file)
    cb(null, Date.now() + path.extname(file.originalname))
  }
})

let upload = multer({ storage: storage })
const XLSX = require('xlsx');
let json2xls = require("json2xls");
const bcrypt = require("bcrypt");
// const { dirname } = require('path/posix');
// const { Json } = require('sequelize/types/utils.js');
// const csvParser = require("csv-parser");
const Employees = db.Employees;
const Organisation = db.organisation
const Attendance = db.attendance
const MonthlySalary = db.MonthlySalary
const Project = db.Project
const board = db.board
const columnBoard = db.columnBoard
const Tasks = db.Tasks
const Teams = db.Teams
const Document = db.Document
const Notification = db.notification
var csv = require('node-csv').createParser();
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
// let smtpAuth = {
//   user: "vB5uBGFvQ06ugmCSGQcjSw",
//   pass: "SG.vB5uBGFvQ06ugmCSGQcjSw.cFZCx-Lc-LtYHS2lTQ9crd5udwSMjDvemGSCL-rbcyw"
// }

// let smtpConfig = {
//   host: 'smtp.sendgrid.net',
//   port: 587,
//   secure: false,
//   auth: smtpAuth
//   //auth:cram_md5
// };
let transporter = nodemailer.createTransport(smtpConfig);

transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log('Server is ready to take our messages');
  }
});
module.exports = function (app) {

  const apiRoutes = express.Router();
  function mailer(transporter, email, subject, message) {
    // console.log(email, subject, message)
    transporter.sendMail({
      from: {
        name: 'HR Portal',
        address: 'support@timesofpeople.com'
      },
      to: email,
      subject: `${subject}`,
      html: `${message}`,
    });
  }

  apiRoutes.post('/employeeOnboarding', async function (req, res) {
    req.body.isActive = true;
    req.body.image = 'https://t3.ftcdn.net/jpg/03/46/83/96/360_F_346839683_6nAPzbhpSkIpb8pmAwufkC7c5eD7wYws.jpg';
    Employees.create(req.body).then(c => {
      // let email = c.officialEmail
      // let email2  = "vkumar@mckinsol.com"
      // let subject = "Create Your New Password for HR Portal Login"
      // let message = `Hello ${First_Name} ${Last_Name}, <br><br> Please Create Your New Password for HR Portal Login.<br><br> Thanks<br>Team HR`

      // mailer(transporter, email2, subject, message)
      res.status(200).send(c)
    }, error => {
      console.log("error ", error)
      res.status(401).send(error)
    })
  });

  apiRoutes.post('/employeeFilesUploading', upload.array('files', 15), async function (req, res) {
    let data = req.files
    let organisationId = req.body.organisationId
    let employeeId = req.body.employeeId
    let projectId = req.body.projectId
    let date = new Date()
    let date1 = ("0" + date.getDate()).slice(-2);
    let month1 = ("0" + (date.getMonth() + 1)).slice(-2);
    let year1 = date.getFullYear();
    let newOne = year1 + "-" + month1 + "-" + date1
    for (i = 0; i < data.length; i++) {
      await Document.create({
        "organisationId": organisationId,
        "employeeId": employeeId,
        "projectId": projectId,
        "originalname": data[i].originalname,
        "filename": data[i].filename,
        "size": data[i].size,
        "date": newOne
      })
    }
    res.send({ "Status": "Uploading Successfully" })
  })


  apiRoutes.post('/deleteDocuments', async function (req, res) {
    await Document.destroy({ where: { documentId: req.body.documentId } }).then(resp => {
      res.send({ code: 1, "msg": "Document Deleted" })
    })
  })
  apiRoutes.post('/getoneEmployee', async function (req, res) {
    await Employees.findAll({ where: { employeeId: req.body.employeeId } }).then((c) => {
      if (c) {
        res.status(200).send(JSON.stringify(c, null, 2))
      }
    }, error => {
      console.log(error)
      res.status(401).send(error)
    })
  });
  apiRoutes.post('/getoneEmployeeDocument', async function (req, res) {
    let employeeId = req.body.employeeId
    let projectId = req.body.projectId
    if (employeeId) {
      await Document.findAll({ where: { employeeId: req.body.employeeId } }).then((c) => {
        if (c) {
          res.status(200).send(JSON.stringify(c))
        }
      }, error => {
        console.log(error)
        res.status(401).send(error)
      })
    } else if (projectId) {
      await Document.findAll({ where: { projectId: req.body.projectId } }).then((c) => {
        if (c) {
          res.status(200).send(JSON.stringify(c))
        }
      }, error => {
        console.log(error)
        res.status(401).send(error)
      })
    }


  });

  apiRoutes.post('/getAllEmployee', async function (req, res) {
    await Employees.findAll({
      where: { organisationId: req.body.organisationId },
      order: [
        ['employeeId', 'DESC']
      ],
      attributes: ['employeeId', 'firstName', 'lastName', 'imageExists', 'designation', 'officialEmail', 'phoneNo', 'DOJ', 'employeeType']
    }).then(result => {
      res.status(200).send(result)
    }, error => {
      res.status(401).send(error)
    })
  });

  apiRoutes.post('/updateEmployeeDetails', async function (req, res) {
    if (req.body.image) {
      req.body.imageExists = 1;
      var base64Data = req.body.image.replace(/^data:image\/png;base64,/, "");
      require("fs").writeFile("images/employees/" + req.body.employeeId + ".png", base64Data, 'base64', function (err) {
        console.log(err);
      });
    }
    await Employees.update(req.body, {
      where: { employeeId: req.body.employeeId }
    }).then(result => {
      res.status(200).send({ "msg": "User Details Updated!" })
    }, error => {
      res.status(401).send(error)
    })
  });

  // apiRoutes.get('/getAllOrganisation', async function (req, res) {
  //   await Organisation.findAll().then(result => {
  //     if (result) {
  //       res.status(200).send({ "count": result.length, result })
  //     }
  //   }, error => {
  //     res.status(401).send(error)
  //   })
  // });

  apiRoutes.post('/dailyAttendance', upload.fields([
    { name: 'name' },
    { name: 'type' },
    { name: 'xlsx' }
  ]), async function (req, res) {
    var workbook = XLSX.read(req.files.xlsx[0].buffer, { type: 'buffer' })
    var sheet_name_list = workbook.SheetNames;
    var json = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {
      raw: false,
    });
    if (json.length == 0) {
      res.send('empty data');
      res.end();
    }
    else {
      let myObj
      myObj = json
      for (i = 0; i < myObj.length; i++) {
        let employeeId = myObj[i].Employee_Id
        let punchIn = myObj[i].Punch_In
        let punchOut = myObj[i].Punch_Out
        var now = moment(punchOut, "H:mm:ss");
        var prev = moment(punchIn, "H:mm:ss");
        let totalWorkingHours = parseFloat(moment(now).diff(moment(prev), 'Hours', 'minutes')).toFixed(2);
        let overtime
        if (totalWorkingHours > 9) {
          overtime = parseFloat(totalWorkingHours - 9).toFixed(2);
        } else {
          overtime = 0
        }
        let date = myObj[i].Date
        date_ob = new Date(date)
        var day = ("0" + date_ob.getDate()).slice(-2);
        var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
        var year = date_ob.getFullYear();
        await Attendance.create({
          employeeId: employeeId,
          punchIn: punchIn,
          punchOut: punchOut,
          date: date,
          day: day,
          year: year,
          month: month,
          organisationId: req.body.organisationId,
          totalWorkingHours: totalWorkingHours,
          overtime: overtime
        })
      }
      res.send({ code: 1, msg: "Employee Attendance Inserted" })
    }
  })

  apiRoutes.post('/updateEmployeeAttendance', async function (req, res) {
    let employeeData = await Employees.findAll({where:{employeeId:req.body.employeeId}})
    if(employeeData.length == 1){
      Attendance.update({
        punchIn: req.body.punchIn,
        punchOut: req.body.punchOut,
        totalWorkingHours: req.body.hours
      }, { where: { employeeId: employeeData[0].biometricId, date: req.body.date } }).then(result => {
        res.status(200).send({result, "msg": "Employee Attendance Updated" })
      }, error => {
        res.status(401).send(error)
      })
    }
  })

  apiRoutes.post('/deleteEmployeeAttendance', async function (req, res) {
    await Attendance.destroy({ where: { employeeId: req.body.employeeId, date: req.body.date } }).then(result => {
      res.status(200).send({ "msg": "Employee Attendance Deleted" })
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/viewEmployeesAttendance', async function (req, res) {
    sequelize.query(`SELECT Employees.employeeId, Employees.firstName, Employees.lastName, Employees.imageExists, Attendances.date,
    Attendances.punchIn, Attendances.punchOut, Attendances.totalWorkingHours
      FROM Employees
      INNER JOIN Attendances
      ON Attendances.employeeId = Employees.biometricId WHERE Attendances.date = '${req.body.date}'`,
      {
        type: Sequelize.QueryTypes.SELECT
      }).then(resp => {
        res.send(resp)
      }, err => {
        res.status(400).send(err)
      })
  })
  apiRoutes.post('/viewUserAttendance', async function (req, res) {
    sequelize.query(`SELECT b.employeeId, b.punchIn, b.punchOut, b.date, b.totalWorkingHours FROM Employees a, Attendances b WHERE a.employeeId = ${req.body.employeeId} AND b.employeeId = a.biometricId ORDER BY DATE DESC LIMIT 30`,
      {
        type: Sequelize.QueryTypes.SELECT
      }).then(resp => {
        res.send(resp)
      }, err => {
        res.status(400).send(err)
      })
  })

  apiRoutes.get('/employeesAttendanceDownload', async function (req, res) {
    sequelize.query(`
    SELECT Employees.employeeId as id, Employees.firstName, Employees.lastName, Employees.biometricId, Attendances.date,
    Attendances.punchIn, Attendances.punchOut, Attendances.totalWorkingHours as hours
FROM Employees
LEFT JOIN Attendances ON Employees.biometricId = Attendances.employeeId AND Attendances.date = '${req.query.date}' 
order by Employees.firstName
`,
      {
        type: Sequelize.QueryTypes.SELECT
      }).then(resp => {
        let fileName = 'Attendance_' + req.query.date + '.xlsx';
        // console.log(fileName)
        resp = resp.filter(e => e['biometricId'] != null);
        resp.forEach(r => {
          delete r['biometricId'];
          r['date'] = req.query.date;
          // var input = d;
          // var fmt = "YYYY-MM-DD hh:mm:ss";  // must match the input
          // var zone = "Asia/Kolkata";
          // var m = moment.tz(input, fmt, zone);
          // m = m.utc();
          // var s = m.format(fmt);
          // var m = moment.unix(utc).tz('Asia/Kolkata').format("hh:mm a")
          if (r.punchIn) {
            var punchIn = moment.utc(r.punchIn);
            r.punchIn = punchIn.tz('Asia/Kolkata').format("hh:mm a")
          }
          if (r.punchOut) {
            var punchOut = moment.utc(r.punchOut);
            r.punchOut = punchOut.tz('Asia/Kolkata').format("hh:mm a")
          }

          // r.punchIn = moment(r.punchIn).format("hh:mm a")
          // if(r.punchOut)
          // r.punchOut = moment(r.punchOut).format("hh:mm a")
        })
        res.xls(fileName, resp)
      }, err => {
        res.status(400).send(err)
      })
  })

  apiRoutes.post('/generateSalaries', async function (req, res) {
    let month = req.body.month;
    let year = req.body.year
    await Employees.findAll({ where: { organisationId: req.body.organisationId } }).then(async result => {
      for (i = 0; i < result.length; i++) {
        let pfDeduction
        let esicDeduction
        let overAllDeductedSalary

        let employeeId = result[i].employeeId
        let employeeName = result[i].firstName + ' ' + result[i].lastName
        let basicSalary = result[i].basicSalary
        let totalSalary = result[i].totalSalary
        let presentDays;
        let overtimeSalary = 0;
        let overtimeHours = 0;

        console.log("264", totalSalary, basicSalary, employeeId)
        daysInMonth = new Date(year, month, 0).getDate();

        await Attendance.findAll({
          where: {
            employeeId: employeeId,
            month: month,
            year: year,
            organisationId: req.body.organisationId
          }
        },
          {
            type: Sequelize.QueryTypes.SELECT
          }).then(resp => {
            // console.log("attendanceData resp ", resp)
            presentDays = resp.length;
            resp.forEach(attendance => {
              console.log("attendanceData.overtime ", attendance.overtime)
              overtimeHours += attendance.overtime
              overtimeSalary += 20 * attendance.overtime
            });
          })
        let basicSalaryNew = ((basicSalary / daysInMonth) * presentDays).toFixed(2)
        let totalSalaryNew = ((totalSalary / daysInMonth) * presentDays).toFixed(2)
        if (basicSalary <= 10500) {
          pfDeduction = ((basicSalaryNew * 12) / 100)
        } else {
          pfDeduction = 0
        }
        if (totalSalary <= 21000) {
          esicDeduction = ((totalSalaryNew * 0.75) / 100)
        } else {
          esicDeduction = 0
        }
        let overallDeduction = pfDeduction + esicDeduction;

        overAllDeductedSalary = (((totalSalary / daysInMonth) * presentDays) - (pfDeduction + esicDeduction)).toFixed(2);

        let monthlySalaryCount = await MonthlySalary.count({ where: { employeeId: employeeId, month: month, year: year } })

        console.log("monthlySalaryCount ", monthlySalaryCount)
        if (monthlySalaryCount == 0) {
          let salaryObj = {
            employeeId: employeeId,
            employeeName: employeeName,
            organisationId: req.body.organisationId,
            totalWorkingDays: presentDays,
            basicSalary: basicSalaryNew,
            pfDeduction: parseFloat(pfDeduction).toFixed(2),
            esicDeduction: parseFloat(esicDeduction).toFixed(2),
            overallDeduction: parseFloat(overallDeduction).toFixed(2),
            overtimeSalary: parseFloat(overtimeSalary).toFixed(2),
            overtimeHours: parseFloat(overtimeHours).toFixed(2),
            totalSalary: parseFloat(totalSalaryNew).toFixed(2),
            overAllDeductedSalary: parseFloat(overAllDeductedSalary).toFixed(2),
            date: new Date(),
            month: month,
            year: year
          }
          await MonthlySalary.create(salaryObj)

        } else {
          await MonthlySalary.update({
            totalWorkingDays: presentDays,
            basicSalary: basicSalaryNew,
            pfDeduction: parseFloat(pfDeduction).toFixed(2),
            esicDeduction: parseFloat(esicDeduction).toFixed(2),
            overallDeduction: parseFloat(overallDeduction).toFixed(2),
            overtimeSalary: parseFloat(overtimeSalary).toFixed(2),
            overtimeHours: parseFloat(overtimeHours).toFixed(2),
            totalSalary: parseFloat(totalSalaryNew).toFixed(2),
            overAllDeductedSalary: parseFloat(overAllDeductedSalary).toFixed(2),
            date: new Date()
          }, {
            where: { employeeId: employeeId, month: month, year: year }
          });
        }
      }
      res.status(200).send({ "msg": "All Employee Salary Created Please Verify!" })
    })
  })

  apiRoutes.post('/getMonthlySalary', function (req, res) {
    sequelize.query(`SELECT *
    FROM Monthly_Salaries
    INNER JOIN Employees
    ON Monthly_Salaries.employeeId = Employees.employeeId AND Monthly_Salaries.year = '${req.body.year}' WHERE Monthly_Salaries.month = '${req.body.month}' AND Employees.organisationId = '${req.body.organisationCode}'`,
      {
        type: Sequelize.QueryTypes.SELECT
      }).then(resp => {
        res.send(resp)
      }, err => {
        res.status(400).send(err)
      })
  });

  // apiRoutes.post('/downloadexcel', async function (req, res) {
  //   let month = req.body.month
  //   let organisationId = req.body.organisationId
  //   if (month) {
  //     let userDetails = await MonthlySalary.findAll({ where: { month: month, organisationId: organisationId } })
  //     let data = JSON.stringify(userDetails)
  //   }
  // })



  apiRoutes.post('/createBoard', async function (req, res) {
    await board.create({
      boardName: req.body.boardName,
      teamId: req.body.teamId
    }).then(c => {

      res.status(200).send({ "msg": "Board Created" })
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/updateBoard', async function (req, res) {
    await board.update({
      boardName: req.body.boardName,
      teamId: req.body.teamId
    }, { where: { boardId: req.body.boardId } }).then(c => {
      res.status(200).send({ "msg": "Board Updated" })
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/deleteBoard', async function (req, res) {
    await board.destroy({ where: { boardId: req.body.boardId } }).then(c => {
      res.status(200).send({ "msg": "Board Deleted" })
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/fetchBoard', async function (req, res) {
    await board.findAll().then(c => {
      res.status(200).send(c)
    }, error => {
      res.status(401).send(error)
    })
  })
  apiRoutes.post('/createTeamColumn', async function (req, res) {
    await columnBoard.create(req.body).then(c => {
      res.status(200).send(c)
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/updateTeamColumn', async function (req, res) {
    await columnBoard.update(req.body, { where: { columnId: req.body.columnId } }).then(c => {
      res.status(200).send(c)
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/deleteTeamColumn', async function (req, res) {
    console.log("deleteTeamColumn", req.body.columnId)
    await columnBoard.destroy({ where: { columnId: req.body.columnId } }).then(c => {
      res.status(200).send({ success: true })
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/fetchTeamColumns', async function (req, res) {
    await columnBoard.findAll({ where: { teamId: req.body.teamId } }).then(c => {
      res.status(200).send(c)
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/createTeam', async function (req, res) {
    await Teams.create({
      teamName: req.body.teamName
    }).then(c => {
      res.status(200).send({ "msg": "Team Created" })
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/updateTeam', async function (req, res) {
    await Teams.update(req.body, { where: { teamId: req.body.teamId } }).then(c => {
      res.status(200).send({ "msg": "Team Updated" })
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/deleteTeam', async function (req, res) {
    await Teams.destroy({ where: { teamId: req.body.teamId } }).then(c => {
      res.status(200).send({ "msg": "Team Deleted" })
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/fetchTeams', async function (req, res) {
    await Teams.findAll().then(c => {
      res.status(200).send(c)
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/getMyTeamId', async function (req, res) {
    await Teams.findAll({
      attributes: ['teamId'],
      where: Sequelize.literal(`JSON_CONTAINS(users, '[${req.body.employeeId}]')`),
    }).then(c => {
      res.status(200).send(c)
    }, error => {
      res.status(401).send(error)
    })
  })

  apiRoutes.post('/massOnboarding', upload.fields([
    { name: 'name' },
    { name: 'type' },
    { name: 'xlsx' }
  ]), async function (req, res) {
    var workbook = XLSX.read(req.files.xlsx[0].buffer, { type: 'buffer' })
    var sheet_name_list = workbook.SheetNames;
    var json = XLSX.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]], {
      raw: false,
    });
    if (json.length == 0) {
      res.send('empty data');
      res.end();
    }
    else {
      let myObj
      myObj = json
      console.log("245", myObj)
      for (i = 0; i < myObj.length; i++) {
        let First_Name = myObj[i].First_Name
        let Middle_Name = myObj[i].Middle_Name
        let Last_Name = myObj[i].Last_Name
        let Personal_Email = myObj[i].Personal_Email
        let Official_Email_ID = myObj[i].Official_Email_ID
        let Official_Email_Password = myObj[i].Official_Email_Password
        let Phone_Number = myObj[i].Phone_Number
        let Present_Address = myObj[i].Present_Address
        let Permanent_Address = myObj[i].Permanent_Address
        let Pan_Number = myObj[i].Pan_Number
        let Adhar_Number = myObj[i].Adhar_Number
        let Gender = myObj[i].Gender
        let DOJ = myObj[i].DOJ
        let DOB = myObj[i].DOB
        let Employee_Type = myObj[i].Employee_Type
        let Father_Name = myObj[i].Father_Name
        let Spouse_Name = myObj[i].Spouse_Name
        let Emergency_Contact_Name = myObj[i].Emergency_Contact_Name
        let Emergency_Contact_Number = myObj[i].Emergency_Contact_Number
        let Organisation_ID = myObj[i].Organisation_ID
        let Company_Name = myObj[i].Company_Name
        let Company_Branch = myObj[i].Company_Branch
        let Apperisal_Days = myObj[i].Apperisal_Days
        let Basic_Salary = myObj[i].Basic_Salary
        let Total_Salary = myObj[i].Total_Salary
        let password = myObj[i].Password
        let designation = myObj[i].Designation
        let userGroup = myObj[i].userGroup
        bcrypt.genSalt(10, function (err, result) {
          bcrypt.hash(Official_Email_ID, result, function (err, hash) {
            if (err) {
              return console.log('Cannot encrypt');
            }
            Employees.create({
              firstName: First_Name,
              middleName: Middle_Name,
              lastName: Last_Name,
              personalEmail: Personal_Email,
              officialEmail: Official_Email_ID,
              officialEmailPassword: Official_Email_Password,
              presentAddress: Present_Address,
              phoneNo: Phone_Number,
              permanentAddress: Permanent_Address,
              panNumber: Pan_Number,
              adharNumber: Adhar_Number,
              gender: Gender,
              DOJ: DOJ,
              DOB: DOB,
              employeeType: Employee_Type,
              fatherName: Father_Name,
              spouseName: Spouse_Name,
              emergencyContachName: Emergency_Contact_Name,
              emergencyContactNumber: Emergency_Contact_Number,
              organisationId: Organisation_ID,
              companyName: Company_Name,
              companyBranch: Company_Branch,
              apperisalDays: Apperisal_Days,
              basicSalary: Basic_Salary,
              totalSalary: Total_Salary,
              isActive: true,
              hashedEmail: hash,
              password: password,
              designation: designation,
              userGroup: userGroup
            })
            // let email2 = Official_Email_ID
            // let subject = "Create Your New Password for HR Portal Login"
            // let message = `Hello ${First_Name} ${Last_Name}, <br><br> Please Create Your New Password for HR Portal Login.<br><br> Thanks<br>Team HR`
            // mailer(transporter, email2, subject, message)
            // }
          })
        })
      }
      res.send({ code: 1, msg: "Employee Attendance Inserted" })
    }
  })

  apiRoutes.post('/filterdataTask', async function (req, res) {

    let employeeId = req.body.employeeId
    let to = req.body.to
    let from = req.body.from
    let statuses = req.body.statuses

    if (employeeId.length > 0) {
      let query = `select tab1.*,
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
          Tasks.status,
          Tasks.taskId,
          Tasks.taskName,
          Tasks.projectId,
          Tasks.approverId,
          Tasks.approverName,
          Tasks.approvedDate,
          Tasks.estimatedHours,
          columnBoards.columnName
        from
          Employees Inner join Tasks on Employees.employeeId = Tasks.employeeId 
          JOIN columnBoards ON Tasks.columnId = columnBoards.columnId
        where                  
          Employees.employeeId in (${employeeId})
          and Tasks.date between '${to}' and '${from}'
          and Tasks.status in (${statuses})
      ) as tab1 left join Projects on tab1.projectId = Projects.projectId `;
      sequelize.query(query,
        {
          type: Sequelize.QueryTypes.SELECT
        }).then(resp => {
          let newResp = _.groupBy(resp, function (person) {
            var props = ['lastName', 'firstName', 'employeeId'],
              prop = [];
            for (var i = 0, length = props.length; i < length; i++) {
              prop.push(person[props[i]]);
            }
            return prop
          });
          let finalResult = []
          Object.entries(newResp).forEach(([key, value]) => {
            // console.log(`${key} ${value}`); 
            let newValue = value.map(({ employeeId, firstName, lastName, ...rest }) => {
              return rest;
            });
            let myArray = key.split(",");
            let finalResultObject = {}
            finalResultObject['details'] = {}
            finalResultObject['details']['task'] = newValue
            finalResultObject['details']['lastName'] = myArray[0]
            finalResultObject['details']['firstName'] = myArray[1]
            finalResultObject['details']['employeeId'] = parseInt(myArray[2])
            finalResult.push(finalResultObject)
          });
          res.send(finalResult)
        }, error => {
          console.log('error is.........', error)
          res.status(400).send({ msg: JSON.stringify(error) })
        })
    } else {
      res.status(400).send({ "msg": "Please Select Employee" })
    }
  }),

    apiRoutes.post('/getNotifications', async function (req, res) {
      console.log("741", req.body.employeeId)
      let data = await Notification.findAll({ where: { employeeId: req.body.employeeId } })
      console.log(data.length)
      await Notification.findAll({
        limit: 20, where: { employeeId: req.body.employeeId }, order: [
          ['notificationId', 'DESC']
        ]
      }).then(resp => {
        res.send({ "count": data.length, resp })
      }, error => {
        res.send("error")
      })
    })

  // let test = {
  //   "analysis": {
  //     "title": "DMAC Profiling Report",
  //     "date_start": "2022-10-17 14:41:19.286235",
  //     "date_end": "2022-10-17 14:41:25.070987",
  //     "duration": "0:00:05.784752"
  //   },
  //   "table": {
  //     "n": 12,
  //     "n_var": 67,
  //     "memory_size": 6308,
  //     "record_size": 525.6666666666666,
  //     "n_cells_missing": 527,
  //     "n_vars_with_missing": 54,
  //     "n_vars_all_missing": 34,
  //     "p_cells_missing": 0.6554726368159204,
  //     "types": {
  //       "Categorical": 29,
  //       "Unsupported": 34,
  //       "Numeric": 1,
  //       "Boolean": 3
  //     },
  //     "n_duplicates": 0,
  //     "p_duplicates": 0.0
  //   },
  //   "variables": {
  //     "Plant": {
  //       "n_distinct": 12,
  //       "p_distinct": 1.0,
  //       "is_unique": true,
  //       "n_unique": 12,
  //       "p_unique": 1.0,
  //       "type": "Categorical",
  //       "hashable": true,
  //       "value_counts_without_nan": {
  //         "0001": 1,
  //         "0003": 1,
  //         "1000": 1,
  //         "2000": 1,
  //         "INDC": 1,
  //         "INST": 1,
  //         "MCK1": 1,
  //         "MCK2": 1,
  //         "RFDC": 1,
  //         "RFST": 1,
  //         "RRDC": 1,
  //         "RRST": 1
  //       },
  //       "value_counts_index_sorted": {
  //         "0001": 1,
  //         "0003": 1,
  //         "1000": 1,
  //         "2000": 1,
  //         "INDC": 1,
  //         "INST": 1,
  //         "MCK1": 1,
  //         "MCK2": 1,
  //         "RFDC": 1,
  //         "RFST": 1,
  //         "RRDC": 1,
  //         "RRST": 1
  //       },
  //       "ordering": true,
  //       "n_missing": 0,
  //       "n": 12,
  //       "p_missing": 0.0,
  //       "count": 12,
  //       "memory_size": 224,
  //       "first_rows": {
  //         "0": "0001",
  //         "1": "0003",
  //         "2": "1000",
  //         "3": "2000",
  //         "4": "INDC"
  //       },
  //       "chi_squared": {
  //         "statistic": 0.0,
  //         "pvalue": 1.0
  //       },
  //       "max_length": 4,
  //       "mean_length": 4.0,
  //       "median_length": 4,
  //       "min_length": 4,
  //       "length_histogram": {
  //         "4": 12
  //       },
  //       "histogram_length": {
  //         "counts": [
  //           12
  //         ],
  //         "bin_edges": [
  //           3.5,
  //           4.5
  //         ]
  //       },
  //       "n_characters_distinct": 14,
  //       "n_characters": 48,
  //       "character_counts": {
  //         "0": 12,
  //         "R": 6,
  //         "C": 5,
  //         "1": 3,
  //         "D": 3,
  //         "S": 3,
  //         "T": 3,
  //         "2": 2,
  //         "I": 2,
  //         "N": 2,
  //         "M": 2,
  //         "K": 2,
  //         "F": 2,
  //         "3": 1
  //       },
  //       "category_alias_values": {
  //         "0": "Decimal_Number",
  //         "R": "Uppercase_Letter",
  //         "C": "Uppercase_Letter",
  //         "1": "Decimal_Number",
  //         "D": "Uppercase_Letter",
  //         "S": "Uppercase_Letter",
  //         "T": "Uppercase_Letter",
  //         "2": "Decimal_Number",
  //         "I": "Uppercase_Letter",
  //         "N": "Uppercase_Letter",
  //         "M": "Uppercase_Letter",
  //         "K": "Uppercase_Letter",
  //         "F": "Uppercase_Letter",
  //         "3": "Decimal_Number"
  //       },
  //       "block_alias_values": {
  //         "0": "ASCII",
  //         "R": "ASCII",
  //         "C": "ASCII",
  //         "1": "ASCII",
  //         "D": "ASCII",
  //         "S": "ASCII",
  //         "T": "ASCII",
  //         "2": "ASCII",
  //         "I": "ASCII",
  //         "N": "ASCII",
  //         "M": "ASCII",
  //         "K": "ASCII",
  //         "F": "ASCII",
  //         "3": "ASCII"
  //       },
  //       "block_alias_counts": {
  //         "ASCII": 48
  //       },
  //       "n_block_alias": 1,
  //       "block_alias_char_counts": {
  //         "ASCII": {
  //           "0": 12,
  //           "R": 6,
  //           "C": 5,
  //           "1": 3,
  //           "D": 3,
  //           "S": 3,
  //           "T": 3,
  //           "2": 2,
  //           "I": 2,
  //           "N": 2,
  //           "M": 2,
  //           "K": 2,
  //           "F": 2,
  //           "3": 1
  //         }
  //       },
  //       "script_counts": {
  //         "Latin": 30,
  //         "Common": 18
  //       },
  //       "n_scripts": 2,
  //       "script_char_counts": {
  //         "Common": {
  //           "0": 12,
  //           "1": 3,
  //           "2": 2,
  //           "3": 1
  //         },
  //         "Latin": {
  //           "R": 6,
  //           "C": 5,
  //           "D": 3,
  //           "S": 3,
  //           "T": 3,
  //           "I": 2,
  //           "N": 2,
  //           "M": 2,
  //           "K": 2,
  //           "F": 2
  //         }
  //       },
  //       "category_alias_counts": {
  //         "Uppercase Letter": 30,
  //         "Decimal Number": 18
  //       },
  //       "n_category": 2,
  //       "category_alias_char_counts": {
  //         "Decimal_Number": {
  //           "0": 12,
  //           "1": 3,
  //           "2": 2,
  //           "3": 1
  //         },
  //         "Uppercase_Letter": {
  //           "R": 6,
  //           "C": 5,
  //           "D": 3,
  //           "S": 3,
  //           "T": 3,
  //           "I": 2,
  //           "N": 2,
  //           "M": 2,
  //           "K": 2,
  //           "F": 2
  //         }
  //       },
  //       "word_counts": {
  //         "0001": 1,
  //         "0003": 1,
  //         "1000": 1,
  //         "2000": 1,
  //         "indc": 1,
  //         "inst": 1,
  //         "mck1": 1,
  //         "mck2": 1,
  //         "rfdc": 1,
  //         "rfst": 1,
  //         "rrdc": 1,
  //         "rrst": 1
  //       }
  //     }
  //   }
  // }

  // async function excelGenerate() {
  //   console.log(" excelGenerate ")

  //   const ws = XLSX.utils.json_to_sheet([test.analysis])

  //   const wb = XLSX.utils.book_new()
  //   await XLSX.utils.book_append_sheet(wb, ws, 'users')
  //   var tempFilePath = path.join(os.tmpdir(), new Date().getTime() + "-DMAC.xlsx");

  //   await XLSX.writeFile(wb, tempFilePath)
  //   console.log(" excelGenerate tempFilePath ", tempFilePath)
  // }
  // excelGenerate();


  apiRoutes.post('/organisationChart', async function (req, res) {
    // let data = await sequelize.query(`SELECT * from Teams WHERE JSON_CONTAINS(managers, '${203}', '$');`, { type: Sequelize.QueryTypes.SELECT })
    // console.log(data)
    let data = await sequelize.query(`SELECT * from Teams a where a.teamName = "LOB"`, { type: Sequelize.QueryTypes.SELECT })
    let id = data[0].users
    let managerid = data[0].managers
    let headNode = await sequelize.query(`SELECT * from Employees a where a.employeeId IN(${managerid})`, { type: Sequelize.QueryTypes.SELECT })
    let nodeArray = []
    for (i = 0; i < headNode.length; i++) {
      let firstName = headNode[i].firstName
      let lastName = headNode[i].lastName
      let employeeId = headNode[i].employeeId
      let officialEmail = headNode[i].officialEmail
      let teamArray = []
      let detailsData = await sequelize.query(`SELECT * from Employees a where a.employeeId IN(${id})`, { type: Sequelize.QueryTypes.SELECT })
      for (j = 0; j < detailsData.length; j++) {
        let teamFirstName = detailsData[j].firstName
        let teamLastName = detailsData[j].lastName
        let teamEmployeeId = detailsData[j].employeeId
        let teamOfficialEmail = detailsData[j].officialEmail
        let chieldTeamDataArray = []

        let teamIdSearch = await sequelize.query(`SELECT * from Teams WHERE JSON_CONTAINS(managers, '${teamEmployeeId}', '$');`, { type: Sequelize.QueryTypes.SELECT })
        for (l = 0; l < teamIdSearch.length; l++) {
          let chieldTeamData = await sequelize.query(`SELECT * from Employees a where a.employeeId IN(${teamIdSearch[l].users})`, { type: Sequelize.QueryTypes.SELECT })
          for (o = 0; o < chieldTeamData.length; o++) {

            let teamIdSearchdata = await sequelize.query(`SELECT * from Teams WHERE JSON_CONTAINS(managers, '${chieldTeamData[o].employeeId}', '$');`, { type: Sequelize.QueryTypes.SELECT })
            let subChildData = []
            for (p = 0; p < teamIdSearchdata.length; p++) {
              let chieldTeamDatasss = await sequelize.query(`SELECT * from Employees a where a.employeeId IN(${teamIdSearchdata[p].users})`, { type: Sequelize.QueryTypes.SELECT })
              for (q = 0; q < chieldTeamDatasss.length; q++) {
                subChildData.push({
                  "firstName": chieldTeamDatasss[q].firstName,
                  "lastName": chieldTeamDatasss[q].lastName,
                  "employeeId": chieldTeamDatasss[q].employeeId,
                  "officialEmail": chieldTeamDatasss[q].officialEmail,
                  "chieldNode": []
                })
              }
            }
            chieldTeamDataArray.push({ "firstName": chieldTeamData[o].firstName, "lastName": chieldTeamData[o].lastName, "employeeId": chieldTeamData[o].employeeId, "officialEmail": chieldTeamData[o].officialEmail, "chieldNode": subChildData })
          }
        }
        teamArray.push({ "teamFirstName": teamFirstName, "teamLastName": teamLastName, "teamEmployeeId": teamEmployeeId, "teamOfficialEmail": teamOfficialEmail, "chieldNode": chieldTeamDataArray })
      }
      nodeArray.push({ "firstName": firstName, "lastName": lastName, "employeeId": employeeId, "officialEmail": officialEmail, "teamArray": teamArray })
    }
    res.send(nodeArray)
  })

  // apiRoutes.post('/abhi',(req,res)=>{
  //   res.send("hello world...")
  // })

  // var newPunchOut = moment(1696351089000);
  // var newPuncIn = moment(1696318269000);
  // console.log("newPunchOut....", newPunchOut)
  // console.log("newPuncIn....", newPuncIn)

  // let totalWorkingHours = parseFloat(moment(newPunchOut).diff(moment(newPuncIn), 'Hours', 'minutes')).toFixed(2);
  // console.log("time difference is ...", totalWorkingHours)

  // apiRoutes.post('/tes',async (req, res) => {
  //   await Employees.findAll({}).then(re => {
  //     console.log("employees result is...", re.length);
  //   }, error => {
  //     console.log("error while finding the employees data..", error)
  //   })
  //   console.log("hello hi there ...");
  // })

  app.use('/', apiRoutes);
};
