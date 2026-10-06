const { db } = require('../config/firebase');

const usersCol = db.collection('users');
const ALLOWED_BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

function toUserResponse(doc) {
  if (!doc || !doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

function toPublicUser(doc) {
  const user = toUserResponse(doc);
  if (!user) return null;
  const { password, ...rest } = user;
  return rest;
}

async function findByEmail(email) {
  const snap = await usersCol.where('email', '==', email.toLowerCase()).limit(1).get();
  return snap.empty ? null : snap.docs[0];
}

async function findById(id) {
  if (!id || typeof id !== 'string') return null;
  const doc = await usersCol.doc(id).get();
  return doc.exists ? doc : null;
}

async function create(data) {
  const now = new Date().toISOString();
  const ref = await usersCol.add({ ...data, available: true, createdAt: now, updatedAt: now });
  return ref.get();
}

async function updateById(id, updates) {
  const ref = usersCol.doc(id);
  await ref.update({ ...updates, updatedAt: new Date().toISOString() });
  return ref.get();
}

async function findAvailable({ blood_group, location } = {}) {
  // Fetching all users also keeps older records (created before `available` existed)
  // searchable. Availability is treated as true unless explicitly false.
  const snap = await usersCol.get();
  let docs = snap.docs.filter(d => d.data().available !== false);

  if (blood_group) docs = docs.filter(d => d.data().blood_group === blood_group);
  if (location) {
    const needle = location.trim().toLowerCase();
    docs = docs.filter(d => String(d.data().location || '').toLowerCase().includes(needle));
  }
  return docs;
}

module.exports = {
  usersCol, ALLOWED_BLOOD_GROUPS, findByEmail, findById,
  create, updateById, findAvailable, toUserResponse, toPublicUser,
};
