const express = require("express");
const Sequelize = require("sequelize");
const nodemailer = require("nodemailer");
const { QueryTypes } = require("sequelize");
const { sequelize, Teams } = require("../../config/db.config.js");
const Op = Sequelize.Op;
const smtp = require("../../config/main.js");
const db = require("../../config/db.config.js");
const convinceAndCalm = db.convinceAndCalm;
const Employees = db.Employees;
const cors = require("cors")({ origin: true });
const path = require("path");
var apiRoutes = express.Router();
var multer = require("multer");
const employeesModel = require("../models/employees.model.js");
const fs = require("fs");

let smtpAuth = {
  user: smtp.smtpuser,
  pass: smtp.smtppass,
};
let smtpConfig = {
  host: smtp.smtphost,
  port: smtp.smtpport,
  secure: false,
  auth: smtpAuth,
  //auth:cram_md5
};

let transporter = nodemailer.createTransport(smtpConfig);

transporter.verify(function (error, success) {
  if (error) {
    console.log(error);
  } else {
    console.log("Server is ready to take our messages");
  }
});

function mailer(transporter, email, subject, message) {
  // console.log(email, subject, message)
  transporter.sendMail({
    from: {
      name: "HR Portal",
      address: "support@timesofpeople.com",
    },
    to: email,
    subject: `${subject}`,
    html: `${message}`,
  });
}

module.exports = function (app) {
  const apiRoutes = express.Router();

  apiRoutes.post("/createConvinceAndCalm", async function (req, res) {
    let employeeData = await Employees.findOne({
      where: { employeeId: req.body.employeeId },
    });
    var employeeOfficialEmail = employeeData.officialEmail;
    console.log("employee email...", employeeOfficialEmail);

    sequelize
      .query(
        `SELECT * FROM Employees WHERE employeeId = ${req.body.employeeId};`,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      )
      .then(
        (resp) => {
          // console.log(resp)
          var employeeData = resp.find(
            (employeesModel) => employeesModel.employeeId
          );
          // console.log(employeeData.officialEmail,employeeData.firstName,employeeData.lastName);

          function mailer(transporter, email, subject, message) {
            // console.log(email, subject, message)
            transporter.sendMail({
              from: {
                name: "HR Portal",
                address: "support@timesofpeople.com",
              },
              to: email,
              subject: `${subject}`,
              html: `${message}`,
            });
          }

          let cdate = new Date();
          let udate = new Date();
          let employeeId = req.body.employeeId;
          let employeeName =
            employeeData.firstName + " " + employeeData.lastName;
          let travelData = req.body.travelData;
          let totalAmount = 0;
          for (i = 0; i <= travelData.length - 1; i++) {
            // totalAmount = totalAmount + travelData[i].amount;
            let amount = travelData[i].amount;
            let parsedAmount = parseInt(amount, 10);
            if (!isNaN(parsedAmount)) {
              totalAmount = totalAmount + parsedAmount;
            }
          }

          sequelize
            .query(
              `SELECT managers from Teams WHERE JSON_CONTAINS(users, '${req.body.employeeId}', '$');`,
              {
                type: Sequelize.QueryTypes.SELECT,
              }
            )
            .then((resp) => {
              // console.log("manager respppp...", resp);
              employeeManagerData = resp;

              convinceAndCalm
                .create({
                  cdate: cdate,
                  employeeId: employeeId,
                  employeeName: employeeName,
                  cdate: cdate,
                  status: "New",
                  totalAmount: totalAmount,
                  travelData: travelData,
                  employeeManagerData: employeeManagerData,
                })
                .then(
                  (resp) => {
                    // console.log("convinceAndCalm_Id Id is...", resp.convinceAndCalm_Id);
                    res.status(200).send(resp);
                    //for mail
                    sequelize
                      .query(
                        `SELECT * from Teams WHERE JSON_CONTAINS(users, '${employeeId}', '$');`,
                        {
                          type: Sequelize.QueryTypes.SELECT,
                        }
                      )
                      .then(
                        (teams) => {
                          //   let managerEmails = ["svishwakarma@neuvays.com"];
                          let mEmails = ["svishwakarma@neuvays.com"];
                          mEmails.push(employeeOfficialEmail);

                          let managerEmails = mEmails;
                          console.log("mail sent to...", managerEmails);

                          let subject = `New Convince and Calm applicaton is Submitted by ${employeeName} !!`;
                          let message = `New Convince and Calm application created by ${employeeName}.<br><br>  
                            Kindly ckeck it on the Mckinsol Portal...<br><br>
                            Application Id : <b>${resp.convinceAndCalm_Id}</b> <br>
                            Status : <b>New</b> <br>
                            Amount : Rs. <b>${totalAmount}</b> <br>
                            Created on Date : ${cdate}<br><br><br>
                            Thanks & regards<br>
                            <b>HR Portal</b>`;
                          mailer(transporter, managerEmails, subject, message);
                        },
                        (err) => {
                          //   res.status(400).send(err)
                        }
                      );
                  },
                  (err) => {
                    res.status(400).send(err);
                  }
                );
            });

          console.log(" employeeId ", employeeId);
        },
        (err) => {
          res.status(400).send(err);
        }
      );
  });

  apiRoutes.post("/getConvinceAndCalm", async function (req, res) {
    await convinceAndCalm
      .findAll({ where: { employeeId: req.body.employeeId } })
      .then(
        (resp) => {
          res.status(200).send(resp);
        },
        (err) => {
          res.status(400).send(err);
        }
      );
  });

  apiRoutes.post("/getManagerConvinceAndCalm", async function (req, res) {
    sequelize
      .query(
        `SELECT *
        FROM convinceAndCalms
        WHERE JSON_CONTAINS(
                employeeManagerData,
                JSON_ARRAY(JSON_OBJECT('managers', JSON_ARRAY(${req.body.employeeId}))),
                '$'
            );`,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      )
      .then(
        (resp) => {
          res.send(resp);
        },
        (err) => {
          res.status(400).send(err);
        }
      );
  });

  apiRoutes.post("/updateConvinceAndCalm", async function (req, res) {
    let udate = new Date();
    let employeeId = req.body.employeeId;
    // let employeeName = employeeData.firstName + " " + employeeData.lastName;
    let reason;
    {
      reason = req.body.reason;
      if (reason == undefined) {
        reason = "N/A";
      }
    }
    let travelData = req.body.travelData;
    let totalAmount = 0;
    for (i = 0; i <= travelData.length - 1; i++) {
      let approvedAmount = travelData[i].approvedAmount;
      let parsedApproveAmount = parseInt(approvedAmount, 10);
      let amount = travelData[i].amount;
      let parsedAmount = parseInt(amount, 10);

      if (parsedApproveAmount != parsedAmount && !isNaN(parsedApproveAmount)) {
        if (!isNaN(parsedApproveAmount)) {
          totalAmount = totalAmount + parsedApproveAmount;
          console.log("total amount at index ", i, " is ", totalAmount);
        } else {
          console.log("total amount at index ", i, " is ", totalAmount);
        }
      } else {
        if (!isNaN(parsedAmount)) {
          totalAmount = totalAmount + parsedAmount;
          console.log("total amount at index ", i, " is ", totalAmount);
        } else {
          console.log("total amount at index ", i, " is ", totalAmount);
        }
      }
    }
    console.log("total amount update...", totalAmount);

    let employeeData = await Employees.findOne({
      where: { employeeId: employeeId },
    });
    let employeeOfficialEmail = employeeData.officialEmail;
    console.log("employee email...", employeeOfficialEmail);

    var empMiddleware = await Employees.findOne({
      where: { employeeId: req.body.employeeIdMiddleware },
    });

    sequelize
      .query(
        `SELECT * FROM Employees WHERE employeeId = ${req.body.employeeId};`,
        {
          type: Sequelize.QueryTypes.SELECT,
        }
      )
      .then(
        (resp) => {
          // console.log(resp)
          var employeeData = resp.find(
            (employeesModel) => employeesModel.employeeId
          );
          // console.log(employeeData.officialEmail,employeeData.firstName,employeeData.lastName);
          let employeeName =
            employeeData.firstName + " " + employeeData.lastName;

          var empMiddlewareName =
            empMiddleware.firstName + " " + empMiddleware.lastName;
          console.log("employeMiddlewareName : ", empMiddlewareName);

          function mailer(transporter, email, subject, message) {
            // console.log(email, subject, message)
            transporter.sendMail({
              from: {
                name: "HR Portal",
                address: "support@timesofpeople.com",
              },
              to: email,
              subject: `${subject}`,
              html: `${message}`,
            });
          }

          convinceAndCalm
            .update(
              {
                status: req.body.status,
                udate: udate,
                reason: reason,
                travelData: travelData,
                totalAmount: totalAmount,
              },
              { where: { convinceAndCalm_Id: req.body.convinceAndCalm_Id } }
            )
            .then(
              (c) => {
                res
                  .status(200)
                  .send({ message: "Record updated successfully!!" });

                sequelize
                  .query(
                    `SELECT * from Teams WHERE JSON_CONTAINS(users, '${employeeId}', '$');`,
                    {
                      type: Sequelize.QueryTypes.SELECT,
                    }
                  )
                  .then(
                    (teams) => {
                      let mEmails = ["svishwakarma@neuvays.com"];
                      mEmails.push(employeeOfficialEmail);

                      let managerEmails = mEmails;
                      console.log("mail sent to...", managerEmails);

                      let subject = `Status Updated - Convince and Calm applicaton by ${empMiddlewareName} !!`;
                      let message = `Convince and Calm application created by ${employeeName} is now updated by ${empMiddlewareName}.<br><br>
                          Kindly check it on the Mckinsol Portal...<br><br>
                          Application Id : <b>${req.body.convinceAndCalm_Id}</b> <br>
                          Status : <b>${req.body.status}</b> <br>
                          Reason : ${reason} <br>
                          Updated on Date : ${udate}<br><br><br>
                          Thanks & regards,<br>
                          <b>HR Portal</b>`;
                      mailer(transporter, managerEmails, subject, message);
                    },
                    (err) => {
                      //   res.status(400).send(err)
                    }
                  );
              },
              (error) => {
                res.status(401).send(error);
              }
            );
        },
        (err) => {
          res.status(400).send(err);
        }
      );
  });

  // apiRoutes.post("/deleteConvince", async function (req, res) {
  //   sequelize.query(`DELETE FROM convinceAndCalms WHERE employeeId = 344;`)
  //   .then(
  //     (resp) => {
  //       res.status(200).send(resp);
  //     },
  //     (err) => {
  //       res.status(400).send(err);
  //     }
  //   );
  // });

  // apiRoutes.post("/getAllConvinceAndCalm", async function (req, res) {
  //   await convinceAndCalm
  //     .findAll()
  //     .then(
  //       (resp) => {
  //         res.status(200).send(resp);
  //       },
  //       (err) => {
  //         res.status(400).send(err);
  //       }
  //     );
  // });

  app.use("/", apiRoutes);
};
