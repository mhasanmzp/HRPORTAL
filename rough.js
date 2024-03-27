apiRoutes.post('/MyempMang', async (req, res) => { // Sending Flag 1 if Appraisal is already Forwarded.
    try {
      if (req.body.entries && req.body.entries.length > 0) {
        const entries = req.body.entries;
        const employeeId = entries[0].employee;
  
        // Check if entries already exist for the employee
        const existingEntry = await empMang.findOne({ where: { employeeId: employeeId }, raw: true });
        
        // Check if appraisal process exists with a status other than "initiated"
        const appraisalExists = await empAppraisal.findOne({ where: { employeeId: employeeId, status: { [Op.not]: 'initiated' } } });

        if (appraisalExists && appraisalExists.status == "initiated") {
            
                
                const { l2Manager, l3Manager, l4Manager, l5Manager, hr } = req.body;

                // Prepare update object with only provided managers
                const updatedManagers = {};
                if (l2Manager !== undefined) updatedManagers.L2ManagerId = l2Manager;
                if (l3Manager !== undefined) updatedManagers.L3ManagerId = l3Manager;
                if (l4Manager !== undefined) updatedManagers.L4ManagerId = l4Manager;
                if (l5Manager !== undefined) updatedManagers.L5ManagerId = l5Manager;
                if (hr !== undefined) updatedManagers.hrId = hr;

                // Update only the provided managers without affecting the absent managers
                await empMang.update(updatedManagers, { where: { employeeId: employeeId } });
                res.status(200).json({"message": "Updated Succesfully"})
            }
            console.log("updatedManagers: " + updatedManagers)
        }

        else if (existingEntry) {
            // Update existing entries
            for (let i = 0; i < entries.length; i++) {
              await empMang.update({
                L2ManagerId: entries[i].l2Manager,
                L3ManagerId: entries[i].l3Manager,
                L4ManagerId: entries[i].l4Manager,
                L5ManagerId: entries[i].l5Manager,
                hrId: entries[i].hr
              }, { where: { employeeId: employeeId } }).then((data) => {
                console.log("Entry updated for entries array object:::", i);
              }).catch((err) => {
                console.log(err);
                res.status(400).json({ "message": err });
              });
            }

            else{
            // Send additional flag and message
            return res.status(400).json({ "flag": 1, "message": "Can't Update Managers: Appraisal Already Processed" });
          }
  
          res.json({ "message": "Entries Updated Successfully" }).status(200);
        } else {
          // Store new entries
          const emp = entries[i].employee;
          const l2 = entries[i].l2Manager;
          const l3 = entries[i].l3Manager;
          const l4 = entries[i].l4Manager;
          const l5 = entries[i].l5Manager;
          const hr = entries[i].hr;
          
          if (emp == l2 || emp == l3 || emp == l4 || emp == l5 || emp == hr) {
            return res.status(400).json({ "message": "Employee and manager cannot be same" });
          }
  
          await empMang.create({
            employeeId: emp,
            L2ManagerId: l2,
            L3ManagerId: l3,
            L4ManagerId: l4,
            L5ManagerId: l5,
            hrId: hr
          }).then((data) => {
            console.log("Entry created for entries array object:::", i)
            res.json({ "message": "Entries Created" }).status(200);
          }).catch((err) => {
            console.log(err);
            res.status(400).json({ "message": err });
          });
        }
      } else {
        res.status(400).json({ "message": "No entries provided" });
      }
    } catch (e) {
      res.status(400).json({ "message": e });
    }
  });
  