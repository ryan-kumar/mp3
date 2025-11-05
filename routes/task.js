const User = require('../models/user'); 
const Task = require('../models/task'); 

module.exports = function (router) {

    var taskRoute = router.route('/tasks');

   
       taskRoute.get( async (req, res) => {
       try {
         const tasks = await Task.find(); 
         res.status(200).json(tasks);
       } catch (err) {
           console.error(err);
           res.status(500).json({ error: 'Could not retrieve tasks' });
       }});
   
      
       taskRoute.post( async (req, res) => {
       try {
         const { name, description, deadline, completed, assignedUser, assignedUserName} = req.body;
         const newTask = new Task({
           name,
           description,
           deadline,
           completed,
           assignedUser,
           assignedUserName, 
         });
         const savedTask = await newTask.save();

           if (assignedUser) {
            await User.findByIdAndUpdate(
            assignedUser,
            { $push: { pendingTasks: savedTask._id } },
            { new: true }
            );
           }
   
         res.status(201).json(savedTask);
       } catch (err) {
           console.error(err);
           res.status(500).json({ error: 'Could not insert specified task' });
       }});

   

    return router;
}
