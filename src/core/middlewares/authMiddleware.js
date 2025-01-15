exports.checkVerifiedUser = async (req, res, next) => {
    const user = await userService.getUserById(req.user.userID);

    if (!user.isVerified) {
        return res.status(403).json({ message: 'Votre compte n’est pas encore vérifié.' });
    }

    next();
};
