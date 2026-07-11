const Subscription = require("../models/Subscription.model");

const subscribe = async (req, res, next) => {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to subscribe to room alerts.",
      });
    }

    // Check if already subscribed
    let sub = await Subscription.findOne({ email });
    if (sub) {
      if (sub.isActive) {
        return res.status(200).json({
          success: true,
          message: "You are already subscribed to room alerts!",
        });
      } else {
        sub.isActive = true;
        await sub.save();
        return res.status(200).json({
          success: true,
          message: "Welcome back! Your room alert subscription is reactivated.",
        });
      }
    }

    sub = await Subscription.create({ email });
    res.status(201).json({
      success: true,
      message: "Successfully subscribed to room alerts! 🎉",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  subscribe,
};
