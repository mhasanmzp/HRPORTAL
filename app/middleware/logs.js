const express = require('express');
const Sequelize = require('sequelize');
const { QueryTypes } = require('sequelize');
const { sequelize, Teams, Employees, ProjectMembers } = require('../../config/db.config.js');
const Op = Sequelize.Op
const db = require('../../config/db.config.js');
let logs = db.logs


async function createTask(employeeId, logDetails, event) {
    await logs.create({
        employeeId: employeeId,
        logDetails: logDetails,
        event:event,
        date:new Date()
    }).then(resp => {
        console.log("log created")
    })
}
async function readTask(employeeId, logDetails) {
    await logs.create({
        employeeId: employeeId,
        logDetails: logDetails
    }).then(resp => {
        console.log("log created")
    })
}




module.exports = { createTask , readTask}