const express = require("express");
const Sequelize = require("sequelize");
const {
  sequelize,
  Teams,
  Employees,
  ProjectMembers,
} = require("../../config/db.config.js");
const Op = Sequelize.Op;
const db = require("../../config/db.config.js");
const StoryTasks = db.StoryTasks;
const Project = db.Project;
const Sprint = db.Sprint;
const apiRoutes = express.Router();


module.exports = function (app) {
    
  apiRoutes.post("/plannedVsActual", async (req, res) => {
    try {
      const date = new Date();
      const taskId = req.body.taskId;
      const employeeId = req.body.employeeId;

      const projects = await Project.findAll({
        attributes: ["projectId"],
        where: {
          organisationId: req.body.user_organisationId,
        },
      });
      const projectsArr = projects.map((project) => project.projectId);

      const employees = await Employees.findAll({
        attributes: ["employeeId"],
        where: {
          organisationId: req.body.user_organisationId,
        },
      });
      const empArr = employees.map((employee) => employee.employeeId);

      const activeTaskAllProject = [];

      await Promise.all(
        projectsArr.map(async (projectId) => {
          const where = {
            projectId: projectId,
            startDate: { [Op.lte]: date },
            [Op.or]: [
              { completionDate: null },
              { completionDate: { [Op.gte]: date } },
            ],
            organisationId: req.body.user_organisationId,
          };

          const sprints = await Sprint.findAll({ where });
          const uniqueActiveTask = [
            ...new Set(sprints.flatMap((sprint) => sprint.tasks)),
          ];

          const storyTasks = await StoryTasks.findAll({
            attributes: [
              "taskId",
              "assignee",
              "estimatedHours",
              "projectId",
              "reporter",
              "actualHours",
              "extraHours",
            ],
            where: {
              projectId: projectId,
              organisationId: req.body.user_organisationId,
              taskId: uniqueActiveTask,
            },
          });

          if (storyTasks.length > 0) {
            activeTaskAllProject.push(storyTasks);
          }
        })
      );

      const summaryMap = {};

      activeTaskAllProject.forEach((tasks) => {
        tasks.forEach((task) => {
          const {
            assignee,
            estimatedHours,
            actualHours,
            extraHours,
            projectId,
          } = task;
          if (!summaryMap[assignee]) {
            summaryMap[assignee] = [];
          }
          const index = summaryMap[assignee].findIndex(
            (item) => item.projectId === projectId
          );
          if (index === -1) {
            summaryMap[assignee].push({
              projectId: projectId,
              totalEstimatedHours: estimatedHours,
              totalActualHours: actualHours,
              totalExtraHours: extraHours,
            });
          } else {
            summaryMap[assignee][index].totalEstimatedHours += estimatedHours;
            summaryMap[assignee][index].totalActualHours += actualHours;
            summaryMap[assignee][index].totalExtraHours += extraHours;
          }
        });
      });

      // Calculate total hours for each assignee
      Object.keys(summaryMap).forEach((assignee) => {
        const totalHours = summaryMap[assignee].reduce(
          (acc, curr) => {
            acc.totalEstimatedHours += curr.totalEstimatedHours;
            acc.totalActualHours += curr.totalActualHours;
            acc.totalExtraHours += curr.totalExtraHours;
            return acc;
          },
          { totalEstimatedHours: 0, totalActualHours: 0, totalExtraHours: 0 }
        );
        summaryMap[assignee].push(totalHours);
      });

      res.send(summaryMap);
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  });

  apiRoutes.post("/empProjectData", async (req, res) => {
    let dataArray = [];
    let idArray = [];
    const rawQuery = `SELECT CONCAT(E.firstname, CONCAT(" ",E.lastName)) AS name,E.employeeId,E.designation,M.projectId,M.type,M.hoursAssign,M.billable AS billableFlag,P.projectName FROM (Employees AS E INNER JOIN ProjectMembers AS M ON E.employeeId = M.employeeId)INNER JOIN Projects AS P ON M.projectId = P.projectId`;
    await sequelize
      .query(rawQuery, {
        type: Sequelize.QueryTypes.SELECT,
      })
      .then((data) => {
        // console.log(data);
        dataArray = data;
      })
      .catch((err) => {
        console.log(err);
        // res.json({"message":err}).status(400);
      });
    //Pushing all names in an array
    for (i = 0; i < dataArray.length; i++) {
      idArray.push(dataArray[i].employeeId);
    }
    // console.log("nameArray:::::", idArray);
    // console.log("data:::::", dataArray);
    const uniqueSet = new Set(idArray);
    const uniqueidArray = Array.from(uniqueSet);
    // console.log("Unique array name:::::::", uniqueidArray);
    const result = {};
    for (j = 0; j < uniqueidArray.length; j++) {
      const id = uniqueidArray[j];
      const temp = [];
      for (k = 0; k < dataArray.length; k++) {
        if (id == dataArray[k].employeeId) {
          const object = new Object({
            employeeName: dataArray[k].name,
            employeeId: dataArray[k].employeeId,
            designation: dataArray[k].designation,
            projectId: dataArray[k].projectId,
            billableFlag: dataArray[k].billableFlag,
            projectName: dataArray[k].projectName,
          });
          temp.push(object);
        }
      }
      result[id] = temp;
    }
    res.json(result);
  });

  // apiRoutes.post("/data", async (req, res) => {
  //   const data = await Project.findAll();
  //   res.send(data);
  // });

  apiRoutes.get("/", function (req, res) {
    res.send({ status: true });
  });
  app.use("/", apiRoutes);
};
