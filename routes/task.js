const User = require('../models/user'); 
const Task = require('../models/task'); 

module.exports = function (router) {

    var taskRoute = router.route('/tasks');
    var taskRouteByID = router.route('/tasks/:id');

    taskRoute.get(async (req, res) => {
        try {
            const where = req.query.where ? JSON.parse(req.query.where) : {};
            const sort = req.query.sort ? JSON.parse(req.query.sort) : {};
            const select = req.query.select ? JSON.parse(req.query.select) : {};
            const skip = parseInt(req.query.skip) || 0;
            const limit = parseInt(req.query.limit) || 100;
            const count = req.query.count === 'true';

            if (count) {
              const total = await Task.countDocuments(where);
              return res.json({ message: "tasks successfully fetched", data: total });
            }

            const tasks = await Task.find(where)
              .sort(sort)
              .select(select)
              .skip(skip)
              .limit(limit);
            res.status(200).json({ message: "tasks successfully fetched", data: tasks });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not retrieve tasks' });
        }
    });
   
    taskRoute.post(async (req, res) => {
        try {
            const { name, description, deadline, completed, assignedUser, assignedUserName } = req.body;
            if (!name || !deadline) {
                return res.status(400).json({ error: 'Must provide name and deadline for task to insert' });
            }
            const newTask = new Task({
                name,
                description: description || " ",
                deadline,
                completed: completed || false,
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

            res.status(201).json({ message: "Specified task has been created", data: savedTask });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not insert specified task' });
        }
    });

    taskRouteByID.get(async (req, res) => {
        try {
            const task = await Task.findById(req.params.id);
            if (!task) return res.status(404).json({ error: 'Could not find specified task to get' });

            const select = req.query.select ? JSON.parse(req.query.select) : {};
            const finalized = await Task.findById(req.params.id).select(select);

            res.status(200).json({ message: "Specified task has been retrieved", data: finalized });

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
            if (!name || !deadline) {
                return res.status(400).json({ error: 'Must provide new name and new deadline for task to update' });
            }
            if (task.assignedUser) {
                await User.findByIdAndUpdate(
                    task.assignedUser,
                    { $pull: { pendingTasks: task._id } },
                    { new: true }
                );
            }
            const updatedTask = await Task.findByIdAndUpdate(
                req.params.id,
                { name, description, deadline, completed, assignedUser, assignedUserName },
                { new: true }
            );

            if (assignedUser) {
                await User.findByIdAndUpdate(
                    assignedUser,
                    { $push: { pendingTasks: req.params.id } },
                    { new: true }
                );
            }


            res.status(200).json({ message: "Specified task has been updated", data: updatedTask });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not find specified task to update - Server error' });
        }
    });

    taskRouteByID.delete(async (req, res) => {
        try {
            const task = await Task.findById(req.params.id);
            if (!task) return res.status(404).json({ error: 'Could not find specified user to delete' });

            if (task.assignedUser) {
                await User.findByIdAndUpdate(
                    task.assignedUser,
                    { $pull: { pendingTasks: task._id } },
                    { new: true }
                );
            }



            await Task.deleteOne({ _id: req.params.id });
            res.status(204).json({ message: "Specified task has been deleted", data: "success" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not find specified user to delete - Server error' });
        }
    });

    return router;
};
