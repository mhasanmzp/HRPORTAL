const express = require("express");
const Sequelize = require("sequelize");
const nodemailer = require("nodemailer");
const { QueryTypes } = require("sequelize");
const { sequelize, Teams } = require("../../config/db.config.js");
const Op = Sequelize.Op;
const smtp = require("../../config/main.js");
const db = require("../../config/db.config.js");
// const appraisal = db.appraisal;
const empAppraisal = db.empAppraisal;
const L2Appraisal = db.L2Appraisal;
const L3Appraisal = db.L3Appraisal;
const L4Appraisal = db.L4Appraisal;
const Manager = db.ManagerEvaluation;
const department = db.department;
const Employees = db.Employees;
const empMang = db.empMan;
const hrAmount = db.hrAppraisalPerRatingAmount;
const employeesModel = require("../models/employees.model.js");
const cors = require("cors")({ origin: true });
const path = require("path");
var apiRoutes = express.Router();
var multer = require("multer");
const ejs = require('ejs');
const fs = require('fs');
const { differenceInMonths, max, getYear } = require('date-fns');
const { isNull, concat, entries } = require("lodash");
const { map } = require("async");
const { v4: uuidv4 } = require('uuid');

// // Generate a UUID
// const myUUID = uuidv4();

// console.log(myUUID);



module.exports = function (app) {
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
  }
  let transporter = nodemailer.createTransport(smtpConfig);
  transporter.verify(function (error, success) {
    if (error) {
      console.log(error);
    } else {
      console.log("Server is ready to take our messages");
    }
  });

  apiRoutes.post("/hrResponse", async (req, res) => {
    console.log("req.body::::::", req.body);
    const flag = req.body.flag;
    if (flag == 1) {
      empAppraisal.update({ status: "Completed" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
        res.json({ "message": "Appraisal process completed successfully" }).status(200);
        console.log("Status updated successfully");
      }).catch((err) => {
        console.log(err);
      })
    }
    else {
      res.json({ "message": "Appraisal has been rejected" });
    }
  });

  apiRoutes.post("/oldmanagersEvaluation", async (req, res) => {//old
    try {
      console.log("Payload::::::::", req.body);
      const id = req.body.employeeId;//Manager Id who is filling the evaluation form.
      const date = new Date();
      console.log(id);
      const appraisalId = parseInt(req.body.appraisalId);
      console.log(appraisalId);
      const appraisalDetails = await empAppraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['employeeId', 'isEditedByEmp'] });
      console.log(appraisalDetails);
      const empFlag = appraisalDetails.isEditedByEmp;
      // const L2EmpFlag = appraisalDetails.isEditedByL2;
      let L2Flag;
      let L3Flag;
      let L4Flag;
      const empMangDetails = await empMang.findOne({ where: { employeeId: appraisalDetails.employeeId }, raw: true });
      console.log(empMangDetails);
      const L2Manager = empMangDetails.L2ManagerId;
      const L3Manager = empMangDetails.L3ManagerId;
      const L4Manager = empMangDetails.L4ManagerId;
      const L5Manager = empMangDetails.L5ManagerId;
      // console.log("L3Manager:::", L3Manager);
      if (id == L2Manager || id == L3Manager || id == L4Manager || id == L5Manager) {
        if (empFlag == 0) {
          res.status(400).json({
            "message": "Employee Self evaluation is not yet filled by the employee"
          });
        }
        else {
          if (id == L2Manager) {
            let check;
            await L2Appraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL2Manager'] }).then((data) => {
              check = data.isEditedByL2Manager
            }).catch((err) => {
              console.log(err);
            })
            if (check == 1) {
              res.status(400).json({ "message": "Form already submitted by manager not allowed to re-submit" });
            }
            else {
              console.log("req.body:::", req.body)
              const flag = req.body.flag;


              const updateData = {
                L2communicationSkill: req.body.communicationSkill,
                L2communicationSkillRemarks: req.body.communicationSkillRemarks,
                L2interpersonalSkill: req.body.interpersonalSkill,
                L2interpersonalSkillRemarks: req.body.interpersonalSkillRemarks,
                L2abilityToPlanTheWork: req.body.abilityToPlanTheWork,
                L2abilityToPlanTheWorkRemarks: req.body.abilityToPlanTheWorkRemarks,
                L2problemSolving: req.body.problemSolving,
                L2problemSolvingRemarks: req.body.problemSolvingRemarks,
                L2adaptability: req.body.adaptability,
                L2adaptabilityRemarks: req.body.adaptabilityRemarks,
                L2willingnessToShoulderAdditional: req.body.willingnessToShoulderAdditional,
                L2willingnessToShoulderAdditionalRemarks: req.body.willingnessToShoulderAdditionalRemarks,
                L2commitmentToDoAPerfectJob: req.body.commitmentToDoAPerfectJob,
                L2commitmentToDoAPerfectJobRemarks: req.body.commitmentToDoAPerfectJobRemarks,
                L2habitsAndManners: req.body.habitsAndManners,
                L2habitsAndMannersRemarks: req.body.habitsAndMannersRemarks,
                L2presentation: req.body.presentation,
                L2presentationRemarks: req.body.presentationRemarks,
                L2punctuality: req.body.punctuality,
                L2punctualityRemarks: req.body.punctualityRemarks,
                L2confidentialityOfInfo: req.body.confidentialityOfInfo,
                L2confidentialityOfInfoRemarks: req.body.confidentialityOfInfoRemarks,
                L2trustworthiness: req.body.trustworthiness,
                L2trustworthinessRemarks: req.body.trustworthinessRemarks,
                L2teamSpirit: req.body.teamSpirit,
                L2teamSpiritRemarks: req.body.teamSpiritRemarks,
                L2relationshipWithColleagues: req.body.relationshipWithColleagues,
                L2relationshipWithColleaguesRemarks: req.body.relationshipWithColleaguesRemarks,
                L2decisionMaking: req.body.decisionMaking,
                L2decisionMakingRemarks: req.body.decisionMakingRemarks,
                L2computerskills: req.body.computerskills,
                L2computerskillsRemarks: req.body.computerskillsRemarks
                // Add more fields as needed
              };

              const updateCondition = {
                // Define the condition based on which records should be updated
                // For example, to update records with id = 1:
                appraisalId: req.body.appraisalId,
              };

              L2Appraisal.update(updateData, {
                where: updateCondition,
              })
                .then((data) => {
                  console.log("Updated Successfully");
                  // res.send("Updated Successfully").status(200)
                })
                .catch(error => {
                  console.error('Error updating records:', error);
                  // res.send(error).status(400);
                });

              // const sum = parseInt(req.body.sum);
              const sum = req.body.communicationSkill + req.body.interpersonalSkill + req.body.abilityToPlanTheWork + req.body.problemSolving + req.body.adaptability + req.body.willingnessToShoulderAdditional + req.body.commitmentToDoAPerfectJob + req.body.habitsAndManners + req.body.presentation + req.body.punctuality + req.body.confidentialityOfInfo + req.body.trustworthiness + req.body.teamSpirit + req.body.relationshipWithColleagues + req.body.decisionMaking + req.body.computerskills;

              console.log(sum);
              // console.log(empEvaSum);
              const percentage = Math.floor(sum / 80 * 100);
              console.log("Overall Percentage::::::::", percentage);
              // console.log("sum+emEvaSum.L2TS::::::::", sum + empEvaSum.L2TS);

              L2Appraisal.update({ L2_ManagersOverallPercentage: percentage, L2_ManagersTotalScore: sum }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                console.log("percentage updated successfully");
              }).catch((err) => {
                console.log(err);
              });

              let overallRating;
              if (1 <= percentage && percentage <= 25) {
                overallRating = "Average";
              } else if (26 <= percentage && percentage <= 50) {
                overallRating = "Good";
              } else if (51 <= percentage && percentage <= 75) {
                overallRating = "Very Good";
              } else if (76 <= percentage && percentage <= 100) {
                overallRating = "Excellent";
              }
              console.log("OverallRating::::::::::", overallRating);
              L2Appraisal.update({ L2_ManagersOverallRating: overallRating }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                // L2Flag =1;
                console.log("rating updated successfully");
              }).catch((err) => {
                console.log(err);
              })

              if (flag == 1) {
                L2Appraisal.update({ isEditedByL2Manager: true }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  // L2Flag =1;
                  console.log("flag has been updated successfully");
                }).catch((err) => {
                  console.log(err);
                })
                empAppraisal.update({ status: "Forwarded to Level-3- Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  console.log("Status updated successfully in empAppraisal");
                }).catch((err) => {
                  console.log(err);
                });
                console.log("isnull():::::", isNull(L3Manager));

                if (isNull(L3Manager)) {//Checking whether is there any further level for evaluation or not for an employee. 
                  console.log(":::::::::::::::::Here:::::::::::::::::")
                  empAppraisal.update({ status: "Forwarded to Last Level Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                    console.log("Status updated successfully l3 is null");

                    Manager.update({
                      lastLevelMaxMarks: 80, lastLevelScoredMarks: sum
                    }, { where: { appraisalId: req.body.appraisalId } })
                      .then((data) => {
                        console.log("Created Successfully in L5Appraisals");
                        // res.send("Updated Successfully").status(200)
                      })
                      .catch(error => {
                        console.error('Error creating records in L5Appraisals:', error);
                        // res.json({ "message": error }).status(400);
                      });
                  }).catch((err) => {
                    console.log(err);
                  });
                }
              }

              res.json({ "message": overallRating }).status(200);
            }


          }
          if (id == L3Manager) {
            await L2Appraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL2manager'] }).then((data) => {
              console.log("Here at L2Flag data::::::", data)
              L2Flag = data.isEditedByL2manager;
              console.log("L2Flag::::", L2Flag)
            }).catch((err) => {
              console.log(err);
            });
            if (L2Flag == 0) {
              res.json({ "message": "Level 2 Evaluation is not done yet", "status": 400 });
            }
            else {
              let check;
              await L3Appraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL3Manager'] }).then((data) => {
                check = data.isEditedByL3Manager
              }).catch((err) => {
                console.log(err);
              })
              if (check == 1) {
                res.status(400).json({ "message": "Form already submitted by the manager not allowed to re-submit" });
              }
              else {
                let flag = req.body.flag;


                const updateData = {
                  L3communicationSkill: req.body.communicationSkill,
                  L3communicationSkillRemarks: req.body.communicationSkillRemarks,
                  L3interpersonalSkill: req.body.interpersonalSkill,
                  L3interpersonalSkillRemarks: req.body.interpersonalSkillRemarks,
                  L3abilityToPlanTheWork: req.body.abilityToPlanTheWork,
                  L3abilityToPlanTheWorkRemarks: req.body.abilityToPlanTheWorkRemarks,
                  L3problemSolving: req.body.problemSolving,
                  L3problemSolvingRemarks: req.body.problemSolvingRemarks,
                  L3adaptability: req.body.adaptability,
                  L3adaptabilityRemarks: req.body.adaptabilityRemarks,
                  L3willingnessToShoulderAdditional: req.body.willingnessToShoulderAdditional,
                  L3willingnessToShoulderAdditionalRemarks: req.body.willingnessToShoulderAdditionalRemarks,
                  L3commitmentToDoAPerfectJob: req.body.commitmentToDoAPerfectJob,
                  L3commitmentToDoAPerfectJobRemarks: req.body.commitmentToDoAPerfectJobRemarks,
                  L3habitsAndManners: req.body.habitsAndManners,
                  L3habitsAndMannersRemarks: req.body.habitsAndMannersRemarks,
                  L3presentation: req.body.presentation,
                  L3presentationRemarks: req.body.presentationRemarks,
                  L3punctuality: req.body.punctuality,
                  L3punctualityRemarks: req.body.punctualityRemarks,
                  L3confidentialityOfInfo: req.body.confidentialityOfInfo,
                  L3confidentialityOfInfoRemarks: req.body.confidentialityOfInfoRemarks,
                  L3trustworthiness: req.body.trustworthiness,
                  L3trustworthinessRemarks: req.body.trustworthinessRemarks,
                  L3teamSpirit: req.body.teamSpirit,
                  L3teamSpiritRemarks: req.body.teamSpiritRemarks,
                  L3relationshipWithColleagues: req.body.relationshipWithColleagues,
                  L3relationshipWithColleaguesRemarks: req.body.relationshipWithColleaguesRemarks,
                  L3decisionMaking: req.body.decisionMaking,
                  L3decisionMakingRemarks: req.body.decisionMakingRemarks,
                  L3computerskills: req.body.computerskills,
                  L3computerskillsRemarks: req.body.computerskillsRemarks
                  // Add more fields as needed
                };

                const updateCondition = {
                  // Define the condition based on which records should be updated
                  // For example, to update records with id = 1:
                  appraisalId: req.body.appraisalId,
                };

                L3Appraisal.update(updateData, {
                  where: updateCondition,
                })
                  .then((data) => {
                    console.log("Updated Successfully");
                    // res.send("Updated Successfully").status(200)
                  })
                  .catch(error => {
                    console.error('Error updating records:', error);
                    // res.send(error).status(400);
                  });

                // const sum = parseInt(req.body.sum);
                const sum = req.body.communicationSkill + req.body.interpersonalSkill + req.body.abilityToPlanTheWork + req.body.problemSolving + req.body.adaptability + req.body.willingnessToShoulderAdditional + req.body.commitmentToDoAPerfectJob + req.body.habitsAndManners + req.body.presentation + req.body.punctuality + req.body.confidentialityOfInfo + req.body.trustworthiness + req.body.teamSpirit + req.body.relationshipWithColleagues + req.body.decisionMaking + req.body.computerskills;

                console.log(sum);
                const lastSum = await L2Appraisal.findOne({
                  where: { appraisalId: req.body.appraisalId }, raw: true,
                  attributes: ['L2_ManagersTotalScore'/* add more fields as needed */]
                });
                console.log(lastSum);
                console.log(lastSum.L2_ManagersTotalScore);
                const finalSum = sum + lastSum.L2_ManagersTotalScore;
                console.log("FinalSum:::::", finalSum);
                const percentage = Math.floor(finalSum / 160 * 100);//total marks at level 3  is 260 which is 80 from level 1 and 90 from level 2 and 90 from level 3 .
                console.log("Overall Percentage::::::::", percentage);


                L3Appraisal.update({ L3_ManagersOverallPercentage: percentage, L3_ManagersTotalScore: finalSum }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  console.log("percentage updated successfully");
                }).catch((err) => {
                  console.log(err);
                })

                let overallRating;
                if (1 <= percentage && percentage <= 25) {
                  overallRating = "Average";
                } else if (26 <= percentage && percentage <= 50) {
                  overallRating = "Good";
                } else if (51 <= percentage && percentage <= 75) {
                  overallRating = "Very Good";
                } else if (76 <= percentage && percentage <= 100) {
                  overallRating = "Excellent";
                }
                console.log("OverallRating::::::::::", overallRating);

                L3Appraisal.update({ L3_ManagersOverallRating: overallRating }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  // L3Flag =1;
                  console.log("rating updated successfully");
                }).catch((err) => {
                  console.log(err);
                });
                if (flag == 1) {
                  L3Appraisal.update({ isEditedByL3Manager: true }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                    // L3Flag =1;
                    console.log("rating updated successfully");
                  }).catch((err) => {
                    console.log(err);
                  });
                  empAppraisal.update({ status: "Forwarded to Level-4- Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                    console.log("Status updated successfully");
                  }).catch((err) => {
                    console.log(err);
                  });

                  if (isNull(L4Manager)) {
                    empAppraisal.update({ status: "Forwarded to Last Level Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                      console.log("Status updated successfully");

                      Manager.update({
                        lastLevelMaxMarks: 160, lastLevelScoredMarks: finalSum
                      }, { where: { appraisalId: req.body.appraisalId } })
                        .then((data) => {
                          console.log("Created Successfully in L5Appraisals");
                          // res.send("Updated Successfully").status(200)
                        })
                        .catch(error => {
                          console.error('Error creating records in L5Appraisals:', error);
                          // res.json({ "message": error }).status(400);
                        });
                    }).catch((err) => {
                      console.log(err);
                    });
                  }
                }


                res.json({ "message": overallRating }).status(200);
              }

            }
          }
          if (id == L4Manager) {
            let data = await L3Appraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL3Manager'] });

            L3Flag = data.isEditedByL3Manager;
            if (L3Flag == 0) {
              res.json({ "message": "Level 3 Evaluation is not done yet", "status": 400 });
            }
            else {
              let check;
              await L4Appraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL4Manager'] }).then((data) => {
                check = data.isEditedByL4Manager
              }).catch((err) => {
                console.log(err);
              })
              if (check == 1) {
                res.status(400).json({ "message": "Form already submitted by the manager not allowed to re-submit" });
              }
              else {
                const flag = req.body.flag;


                const updateData = {
                  L4communicationSkill: req.body.communicationSkill,
                  L4communicationSkillRemarks: req.body.communicationSkillRemarks,
                  L4interpersonalSkill: req.body.interpersonalSkill,
                  L4interpersonalSkillRemarks: req.body.interpersonalSkillRemarks,
                  L4abilityToPlanTheWork: req.body.abilityToPlanTheWork,
                  L4abilityToPlanTheWorkRemarks: req.body.abilityToPlanTheWorkRemarks,
                  L4problemSolving: req.body.problemSolving,
                  L4problemSolvingRemarks: req.body.problemSolvingRemarks,
                  L4adaptability: req.body.adaptability,
                  L4adaptabilityRemarks: req.body.adaptabilityRemarks,
                  L4willingnessToShoulderAdditional: req.body.willingnessToShoulderAdditional,
                  L4willingnessToShoulderAdditionalRemarks: req.bodywillingnessToShoulderAdditionalRemarks,
                  L4commitmentToDoAPerfectJob: req.body.commitmentToDoAPerfectJob,
                  L4commitmentToDoAPerfectJobRemarks: req.body.commitmentToDoAPerfectJobRemarks,
                  L4habitsAndManners: req.body.habitsAndManners,
                  L4habitsAndMannersRemarks: req.body.habitsAndMannersRemarks,
                  L4presentation: req.body.presentation,
                  L4presentationRemarks: req.body.presentationRemarks,
                  L4punctuality: req.body.punctuality,
                  L4punctualityRemarks: req.body.punctualityRemarks,
                  L4confidentialityOfInfo: req.body.confidentialityOfInfo,
                  L4confidentialityOfInfoRemarks: req.body.confidentialityOfInfoRemarks,
                  L4trustworthiness: req.body.trustworthiness,
                  L4trustworthinessRemarks: req.body.trustworthinessRemarks,
                  L4teamSpirit: req.body.teamSpirit,
                  L4teamSpiritRemarks: req.body.teamSpiritRemarks,
                  L4relationshipWithColleagues: req.body.relationshipWithColleagues,
                  L4relationshipWithColleaguesRemarks: req.body.relationshipWithColleaguesRemarks,
                  L4decisionMaking: req.body.decisionMaking,
                  L4decisionMakingRemarks: req.body.decisionMakingRemarks,
                  L4computerskills: req.body.computerskills,
                  L4computerskillsRemarks: req.body.computerskillsRemarks
                  // Add more fields as needed
                };

                const updateCondition = {
                  // Define the condition based on which records should be updated
                  // For example, to update records with id = 1:
                  appraisalId: req.body.appraisalId,
                };

                L4Appraisal.update(updateData, {
                  where: updateCondition,
                })
                  .then((data) => {
                    console.log("Updated Successfully");
                    // res.send("Updated Successfully").status(200)
                  })
                  .catch(error => {
                    console.error('Error updating records:', error);
                    // res.send(error).status(400);
                  });

                // const sum = parseInt(req.body.sum);
                const sum = req.body.communicationSkill + req.body.interpersonalSkill + req.body.abilityToPlanTheWork + req.body.problemSolving + req.body.adaptability + req.body.willingnessToShoulderAdditional + req.body.commitmentToDoAPerfectJob + req.body.habitsAndManners + req.body.presentation + req.body.punctuality + req.body.confidentialityOfInfo + req.body.trustworthiness + req.body.teamSpirit + req.body.relationshipWithColleagues + req.body.decisionMaking + req.body.computerskills;

                console.log(sum);
                const lastSum = L3Appraisal.findOne({
                  where: { appraisalId: req.body.appraisalId }, raw: true,
                  attributes: ['L3_ManagersTotalScore'/* add more fields as needed */]
                });
                // console.log(sum);
                console.log(lastSum.L3_ManagersTotalScore);
                const finalSum = sum + lastSum.L3_ManagersTotalScore;
                const percentage = Math.floor(finalSum / 240 * 100);//total marks at level 3  is 260 which is 80 from level 1 and 90 from level 2 and 90 from level 3 .
                console.log("Overall Percentage::::::::", percentage);


                L4Appraisal.update({ L4_ManagersOverallPercentage: percentage, L4_ManagersTotalScore: finalSum }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  console.log("percentage updated successfully");
                }).catch((err) => {
                  console.log(err);
                })

                let overallRating;
                if (1 <= percentage && percentage <= 25) {
                  overallRating = "Average";
                } else if (26 <= percentage && percentage <= 50) {
                  overallRating = "Good";
                } else if (51 <= percentage && percentage <= 75) {
                  overallRating = "Very Good";
                } else if (76 <= percentage && percentage <= 100) {
                  overallRating = "Excellent";
                }
                console.log("OverallRating::::::::::", overallRating);

                L4Appraisal.update({ L4_ManagersOverallRating: overallRating }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  // L4Flag =1;
                  console.log("rating updated successfully");
                }).catch((err) => {
                  console.log(err);
                });

                if (flag == 1) {
                  L4Appraisal.update({ isEditedByL4Manager: true }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                    // L4Flag =1;
                    console.log("rating updated successfully");
                  }).catch((err) => {
                    console.log(err);
                  });
                  empAppraisal.update({ status: "Forwarded to Last Level Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                    console.log("Status updated successfully");
                  }).catch((err) => {
                    console.log(err);
                  });
                  Manager.update({
                    lastLevelMaxMarks: 240, lastLevelScoredMarks: finalSum
                  }, { where: { appraisalId: req.body.appraisalId } })
                    .then((data) => {
                      console.log("Created Successfully in L5Appraisals");
                      // res.send("Updated Successfully").status(200)
                    })
                    .catch(error => {
                      console.error('Error creating records in L5Appraisals:', error);
                      // res.json({ "message": error }).status(400);
                    });
                }


                res.json({ "message": overallRating }).status(200);

              }
            }
          }
          // if (id == L5Manager) {
          //   try {
          //     console.log("::::::::::::here::::::::::");

          //     const [l2Data,l3Data,l4Data,managerData] = await Promise.all([
          //       L2Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL4Manager'] }),
          //       L3Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL4Manager'] }),
          //       L4Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL4Manager'] }),
          //       Manager.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByManager'] }),
          //     ]);

          //     let L4Flag = l4Data.length === 0 ? 1 : l4Data[0].isEditedByL4Manager;
          //     console.log("L4Flag::::", L4Flag);

          //     if (L4Flag === 0) {
          //       res.json({ "message": "Level 4 Evaluation is not done yet", "status": 400 });
          //     } else {
          //       console.log("heressssssssssssssssssss");

          //       let check = managerData.isEditedByManager;
          //       console.log("check::::::", check);

          //       if (check === 1) {
          //         res.status(400).json({ "message": "Form already submitted by the manager not allowed to re-submit" });
          //       } else {
          //         const updateData = {
          //           appraisalId: appraisalId,
          //           ManagerId: id,
          //           createdAt: date,
          //           FSQoW_1: req.body.FSQoW1,
          //           FSQoW_2: req.body.FSQoW2,
          //           FSQoW_3: req.body.FSQoW3,
          //           FSWH_1: req.body.FSWH1,
          //           FSWH_2: req.body.FSWH2,
          //           FSWH_3: req.body.FSWH3,
          //           FSWH_4: req.body.FSWH4,
          //           FSJK_1: req.body.FSJK1,
          //           FSJK_2: req.body.FSJK2,
          //           FSJK_3: req.body.FSJK3,
          //           FSRemarks: req.body.FSRemarks,
          //           ISIR_1: req.body.ISIR1,
          //           ISIR_2: req.body.ISIR2,
          //           ISIR_3: req.body.ISIR3,
          //           ISIR_4: req.body.ISIR4,
          //           ISIR_5: req.body.ISIR5,
          //           ISIRRemarks: req.body.ISIRRemarks,
          //           LSL_1: req.body.LSL1,
          //           LSL_2: req.body.LSL2,
          //           LSL_3: req.body.LSL3,
          //           LSLRemarks: req.body.LSLRemarks,
          //         }

          //         await Manager.update(updateData, { where: { appraisalId: req.body.appraisalId } });

          //         const sum = req.body.FSQoW1 + req.body.FSQoW2 + req.body.FSQoW3 + req.body.FSWH1 + req.body.FSWH2 + req.body.FSWH3 + req.body.FSWH4 + req.body.FSJK1 + req.body.FSJK2 + req.body.FSJK3 + req.body.ISIR1 + req.body.ISIR2 + req.body.ISIR3 + req.body.ISIR4 + req.body.ISIR5 + req.body.LSL1 + req.body.LSL2 + req.body.LSL3;

          //         const lastLevel = await Manager.findOne({
          //           where: { appraisalId: req.body.appraisalId },
          //           raw: true,
          //           attributes: ['lastLevelMaxMarks', 'lastLevelScoredMarks'],
          //         });

          //         console.log("LastLevel:::::", lastLevel);

          //         const finalSum = sum + lastLevel.lastLevelScoredMarks;
          //         console.log(sum);
          //         console.log(finalSum);

          //         const percentage = Math.floor(finalSum / (90 + lastLevel.lastLevelMaxMarks) * 100);
          //         console.log("Overall Percentage::::::::", percentage);

          //         await Manager.update(
          //           { managersOverallPercentage: percentage, managersTotalScore: finalSum },
          //           { where: { appraisalId: req.body.appraisalId } }
          //         );

          //         let overallRating;

          //         if (1 <= percentage && percentage <= 25) {
          //           overallRating = "Average";
          //         } else if (26 <= percentage && percentage <= 50) {
          //           overallRating = "Good";
          //         } else if (51 <= percentage && percentage <= 75) {
          //           overallRating = "Very Good";
          //         } else if (76 <= percentage && percentage <= 100) {
          //           overallRating = "Excellent";
          //         }

          //         console.log("OverallRating::::::::::", overallRating);
          //         const flag = req.body.flag;
          //         if (flag == 1) {



          //           await Manager.update(
          //             { managersOverallRating: overallRating, isEditedByManager: true },
          //             { where: { appraisalId: req.body.appraisalId } }
          //           );

          //           await empAppraisal.update({ status: "Sent to HR" }, { where: { appraisalId: req.body.appraisalId } });
          //         }

          //         res.json({ "message": overallRating }).status(200);
          //       }
          //     }
          //   } catch (error) {
          //     console.error('Error:', error);
          //     res.status(500).json({ "message": "Internal Server Error" });
          //   }
          // }
          if (id == L5Manager) {
            try {
              console.log("::::::::::::here::::::::::");

              const [l2Data, l3Data, l4Data, managerData] = await Promise.all([
                L2Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL2Manager'] }),
                L3Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL3Manager'] }),
                L4Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL4Manager'] }),
                Manager.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByManager'] }),
              ]);

              let L2Flag = l2Data.length === 0 ? 1 : l2Data[0].isEditedByL2Manager;
              let L3Flag = l3Data.length === 0 ? 1 : l3Data[0].isEditedByL3Manager;
              let L4Flag = l4Data.length === 0 ? 1 : l4Data[0].isEditedByL4Manager;

              console.log("L2Flag::::", L2Flag);
              console.log("L3Flag::::", L3Flag);
              console.log("L4Flag::::", L4Flag);

              if (L2Flag === 0) {
                res.json({ "message": "Level 2 Evaluation is not done yet", "status": 400 });
              } else if (L3Flag === 0) {
                res.json({ "message": "Level 3 Evaluation is not done yet", "status": 400 });
              } else if (L4Flag === 0) {
                res.json({ "message": "Level 4 Evaluation is not done yet", "status": 400 });
              } else {
                console.log("heressssssssssssssssssss");

                let check = managerData.isEditedByManager;
                console.log("check::::::", check);

                if (check === 1) {
                  res.status(400).json({ "message": "Form already submitted by the manager not allowed to re-submit" });
                } else {
                  const updateData = {
                    appraisalId: appraisalId,
                    ManagerId: id,
                    createdAt: date,
                    FSQoW_1: req.body.FSQoW1,
                    FSQoW_2: req.body.FSQoW2,
                    FSQoW_3: req.body.FSQoW3,
                    FSWH_1: req.body.FSWH1,
                    FSWH_2: req.body.FSWH2,
                    FSWH_3: req.body.FSWH3,
                    FSWH_4: req.body.FSWH4,
                    FSJK_1: req.body.FSJK1,
                    FSJK_2: req.body.FSJK2,
                    FSJK_3: req.body.FSJK3,
                    FSRemarks: req.body.FSRemarks,
                    ISIR_1: req.body.ISIR1,
                    ISIR_2: req.body.ISIR2,
                    ISIR_3: req.body.ISIR3,
                    ISIR_4: req.body.ISIR4,
                    ISIR_5: req.body.ISIR5,
                    ISIRRemarks: req.body.ISIRRemarks,
                    LSL_1: req.body.LSL1,
                    LSL_2: req.body.LSL2,
                    LSL_3: req.body.LSL3,
                    LSLRemarks: req.body.LSLRemarks,
                  }

                  await Manager.update(updateData, { where: { appraisalId: req.body.appraisalId } });

                  const sum = req.body.FSQoW1 + req.body.FSQoW2 + req.body.FSQoW3 + req.body.FSWH1 + req.body.FSWH2 + req.body.FSWH3 + req.body.FSWH4 + req.body.FSJK1 + req.body.FSJK2 + req.body.FSJK3 + req.body.ISIR1 + req.body.ISIR2 + req.body.ISIR3 + req.body.ISIR4 + req.body.ISIR5 + req.body.LSL1 + req.body.LSL2 + req.body.LSL3;

                  const lastLevel = await Manager.findOne({
                    where: { appraisalId: req.body.appraisalId },
                    raw: true,
                    attributes: ['lastLevelMaxMarks', 'lastLevelScoredMarks'],
                  });

                  console.log("LastLevel:::::", lastLevel);

                  const finalSum = sum + lastLevel.lastLevelScoredMarks;
                  console.log(sum);
                  console.log(finalSum);

                  const percentage = Math.floor(finalSum / (90 + lastLevel.lastLevelMaxMarks) * 100);
                  console.log("Overall Percentage::::::::", percentage);

                  await Manager.update(
                    { managersOverallPercentage: percentage, managersTotalScore: finalSum },
                    { where: { appraisalId: req.body.appraisalId } }
                  );

                  let overallRating;

                  if (1 <= percentage && percentage <= 25) {
                    overallRating = "Average";
                  } else if (26 <= percentage && percentage <= 50) {
                    overallRating = "Good";
                  } else if (51 <= percentage && percentage <= 75) {
                    overallRating = "Very Good";
                  } else if (76 <= percentage && percentage <= 100) {
                    overallRating = "Excellent";
                  }

                  console.log("OverallRating::::::::::", overallRating);
                  const flag = req.body.flag;
                  if (flag == 1) {



                    await Manager.update(
                      { managersOverallRating: overallRating, isEditedByManager: true },
                      { where: { appraisalId: req.body.appraisalId } }
                    );

                    await empAppraisal.update({ status: "Sent to HR" }, { where: { appraisalId: req.body.appraisalId } });
                  }

                  res.json({ "message": overallRating }).status(200);
                }
              }
            } catch (error) {
              console.error('Error:', error);
              res.status(500).json({ "message": "Internal Server Error" });
            }
          }

        }
      }
      else {
        res.status(400).json({ "message": "You are not in the manager list for this employee" })
        console.log("You are not in the manager list");
      }
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }
  });

  apiRoutes.post("/managersEvaluation", async (req, res) => {//Updated/New
    try {
      console.log("Payload::::::::", req.body);
      const formType = req.body.formType;
      const id = req.body.employeeId;//Manager Id who is filling the evaluation form.
      const date = new Date();
      console.log(id);
      const appraisalId = parseInt(req.body.appraisalId);
      console.log(appraisalId);
      const appraisalDetails = await empAppraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['employeeId', 'isEditedByEmp'] });
      console.log(appraisalDetails);
      const empFlag = appraisalDetails.isEditedByEmp;
      // const L2EmpFlag = appraisalDetails.isEditedByL2;
      let L2Flag;
      let L3Flag;
      let L4Flag;
      const empMangDetails = await empMang.findOne({ where: { employeeId: appraisalDetails.employeeId }, raw: true });
      console.log(empMangDetails);
      const L2Manager = empMangDetails.L2ManagerId;
      console.log("L2Manager::", L2Manager);
      const L3Manager = empMangDetails.L3ManagerId;
      console.log("L3Manager::", L3Manager);
      const L4Manager = empMangDetails.L4ManagerId;
      console.log("L4Manager::", L4Manager);
      const L5Manager = empMangDetails.L5ManagerId;
      console.log("L5Manager::", L5Manager);

      let topManager;

      if (empMangDetails.L5ManagerId !== null) {
        topManager = empMangDetails.L5ManagerId;
      } else if (empMangDetails.L4ManagerId !== null) {
        topManager = empMangDetails.L4ManagerId;
      } else if (empMangDetails.L3ManagerId !== null) {
        topManager = empMangDetails.L3ManagerId;
      } else if (empMangDetails.L2ManagerId !== null) {
        topManager = empMangDetails.L2ManagerId;
      } else {
        // All managers are null
        topManager = null;
      }

      console.log("Top Manager:", topManager);

      // console.log("L3Manager:::", L3Manager);
      if (id == L2Manager || id == L3Manager || id == L4Manager || id == L5Manager) {
        if (empFlag == 0) {
          res.status(400).json({
            "message": "Employee Self evaluation is not yet filled by the employee"
          });
        }
        else {
          if (id == L2Manager && formType == "employeeEvaluation") {
            let check;
            await L2Appraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL2Manager'] }).then((data) => {
              check = data.isEditedByL2Manager
            }).catch((err) => {
              console.log(err);
            })
            if (check == 1) {
              res.status(400).json({ "message": "Form already submitted by manager not allowed to re-submit" });
            }
            else {
              console.log("req.body:::", req.body)
              const flag = req.body.flag;


              const updateData = {
                L2communicationSkill: req.body.communicationSkill,
                L2communicationSkillRemarks: req.body.communicationSkillRemarks,
                L2interpersonalSkill: req.body.interpersonalSkill,
                L2interpersonalSkillRemarks: req.body.interpersonalSkillRemarks,
                L2abilityToPlanTheWork: req.body.abilityToPlanTheWork,
                L2abilityToPlanTheWorkRemarks: req.body.abilityToPlanTheWorkRemarks,
                L2problemSolving: req.body.problemSolving,
                L2problemSolvingRemarks: req.body.problemSolvingRemarks,
                L2adaptability: req.body.adaptability,
                L2adaptabilityRemarks: req.body.adaptabilityRemarks,
                L2willingnessToShoulderAdditional: req.body.willingnessToShoulderAdditional,
                L2willingnessToShoulderAdditionalRemarks: req.body.willingnessToShoulderAdditionalRemarks,
                L2commitmentToDoAPerfectJob: req.body.commitmentToDoAPerfectJob,
                L2commitmentToDoAPerfectJobRemarks: req.body.commitmentToDoAPerfectJobRemarks,
                L2habitsAndManners: req.body.habitsAndManners,
                L2habitsAndMannersRemarks: req.body.habitsAndMannersRemarks,
                L2presentation: req.body.presentation,
                L2presentationRemarks: req.body.presentationRemarks,
                L2punctuality: req.body.punctuality,
                L2punctualityRemarks: req.body.punctualityRemarks,
                L2confidentialityOfInfo: req.body.confidentialityOfInfo,
                L2confidentialityOfInfoRemarks: req.body.confidentialityOfInfoRemarks,
                L2trustworthiness: req.body.trustworthiness,
                L2trustworthinessRemarks: req.body.trustworthinessRemarks,
                L2teamSpirit: req.body.teamSpirit,
                L2teamSpiritRemarks: req.body.teamSpiritRemarks,
                L2relationshipWithColleagues: req.body.relationshipWithColleagues,
                L2relationshipWithColleaguesRemarks: req.body.relationshipWithColleaguesRemarks,
                L2decisionMaking: req.body.decisionMaking,
                L2decisionMakingRemarks: req.body.decisionMakingRemarks,
                L2computerskills: req.body.computerskills,
                L2computerskillsRemarks: req.body.computerskillsRemarks
                // Add more fields as needed
              };

              const updateCondition = {
                // Define the condition based on which records should be updated
                // For example, to update records with id = 1:
                appraisalId: req.body.appraisalId,
              };

              L2Appraisal.update(updateData, {
                where: updateCondition,
              })
                .then((data) => {
                  console.log("Updated Successfully");
                  // res.send("Updated Successfully").status(200)
                })
                .catch(error => {
                  console.error('Error updating records:', error);
                  // res.send(error).status(400);
                });

              // const sum = parseInt(req.body.sum);
              const sum = req.body.communicationSkill + req.body.interpersonalSkill + req.body.abilityToPlanTheWork + req.body.problemSolving + req.body.adaptability + req.body.willingnessToShoulderAdditional + req.body.commitmentToDoAPerfectJob + req.body.habitsAndManners + req.body.presentation + req.body.punctuality + req.body.confidentialityOfInfo + req.body.trustworthiness + req.body.teamSpirit + req.body.relationshipWithColleagues + req.body.decisionMaking + req.body.computerskills;

              console.log(sum);
              // console.log(empEvaSum);
              const percentage = Math.floor(sum / 80 * 100);
              console.log("Overall Percentage::::::::", percentage);
              // console.log("sum+emEvaSum.L2TS::::::::", sum + empEvaSum.L2TS);

              L2Appraisal.update({ L2_ManagersOverallPercentage: percentage, L2_ManagersTotalScore: sum }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                console.log("percentage updated successfully");
              }).catch((err) => {
                console.log(err);
              });

              let overallRating;
              if (1 <= percentage && percentage <= 25) {
                overallRating = "Average";
              } else if (26 <= percentage && percentage <= 50) {
                overallRating = "Good";
              } else if (51 <= percentage && percentage <= 75) {
                overallRating = "Very Good";
              } else if (76 <= percentage && percentage <= 100) {
                overallRating = "Excellent";
              }
              console.log("OverallRating::::::::::", overallRating);
              L2Appraisal.update({ L2_ManagersOverallRating: overallRating }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                // L2Flag =1;
                console.log("rating updated successfully");
              }).catch((err) => {
                console.log(err);
              })

              if (flag == 1) {
                L2Appraisal.update({ isEditedByL2Manager: true }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  // L2Flag =1;
                  console.log("flag has been updated successfully");
                }).catch((err) => {
                  console.log(err);
                })
                empAppraisal.update({ status: "Forwarded to Level-3- Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  console.log("Status updated successfully in empAppraisal");
                }).catch((err) => {
                  console.log(err);
                });
                console.log("isnull():::::", isNull(L3Manager));

                if (isNull(L3Manager)) {//Checking whether is there any further level for evaluation or not for an employee. 
                  console.log(":::::::::::::::::Here:::::::::::::::::")
                  empAppraisal.update({ status: "Forwarded to Last Level Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                    console.log("Status updated successfully l3 is null");

                    Manager.update({
                      lastLevelMaxMarks: 80, lastLevelScoredMarks: sum
                    }, { where: { appraisalId: req.body.appraisalId } })
                      .then((data) => {
                        console.log("Created Successfully in L5Appraisals");
                        // res.send("Updated Successfully").status(200)
                      })
                      .catch(error => {
                        console.error('Error creating records in L5Appraisals:', error);
                        // res.json({ "message": error }).status(400);
                      });
                  }).catch((err) => {
                    console.log(err);
                  });
                }
              }

              res.json({ "message": overallRating }).status(200);
            }


          }
          if (id == L3Manager && formType == "employeeEvaluation" && !(id == topManager)) {
            await L2Appraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL2manager'] }).then((data) => {
              console.log("Here at L2Flag data::::::", data)
              L2Flag = data.isEditedByL2manager;
              console.log("L2Flag::::", L2Flag)
            }).catch((err) => {
              console.log(err);
            });
            if (L2Flag == 0) {
              res.json({ "message": "Level 2 Evaluation is not done yet", "status": 400 });
            }
            else {
              let check;
              await L3Appraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL3Manager'] }).then((data) => {
                check = data.isEditedByL3Manager
              }).catch((err) => {
                console.log(err);
              })
              if (check == 1) {
                res.status(400).json({ "message": "Form already submitted by the manager not allowed to re-submit" });
              }
              else {
                let flag = req.body.flag;


                const updateData = {
                  L3communicationSkill: req.body.communicationSkill,
                  L3communicationSkillRemarks: req.body.communicationSkillRemarks,
                  L3interpersonalSkill: req.body.interpersonalSkill,
                  L3interpersonalSkillRemarks: req.body.interpersonalSkillRemarks,
                  L3abilityToPlanTheWork: req.body.abilityToPlanTheWork,
                  L3abilityToPlanTheWorkRemarks: req.body.abilityToPlanTheWorkRemarks,
                  L3problemSolving: req.body.problemSolving,
                  L3problemSolvingRemarks: req.body.problemSolvingRemarks,
                  L3adaptability: req.body.adaptability,
                  L3adaptabilityRemarks: req.body.adaptabilityRemarks,
                  L3willingnessToShoulderAdditional: req.body.willingnessToShoulderAdditional,
                  L3willingnessToShoulderAdditionalRemarks: req.body.willingnessToShoulderAdditionalRemarks,
                  L3commitmentToDoAPerfectJob: req.body.commitmentToDoAPerfectJob,
                  L3commitmentToDoAPerfectJobRemarks: req.body.commitmentToDoAPerfectJobRemarks,
                  L3habitsAndManners: req.body.habitsAndManners,
                  L3habitsAndMannersRemarks: req.body.habitsAndMannersRemarks,
                  L3presentation: req.body.presentation,
                  L3presentationRemarks: req.body.presentationRemarks,
                  L3punctuality: req.body.punctuality,
                  L3punctualityRemarks: req.body.punctualityRemarks,
                  L3confidentialityOfInfo: req.body.confidentialityOfInfo,
                  L3confidentialityOfInfoRemarks: req.body.confidentialityOfInfoRemarks,
                  L3trustworthiness: req.body.trustworthiness,
                  L3trustworthinessRemarks: req.body.trustworthinessRemarks,
                  L3teamSpirit: req.body.teamSpirit,
                  L3teamSpiritRemarks: req.body.teamSpiritRemarks,
                  L3relationshipWithColleagues: req.body.relationshipWithColleagues,
                  L3relationshipWithColleaguesRemarks: req.body.relationshipWithColleaguesRemarks,
                  L3decisionMaking: req.body.decisionMaking,
                  L3decisionMakingRemarks: req.body.decisionMakingRemarks,
                  L3computerskills: req.body.computerskills,
                  L3computerskillsRemarks: req.body.computerskillsRemarks
                  // Add more fields as needed
                };

                const updateCondition = {
                  // Define the condition based on which records should be updated
                  // For example, to update records with id = 1:
                  appraisalId: req.body.appraisalId,
                };

                L3Appraisal.update(updateData, {
                  where: updateCondition,
                })
                  .then((data) => {
                    console.log("Updated Successfully");
                    // res.send("Updated Successfully").status(200)
                  })
                  .catch(error => {
                    console.error('Error updating records:', error);
                    // res.send(error).status(400);
                  });

                // const sum = parseInt(req.body.sum);
                const sum = req.body.communicationSkill + req.body.interpersonalSkill + req.body.abilityToPlanTheWork + req.body.problemSolving + req.body.adaptability + req.body.willingnessToShoulderAdditional + req.body.commitmentToDoAPerfectJob + req.body.habitsAndManners + req.body.presentation + req.body.punctuality + req.body.confidentialityOfInfo + req.body.trustworthiness + req.body.teamSpirit + req.body.relationshipWithColleagues + req.body.decisionMaking + req.body.computerskills;

                console.log(sum);
                const lastSum = await L2Appraisal.findOne({
                  where: { appraisalId: req.body.appraisalId }, raw: true,
                  attributes: ['L2_ManagersTotalScore'/* add more fields as needed */]
                });
                console.log(lastSum);
                console.log(lastSum.L2_ManagersTotalScore);
                const finalSum = sum + lastSum.L2_ManagersTotalScore;
                console.log("FinalSum:::::", finalSum);
                const percentage = Math.floor(finalSum / 160 * 100);//total marks at level 3  is 260 which is 80 from level 1 and 90 from level 2 and 90 from level 3 .
                console.log("Overall Percentage::::::::", percentage);


                L3Appraisal.update({ L3_ManagersOverallPercentage: percentage, L3_ManagersTotalScore: finalSum }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  console.log("percentage updated successfully");
                }).catch((err) => {
                  console.log(err);
                })

                let overallRating;
                if (1 <= percentage && percentage <= 25) {
                  overallRating = "Average";
                } else if (26 <= percentage && percentage <= 50) {
                  overallRating = "Good";
                } else if (51 <= percentage && percentage <= 75) {
                  overallRating = "Very Good";
                } else if (76 <= percentage && percentage <= 100) {
                  overallRating = "Excellent";
                }
                console.log("OverallRating::::::::::", overallRating);

                L3Appraisal.update({ L3_ManagersOverallRating: overallRating }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  // L3Flag =1;
                  console.log("rating updated successfully");
                }).catch((err) => {
                  console.log(err);
                });
                if (flag == 1) {
                  L3Appraisal.update({ isEditedByL3Manager: true }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                    // L3Flag =1;
                    console.log("rating updated successfully");
                  }).catch((err) => {
                    console.log(err);
                  });
                  empAppraisal.update({ status: "Forwarded to Level-4- Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                    console.log("Status updated successfully");
                  }).catch((err) => {
                    console.log(err);
                  });

                  if (isNull(L4Manager)) {
                    empAppraisal.update({ status: "Forwarded to Last Level Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                      console.log("Status updated successfully");

                      Manager.update({
                        lastLevelMaxMarks: 160, lastLevelScoredMarks: finalSum
                      }, { where: { appraisalId: req.body.appraisalId } })
                        .then((data) => {
                          console.log("Created Successfully in L5Appraisals");
                          // res.send("Updated Successfully").status(200)
                        })
                        .catch(error => {
                          console.error('Error creating records in L5Appraisals:', error);
                          // res.json({ "message": error }).status(400);
                        });
                    }).catch((err) => {
                      console.log(err);
                    });
                  }
                }


                res.json({ "message": overallRating }).status(200);
              }

            }
          }
          if (id == L4Manager && formType == "employeeEvaluation" && !(id == topManager)) {
            let data = await L3Appraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL3Manager'] });

            L3Flag = data.isEditedByL3Manager;
            if (L3Flag == 0) {
              res.json({ "message": "Level 3 Evaluation is not done yet", "status": 400 });
            }
            else {
              let check;
              await L4Appraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL4Manager'] }).then((data) => {
                check = data.isEditedByL4Manager
              }).catch((err) => {
                console.log(err);
              })
              if (check == 1) {
                res.status(400).json({ "message": "Form already submitted by the manager not allowed to re-submit" });
              }
              else {
                const flag = req.body.flag;


                const updateData = {
                  L4communicationSkill: req.body.communicationSkill,
                  L4communicationSkillRemarks: req.body.communicationSkillRemarks,
                  L4interpersonalSkill: req.body.interpersonalSkill,
                  L4interpersonalSkillRemarks: req.body.interpersonalSkillRemarks,
                  L4abilityToPlanTheWork: req.body.abilityToPlanTheWork,
                  L4abilityToPlanTheWorkRemarks: req.body.abilityToPlanTheWorkRemarks,
                  L4problemSolving: req.body.problemSolving,
                  L4problemSolvingRemarks: req.body.problemSolvingRemarks,
                  L4adaptability: req.body.adaptability,
                  L4adaptabilityRemarks: req.body.adaptabilityRemarks,
                  L4willingnessToShoulderAdditional: req.body.willingnessToShoulderAdditional,
                  L4willingnessToShoulderAdditionalRemarks: req.bodywillingnessToShoulderAdditionalRemarks,
                  L4commitmentToDoAPerfectJob: req.body.commitmentToDoAPerfectJob,
                  L4commitmentToDoAPerfectJobRemarks: req.body.commitmentToDoAPerfectJobRemarks,
                  L4habitsAndManners: req.body.habitsAndManners,
                  L4habitsAndMannersRemarks: req.body.habitsAndMannersRemarks,
                  L4presentation: req.body.presentation,
                  L4presentationRemarks: req.body.presentationRemarks,
                  L4punctuality: req.body.punctuality,
                  L4punctualityRemarks: req.body.punctualityRemarks,
                  L4confidentialityOfInfo: req.body.confidentialityOfInfo,
                  L4confidentialityOfInfoRemarks: req.body.confidentialityOfInfoRemarks,
                  L4trustworthiness: req.body.trustworthiness,
                  L4trustworthinessRemarks: req.body.trustworthinessRemarks,
                  L4teamSpirit: req.body.teamSpirit,
                  L4teamSpiritRemarks: req.body.teamSpiritRemarks,
                  L4relationshipWithColleagues: req.body.relationshipWithColleagues,
                  L4relationshipWithColleaguesRemarks: req.body.relationshipWithColleaguesRemarks,
                  L4decisionMaking: req.body.decisionMaking,
                  L4decisionMakingRemarks: req.body.decisionMakingRemarks,
                  L4computerskills: req.body.computerskills,
                  L4computerskillsRemarks: req.body.computerskillsRemarks
                  // Add more fields as needed
                };

                const updateCondition = {
                  // Define the condition based on which records should be updated
                  // For example, to update records with id = 1:
                  appraisalId: req.body.appraisalId,
                };

                L4Appraisal.update(updateData, {
                  where: updateCondition,
                })
                  .then((data) => {
                    console.log("Updated Successfully");
                    // res.send("Updated Successfully").status(200)
                  })
                  .catch(error => {
                    console.error('Error updating records:', error);
                    // res.send(error).status(400);
                  });

                // const sum = parseInt(req.body.sum);
                const sum = req.body.communicationSkill + req.body.interpersonalSkill + req.body.abilityToPlanTheWork + req.body.problemSolving + req.body.adaptability + req.body.willingnessToShoulderAdditional + req.body.commitmentToDoAPerfectJob + req.body.habitsAndManners + req.body.presentation + req.body.punctuality + req.body.confidentialityOfInfo + req.body.trustworthiness + req.body.teamSpirit + req.body.relationshipWithColleagues + req.body.decisionMaking + req.body.computerskills;

                console.log(sum);
                const lastSum = L3Appraisal.findOne({
                  where: { appraisalId: req.body.appraisalId }, raw: true,
                  attributes: ['L3_ManagersTotalScore'/* add more fields as needed */]
                });
                // console.log(sum);
                console.log(lastSum.L3_ManagersTotalScore);
                const finalSum = sum + lastSum.L3_ManagersTotalScore;
                const percentage = Math.floor(finalSum / 240 * 100);//total marks at level 3  is 260 which is 80 from level 1 and 90 from level 2 and 90 from level 3 .
                console.log("Overall Percentage::::::::", percentage);


                L4Appraisal.update({ L4_ManagersOverallPercentage: percentage, L4_ManagersTotalScore: finalSum }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  console.log("percentage updated successfully");
                }).catch((err) => {
                  console.log(err);
                })

                let overallRating;
                if (1 <= percentage && percentage <= 25) {
                  overallRating = "Average";
                } else if (26 <= percentage && percentage <= 50) {
                  overallRating = "Good";
                } else if (51 <= percentage && percentage <= 75) {
                  overallRating = "Very Good";
                } else if (76 <= percentage && percentage <= 100) {
                  overallRating = "Excellent";
                }
                console.log("OverallRating::::::::::", overallRating);

                L4Appraisal.update({ L4_ManagersOverallRating: overallRating }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                  // L4Flag =1;
                  console.log("rating updated successfully");
                }).catch((err) => {
                  console.log(err);
                });

                if (flag == 1) {
                  L4Appraisal.update({ isEditedByL4Manager: true }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                    // L4Flag =1;
                    console.log("rating updated successfully");
                  }).catch((err) => {
                    console.log(err);
                  });
                  empAppraisal.update({ status: "Forwarded to Last Level Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
                    console.log("Status updated successfully");
                  }).catch((err) => {
                    console.log(err);
                  });
                  Manager.update({
                    lastLevelMaxMarks: 240, lastLevelScoredMarks: finalSum
                  }, { where: { appraisalId: req.body.appraisalId } })
                    .then((data) => {
                      console.log("Created Successfully in L5Appraisals");
                      // res.send("Updated Successfully").status(200)
                    })
                    .catch(error => {
                      console.error('Error creating records in L5Appraisals:', error);
                      // res.json({ "message": error }).status(400);
                    });
                }


                res.json({ "message": overallRating }).status(200);

              }
            }
          }
          // if (id == L5Manager) {
          //   try {
          //     console.log("::::::::::::here::::::::::");

          //     const [l2Data,l3Data,l4Data,managerData] = await Promise.all([
          //       L2Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL4Manager'] }),
          //       L3Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL4Manager'] }),
          //       L4Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL4Manager'] }),
          //       Manager.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByManager'] }),
          //     ]);

          //     let L4Flag = l4Data.length === 0 ? 1 : l4Data[0].isEditedByL4Manager;
          //     console.log("L4Flag::::", L4Flag);

          //     if (L4Flag === 0) {
          //       res.json({ "message": "Level 4 Evaluation is not done yet", "status": 400 });
          //     } else {
          //       console.log("heressssssssssssssssssss");

          //       let check = managerData.isEditedByManager;
          //       console.log("check::::::", check);

          //       if (check === 1) {
          //         res.status(400).json({ "message": "Form already submitted by the manager not allowed to re-submit" });
          //       } else {
          //         const updateData = {
          //           appraisalId: appraisalId,
          //           ManagerId: id,
          //           createdAt: date,
          //           FSQoW_1: req.body.FSQoW1,
          //           FSQoW_2: req.body.FSQoW2,
          //           FSQoW_3: req.body.FSQoW3,
          //           FSWH_1: req.body.FSWH1,
          //           FSWH_2: req.body.FSWH2,
          //           FSWH_3: req.body.FSWH3,
          //           FSWH_4: req.body.FSWH4,
          //           FSJK_1: req.body.FSJK1,
          //           FSJK_2: req.body.FSJK2,
          //           FSJK_3: req.body.FSJK3,
          //           FSRemarks: req.body.FSRemarks,
          //           ISIR_1: req.body.ISIR1,
          //           ISIR_2: req.body.ISIR2,
          //           ISIR_3: req.body.ISIR3,
          //           ISIR_4: req.body.ISIR4,
          //           ISIR_5: req.body.ISIR5,
          //           ISIRRemarks: req.body.ISIRRemarks,
          //           LSL_1: req.body.LSL1,
          //           LSL_2: req.body.LSL2,
          //           LSL_3: req.body.LSL3,
          //           LSLRemarks: req.body.LSLRemarks,
          //         }

          //         await Manager.update(updateData, { where: { appraisalId: req.body.appraisalId } });

          //         const sum = req.body.FSQoW1 + req.body.FSQoW2 + req.body.FSQoW3 + req.body.FSWH1 + req.body.FSWH2 + req.body.FSWH3 + req.body.FSWH4 + req.body.FSJK1 + req.body.FSJK2 + req.body.FSJK3 + req.body.ISIR1 + req.body.ISIR2 + req.body.ISIR3 + req.body.ISIR4 + req.body.ISIR5 + req.body.LSL1 + req.body.LSL2 + req.body.LSL3;

          //         const lastLevel = await Manager.findOne({
          //           where: { appraisalId: req.body.appraisalId },
          //           raw: true,
          //           attributes: ['lastLevelMaxMarks', 'lastLevelScoredMarks'],
          //         });

          //         console.log("LastLevel:::::", lastLevel);

          //         const finalSum = sum + lastLevel.lastLevelScoredMarks;
          //         console.log(sum);
          //         console.log(finalSum);

          //         const percentage = Math.floor(finalSum / (90 + lastLevel.lastLevelMaxMarks) * 100);
          //         console.log("Overall Percentage::::::::", percentage);

          //         await Manager.update(
          //           { managersOverallPercentage: percentage, managersTotalScore: finalSum },
          //           { where: { appraisalId: req.body.appraisalId } }
          //         );

          //         let overallRating;

          //         if (1 <= percentage && percentage <= 25) {
          //           overallRating = "Average";
          //         } else if (26 <= percentage && percentage <= 50) {
          //           overallRating = "Good";
          //         } else if (51 <= percentage && percentage <= 75) {
          //           overallRating = "Very Good";
          //         } else if (76 <= percentage && percentage <= 100) {
          //           overallRating = "Excellent";
          //         }

          //         console.log("OverallRating::::::::::", overallRating);
          //         const flag = req.body.flag;
          //         if (flag == 1) {



          //           await Manager.update(
          //             { managersOverallRating: overallRating, isEditedByManager: true },
          //             { where: { appraisalId: req.body.appraisalId } }
          //           );

          //           await empAppraisal.update({ status: "Sent to HR" }, { where: { appraisalId: req.body.appraisalId } });
          //         }

          //         res.json({ "message": overallRating }).status(200);
          //       }
          //     }
          //   } catch (error) {
          //     console.error('Error:', error);
          //     res.status(500).json({ "message": "Internal Server Error" });
          //   }
          // }
          if (id == topManager && formType == "managerEvaluation") {
            try {
              console.log("::::::::::::here::::::::::");

              const [l2Data, l3Data, l4Data, managerData] = await Promise.all([
                L2Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL2Manager'] }),
                L3Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL3Manager'] }),
                L4Appraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByL4Manager'] }),
                Manager.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByManager'] }),
              ]);

              let L2Flag = l2Data.length === 0 ? 1 : l2Data[0].isEditedByL2Manager;
              let L3Flag = l3Data.length === 0 ? 1 : l3Data[0].isEditedByL3Manager;
              let L4Flag = l4Data.length === 0 ? 1 : l4Data[0].isEditedByL4Manager;

              console.log("L2Flag::::", L2Flag);
              console.log("L3Flag::::", L3Flag);
              console.log("L4Flag::::", L4Flag);

              if (L2Flag === 0) {
                res.json({ "message": "Level 2 Evaluation is not done yet", "status": 400 });
              } else if (L3Flag === 0) {
                res.json({ "message": "Level 3 Evaluation is not done yet", "status": 400 });
              } else if (L4Flag === 0) {
                res.json({ "message": "Level 4 Evaluation is not done yet", "status": 400 });
              } else {
                console.log("heressssssssssssssssssss");

                let check = managerData.isEditedByManager;
                console.log("check::::::", check);

                if (check === 1) {
                  res.status(400).json({ "message": "Form already submitted by the manager not allowed to re-submit" });
                } else {
                  const updateData = {
                    appraisalId: appraisalId,
                    ManagerId: id,
                    createdAt: date,
                    FSQoW_1: req.body.FSQoW1,
                    FSQoW_2: req.body.FSQoW2,
                    FSQoW_3: req.body.FSQoW3,
                    FSWH_1: req.body.FSWH1,
                    FSWH_2: req.body.FSWH2,
                    FSWH_3: req.body.FSWH3,
                    FSWH_4: req.body.FSWH4,
                    FSJK_1: req.body.FSJK1,
                    FSJK_2: req.body.FSJK2,
                    FSJK_3: req.body.FSJK3,
                    FSRemarks: req.body.FSRemarks,
                    ISIR_1: req.body.ISIR1,
                    ISIR_2: req.body.ISIR2,
                    ISIR_3: req.body.ISIR3,
                    ISIR_4: req.body.ISIR4,
                    ISIR_5: req.body.ISIR5,
                    ISIRRemarks: req.body.ISIRRemarks,
                    LSL_1: req.body.LSL1,
                    LSL_2: req.body.LSL2,
                    LSL_3: req.body.LSL3,
                    LSLRemarks: req.body.LSLRemarks,
                  }

                  await Manager.update(updateData, { where: { appraisalId: req.body.appraisalId } });

                  const sum = req.body.FSQoW1 + req.body.FSQoW2 + req.body.FSQoW3 + req.body.FSWH1 + req.body.FSWH2 + req.body.FSWH3 + req.body.FSWH4 + req.body.FSJK1 + req.body.FSJK2 + req.body.FSJK3 + req.body.ISIR1 + req.body.ISIR2 + req.body.ISIR3 + req.body.ISIR4 + req.body.ISIR5 + req.body.LSL1 + req.body.LSL2 + req.body.LSL3;

                  const lastLevel = await Manager.findOne({
                    where: { appraisalId: req.body.appraisalId },
                    raw: true,
                    attributes: ['lastLevelMaxMarks', 'lastLevelScoredMarks'],
                  });

                  console.log("LastLevel:::::", lastLevel);

                  const finalSum = sum + lastLevel.lastLevelScoredMarks;
                  console.log(sum);
                  console.log(finalSum);

                  const percentage = Math.floor(finalSum / (90 + lastLevel.lastLevelMaxMarks) * 100);
                  console.log("Overall Percentage::::::::", percentage);

                  await Manager.update(
                    { managersOverallPercentage: percentage, managersTotalScore: finalSum },
                    { where: { appraisalId: req.body.appraisalId } }
                  );

                  let overallRating;

                  if (1 <= percentage && percentage <= 25) {
                    overallRating = "Average";
                  } else if (26 <= percentage && percentage <= 50) {
                    overallRating = "Good";
                  } else if (51 <= percentage && percentage <= 75) {
                    overallRating = "Very Good";
                  } else if (76 <= percentage && percentage <= 100) {
                    overallRating = "Excellent";
                  }

                  console.log("OverallRating::::::::::", overallRating);
                  const flag = req.body.flag;
                  if (flag == 1) {



                    await Manager.update(
                      { managersOverallRating: overallRating, isEditedByManager: true },
                      { where: { appraisalId: req.body.appraisalId } }
                    );

                    await empAppraisal.update({ status: "Sent to HR" }, { where: { appraisalId: req.body.appraisalId } });
                  }

                  res.json({ "message": overallRating }).status(200);
                }
              }
            } catch (error) {
              console.error('Error:', error);
              res.status(500).json({ "message": "Internal Server Error" });
            }
          }

        }
      }
      else {
        res.status(400).json({ "message": "You are not in the manager list for this employee" })
        console.log("You are not in the manager list");
      }
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }
  });

  apiRoutes.post("/automaticAmount", async (req, res) => {//This api is used when the hr sees final rating at level 5 and amount get automatically generated ***UPDATED ACCORDING TO NEW DATABASE
    try {
      const info = await empAppraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['status'] });
      console.log("status::::", info.status);
      if (info.status == "Sent to HR") {
        console.log(req.body.appraisalId);
        const aDetails = await Manager.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true });
        const date = new Date;
        console.log("date::::::::", date);
        const cYear = date.getFullYear();
        console.log("Current Year::::", cYear);
        const rawQuery = `SELECT ExcellentAmount,VgoodAmount,GoodAmount,AverageAmount FROM (employees AS E INNER JOIN empappraisals AS A ON E.employeeId = A.employeeId)INNER JOIN hrappraisalratingamounts AS H ON E.departmentId = H.departmentId WHERE A.appraisalId=${req.body.appraisalId} AND E.designation = H.designation AND H.year=${cYear}`;
        const OverallRating = aDetails.managersOverallRating;
        console.log(OverallRating);

        sequelize.query(rawQuery, {
          type: Sequelize.QueryTypes.SELECT,
        }).then((data) => {
          console.log(data);
          if (OverallRating == "Excellent") {
            res.json({ "data": data[0].ExcellentAmount });
          } else if (OverallRating == "Very Good") {
            res.json({ "data": data[0].VgoodAmount });
          } else if (OverallRating == "Good") {
            res.json({ "data": data[0].GoodAmount });
          } else if (OverallRating == "Average") {
            res.json({ "data": data[0].AverageAmount });
          };
        }).catch((err) => {
          console.log(err);
          // res.send(err).status(400);
        })
      }
      else {
        res.status(400).json({ "message": "Evaluation is not completed at all levels" });
      }
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }

  });

  apiRoutes.post("/anAppraisalDetailsOfEmpEval", async (req, res) => {
    try {
      const details = await empAppraisal.findAll({ where: { appraisalId: req.body.appraisalId }, raw: true });
      console.log("data", details);
      res.json({ "data": details[0] }).status(200);
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }
  });

  // apiRoutes.post("/L3managerEvaluation",async(req,res)=>{
  //   const updateData = {
  //     L3FSQoW_1:req.body.L3FSQoW_1,
  //   L3FSQoW_2:req.body.L3FSQoW_2,
  //   L3FSQoW_3:req.body.L3FSQoW_3,
  //   L3FSWH_1:req.body.L3FSWH_1,
  //   L3FSWH_2:req.body.L3FSWH_2,
  //   L3FSWH_3:req.body.L3FSWH_3,
  //   L3FSWH_4:req.body.L3FSWH_4,
  //   L3FSJK_1:req.body.L3FSJK_1,
  //   L3FSJK_2:req.body.L3FSJK_2,
  //   L3FSJK_3:req.body.L3FSJK_3,
  //   L3FSRemarks:req.body.L3FSRemarks,
  //   L3ISIR_1:req.body.L3ISIR_1,
  //   L3ISIR_2:req.body.L3ISIR_2,
  //   L3ISIR_3:req.body.L3ISIR_3,
  //   L3ISIR_4:req.body.L3ISIR_4,
  //   L3ISIR_5:req.body.L3ISIR_5,
  //   L3ISIRRemarks:req.body.L3ISIRRemarks,
  //   L3LSL_1:req.body.L3LSL_1,
  //   L3LSL_2:req.body.L3LSL_2,
  //   L3LSL_3:req.body.L3LSL_3,
  //   L3LSLRemarks:req.body.L3LSLRemarks
  //   }

  //   const updateCondition = {
  //     // Define the condition based on which records should be updated
  //     // For example, to update records with id = 1:
  //     appraisalId: req.body.appraisalId,
  //   };

  //   appraisal.update(updateData, {
  //     where: updateCondition,
  //   })
  //     .then((data) => {
  //       console.log("Updated Successfully");
  //       // res.send("Updated Successfully").status(200)
  //     })
  //     .catch(error => {
  //       console.error('Error updating records:', error);
  //       res.send(error).status(400);
  //     });

  //     const sum = parseInt(req.body.sum);
  //     const empEvaSum = await appraisal.findOne({
  //       where: { appraisalId:req.body.appraisalId}, raw: true,
  //       attributes: ['L2_ManagersTotalScore'/* add more fields as needed */]
  //     });
  //     console.log(sum);
  //     console.log(empEvaSum);
  //     const percentage =Math.floor((sum+empEvaSum.L2_ManagersTotalScore) / (80+90+90) * 100);//total marks at level 3  is 260 which is 80 from level 1 and 90 from level 2 and 90 from level 3 .
  //     console.log("Overall Percentage::::::::",percentage);


  //     appraisal.update({ L3_OverallPercentage: percentage,L3_TotalScore:sum+empEvaSum.L2_ManagersTotalScore },{where:{appraisalId: req.body.appraisalId}}).then((data) => {
  //       console.log("percentage updated successfully");
  //     }).catch((err) => {
  //       console.log(err);
  //     })

  //     let overallRating;
  //     if (1 <= percentage && percentage <= 25) {
  //       overallRating = "Average";
  //     } else if (26 <= percentage && percentage <= 50) {
  //       overallRating = "Good";
  //     } else if (51 <= percentage && percentage <= 75) {
  //       overallRating = "Very Good";
  //     } else if (76 <= percentage && percentage <= 100) {
  //       overallRating = "Excellent";
  //     }
  //     console.log("OverallRating::::::::::",overallRating);
  //     appraisal.update({ L3_OverallRating:overallRating,status:"Completed",isEditedByL3Manager:true},{where:{ appraisalId: req.body.appraisalId}}).then((data) => {
  //       console.log("rating updated successfully");
  //     }).catch((err) => {
  //       console.log(err);
  //     })


  //     res.send(overallRating).status(200);


  // })

  // apiRoutes.post("/L2managerEvaluation",async(req,res)=>{
  //   const updateData = {
  //     L2FSQoW_1:req.body.L2FSQoW_1,
  //   L2FSQoW_2:req.body.L2FSQoW_2,
  //   L2FSQoW_3:req.body.L2FSQoW_3,
  //   L2FSWH_1:req.body.L2FSWH_1,
  //   L2FSWH_2:req.body.L2FSWH_2,
  //   L2FSWH_3:req.body.L2FSWH_3,
  //   L2FSWH_4:req.body.L2FSWH_4,
  //   L2FSJK_1:req.body.L2FSJK_1,
  //   L2FSJK_2:req.body.L2FSJK_2,
  //   L2FSJK_3:req.body.L2FSJK_3,
  //   L2FSRemarks:req.body.L2FSRemarks,
  //   L2ISIR_1:req.body.L2ISIR_1,
  //   L2ISIR_2:req.body.L2ISIR_2,
  //   L2ISIR_3:req.body.L2ISIR_3,
  //   L2ISIR_4:req.body.L2ISIR_4,
  //   L2ISIR_5:req.body.L2ISIR_5,
  //   L2ISIRRemarks:req.body.L2ISIRRemarks,
  //   L2LSL_1:req.body.L2LSL_1,
  //   L2LSL_2:req.body.L2LSL_2,
  //   L2LSL_3:req.body.L2LSL_3,
  //   L2LSLRemarks:req.body.L2LSLRemarks
  //   }

  //   const updateCondition = {
  //     // Define the condition based on which records should be updated
  //     // For example, to update records with id = 1:
  //     appraisalId: req.body.appraisalId,
  //   };

  //   appraisal.update(updateData, {
  //     where: updateCondition,
  //   })
  //     .then((data) => {
  //       console.log("Updated Successfully");
  //       // res.send("Updated Successfully").status(200)
  //     })
  //     .catch(error => {
  //       console.error('Error updating records:', error);
  //       res.send(error).status(400);
  //     });

  //     const sum = parseInt(req.body.sum);
  //     const empEvaSum = await appraisal.findOne({
  //       where: { appraisalId:req.body.appraisalId}, raw: true,
  //       attributes: ['employeeTotalScore'/* add more fields as needed */]
  //     });
  //     console.log(sum);
  //     console.log(empEvaSum);
  //     const percentage =Math.floor((sum+empEvaSum.employeeTotalScore) / (80+90) * 100);//total marks at level 2 and 3 is 170 which is 80 from level 1 and 90 from level 2.
  //     console.log("Overall Percentage::::::::",percentage);


  //     appraisal.update({ L2_ManagersOverallPercentage: percentage,L2_ManagersTotalScore:sum+empEvaSum.employeeTotalScore },{where:{appraisalId: req.body.appraisalId}}).then((data) => {
  //       console.log("percentage updated successfully");
  //     }).catch((err) => {
  //       console.log(err);
  //     })

  //     let overallRating;
  //     if (1 <= percentage && percentage <= 25) {
  //       overallRating = "Average";
  //     } else if (26 <= percentage && percentage <= 50) {
  //       overallRating = "Good";
  //     } else if (51 <= percentage && percentage <= 75) {
  //       overallRating = "Very Good";
  //     } else if (76 <= percentage && percentage <= 100) {
  //       overallRating = "Excellent";
  //     }
  //     console.log("OverallRating::::::::::",overallRating);
  //     appraisal.update({ L2_ManagersOverallRating:overallRating,isEditedByL2Manager:true},{where:{ appraisalId: req.body.appraisalId}}).then((data) => {
  //       console.log("rating updated successfully");
  //     }).catch((err) => {
  //       console.log(err);
  //     })


  //     res.send(overallRating).status(200);


  // })

  apiRoutes.post("/hrRatingAmountStorage", async (req, res) => {
    try {
      console.log("req.body::::::", req.body);
      const date = new Date();
      const year = date.getFullYear()
      const info = await hrAmount.findOne({ where: { departmentId: req.body.departmentId, designation: req.body.designation, year: year }, raw: true });
      if (info) {
        res.status(400).json({ "message": "Entry already exist for the respective department,designation and year" });
      }
      else {
        const depInfo = await department.findOne({ where: { id: req.body.departmentId }, raw: true });
        console.log(depInfo);
        const depId = depInfo.id;

        hrAmount.create({ departmentId: req.body.departmentId, designation: req.body.designation, year: year, ExcellentAmount: req.body.excellentAmount, VgoodAmount: req.body.vgoodAmount, GoodAmount: req.body.goodAmount, AverageAmount: req.body.averageAmount }).then((data) => {
          // console.log("Entry created",data);
          res.json({ "message": "Entries Created" }).status(200);
        }).catch((err) => {
          console.log(err);
          // res.send(err).status(400);
        })
      }
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }
  });

  apiRoutes.post("/hrRatingAmountUpdate", async (req, res) => {
    try {
      console.log("req.body::::::", req.body);
      const date = new Date();
      const year = date.getFullYear();
      let entries = [];
      entries = req.body.entries;
      console.log("Entries:::::", entries, "length::::", entries.length);
      for (i = 0; i < entries.length; i++) {
        console.log("Entry::::", entries[i]);
        hrAmount.update({ ExcellentAmount: entries[i].excellentAmount, VgoodAmount: entries[i].vgoodAmount, GoodAmount: entries[i].goodAmount, AverageAmount: entries[i].averageAmount }, { where: { departmentId: entries[i].departmentId, designation: entries[i].designation, year: year } }).then((data) => {
          // res.json({"message":"Entries Updated Successfully"}).status(400);
          console.log("Entries Updated Successfully for entries index value:", i);

        }).catch((e) => {
          console.log(e);
        })
      }
      res.status(200).json({ "message": "Entries Updated Successfully" });
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }
  });

  apiRoutes.post("/hrRatingAmountInfo", async (req, res) => {
    try {
      console.log("req.body::::::", req.body);
      const rawQuery = `SELECT H.id AS serialNumber, D.name AS departmentName,D.id AS departmentId,H.designation, H.ExcellentAmount,H.VgoodAmount,H.GoodAmount,H.AverageAmount FROM hrappraisalratingamounts AS H INNER JOIN departments AS D ON H.departmentId = D.id`;


      sequelize.query(rawQuery, {
        type: Sequelize.QueryTypes.SELECT,
      }).then((data) => {
        console.log(data);
        res.json({ "message": data }).status(200);
      }).catch((err) => {
        console.log(err);
        // res.json({ "message": err }).status(400);
      });
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }
  });

  // apiRoutes.post("/allAppraisalInfoOfAnEmp", async (req, res) => {//for the employee main screen as well as for managers
  //   const id = req.body.employeeId;
  //   const appraisalInfo = await empAppraisal.findAll({ where: { employeeId: id }, raw: true, attributes: ['appraisalId', 'employeeId', 'createdAt', 'status'] }).then((data) => {
  //     console.log(data);
  //     res.send(data).status(200);
  //   }).catch((err) => {
  //     console.log(err);
  //     res.send(err).status(400);
  //   });
  // });

  apiRoutes.post("/allAppraisalInfoOfAnEmp", async (req, res) => {//for the employee main screen 
    try {


      const id = req.body.employeeId;
      const rawQuery = `SELECT CONCAT(E.firstname, CONCAT(" ",E.lastName)) AS name,designation,A.appraisalId,A.createdAt,A.status,E.officialEmail FROM employees AS E INNER JOIN empappraisals AS A ON E.employeeId = A.employeeId WHERE A.employeeId = ${id}`;

      sequelize.query(rawQuery, {
        type: Sequelize.QueryTypes.SELECT,
      }).then((data) => {
        console.log(data);
        res.json({ "data": data }).status(200);
      }).catch((err) => {
        console.log(err);
        // res.send(err).status(400);
      })
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }
  });

  //   let flagCheck = await appraisal.findOne({where:{appraisalId:req.body.appraisalId},raw:true,attributes:['isEditedByEmp']}) ;
  //   console.log(flagCheck);
  //   if(flagCheck.isEditedByEmp){
  //     res.json({
  //       "message":"Form already edited by employee",
  //       "flag":1
  //     });
  //   }
  //   else{
  //   const updateData = {
  //     communicationSkill: req.body.communicationSkill,
  //     communicationSkillRemarks: req.body.communicationSkillRemarks,
  //     interpersonalSkill: req.body.interpersonalSkill,
  //     interpersonalSkillRemarks: req.body.interpersonalSkillRemarks,
  //     abilityToPlanTheWork: req.body.abilityToPlanTheWork,
  //     abilityToPlanTheWorkRemarks: req.body.abilityToPlanTheWorkRemarks,
  //     problemSolving: req.body.problemSolving,
  //     problemSolvingRemarks: req.body.problemSolvingRemarks,
  //     adaptability: req.body.adaptability,
  //     adaptabilityRemarks: req.body.adaptabilityRemarks,
  //     willingnessToShoulderAdditional: req.body.willingnessToShoulderAdditional,
  //     willingnessToShoulderAdditionalRemarks: req.body.willingnessToShoulderAdditionalRemarks,
  //     commitmentToDoAPerfectJob: req.body.commitmentToDoAPerfectJob,
  //     commitmentToDoAPerfectJobRemarks: req.body.commitmentToDoAPerfectJobRemarks,
  //     habitsAndManners: req.body.habitsAndManners,
  //     habitsAndMannersRemarks: req.body.habitsAndMannersRemarks,
  //     presentation: req.body.presentation,
  //     presentationRemarks: req.body.presentationRemarks,
  //     punctuality: req.body.punctuality,
  //     punctualityRemarks: req.body.punctualityRemarks,
  //     confidentialityOfInfo: req.body.confidentialityOfInfo,
  //     confidentialityOfInfoRemarks: req.body.commitmentToDoAPerfectJobRemarks,
  //     trustworthiness: req.body.trustworthiness,
  //     trustworthinessRemarks: req.body.trustworthinessRemarks,
  //     teamSpirit: req.body.teamSpirit,
  //     teamSpiritRemarks: req.body.teamSpiritRemarks,
  //     relationshipWithColleagues: req.body.relationshipWithColleagues,
  //     relationshipWithColleaguesRemarks: req.body.relationshipWithColleaguesRemarks,
  //     decisionMaking: req.body.decisionMaking,
  //     decisionMakingRemarks: req.body.decisionMakingRemarks,
  //     computerskills: req.body.computerskills,
  //     computerskillsRemarks: req.body.computerskillsRemarks
  //     // Add more fields as needed
  //   };

  //   const updateCondition = {
  //     // Define the condition based on which records should be updated
  //     // For example, to update records with id = 1:
  //     appraisalId: req.body.appraisalId,
  //   };

  //   appraisal.update(updateData, {
  //     where: updateCondition,
  //   })
  //     .then((data) => {
  //       console.log("Updated Successfully");
  //       // res.send("Updated Successfully").status(200)
  //     })
  //     .catch(error => {
  //       console.error('Error updating records:', error);
  //       res.send(error).status(400);
  //     });
  //   const sum = parseInt(req.body.sum);
  //   console.log(sum);
  //   const percentage =Math.floor(sum / 80 * 100);//the total of all 16 fields is 16*5=80
  //   console.log("Overall Percentage::::::::",percentage);

  //   appraisal.update({ employeeOverallPercentage: percentage,employeeTotalScore:sum },{where:{appraisalId: req.body.appraisalId}}).then((data) => {
  //     console.log("percentage updated successfully");
  //   }).catch((err) => {
  //     console.log(err);
  //   })

  //   let overallRating;
  //   if (1 <= percentage && percentage <= 25) {
  //     overallRating = "Average";
  //   } else if (26 <= percentage && percentage <= 50) {
  //     overallRating = "Good";
  //   } else if (51 <= percentage && percentage <= 75) {
  //     overallRating = "Very Good";
  //   } else if (76 <= percentage && percentage <= 100) {
  //     overallRating = "Excellent";
  //   }
  //   console.log("OverallRating::::::::::",overallRating);
  //   appraisal.update({ employeeOverallRating:overallRating,isEditedByEmp:true},{where:{ appraisalId: req.body.appraisalId}}).then((data) => {
  //     console.log("rating updated successfully");
  //   }).catch((err) => {
  //     console.log(err);
  //   })

  //   res.send(overallRating).status(200);
  // }
  // });

  apiRoutes.post("/employeeEvaluation", async (req, res) => { //to fill entries in the employee self evaluation form***UPDATED ACCORDING TO NEW DATABASE***
    try {
      const flag = req.body.flag;//0 if draft and 1 if submit


      console.log(req.body);
      let flagCheck = await empAppraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['isEditedByEmp', 'status'] });
      console.log(flagCheck);
      if (flagCheck.isEditedByEmp || flagCheck.status == "Forwarded to the Level-2- Manager") {
        res.status(400).json({
          "message": "Form already edited by employee, Not allowed to re-edit the form"
        });
      }
      else {
        let firstL2ManagerId;
        let firstL3ManagerId;
        let firstL4ManagerId;
        let firstL5ManagerId;
        let firstHr;


        ////Assigning Level 2 Manager///////////
        const assignedL2Manager = await empMang.findAll({
          attributes: ['L2ManagerId'],
          where: { employeeId: req.body.employeeId }, raw: true
        });
        console.log("assignedL2manager::::::", assignedL2Manager);
        if (assignedL2Manager.length > 0) {
          // Extract the first L2ManagerId (assuming there's only one result)
          firstL2ManagerId = assignedL2Manager[0].L2ManagerId;
          await empAppraisal.update(
            { assignedL2Manager: firstL2ManagerId },
            { where: { employeeId: req.body.employeeId } }
          );
          console.log("L2 Manager ID:", firstL2ManagerId);
        } else {
          console.log("No L2 Manager found for the given employee ID");
        }
        /////Sending Mail to Level 2 Manager
        Employees.findOne({
          attributes: ['officialEmail'],
          where: { employeeId: firstL2ManagerId },
          raw: true
        }).then((l2ManagerDetails) => {
          if (l2ManagerDetails) {
            const l2ManagerEmail = l2ManagerDetails.officialEmail;
            const htmlFilePath = path.join('Mails/mangAppMail.ejs');
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8')
            let mailOptions = {
              from: 'support@timesofpeople.com',
              to: l2ManagerEmail,
              subject: 'You Have Been Assigned as an Evaluator',
              text: `Dear Manager, \n\nYou have been assigned as an evaluator for an employee. Please review the employee's evaluation.\n\nRegards,\Mckinsol Consulting Inc.`,
              html: htmlContent,
            };

            console.log(l2ManagerEmail);

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent to ' + l2ManagerEmail);
              }
            });
          }
        }).catch((err) => {
          console.log("Error finding L2 Manager details: ", err);
        });
        ////Creating a row in L2Appraisal Table///////////
        await L2Appraisal.create({ appraisalId: req.body.appraisalId, L2ManagerId: firstL2ManagerId }).then((data) => {
          // console.log("data at l3:::",data);
          console.log("Enteries created successfully in L2Appraisal Table")
        }).catch((err) => {
          console.log(err);
        });
        //Assigning the L3 Manager //////
        const assignedL3Manager = await empMang.findAll({
          attributes: ['L3ManagerId'],
          where: { employeeId: req.body.employeeId }, raw: true
        });
        console.log("assignedL3manager::::::", assignedL3Manager);
        if (assignedL3Manager.length > 0) {
          // Extract the first L2ManagerId (assuming there's only one result)
          firstL3ManagerId = assignedL3Manager[0].L3ManagerId;
          await empAppraisal.update(
            { assignedL3Manager: firstL3ManagerId },
            { where: { employeeId: req.body.employeeId } }
          );
          console.log("L3 Manager ID:", firstL3ManagerId);
        } else {
          console.log("No L3 Manager found for the given employee ID");
        }
        //////////////Sending mail to Level3 Manager//////////
        Employees.findOne({
          attributes: ['officialEmail'],
          where: { employeeId: firstL3ManagerId },
          raw: true
        }).then((l3ManagerDetails) => {
          if (l3ManagerDetails) {
            const l3ManagerEmail = l3ManagerDetails.officialEmail;
            const htmlFilePath = path.join('Mails/mangAppMail.ejs');
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8')
            let mailOptions = {
              from: 'support@timesofpeople.com',
              to: l3ManagerEmail,
              subject: 'You Have Been Assigned as an Evaluator',
              text: `Dear Manager, \n\nYou have been assigned as an evaluator for an employee. Please review the employee's evaluation.\n\nRegards,\Mckinsol Consulting Inc.`,
              html: htmlContent,
            };

            console.log(l3ManagerEmail);

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent to ' + l3ManagerEmail);
              }
            });
          }
        }).catch((err) => {
          console.log("Error finding L3 Manager details: ", err);
        });
        ////Creating a row in L3Appraisal Table///////////
        if (!(isNull(firstL3ManagerId))) {
          await L3Appraisal.create({ appraisalId: req.body.appraisalId, L3ManagerId: firstL3ManagerId }).then((data) => {
            // console.log("data at l3:::",data);
            console.log("Enteries created successfully in L3Appraisal Table")
          }).catch((err) => {
            console.log(err);
          });
        }
        //Assigning the L4 Manager
        const assignedL4Manager = await empMang.findAll({
          attributes: ['L4ManagerId'],
        }, { where: { employeeId: req.body.employeeId }, raw: true })
        if (assignedL4Manager.length > 0) {
          // Extract the first L4ManagerId (assuming there's only one result)
          firstL4ManagerId = assignedL4Manager[0].L4ManagerId;
          await empAppraisal.update(
            { assignedL4Manager: firstL4ManagerId },
            { where: { employeeId: req.body.employeeId } }
          );
          console.log("L4 Manager ID:", firstL4ManagerId);
        } else {
          console.log("No L4 Manager found for the given employee ID");
        }
        ///////////Sending mail to Level 4 Manager///////////
        Employees.findOne({
          attributes: ['officialEmail'],
          where: { employeeId: firstL4ManagerId },
          raw: true
        }).then((l4ManagerDetails) => {
          if (l4ManagerDetails) {
            const l4ManagerEmail = l4ManagerDetails.officialEmail;
            const htmlFilePath = path.join('Mails/mangAppMail.ejs');
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8')
            let mailOptions = {
              from: 'support@timesofpeople.com',
              to: l4ManagerEmail,
              subject: 'You Have Been Assigned as an Evaluator',
              text: `Dear Manager, \n\nYou have been assigned as an evaluator for an employee. Please review the employee's evaluation.\n\nRegards,\Mckinsol Consulting Inc.`,
              html: htmlContent,
            };

            console.log(l4ManagerEmail);

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent to ' + l4ManagerEmail);
              }
            });
          }
        }).catch((err) => {
          console.log("Error finding L4 Manager details: ", err);
        });
        ////Creating a row in L4Appraisal Table///////////
        if (!(isNull(firstL4ManagerId))) {
          await L4Appraisal.create({ appraisalId: req.body.appraisalId, L4ManagerId: firstL4ManagerId }).then((data) => { console.log("Enteries created successfully in L4Appraisal Table") }).catch((err) => {
            console.log(err);
          });
        }

        //Assigning the L5 Manager
        const assignedL5Manager = await empMang.findAll({
          attributes: ['L5ManagerId'],
        }, { where: { employeeId: req.body.employeeId }, raw: true })
        if (assignedL5Manager.length > 0) {
          // Extract the first L5ManagerId (assuming there's only one result)
          firstL5ManagerId = assignedL5Manager[0].L5ManagerId;
          await empAppraisal.update(
            { assignedL5Manager: firstL5ManagerId },
            { where: { employeeId: req.body.employeeId } }
          );
          console.log("L5 Manager ID:", firstL5ManagerId);
        } else {
          console.log("No L5 Manager found for the given employee ID");
        }
        /////////// Sending Mail to Level 5 Manager//////////
        Employees.findOne({
          attributes: ['officialEmail'],
          where: { employeeId: firstL5ManagerId },
          raw: true
        }).then((l5ManagerDetails) => {
          if (l5ManagerDetails) {
            const l5ManagerEmail = l5ManagerDetails.officialEmail;
            const htmlFilePath = path.join('Mails/mangAppMail.ejs');
            const htmlContent = fs.readFileSync(htmlFilePath, 'utf8')
            let mailOptions = {
              from: 'support@timesofpeople.com',
              to: l5ManagerEmail,
              subject: 'You Have Been Assigned as an Evaluator',
              text: `Dear Manager, \n\nYou have been assigned as an evaluator for an employee. Please review the employee's evaluation.\n\nRegards,\Mckinsol Consulting Inc.`,
              html: htmlContent,
            };
            console.log(l5ManagerEmail);

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                console.log(error);
              } else {
                console.log('Email sent to ' + l5ManagerEmail);
              }
            });
          }
        }).catch((err) => {
          console.log("Error finding L5 Manager details: ", err);
        });
        ////Creating a row in Manager Table///////////
        await Manager.create({ appraisalId: req.body.appraisalId, ManagerId: firstL5ManagerId }).then((data) => { console.log("Enteries created successfully in Manager Table") }).catch((err) => {
          console.log(err);
        });


        //Assigning the hr
        const hrId = await empMang.findAll({
          attributes: ['hrId'],
        }, { where: { employeeId: req.body.employeeId }, raw: true })
        if (hrId.length > 0) {
          // Extract the first hr (assuming there's only one result)
          firstHr = hrId[0].hrId;
          await empAppraisal.update(
            { hrId: firstHr },
            { where: { employeeId: req.body.employeeId } }
          );
          console.log("hr ID:", firstHr);
        } else {
          console.log("No HR found for the given employee ID");
        }


        const updateData = {
          communicationSkill: req.body.communicationSkill,
          communicationSkillRemarks: req.body.communicationSkillRemarks,
          interpersonalSkill: req.body.interpersonalSkill,
          interpersonalSkillRemarks: req.body.interpersonalSkillRemarks,
          abilityToPlanTheWork: req.body.abilityToPlanTheWork,
          abilityToPlanTheWorkRemarks: req.body.abilityToPlanTheWorkRemarks,
          problemSolving: req.body.problemSolving,
          problemSolvingRemarks: req.body.problemSolvingRemarks,
          adaptability: req.body.adaptability,
          adaptabilityRemarks: req.body.adaptabilityRemarks,
          willingnessToShoulderAdditional: req.body.willingnessToShoulderAdditional,
          willingnessToShoulderAdditionalRemarks: req.body.willingnessToShoulderAdditionalRemarks,
          commitmentToDoAPerfectJob: req.body.commitmentToDoAPerfectJob,
          commitmentToDoAPerfectJobRemarks: req.body.commitmentToDoAPerfectJobRemarks,
          habitsAndManners: req.body.habitsAndManners,
          habitsAndMannersRemarks: req.body.habitsAndMannersRemarks,
          presentation: req.body.presentation,
          presentationRemarks: req.body.presentationRemarks,
          punctuality: req.body.punctuality,
          punctualityRemarks: req.body.punctualityRemarks,
          confidentialityOfInfo: req.body.confidentialityOfInfo,
          confidentialityOfInfoRemarks: req.body.commitmentToDoAPerfectJobRemarks,
          trustworthiness: req.body.trustworthiness,
          trustworthinessRemarks: req.body.trustworthinessRemarks,
          teamSpirit: req.body.teamSpirit,
          teamSpiritRemarks: req.body.teamSpiritRemarks,
          relationshipWithColleagues: req.body.relationshipWithColleagues,
          relationshipWithColleaguesRemarks: req.body.relationshipWithColleaguesRemarks,
          decisionMaking: req.body.decisionMaking,
          decisionMakingRemarks: req.body.decisionMakingRemarks,
          computerskills: req.body.computerskills,
          computerskillsRemarks: req.body.computerskillsRemarks
          // Add more fields as needed
        };

        const updateCondition = {
          // Define the condition based on which records should be updated
          // For example, to update records with id = 1:
          appraisalId: req.body.appraisalId,
        };

        empAppraisal.update(updateData, {
          where: updateCondition,
        })
          .then((data) => {
            console.log("Updated Successfully");
            // res.send("Updated Successfully").status(200)
          })
          .catch(error => {
            console.error('Error updating records:', error);
            // res.send(error).status(400);
          });
        // const sum = parseInt(req.body.sum);
        const sum = req.body.communicationSkill + req.body.interpersonalSkill + req.body.abilityToPlanTheWork + req.body.problemSolving + req.body.adaptability + req.body.willingnessToShoulderAdditional + req.body.commitmentToDoAPerfectJob + req.body.habitsAndManners + req.body.presentation + req.body.punctuality + req.body.confidentialityOfInfo + req.body.trustworthiness + req.body.teamSpirit + req.body.relationshipWithColleagues + req.body.decisionMaking + req.body.computerskills;
        console.log(sum);
        const percentage = Math.floor(sum / 80 * 100);//the total of all 16 fields is 16*5=80
        console.log("Overall Percentage::::::::", percentage);

        empAppraisal.update({ employeeOverallPercentage: percentage, employeeTotalScore: sum }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
          console.log("percentage updated successfully");
        }).catch((err) => {
          console.log(err);
        })

        let overallRating;
        if (1 <= percentage && percentage <= 25) {
          overallRating = "Average";
        } else if (26 <= percentage && percentage <= 50) {
          overallRating = "Good";
        } else if (51 <= percentage && percentage <= 75) {
          overallRating = "Very Good";
        } else if (76 <= percentage && percentage <= 100) {
          overallRating = "Excellent";
        }
        console.log("OverallRating::::::::::", overallRating);

        empAppraisal.update({ employeeOverallRating: overallRating }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
          console.log("rating updated successfully");
        }).catch((err) => {
          console.log(err);
        })

        if (flag == 1) {   //it means submit button has been pressed.   
          empAppraisal.update({ isEditedByEmp: true, status: "Forwarded to the Level-2- Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
            console.log("rating updated successfully");
          }).catch((err) => {
            console.log(err);
          });
        }

        res.json({ "Message": overallRating }).status(200);
      }
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }
  });

  apiRoutes.post("/initiateAppraisal", async (req, res) => {
    try {
      console.log("req.body::::", req.body);
      const hrId = req.body.employeeId;
      console.log("hrId::::", hrId); const date = new Date();
      const entries = req.body.entries; for (let i = 0; i < entries.length; i++) {
        const randomSixDigitNumber = Math.floor(100000 + Math.random() * 900000);
        console.log("Random appraisalId for index value", i, "::::", randomSixDigitNumber);
        await empAppraisal.create({ appraisalId: randomSixDigitNumber, employeeId: entries[i].employeeId, createdAt: date, status: "Initiated", hrId: hrId });
        // const employee = await Employees.findOne({
        //   where: {
        //     employeeId: entries[i].employeeId
        //   },
        //   attributes: ['officialEmail']
        // }); console.log(employee); if (employee && employee.officialEmail) {
        //   // Setup email data
        //   const htmlFilePath = path.join('Mails/empAppMail.ejs');
        //   const htmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        //   const mailOptions = {
        //     from: 'support@timesofpeople.com',
        //     to: employee.officialEmail,
        //     subject: 'Appraisal Initiated Appraisal ID : ' + res.appraisalId,
        //     text: 'Your appraisal has been initiated',
        //     html: htmlContent,
        //   };          // Send the email
        //   transporter.sendMail(mailOptions, (error, info) => {
        //     if (error) {
        //       console.log('Error sending email:', error);
        //     } else {
        //       console.log('Email sent:', info.response);
        //     }
        //   });
        // } else {
        //   console.log('Employee email not found or invalid');
        // }
      } res.status(200).json({ "message": "Entries Created" });
    } catch (err) {
      console.log(err);
      res.status(400).json({ "message": err });
    }
  });

  // apiRoutes.post("/hrMainScreen", async (req, res) => {//for hr main screen in progress tab 
  //   try {
  //     const rawQuery = 'SELECT E.employeeId,CONCAT(E.firstname, CONCAT(" ",E.lastName)) AS name,E.designation,D.name AS department,A.appraisalId,A.createdAt,A.status FROM (hrportal.employees AS E INNER JOIN hrportal.empappraisals AS A ON E.employeeId = A.employeeId )INNER JOIN hrportal.departments AS D ON E.departmentId = D.id';

  //     sequelize.query(rawQuery, {
  //       type: Sequelize.QueryTypes.SELECT,
  //     }).then((data) => {
  //       console.log(data);
  //       res.json({ "data": data }).status(200);
  //     }).catch((err) => {
  //       console.log(err);
  //       // res.send(err).status(400);
  //     })
  //   }
  //   catch (err) {
  //     res.status(400).json({ "message": err });
  //   }
  // });

  // apiRoutes.post("/completedAppraisals", async (req, res) => {// for hr main screen in completed tab
  //   const id = req.body.id;
  //   const rawQuery = `SELECT E.employeeId,E.firstname,E.lastName,E.designation,D.name AS departmentName,A.appraisalId,A.createdAt,A.status FROM ((hrportal.employees AS E INNER JOIN hrportal.appraisals AS A ON E.employeeId = A.employeeId )INNER JOIN hrportal.departments AS D ON E.departmentId = D.id) WHERE A.status="Completed" AND E.employeeId=${id} `;

  //   sequelize.query(rawQuery, {
  //     type: Sequelize.QueryTypes.SELECT,
  //   }).then((data) => {
  //     console.log(data);
  //     res.send(data).status(200);
  //   }).catch((err) => {
  //     console.log(err);
  //     res.send(err).status(400);
  //   })
  // });

  // apiRoutes.post("/employeeList", async (req, res) => {// to show the list of all eligible employees
  //   // console.log(req.body);
  //   const depInfo = await department.findOne({ where: { name: `${req.body.name}` }, raw: true });
  //   // console.log(depInfo);
  //   const depId = depInfo.id;
  //   // console.log(depId);
  //   const employeeInfo = await Employees.findAll({
  //     where: { departmentId: `${depId}` }, raw: true,
  //     attributes: ['employeeId', 'firstName', 'lastname', 'designation' /* add more fields as needed */]
  //   });
  //   // console.log("employee Information:",employeeInfo);
  //   // const appraisalInfo = await appraisal.findAll({where:{employeeId:294},raw:true,attributes:['appraisalId','employeeId']});
  //   // console.log("appraisalInfo",appraisalInfo);
  //   for (let i = 0; i < employeeInfo.length; i++) {
  //     const appraisalInfo = await appraisal.findAll({ where: { employeeId: employeeInfo[i].employeeId }, raw: true, attributes: ['appraisalId', 'employeeId', 'createdAt'] });
  //     // console.log(appraisalInfo);
  //     if (appraisalInfo.length == 0) {
  //       employeeInfo[i]["flag"] = 0;//here it means no appraisal has been found for this particular employee
  //     }
  //     else {
  //       let dateArray = [];
  //       for (let j = 0; j < appraisalInfo.length; j++) {
  //         dateArray.push(appraisalInfo[j]["createdAt"]);
  //       }
  //       // console.log(dateArray);
  //       let latestDate = max(dateArray);
  //       let todayDate = new Date;
  //       // console.log(latestDate,todayDate);
  //       const monthDifference = differenceInMonths(todayDate, latestDate);
  //       // console.log(monthDifference);
  //       if (monthDifference < 12) {
  //         employeeInfo[i]["flag"] = 1;
  //       }
  //       else {
  //         employeeInfo[i]["flag"] = 0;//Here it means that the last appraisal of this employee happend before 12 months
  //       }


  //     }


  //   }

  //   res.send(employeeInfo).status(200);
  // });

  apiRoutes.post("/empList", async (req, res) => {// ''''''New One''''''to show the list of all employees with updated table for a department
    try {


      let depId;

      // console.log(req.body);
      await department.findOne({ where: { name: `${req.body.name}` }, raw: true }).then((data) => {
        depId = data.id;
        console.log("depId:::::::", depId);
      }).catch((err) => {
        console.log(err);
        // res.send(err);
      })
      // console.log(depInfo);
      // console.log(depId);
      if (depId != null) {
        let employeeInfo;
        await Employees.findAll({
          where: { departmentId: `${depId}` }, raw: true,
          attributes: ['employeeId', [sequelize.literal('CONCAT(firstname, " ", lastName)'), 'employeeName'], 'designation',  /* add more fields as needed */]
        }).then((data) => {
          employeeInfo = data;
        }).catch((err) => {
          console.log(err);
          // res.send(err).status(400)
        });
        console.log("employee Information::::::", employeeInfo);
        // const appraisalInfo = await appraisal.findAll({where:{employeeId:294},raw:true,attributes:['appraisalId','employeeId']});
        // console.log("appraisalInfo",appraisalInfo);
        for (let i = 0; i < employeeInfo.length; i++) {
          const appraisalInfo = await empAppraisal.findAll({ where: { employeeId: employeeInfo[i].employeeId }, raw: true, attributes: ['appraisalId', 'employeeId', 'createdAt'] });
          // console.log(appraisalInfo);

          if (appraisalInfo.length == 0) {//here it means no appraisal has been found for this particular employee
            let lastDate = new Date('2023-01-01');
            let dueDate = new Date('2024-01-01');
            employeeInfo[i]["flag"] = 0;
            employeeInfo[i]["lastAppraisalDate"] = lastDate;
            employeeInfo[i]["dueDate"] = dueDate;
          }
          else {
            let dateArray = [];
            for (let j = 0; j < appraisalInfo.length; j++) {
              dateArray.push(appraisalInfo[j]["createdAt"]);
            }
            // console.log(dateArray);
            let latestDate = max(dateArray);
            let lastAppraisalDate = latestDate;
            // console.log("lastAppraisaldate:::::",lastAppraisalDate);
            let dueDate = new Date(lastAppraisalDate);
            dueDate.setDate(dueDate.getDate() + 365);
            // console.log("dueDate:::::::",dueDate);
            let todayDate = new Date;
            // console.log(latestDate,todayDate);
            const monthDifference = differenceInMonths(todayDate, latestDate);
            // console.log(monthDifference);
            if (monthDifference < 12) {
              employeeInfo[i]["flag"] = 1;
              employeeInfo[i]["lastAppraisalDate"] = lastAppraisalDate;
              employeeInfo[i]["dueDate"] = dueDate;

            }
            else {
              employeeInfo[i]["flag"] = 0;//Here it means that the last appraisal of this employee happend before 12 months and the employee is eligible for the appraisal
              employeeInfo[i]["lastAppraisalDate"] = lastAppraisalDate;
              employeeInfo[i]["dueDate"] = dueDate;
            }


          }


        }

        res.json({ "data": employeeInfo }).status(200);
      }
      // else{
      //   res.send("Payload is not correct");
      // }
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }
  });

  apiRoutes.post("/departments", async (req, res) => {// to show all the departments
    try {


      // console.log("hit............");
      let depInfo = await department.findAll({ raw: true });
      console.log(depInfo);
      res.json({ "data": depInfo }).status(200);
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }
  });

  apiRoutes.post("/lastAppraisalOfEmpInfoByManager", async (req, res) => {
    try {
      let lastAppraisalInfo = [];


      const empId = req.body.empId;//Employee id whose information we want to fetch for last appraisal.
      const info = await empAppraisal.findAll({ where: { employeeId: empId, status: "Completed" }, raw: true, attributes: ['appraisalId', 'employeeId', 'createdAt'] });
      console.log(info);
      const dates = [];
      for (let i = 0; i < info.length; i++) {
        dates.push(info[i].createdAt)

      }
      console.log("Dates Array::::::", dates);

      const latestDate = max(dates);
      console.log("latest date:::::::::", latestDate);

      const lastAppraisalInfoByEmp = await empAppraisal.findAll({ where: { employeeId: empId, createdAt: latestDate }, raw: true });
      console.log("Latest Appraisal Details:::::::::", lastAppraisalInfoByEmp);
      lastAppraisalInfo["employeeForm"] = lastAppraisalInfoByEmp;

      const assignedManager = await empMang.findOne({ where: { employeeId: empId }, raw: true });

      console.log("Managers::::", assignedManager);

      const L2Manager = assignedManager.L2ManagerId;
      console.log("L2Manager:::", L2Manager)
      const L3Manager = assignedManager.L3ManagerId;
      console.log("L3Manager:::", L3Manager)
      const L4Manager = assignedManager.L4ManagerId;
      console.log("L4Manager:::", L4Manager)
      const L5Manager = assignedManager.L5ManagerId;
      console.log("L5Manager:::", L5Manager)
      console.log("appraisalID::::::", lastAppraisalInfoByEmp[0].appraisalId);

      await L2Appraisal.findOne({ where: { appraisalId: lastAppraisalInfoByEmp[0].appraisalId }, raw: true }).then((data) => {
        lastAppraisalInfo["L2Form"] = data;
      }).catch((err) => {
        console.log(err);
        // res.send(err);
      })

      await L3Appraisal.findOne({ where: { appraisalId: lastAppraisalInfoByEmp.appraisalId }, raw: true }).then((data) => {
        lastAppraisalInfo["L3Form"] = data;
      }).catch((err) => {
        console.log(err);
        // res.send(err);
      })

      await L4Appraisal.findOne({ where: { appraisalId: lastAppraisalInfoByEmp.appraisalId }, raw: true }).then((data) => {
        lastAppraisalInfo["L4Form"] = data;
      }).catch((err) => {
        console.log(err);
        // res.send(err);
      })

      await Manager.findOne({ where: { appraisalId: lastAppraisalInfoByEmp.appraisalId }, raw: true }).then((data) => {
        lastAppraisalInfo["lastLevel"] = data;
      }).catch((err) => {
        console.log(err);
        // res.send(err);
      })


      console.log("details filled by manager:::::::", lastAppraisalInfo);

      // const result = [lastAppraisalInfoByEmp[0], lastAppraisalInfoByMan];
      console.log("result:::::::::::", lastAppraisalInfo);


      res.json(lastAppraisalInfo);//It is used to send last form filled at level1 and (level 2 or 3 or 4 or 5)
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }

  });


  apiRoutes.post("/empOverallRating", async (req, res) => {
    try {


      const id = req.body.employeeId;
      await empAppraisal.findOne({ where: { employeeId: id, status: "In Progress" }, raw: true, attributes: ['employeeOverallRating'] }).then((data) => {
        console.log(data);
        res.json({ "data": data.employeeOverallRating }).status(200);
      }).catch((err) => {
        console.log(err);
        res.status(400).json({ "message": err });
      });
    }
    catch (err) {
      res.status(400).json(err);
    }
  });


  apiRoutes.post("/OldappraisalListL2L3L4L5", async (req, res) => {//For manager main screen to show appraisals alloted to him/her

    try {
      const id = req.body.employeeId;//manager's id fetched from req.body
      // Fetch all appraisal records for the specified assignedL2Manager or assignedL3Manager or assignedL4Manager or or assignedL5Manager
      console.log("id:::::", id)
      const rawQuery = `SELECT CONCAT(E.firstname, CONCAT(" ",E.lastName)) AS name,designation,A.appraisalId,A.createdAt,A.status,A.employeeId,D.name AS department FROM (employees AS E INNER JOIN empappraisals AS A ON E.employeeId = A.employeeId)INNER JOIN departments AS D ON D.id = E.departmentId  WHERE A.assignedL2Manager = ${id} OR A.assignedL3Manager = ${id} OR A.assignedL4Manager = ${id} OR A.assignedL5Manager = ${id} `;

      sequelize.query(rawQuery, {
        type: Sequelize.QueryTypes.SELECT,
      }).then((data) => {
        console.log(data);
        res.json({ "data": data }).status(200);
      }).catch((err) => {
        console.log(err);
        // res.send(err).status(400);
      })

    } catch (error) {
      console.error("Error fetching appraisal list:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });


  apiRoutes.post("/appraisalListL2L3L4L5", async (req, res) => {
    try {
      const id = req.body.employeeId; // manager's id fetched from req.body
      console.log("id:::::", id);

      const rawQuery = `
        SELECT
          CONCAT(E.firstname, CONCAT(" ",E.lastName)) AS name,
          E.designation,
          A.appraisalId,
          A.createdAt,
          A.status,
          A.employeeId,
          D.name AS department,
          CASE
            WHEN M.TopManager = ${id} THEN 1
            ELSE 0
          END AS isTopManager
        FROM
          employees AS E
          INNER JOIN empappraisals AS A ON E.employeeId = A.employeeId
          INNER JOIN departments AS D ON D.id = E.departmentId
          LEFT JOIN (
            SELECT
              employeeId,
              COALESCE(L5ManagerId, L4ManagerId, L3ManagerId, L2ManagerId) AS TopManager
            FROM
              empmangs
          ) AS M ON A.employeeId = M.employeeId
        WHERE
          A.assignedL2Manager = ${id} OR
          A.assignedL3Manager = ${id} OR
          A.assignedL4Manager = ${id} OR
          A.assignedL5Manager = ${id}`;

      sequelize.query(rawQuery, {
        type: Sequelize.QueryTypes.SELECT,
      }).then((data) => {
        console.log(data);
        res.json({ "data": data }).status(200);
      }).catch((err) => {
        console.log(err);
        res.status(500).json({ error: "Internal Server Error" });
      });
    } catch (error) {
      console.error("Error fetching appraisal list:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  apiRoutes.post("/appraisalListHr", async (req, res) => {//For manager main screen to show appraisals alloted to him/her
    try {
      const id = req.body.employeeId;//manager's id fetched from req.body
      // Fetch all appraisal records for the specified assignedL2Manager or assignedL3Manager or assignedL4Manager or or assignedL5Manager
      console.log("id:::::", id)
      const rawQuery = `SELECT CONCAT(E.firstname, CONCAT(" ",E.lastName)) AS name,E.designation,A.appraisalId,A.createdAt,A.status,A.employeeId,D.name AS department FROM ((employees AS E INNER JOIN empappraisals AS A ON E.employeeId = A.employeeId)INNER JOIN departments AS D ON D.id = E.departmentId)INNER JOIN empmangs AS M ON A.employeeId = M.employeeId  WHERE M.hrID = ${id}`;

      sequelize.query(rawQuery, {
        type: Sequelize.QueryTypes.SELECT,
      }).then((data) => {
        console.log(data);
        res.json({ "data": data }).status(200);
      }).catch((err) => {
        console.log(err);
        // res.send(err).status(400);
      })

    } catch (error) {
      console.error("Error fetching appraisal list:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  apiRoutes.post('/anEmpBasicDetails', async (req, res) => {
    try {


      const id = req.body.empId;
      const rawQuery = `SELECT CONCAT(E.firstname, CONCAT(" ",E.lastName)) AS name,E.employeeId,E.designation,E.officialEmail,D.name AS Department FROM employees AS E INNER JOIN departments AS D ON E.departmentId = D.id WHERE E.employeeId = ${id}`;

      sequelize.query(rawQuery, {
        type: Sequelize.QueryTypes.SELECT,
      }).then((data) => {
        console.log(data);
        res.json({ "data": data }).status(200)
      }).catch((err) => {
        console.log(err);
        // res.json({"message":err}).status(400);
      });
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }

  });

  apiRoutes.post('/allDetailsOfAnAppraisal', async (req, res) => { //For HR to know progress of an appraisal
    try {
      const id = req.body.appraisalId;
      let empDetails;
      let l2Details;
      let l3Details;
      let l4Details;
      let l5Details;

      await empAppraisal.findOne({ where: { appraisalId: id }, raw: true }).then((data) => {
        if (data) {
          empDetails = data;
        }
        else {
          empDetails = null
        }

      }).catch((err) => {
        console.log(err);
      });

      await L2Appraisal.findOne({ where: { appraisalId: id }, raw: true }).then((data) => {
        if (data) {
          l2Details = data;
        }
        else {
          l2Details = null;
        }

      }).catch((err) => {
        console.log(err);
      })

      await L3Appraisal.findOne({ where: { appraisalId: id }, raw: true }).then((data) => {
        if (data) {
          l3Details = data;
        }
        else {
          l3Details = null;
        }

      })
      await L4Appraisal.findOne({ where: { appraisalId: id }, raw: true }).then((data) => {
        if (data) {
          l4Details = data;
        }
        else {
          l4Details = null;
        }

      })
      await Manager.findOne({ where: { appraisalId: id }, raw: true }).then((data) => {
        if (data) {
          l5Details = data;
        }
        else {
          l5Details = null;
        }

      })

      let result = [];
      result.push(empDetails, l2Details, l3Details, l4Details, l5Details)

      res.json({ "data": result }).status(200);



    }
    catch (e) {
      console.log(e);
      res.status(400).json({ "message": e });


    }
  });

  // apiRoutes.post('/employeeEvaluationByL2', async (req, res) => {//It is used by l2 manager to fill employee evaluation form by him/her
  //   try {
  //     const flag = req.body.flag;
  //     console.log("req.body:::::::", req.body);
  //     let info;
  //     let isEditedByL2;


  //     let l2ManagerId;
  //     await empAppraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['assignedL2Manager', 'isEditedByEmp', 'status', 'isEditedByL2'] }).then((data) => {
  //       if (data) {
  //         l2ManagerId = data.assignedL2Manager;
  //         isEditedByL2 = data.isEditedByL2;
  //         info = data;
  //       }
  //     }).catch((err) => {
  //       console.log(err);
  //     });
  //     //Here I am checking whether the employee who is sending the data as evaluation of L2 employee evaluation is a valid L2 manager or not.
  //     if (info.isEditedByEmp || info.status == "Forwarded to the Level-2- Manager") {
  //       if (l2ManagerId == req.body.employeeId) {
  //         if (isEditedByL2 == 1) {
  //           res.status(400).json({ "message": "Form already submitted by the manager not allowed to re-submit" });
  //         }
  //         else {
  //           const updateData = {
  //             L2communicationSkill: req.body.communicationSkill,
  //             L2communicationSkillRemarks: req.body.communicationSkillRemarks,
  //             L2interpersonalSkill: req.body.interpersonalSkill,
  //             L2interpersonalSkillRemarks: req.body.interpersonalSkillRemarks,
  //             L2abilityToPlanTheWork: req.body.abilityToPlanTheWork,
  //             L2abilityToPlanTheWorkRemarks: req.body.abilityToPlanTheWorkRemarks,
  //             L2problemSolving: req.body.problemSolving,
  //             L2problemSolvingRemarks: req.body.problemSolvingRemarks,
  //             L2adaptability: req.body.adaptability,
  //             L2adaptabilityRemarks: req.body.adaptabilityRemarks,
  //             L2willingnessToShoulderAdditional: req.body.willingnessToShoulderAdditional,
  //             L2willingnessToShoulderAdditionalRemarks: req.body.willingnessToShoulderAdditionalRemarks,
  //             L2commitmentToDoAPerfectJob: req.body.commitmentToDoAPerfectJob,
  //             L2commitmentToDoAPerfectJobRemarks: req.body.commitmentToDoAPerfectJobRemarks,
  //             L2habitsAndManners: req.body.habitsAndManners,
  //             L2habitsAndMannersRemarks: req.body.habitsAndMannersRemarks,
  //             L2presentation: req.body.presentation,
  //             L2presentationRemarks: req.body.presentationRemarks,
  //             L2punctuality: req.body.punctuality,
  //             L2punctualityRemarks: req.body.punctualityRemarks,
  //             L2confidentialityOfInfo: req.body.confidentialityOfInfo,
  //             L2confidentialityOfInfoRemarks: req.body.confidentialityOfInfoRemarks,
  //             L2trustworthiness: req.body.trustworthiness,
  //             L2trustworthinessRemarks: req.body.trustworthinessRemarks,
  //             L2teamSpirit: req.body.teamSpirit,
  //             L2teamSpiritRemarks: req.body.teamSpiritRemarks,
  //             L2relationshipWithColleagues: req.body.relationshipWithColleagues,
  //             L2relationshipWithColleaguesRemarks: req.body.relationshipWithColleaguesRemarks,
  //             L2decisionMaking: req.body.decisionMaking,
  //             L2decisionMakingRemarks: req.body.decisionMakingRemarks,
  //             L2computerskills: req.body.computerskills,
  //             L2computerskillsRemarks: req.body.computerskillsRemarks
  //             // Add more fields as needed
  //           };

  //           const updateCondition = {
  //             // Define the condition based on which records should be updated
  //             // For example, to update records with id = 1:
  //             appraisalId: req.body.appraisalId,
  //           };

  //           empAppraisal.update(updateData, {
  //             where: updateCondition,
  //           })
  //             .then((data) => {
  //               console.log("Updated Successfully");
  //               // res.send("Updated Successfully").status(200)
  //             })
  //             .catch(error => {
  //               console.error('Error updating records:', error);
  //               // res.send(error).status(400);
  //             });

  //           const L2sum = req.body.communicationSkill + req.body.interpersonalSkill + req.body.abilityToPlanTheWork + req.body.problemSolving + req.body.adaptability + req.body.willingnessToShoulderAdditional + req.body.commitmentToDoAPerfectJob + req.body.habitsAndManners + req.body.presentation + req.body.punctuality + req.body.confidentialityOfInfo + req.body.trustworthiness + req.body.teamSpirit + req.body.relationshipWithColleagues + req.body.decisionMaking + req.body.computerskills;
  //           console.log(L2sum);
  //           const details = await empAppraisal.findOne({ where: { appraisalId: req.body.appraisalId }, raw: true, attributes: ['employeeTotalScore'] });
  //           const previousSum = 0;

  //           console.log("New sum::::::", L2sum + previousSum)

  //           const percentage = Math.floor((L2sum + previousSum) / 80 * 100);//the total of all 16 fields is 16*5=80 now employee evaluation is not considerd for the final rating 
  //           console.log("Overall Percentage::::::::", percentage);

  //           empAppraisal.update({ L2OP: percentage, L2TS: L2sum + previousSum }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
  //             console.log("percentage and L2 total sum is updated successfully");
  //           }).catch((err) => {
  //             console.log(err);
  //           });

  //           let overallRating;
  //           if (1 <= percentage && percentage <= 25) {
  //             overallRating = "Average";
  //           } else if (26 <= percentage && percentage <= 50) {
  //             overallRating = "Good";
  //           } else if (51 <= percentage && percentage <= 75) {
  //             overallRating = "Very Good";
  //           } else if (76 <= percentage && percentage <= 100) {
  //             overallRating = "Excellent";
  //           }
  //           console.log("OverallRating::::::::::", overallRating);
  //           empAppraisal.update({ L2OR: overallRating }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
  //             console.log("rating updated successfully");
  //           }).catch((err) => {
  //             console.log(err);
  //           })

  //           if (flag == 1) {
  //             empAppraisal.update({ isEditedByL2: true, status: "Forwarded to Level-3- Manager" }, { where: { appraisalId: req.body.appraisalId } }).then((data) => {
  //               console.log("rating updated successfully");
  //             }).catch((err) => {
  //               console.log(err);
  //             })
  //           }

  //           res.json({ "data": overallRating }).status(200);
  //         }
  //       }
  //       else {
  //         res.status(400).json({ "message": "You are not the assigned L2 Manager for this employee" });
  //       }
  //     }
  //     else {
  //       res.status(400).json({ "message": "Employee evaluation form is yet to be filled by employee" });
  //     }

  //   }
  //   catch (e) {
  //     res.status(400).json({ "message": e });
  //   }

  // });

  apiRoutes.post('/employees', async (req, res) => {//It is used to generate all employee list
    try {


      Employees.findAll({
        attributes: [
          'employeeId',
          [sequelize.literal('CONCAT(firstname, " ", lastName)'), 'Name'], 'designation'
        ], raw: true
      }).then((data) => {
        console.log(data);
        res.json({ "data": data }).status(200);
      }).catch((err) => {
        console.log(err);
        // res.send(err).status(400);
      })
    }
    catch (e) {
      res.status(400).json({ "message": e });
    }
  });

  apiRoutes.post('/hrList', async (req, res) => {//It is used to generate all employee list

    try {
      Employees.findAll({
        where: { departmentId: 101 },
        attributes: [
          'employeeId',
          [sequelize.literal('CONCAT(firstname, " ", lastName)'), 'Name'],
        ], raw: true
      }).then((data) => {
        console.log(data);
        res.json({ "data": data }).status(200);
      }).catch((err) => {
        console.log(err);
        // res.send(err).status(400);
      })
    }
    catch (e) {
      res.status(400).json({ "message": e });
    }
  });

  apiRoutes.post('/empmangFetch', async (req, res) => {
    try {
      let details;
      let result = [];

      await empMang.findAll({ raw: true, attributes: ['employeeId', 'L2ManagerId', 'L3ManagerId', 'L4ManagerId', 'L5ManagerId', 'hrId'] }).then((data) => {
        console.log("data::::::", data)
        details = data;
        // res.send(data).status(200)
        console.log(data);
      }).catch((err) => {
        console.log(err);
        res.send(err);
      });
      console.log("details:::::", details);
      for (let i = 0; i < details.length; i++) {
        const inputObject = details[i];

        const employeeIds = Object.values(inputObject);

        await Employees.findAll({
          attributes: ['employeeId', [sequelize.literal('CONCAT(firstname, " ", lastName)'), 'Name']],
          where: {
            employeeId: employeeIds,
          }, raw: true
        })
          .then((employees) => {
            console.log("AttemptNo::::", i, "employees::::::::", employees);
            const employeeDetails = employees.map((employee) => ({
              employeeId: employee.employeeId,
              name: employee.Name,
            }));
            console.log('Employee Details:', employeeDetails);
            const secondArray = [details[i]];
            console.log("secondArray:::::::", secondArray);

            const resultArray = secondArray.map((item) => {
              const mappedNames = {};
              Object.keys(item).forEach((key) => {
                if (key.endsWith('Id') && item[key]) {
                  const correspondingEmployee = employeeDetails.find((employee) => employee.employeeId === item[key]);
                  if (correspondingEmployee) {
                    mappedNames[`${key}Name`] = correspondingEmployee.name;
                    mappedNames["employeeId"] = details[i].employeeId;
                    mappedNames["l2ManagerId"] = details[i].L2ManagerId;
                    mappedNames["l3ManagerId"] = details[i].L3ManagerId;
                    mappedNames["l4ManagerId"] = details[i].L4ManagerId;
                    mappedNames["l5ManagerId"] = details[i].L5ManagerId;
                    mappedNames["hrId"] = details[i].hrId;
                  }
                }
              });
              console.log("mappedNames::::", mappedNames);
              result.push(mappedNames);
            })



          }).catch((error) => {
            console.error('Error fetching employee details:', error);
          });
      }

      console.log("RESULT:::::", result);
      res.json({ "data": result }).status(200);
    }
    catch (err) {
      res.status(400).json({ "message": err });
    }
  });

  apiRoutes.post('/empmangStore', async (req, res) => {
    try {
      console.log("req.body", req.body);
      console.log("entries[0].employee::::::::", req.body.entries);
      let info;
      let emp = req.body.entries[0].employee;
      let l2 = req.body.entries[0].l2Manager;
      let l3 = req.body.entries[0].l3Manager;
      let l4 = req.body.entries[0].l4Manager;
      let l5 = req.body.entries[0].l5Manager;
      let hr = req.body.entries[0].hr;
      await empMang.findOne({ where: { employeeId: req.body.entries[0].employee }, raw: true }).then((data) => {
        console.log("data::::::::::::", data);

        info = data;

      }).catch((e) => {
        console.log(e);
      })
      console.log("Info::::", info);
      if (info != null) {
        res.status(400).json({ "message": "Entries already present for the selected employee" });
      }
      else {
        if (emp == l2 || emp == l3 || emp == l4 || emp == l5 || emp == hr) {
          res.status(400).json({ "message": "Employee and manager cannot be same" });
        }
        else {


          const entries = req.body.entries;
          console.log("ENTRIES::::", entries)
          for (let i = 0; i < entries.length; i++) {
            await empMang.create({ employeeId: entries[i].employee, L2ManagerId: entries[i].l2Manager, L3ManagerId: entries[i].l3Manager, L4ManagerId: entries[i].l4Manager, L5ManagerId: entries[i].l5Manager, hrId: entries[i].hr }).then((data) => {
              console.log("Entry created for entries array object:::", i)
              res.json({ "message": "Entries Created" }).status(200);
            }).catch((err) => {
              console.log(err);
              res.status(400).json({ "message": err });
            })
          }
          // res.send("Entries Created").status(200);
        }
      }
    }
    catch (e) {
      res.status(400).json({ "message": e });
    }

  });

  apiRoutes.post('/empmangUpdate', async (req, res) => {

    try {
      // const empId = Employees.findOne({where:})
      const employeeId = req.body.entries[0].employee;
      console.log("employeeId:::", employeeId);
      // const arrayName = name.split(' ');
      // console.log("name:::", arrayName);
      // const firstName = arrayName[0];
      // const lastName = arrayName[1];
      // console.log("firstName:::", firstName, "lastName::", lastName);
      // const empId = await Employees.findOne({ where: { employeeId:employeeId}, raw: true, attributes: ['employeeId'] });
      // console.log(empId);
      const entries = req.body.entries;
      console.log("Before ENTRIES::::", entries)
      const info = await empMang.findOne({ where: { employeeId: employeeId }, raw: true });
      console.log("info::::", info);
      if (entries[0].l2Manager == null) {
        entries[0].l2Manager = info.L2ManagerId;
      }
      if (entries[0].l3Manager == null) {
        entries[0].l3Manager = info.L3ManagerId;
      }
      if (entries[0].l4Manager == null) {
        entries[0].l4Manager = info.L4ManagerId;
      }
      if (entries[0].l5Manager == null) {
        entries[0].l5Manager = info.L5ManagerId;
      }
      if (entries[0].hr == null) {
        entries[0].hr = info.hrId;
      }



      console.log(" After ENTRIES::::", entries)
      for (let i = 0; i < entries.length; i++) {
        await empMang.update({ employeeId: employeeId, L2ManagerId: entries[i].l2Manager, L3ManagerId: entries[i].l3Manager, L4ManagerId: entries[i].l4Manager, L5ManagerId: entries[i].l5Manager, hrId: entries[i].hr }, { where: { employeeId: employeeId } }).then((data) => {
          console.log("Entry updated for entries array object:::", i);
          res.json({ "message": "Entries Updated Successfully" }).status(200);
        }).catch((err) => {
          console.log(err);
          // res.send(err).status(400);
        })
      }
      // res.send("Entries Created").status(200);
    }
    catch (e) {
      res.status(400).json({ "message": e });
    }
  });






  apiRoutes.get("/", function (req, res) {
    res.send({ status: true, message: "Please enter the correct endpoint" });
  });
  app.use("/", apiRoutes);
}