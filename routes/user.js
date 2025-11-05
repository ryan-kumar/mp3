const User = require('../models/user'); 

module.exports = function (router) {

    var userRoute = router.route('/users');
    var userRouteByID = router.route('/users/:id');

    userRoute.get(async (req, res) => {
        try {
            const users = await User.find(); 
            res.status(200).json({ message: "OK", data: users });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not retrieve users' });
        }
    });

    userRoute.post(async (req, res) => {
        try {
            const { name, email, pendingTasks } = req.body;
            const newUser = new User({
                name,
                email,
                pendingTasks: pendingTasks || [], 
            });
            const savedUser = await newUser.save();

            res.status(201).json({ message: "OK", data: savedUser });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not insert specified user' });
        }
    });

    userRouteByID.get(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: 'Could not find specified user to get' });
            res.status(200).json({ message: "OK", data: user });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not find specified user to get - Server error' });
        }
    });

    userRouteByID.put(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: 'Could not find specified user to update' });

            const { name, email, pendingTasks } = req.body;
            const updatedUser = await User.replaceOne(
                { _id: req.params.id }, 
                {
                    _id: req.params.id, 
                    name,
                    email,
                    pendingTasks: pendingTasks || []
                }
            );

            res.status(200).json({ message: "OK", data: updatedUser });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not find specified user to update - Server error' });
        }
    });

    userRouteByID.delete(async (req, res) => {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ error: 'Could not find specified user to delete' });
            await User.deleteOne({ _id: req.params.id });
            res.status(200).json({ message: "OK", data: "success" });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Could not find specified user to delete - Server error' });
        }
    });

    return router;
};
