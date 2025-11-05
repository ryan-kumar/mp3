const User = require('../models/user'); 
const Task = require('../models/task'); 

module.exports = function (router) {

    var userRoute = router.route('/users');
    var userRouteByID = router.route('/users/:id');

    userRoute.get(async (req, res) => {
        try {
            const where = req.query.where ? JSON.parse(req.query.where) : {};
            const sort = req.query.sort ? JSON.parse(req.query.sort) : {};
            const select = req.query.select ? JSON.parse(req.query.select) : {};
            const skip = parseInt(req.query.skip) || 0;
            const limit = parseInt(req.query.limit);
            const count = req.query.count === 'true';

            if (count) {
                const total = await User.countDocuments(where);
                return res.json({ message: "users successfully fetched", data: total });
            }

            const users = await User.find(where)
            .sort(sort)
            .select(select)
            .skip(skip)
            .limit(limit);
            res.status(200).json({ message: "users successfully fetched", data: users });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Could not retrieve users', data: {} });
        }
    });

    userRoute.post(async (req, res) => {
        try {
            const { name, email, pendingTasks } = req.body;
            if (!name || !email) {
                return res.status(400).json({ message: 'Must provide name and email for user to insert', data: {} });
            }
            const user = await User.findOne({ email });
            if (user) return res.status(400).json({ message: 'Duplicate email address not allowed', data: {} });
            const newUser = new User({
                name,
                email,
                pendingTasks: pendingTasks || [], 
            });
            const savedUser = await newUser.save();

            res.status(201).json({ message: "Specified user has been created", data: savedUser });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Could not insert specified user', data: {} });
        }
    });

    userRouteByID.get(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ message: 'Could not find specified user to get', data: {} });

            const select = req.query.select ? JSON.parse(req.query.select) : {};
            const finalized = await User.findById(req.params.id).select(select);

            res.status(200).json({ message: "Specified user has been retrieved", data: finalized });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Could not find specified user to get - Server error', data: {} });
        }
    });

    userRouteByID.put(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ message: 'Could not find specified user to update', data: {} });
            const { name, email, pendingTasks } = req.body;
            if (!name || !email) {
                return res.status(400).json({ message: 'Must provide new name and new email for user to update', data: {} });
            }
            const otherUser = await User.findOne({ email });
            if (otherUser && otherUser._id.toString() !== user._id.toString()) {
                return res.status(400).json({ message: 'Duplicate email address not allowed', data: {} });
            }

            const oldPendingTasks = user.pendingTasks.map(id => id.toString());
            const newPendingTasks = (pendingTasks || []).map(id => id.toString());

            const tasksToUnassign = oldPendingTasks.filter(id => !newPendingTasks.includes(id));
            const tasksToAssign = newPendingTasks.filter(id => !oldPendingTasks.includes(id));

            for (const taskId of tasksToUnassign) {
                await Task.findByIdAndUpdate(
                    taskId,
                    { assignedUser: "", assignedUserName: "unassigned" },
                    { new: true }
                );
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.params.id,
                { name, email, pendingTasks: pendingTasks || [] },
                { new: true }
            );

            for (const taskId of tasksToAssign) {
                await Task.findByIdAndUpdate(
                    taskId,
                    { assignedUser: updatedUser._id, assignedUserName: updatedUser.name },
                    { new: true }
                );
            }

            res.status(200).json({ message: "Specified user has been updated", data: updatedUser });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Could not find specified user to update - Server error', data: {} });
        }
    });

    userRouteByID.delete(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ message: 'Could not find specified user to delete', data: {} });
            for (let i = 0; i < user.pendingTasks.length; i++) {
                const task = await Task.findById(user.pendingTasks[i]);
                if (task) {
                    task.assignedUser = "";
                    task.assignedUserName = "unassigned";
                    await task.save();
                }
            }
            await User.deleteOne({ _id: req.params.id });
            res.status(200).json({ message: "Specified user has been deleted", data: "success" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Could not find specified user to delete - Server error', data: {} });
        }
    });

    return router;
};