const express = require('express');
const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../config/db.config.js');
const Op = Sequelize.Op
const db = require('../../config/db.config.js');
const Employees = db.Employees;
const Organisation = db.organisation
const Attendance = db.attendance
const Customer = db.Customer
const clientDetail = db.clientDetails
const Otp = db.Otp
const roles = db.roles
const cors = require('cors')({ origin: true });
const api_key = 'key-a14dbfed56acf890771e7d1f3d372a82';
const domain = 'mail.aftersale.in';
const mailgun = require('mailgun-js')({ apiKey: api_key, domain: domain });
const axios = require('axios').default;
const xmlparser = require('express-xml-bodyparser');
const xml = require('xml');
const moment = require('moment');
const nodemailer = require('nodemailer')
const smtp = require('../../config/main');
const e = require('express');
var multer = require('multer')
const path = require('path')
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
let transporter = nodemailer.createTransport(smtpConfig);
transporter.verify(function (error) {
  if (error) {
    console.log(error);
  }
});
const storage = multer.diskStorage({
  destination: './images/',
  filename: (req, file, cb) => {
      return cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`)
  }
})
const upload = multer({ storage: storage })
module.exports = function (app) {

  const apiRoutes = express.Router();

  apiRoutes.use(xmlparser());
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
  //   apiRoutes.use((req, res, next)=>{
  //     if(req.header('Content-Type').endsWith("xml")){
  //         parser.parseString(req.body, (err, data)=>{
  //             console.log('xml data',data);
  //             next();
  //         })
  //     }
  //     next();
  // });

  //   apiRoutes.post('/login', async function (req, res) {
  //     await Organisation.findOne({ where: { organisationEmail: req.body.organisationEmail, password: req.body.password } }).then((resp) => {
  //       res.status(200).send(resp)
  //     }, error => {
  //       res.status(401).send(error)
  //     })
  //   });

  apiRoutes.post('/login', function (req, res) {
    let email = req.body.email;
    if(email.includes("mckinsol") || email.includes("neuvays") || email.includes("intellicept") || email.includes("upharmony")){
      console.log(req.body.email)
      Organisation.findOne({
        where: {
          organisationEmail: req.body.email,
          password: req.body.password
        }
      }).then(resp => {
        console.log(req.body.email, req.body.password, resp)
        if (resp && Object.keys(resp).length > 0) {
          res.send({ userId: resp.organisationId, type: 'organisation' });
        } else {
          Employees.findOne({
            where: {
              officialEmail: req.body.email,
              password: req.body.password,
              isActive:1
            }
          }).then(result => {
            // console.log("Employees findOne ", result)
            if (result)
              res.send({ userId: result['employeeId'], type: 'employee' });
            else
              res.sendStatus(400);
          }, err => {
            res.send(err);
          })
        }
      }, err => {
        res.status(400).send(err)
      })
    } else {
      Customer.findOne({
        where: {
          email: req.body.email,
          password: req.body.password
        }
      }).then(resp => {
        if(resp) {
          res.send({ userId: resp['customerId'], type: 'customer' });
        }
      }, err => {
        res.status(400).send(err)
      })
    }

  })

  apiRoutes.post('/sentOtp', async function (req, res) {
    let data = await Employees.findOne({ where: { officialEmail: req.body.officialEmail } })
    let number = Math.floor(1000 + Math.random() * 9000);
    console.log(number)
    await Otp.create({
      "otp": number,
      "employeeId": data.employeeId,
      "date": new Date()
    }).then(resp => {
      let email2 = req.body.officialEmail
      let subject = "OTP Verification - HR Portal Email Verification"
      let message = `Hello ${data.firstName} ${data.lastName},<br><br>This is Your OTP ${number} for reset your password on HR Portal. Please Do Not Share with Others <br><br> Thanks,<br>HR Support`
      mailer(transporter, email2, subject, message)
      res.send({ code: 1, resp })
    }, err => {
      res, send({ code: 0, "msg": "Error Found!" })
    })
  })

  apiRoutes.post('/forgotPassword', async function (req, res) {
    await Employees.update(req.body, { where: { officialEmail: req.body.officialEmail } }).then(resp => {
      res.send({ code: 1, "msg": "Request Updated!" })
    }, error => {
      res.send({ code: 0, "msg": "Something Went Wrong!" })
    })
  })

  // let a = ["1", "2022-12-08 02:43:29", "0", "1", "0", "", "", "0", "0", "\n"]
  // let d = a[1];

  // let date = d.split(" ")[0]
  // // // let time = d.split(" ")[1]

  // var input = d;
  // var fmt = "YYYY-MM-DD hh:mm:ss";  // must match the input
  // var zone = "Asia/Kolkata";
  // var m = moment.tz(input, fmt, zone);
  // m = m.utc();
  // // var s = m.format(fmt);
  // let time = new Date(m).getTime();
  // // console.log(time)

  // // let time = new Date().getTime();

  // Attendance.findOne({
  //   where: {
  //     employeeId: a[0]
  //   },
  //   order: [
  //     ['createdAt', 'DESC']
  //   ]
  // }).then(result => {
  //   // console.log("result ", result)
  //   if (result) {

  //     let threshold = result.punchIn + 12*60*60*1000

  //     if(time < threshold){
  //       Attendance.update({
  //         punchOut: time,
  //         totalWorkingHours: parseFloat((time - result.punchIn)/(1*60*60*1000)).toFixed(2)
  //       }, { where: { id: result.id } })
  //     } else {
  //       Attendance.create({
  //         employeeId: a[0],
  //         date: date,
  //         punchIn: time
  //       }).then(result => {
  //       }, error => {
  //       })
  //     }
      
  //   console.log("threshold ", threshold)

  //     // Attendance.update({
  //     //   punchOut: time
  //     // }, { where: { id: result.id } })

  //   } else {
  //     Attendance.create({
  //       employeeId: a[0],
  //       date: date,
  //       punchIn: time
  //     }).then(result => {
  //     }, error => {
  //     })
  //   }

  // }, error => {
  //   console.log("error ", error)
  // })



  apiRoutes.post('/iclock/cdata.aspx', async function (request, response) {
    console.log("post ", request.query)
    request.on('data', async chunk => {
      let a = chunk.toString().split("\t");
      if (request.query['table'] == 'ATTLOG') {
        let d = a[1];

        let date = d.split(" ")[0]

        // var input = d;
        // var fmt = "YYYY-MM-DD hh:mm:ss";  // must match the input
        // var zone = "Asia/Kolkata";
        // var m = moment.tz(input, fmt, zone);
        // m = m.utc();
        // var s = m.format(fmt);
        let time = new Date().getTime();
        // console.log(time)
      
        // let time = new Date().getTime();
      
        Attendance.findOne({
          where: {
            employeeId: a[0]
          },
          order: [
            ['createdAt', 'DESC']
          ]
        }).then(result => {
          // console.log("result ", result)
          if (result) {
      
            let threshold = result.punchIn + 12*60*60*1000
      
            if(time < threshold){
              Attendance.update({
                punchOut: time,
                totalWorkingHours: parseFloat((time - result.punchIn)/(1*60*60*1000)).toFixed(2)
              }, { where: { id: result.id } })
            } else {
              if(result.date != date){
                Attendance.create({
                  employeeId: a[0],
                  date: date,
                  punchIn: time
                }).then(result => {
                }, error => {
                })
              } else {
                Attendance.update({
                  punchIn: time
                }, { where: { id: result.id, date: date } }).then(result => {
                }, error => {
                })
              }
            } 
          } else {
            Attendance.create({
              employeeId: a[0],
              date: date,
              punchIn: time
            }).then(result => {
            }, error => {
            })
          }
        }, error => {
          console.log("error ", error)
        })
      }
    })
    request.on('end', () => {
      // console.log("end ")
    })

    response.send("OK\n");
  });

  apiRoutes.post('/changePassword', async function (req, res) {
    let data = await Employees.findOne({ where: { employeeId: req.body.employeeId } })
    if (data.password == req.body.oldpassword) {
      await Employees.update(req.body, { where: { employeeId: req.body.employeeId } }).then(resp => {
        res.send({ "msg": "Request Updated!" })
      }, error => {
        res.send({ "msg": "Something Went Wrong!" })
      })
    }
  })

  apiRoutes.post('/clientOnboarding', async function (req, res) {
    console.log(req.body)
    let data = await clientDetail.find({ where: { clientEmail: req.body.clientEmail } })
    if (data.length > 0) {
      await clientDetail.create(req.body).then(resp => {
        res.send(resp)
      }, error => {
        res.send(error)
      })
    } else {
      res.send(error)
    }
  })

  apiRoutes.post('/clientLogin', async function (req, res) {
    await clientDetail.findOne({ where: { clientEmail: req.body.clientEmail, clientPassword: req.body.clientPassword } }).then(resp => {
      res.send(resp)
    }, error => {
      res.send(error)
    })
  })


  //   apiRoutes.post('/getUserDetails', async function (req, res) {
  //     console.log("getUserDetails ", req.body.userId)

  //     Organisation.findOne({  where: {
  //         organisationEmail: req.body.email
  //       }}).then(resp => {
  //         // if (resp && Object.keys(resp).length > 0) {
  //             // console.log("resp ", resp)
  //             res.send(resp);
  //         // } else {

  //         // }
  //     }, err => {
  //         res.status(400).send(err)
  //     })
  // })


  apiRoutes.post('/createOrganisation', async function (req, res) {
    req.body.isActive = true;
    await Organisation.create(req.body).then(result => {
      res.status(200).send({ "msg": "Organisation Onboarded" })
    }, error => {
      res.status(401).send(error)
    })
  });

  apiRoutes.post('/getNewsFeed', async function (req, res) {
    // axios.get('https://www.prlog.org/news/ind/technology/rss.xml')
    var parseString = require('xml2js').parseString;
    axios.get('https://feeds.feedburner.com/digit/latest-news')
      .then(function (response) {
        parseString(response.data, function (err, result) {
          res.send(result['rss']['channel'][0]['item']);
        });
      })
      .catch(function (error) {
        console.log(error);
        res.status(401).send(error)
      })
  });

  apiRoutes.post('/updateOrganisationDetails', async function (req, res) {
    await Organisation.update(req.body, {
      where: { organisationId: req.body.organisationId }
    }).then(result => {
      res.status(200).send({ "msg": "Organisation Onboarded" })
    }, error => {
      res.status(401).send(error)
    })
  });

  apiRoutes.post('/getOrganisation', async function (req, res) {
    console.log("getOrganisation")
    await Organisation.findOne({ where: { organisationId: req.body.organisationId } }).then((resp) => {
      res.status(200).send(resp)
    }, error => {
      res.status(400).send(error)
    })
  });


  apiRoutes.post('/roleCreate', upload.any(), async function (req, res) {
    const XLSX = require('xlsx');
    const filePath = './images/'+req.files[0].filename;
    console.log(filePath)
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    for(i =0; i<jsonData.length; i++){
      await roles.create({roleName: jsonData[i].roles})
    }
    res.send("ok")
  })
  apiRoutes.get('/', function (req, res) {
    res.send({ status: true })
  });

  app.use('/', apiRoutes);
};
