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
      // Employees.findOne({
      //   attributes: ['officialEmail'],
      //   where: { employeeId: firstL2ManagerId },
      //   raw: true
      // }).then((l2ManagerDetails) => {
      //   if (l2ManagerDetails) {
      //     const l2ManagerEmail = l2ManagerDetails.officialEmail;
      //     const htmlFilePath = path.join('Mails/mangAppMail.ejs');
      //     const htmlContent = fs.readFileSync(htmlFilePath, 'utf8')
      //     let mailOptions = {
      //       from: 'support@timesofpeople.com',
      //       to: l2ManagerEmail,
      //       subject: 'You Have Been Assigned as an Evaluator',
      //       text: `Dear Manager, \n\nYou have been assigned as an evaluator for an employee. Please review the employee's evaluation.\n\nRegards,\Mckinsol Consulting Inc.`,
      //       html: htmlContent,
      //     };

      //     console.log(l2ManagerEmail);

      //     transporter.sendMail(mailOptions, function (error, info) {
      //       if (error) {
      //         console.log(error);
      //       } else {
      //         console.log('Email sent to ' + l2ManagerEmail);
      //       }
      //     });
      //   }
      // }).catch((err) => {
      //   console.log("Error finding L2 Manager details: ", err);
      // });

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
      // //////////////Sending mail to Level3 Manager//////////
      // Employees.findOne({
      //   attributes: ['officialEmail'],
      //   where: { employeeId: firstL3ManagerId },
      //   raw: true
      // }).then((l3ManagerDetails) => {
      //   if (l3ManagerDetails) {
      //     const l3ManagerEmail = l3ManagerDetails.officialEmail;
      //     const htmlFilePath = path.join('Mails/mangAppMail.ejs');
      //     const htmlContent = fs.readFileSync(htmlFilePath, 'utf8')
      //     let mailOptions = {
      //       from: 'support@timesofpeople.com',
      //       to: l3ManagerEmail,
      //       subject: 'You Have Been Assigned as an Evaluator',
      //       text: `Dear Manager, \n\nYou have been assigned as an evaluator for an employee. Please review the employee's evaluation.\n\nRegards,\Mckinsol Consulting Inc.`,
      //       html: htmlContent,
      //     };

      //     console.log(l3ManagerEmail);

      //     transporter.sendMail(mailOptions, function (error, info) {
      //       if (error) {
      //         console.log(error);
      //       } else {
      //         console.log('Email sent to ' + l3ManagerEmail);
      //       }
      //     });
      //   }
      // }).catch((err) => {
      //   console.log("Error finding L3 Manager details: ", err);
      // });
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
      // Employees.findOne({
      //   attributes: ['officialEmail'],
      //   where: { employeeId: firstL4ManagerId },
      //   raw: true
      // }).then((l4ManagerDetails) => {
      //   if (l4ManagerDetails) {
      //     const l4ManagerEmail = l4ManagerDetails.officialEmail;
      //     const htmlFilePath = path.join('Mails/mangAppMail.ejs');
      //     const htmlContent = fs.readFileSync(htmlFilePath, 'utf8')
      //     let mailOptions = {
      //       from: 'support@timesofpeople.com',
      //       to: l4ManagerEmail,
      //       subject: 'You Have Been Assigned as an Evaluator',
      //       text: `Dear Manager, \n\nYou have been assigned as an evaluator for an employee. Please review the employee's evaluation.\n\nRegards,\Mckinsol Consulting Inc.`,
      //       html: htmlContent,
      //     };

      //     console.log(l4ManagerEmail);

      //     transporter.sendMail(mailOptions, function (error, info) {
      //       if (error) {
      //         console.log(error);
      //       } else {
      //         console.log('Email sent to ' + l4ManagerEmail);
      //       }
      //     });
      //   }
      // }).catch((err) => {
      //   console.log("Error finding L4 Manager details: ", err);
      // });
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
      // Employees.findOne({
      //   attributes: ['officialEmail'],
      //   where: { employeeId: firstL5ManagerId },
      //   raw: true
      // }).then((l5ManagerDetails) => {
      //   if (l5ManagerDetails) {
      //     const l5ManagerEmail = l5ManagerDetails.officialEmail;
      //     const htmlFilePath = path.join('Mails/mangAppMail.ejs');
      //     const htmlContent = fs.readFileSync(htmlFilePath, 'utf8')
      //     let mailOptions = {
      //       from: 'support@timesofpeople.com',
      //       to: l5ManagerEmail,
      //       subject: 'You Have Been Assigned as an Evaluator',
      //       text: `Dear Manager, \n\nYou have been assigned as an evaluator for an employee. Please review the employee's evaluation.\n\nRegards,\Mckinsol Consulting Inc.`,
      //       html: htmlContent,
      //     };
      //     console.log(l5ManagerEmail);

      //     transporter.sendMail(mailOptions, function (error, info) {
      //       if (error) {
      //         console.log(error);
      //       } else {
      //         console.log('Email sent to ' + l5ManagerEmail);
      //       }
      //     });
      //   }
      // }).catch((err) => {
      //   console.log("Error finding L5 Manager details: ", err);
      // });
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