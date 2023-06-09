const Transaction = require('../models/transaction');
const stripe = require('stripe')(process.env.STRIPE_SK);

async function verifyPayment(req, res, next) {
  const id = req.query.id || req.body.id;
  const plans = (req.query.plan && req.query.plan.split(',')) || req.body.plan;
  const payment_method = req.query.method || req.body.payload.paymentIntent.payment_method;

  const transaction = await Transaction.findOne({ stripeId: id });
  const client_secret = transaction.clientSecret;

  stripe.paymentIntents.confirm(id, { payment_method, client_secret }, function (err, paymentIntent) {
    const wasPayed = err.payment_intent && err.payment_intent.status === 'succeeded';
    const payment_plans = JSON.parse(err.payment_intent.description);

    const isEquals =
      plans.length === payment_plans.length &&
      plans.every(function (value, index) {
        return value === payment_plans[index];
      });

    if (!isEquals) {
      res.status(404).json({ message: 'Incorrect plans' });
      return;
    }

    if (!wasPayed) {
      res.status(404).json({ message: 'Access denied' });
      return;
    }

    next();
  });
}

module.exports = {
  verifyPayment,
};
