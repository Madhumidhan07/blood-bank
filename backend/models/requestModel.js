const { db } = require('../config/firebase');

const requestsCol = db.collection('requests');
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const URGENCY_LEVELS = ['Normal', 'High', 'Critical'];

function toRequest(doc) {
  if (!doc || !doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

async function create(data) {
  const now = new Date().toISOString();
  const ref = await requestsCol.add({ ...data, fulfilled: false, createdAt: now, updatedAt: now });
  return ref.get();
}

async function findById(id) {
  if (!id || typeof id !== 'string') return null;
  const doc = await requestsCol.doc(id).get();
  return doc.exists ? doc : null;
}

async function findActive({ blood_group } = {}) {
  const snap = await requestsCol.get();
  let docs = snap.docs.filter(d => d.data().fulfilled !== true);
  if (blood_group) docs = docs.filter(d => d.data().blood_group === blood_group);
  return docs.sort((a, b) => new Date(b.data().createdAt || 0) - new Date(a.data().createdAt || 0));
}

async function findByUser(user_id) {
  const snap = await requestsCol.where('user_id', '==', user_id).get();
  return snap.docs.sort((a, b) => new Date(b.data().createdAt || 0) - new Date(a.data().createdAt || 0));
}

async function deleteById(id) { await requestsCol.doc(id).delete(); }

async function markFulfilled(id) {
  const ref = requestsCol.doc(id);
  await ref.update({ fulfilled: true, updatedAt: new Date().toISOString() });
  return ref.get();
}

module.exports = {
  requestsCol, BLOOD_GROUPS, URGENCY_LEVELS, create, findById,
  findActive, findByUser, deleteById, markFulfilled, toRequest,
};
