const RequestModel = require('../models/requestModel');
const UserModel = require('../models/userModel');

const normalize = value => typeof value === 'string' ? value.trim() : '';
const isRealDate = value => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

exports.getRequests = async (req, res, next) => {
  try {
    const blood_group = normalize(req.query.blood_group);
    if (blood_group && !RequestModel.BLOOD_GROUPS.includes(blood_group)) return res.status(400).json({ error: 'Invalid blood group.' });
    const docs = await RequestModel.findActive({ blood_group });
    res.json(docs.map(RequestModel.toRequest));
  } catch (err) { next(err); }
};

exports.createRequest = async (req, res, next) => {
  try {
    const body = req.body || {};
    const patient_name = normalize(body.patient_name), hospital = normalize(body.hospital), location = normalize(body.location);
    const date_needed = normalize(body.date_needed), blood_group = normalize(body.blood_group), urgency = normalize(body.urgency);
    const errors = [];
    if (patient_name.length < 2 || patient_name.length > 100) errors.push('Patient name must be 2–100 characters.');
    if (hospital.length < 2 || hospital.length > 160) errors.push('Hospital must be 2–160 characters.');
    if (location.length < 2 || location.length > 100) errors.push('City must be 2–100 characters.');
    if (!RequestModel.BLOOD_GROUPS.includes(blood_group)) errors.push('Valid blood group is required.');
    if (!isRealDate(date_needed)) errors.push('A valid date is required.');
    if (date_needed && date_needed < new Date().toISOString().slice(0, 10)) errors.push('Date needed cannot be in the past.');
    if (urgency && !RequestModel.URGENCY_LEVELS.includes(urgency)) errors.push('Invalid urgency level.');
    if (errors.length) return res.status(400).json({ errors });

    const userDoc = await UserModel.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ error: 'User not found.' });
    const user = userDoc.data();
    const requestDoc = await RequestModel.create({
      user_id: req.user.id, patient_name, hospital, location, blood_group, date_needed,
      urgency: urgency || 'Normal', contact: { name: user.name, phone: user.phone, email: user.email },
    });
    res.status(201).json(RequestModel.toRequest(requestDoc));
  } catch (err) { next(err); }
};

exports.getMyRequests = async (req, res, next) => {
  try { res.json((await RequestModel.findByUser(req.user.id)).map(RequestModel.toRequest)); }
  catch (err) { next(err); }
};

exports.deleteRequest = async (req, res, next) => {
  try {
    const doc = await RequestModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Request not found.' });
    if (doc.data().user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized to delete this request.' });
    await RequestModel.deleteById(req.params.id);
    res.json({ message: 'Request removed.' });
  } catch (err) { next(err); }
};

exports.fulfillRequest = async (req, res, next) => {
  try {
    const doc = await RequestModel.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Request not found.' });
    if (doc.data().user_id !== req.user.id) return res.status(403).json({ error: 'Not authorized.' });
    await RequestModel.markFulfilled(req.params.id);
    res.json({ message: 'Request marked as fulfilled.' });
  } catch (err) { next(err); }
};
