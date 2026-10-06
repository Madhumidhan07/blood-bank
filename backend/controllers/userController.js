const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const normalize = value => typeof value === 'string' ? value.trim() : '';

function validateRegister({ name, email, phone, password, blood_group, location }) {
  const errors = [];
  name = normalize(name); email = normalize(email).toLowerCase(); phone = normalize(phone); location = normalize(location);
  if (name.length < 2 || name.length > 100) errors.push('Name must be 2–100 characters.');
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 160) errors.push('Valid email is required.');
  if (!/^[0-9]{10}$/.test(phone)) errors.push('Phone must be a 10-digit number.');
  if (!password || password.length < 6 || password.length > 72) errors.push('Password must be 6–72 characters.');
  if (!UserModel.ALLOWED_BLOOD_GROUPS.includes(blood_group)) errors.push('Valid blood group is required.');
  if (location.length < 2 || location.length > 100) errors.push('City/location must be 2–100 characters.');
  return errors;
}

function signToken(user) {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    const err = new Error('JWT_SECRET is missing or too short.'); err.status = 500; throw err;
  }
  return jwt.sign({ id: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
}

function publicAuthUser(user) {
  return { id: user.id, name: user.name, email: user.email, blood_group: user.blood_group, location: user.location };
}

exports.registerUser = async (req, res, next) => {
  try {
    const body = req.body || {};
    const name = normalize(body.name), email = normalize(body.email).toLowerCase();
    const phone = normalize(body.phone), location = normalize(body.location), notes = normalize(body.notes);
    const errors = validateRegister({ ...body, name, email, phone, location });
    if (errors.length) return res.status(400).json({ errors });

    if (await UserModel.findByEmail(email)) return res.status(409).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(body.password, 10);
    const userDoc = await UserModel.create({ name, email, phone, password: hashed, blood_group: body.blood_group, location, notes });
    const user = UserModel.toUserResponse(userDoc);
    res.status(201).json({ token: signToken(user), user: publicAuthUser(user) });
  } catch (err) { next(err); }
};

exports.loginUser = async (req, res, next) => {
  try {
    const email = normalize(req.body?.email).toLowerCase();
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    const userDoc = await UserModel.findByEmail(email);
    if (!userDoc) return res.status(401).json({ error: 'Invalid email or password.' });
    const user = UserModel.toUserResponse(userDoc);
    const valid = await bcrypt.compare(password, user.password || '');
    if (!valid) return res.status(401).json({ error: 'Invalid email or password.' });

    res.json({ token: signToken(user), user: publicAuthUser(user) });
  } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
  try {
    const userDoc = await UserModel.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ error: 'User not found.' });
    res.json(UserModel.toPublicUser(userDoc));
  } catch (err) { next(err); }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const body = req.body || {}, updates = {}, errors = [];
    if (body.name !== undefined) { const v = normalize(body.name); if (v.length < 2 || v.length > 100) errors.push('Name must be 2–100 characters.'); else updates.name = v; }
    if (body.phone !== undefined) { const v = normalize(body.phone); if (!/^[0-9]{10}$/.test(v)) errors.push('Invalid phone number.'); else updates.phone = v; }
    if (body.location !== undefined) { const v = normalize(body.location); if (v.length < 2 || v.length > 100) errors.push('City/location must be 2–100 characters.'); else updates.location = v; }
    if (body.notes !== undefined) { const v = normalize(body.notes); if (v.length > 300) errors.push('Notes must be 300 characters or fewer.'); else updates.notes = v; }
    if (body.blood_group !== undefined) { if (!UserModel.ALLOWED_BLOOD_GROUPS.includes(body.blood_group)) errors.push('Invalid blood group.'); else updates.blood_group = body.blood_group; }
    if (errors.length) return res.status(400).json({ errors });
    if (!Object.keys(updates).length) return res.status(400).json({ error: 'No profile changes supplied.' });

    const updatedDoc = await UserModel.updateById(req.user.id, updates);
    res.json(UserModel.toPublicUser(updatedDoc));
  } catch (err) { next(err); }
};

exports.toggleAvailability = async (req, res, next) => {
  try {
    const userDoc = await UserModel.findById(req.user.id);
    if (!userDoc) return res.status(404).json({ error: 'User not found.' });
    const updatedDoc = await UserModel.updateById(req.user.id, { available: userDoc.data().available !== false ? false : true });
    res.json({ available: updatedDoc.data().available });
  } catch (err) { next(err); }
};

exports.getDonors = async (req, res, next) => {
  try {
    const blood_group = normalize(req.query.blood_group);
    const location = normalize(req.query.location);
    if (blood_group && !UserModel.ALLOWED_BLOOD_GROUPS.includes(blood_group)) return res.status(400).json({ error: 'Invalid blood group.' });
    const docs = await UserModel.findAvailable({ blood_group, location });
    res.json(docs.map(UserModel.toPublicUser));
  } catch (err) { next(err); }
};
