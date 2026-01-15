const express = require('express');
const bcrypt = require('bcryptjs');
const Member = require('../models/Member');
const Payment = require('../models/Payment');
const auth = require('../middleware/auth');
const role = require('../middleware/role');
const upload = require('../middleware/uploads');

const router = express.Router();

/* ---------- ADD MEMBER ---------- */
router.post('/members', auth, role(['admin']), upload, async (req, res) => {
  try {
    const { fullName, phone, email, age, gender, address, subscriptionPlan, amount } = req.body;

    // duplicate check
    if (await Member.findOne({ email }))
      return res.status(400).json({ msg: 'Email already registered' });

    const hashed = await bcrypt.hash('123456', 12);
    const joinDate = new Date();
    const expiry = new Date(joinDate);
    expiry.setDate(expiry.getDate() + (subscriptionPlan === 'Monthly' ? 30 : 90));

    // pic path – leading "/" already added by upload middleware
    const member = await Member.create({
      fullName, phone, email, age, gender, address,
      password: hashed, subscriptionPlan, joinDate, expiryDate: expiry,
      amount: Number(amount) || 0,
      profilePicture: req.file ? req.file.filename : '/assets/avatar.png'
    });

    // payment entry
    await Payment.create({ memberId: member._id, amount: Number(amount) || 0, date: new Date(), remarks: 'Initial subscription' });

    res.json({ msg: 'Member added', member });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Add failed' });
  }
});

module.exports = router;