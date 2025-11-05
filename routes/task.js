const User = require('../models/user'); 
const Task = require('../models/task'); 

module.exports = function (router) {

    var taskRoute = router.route('/tasks');
    var taskRouteByID = router.route('/tasks/:id');

    taskRoute.get(async (req, res) => {
        try {
            const tasks = await Task.find(); 
            res.status(200).json({ message: "OK", data: tasks });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not retrieve tasks' });
        }
    });
   
    taskRoute.post(async (req, res) => {
        try {
            const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;
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

            res.status(201).json({ message: "OK", data: savedTask });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not insert specified task' });
        }
    });

    taskRouteByID.get(async (req, res) => {
        try {
            const task = await Task.findById(req.params.id);
            if (!task) return res.status(404).json({ error: 'Could not find specified task to get' });
            res.status(200).json({ message: "OK", data: task });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not find specified task to get - Server error' });
        }
    });

    taskRouteByID.put(async (req, res) => {
        try {
            const task = await Task.findById(req.params.id);
            if (!task) return res.status(404).json({ error: 'Could not find specified task to update' });

            const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;
            const updatedTask = await Task.replaceOne(
                { _id: req.params.id }, 
                {
                    _id: req.params.id, 
                    name,
                    description,
                    deadline,
                    completed,
                    assignedUser,
                    assignedUserName
                }
            );

            res.status(200).json({ message: "OK", data: updatedTask });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not find specified task to update - Server error' });
        }
    });

    taskRouteByID.delete(async (req, res) => {
        try {
            const task = await Task.findById(req.params.id);
            if (!task) return res.status(404).json({ error: 'Could not find specified user to delete' });
            await Task.deleteOne({ _id: req.params.id });
            res.status(200).json({ message: "OK", data: "success" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not find specified user to delete - Server error' });
        }
    });

    return router;
};
