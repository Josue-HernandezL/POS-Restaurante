const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = require('../../serviceAccountKey.json');

// Inicializar Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('✅ Firebase inicializado correctamente');
console.log(`📁 Proyecto: ${serviceAccount.project_id}`);

// Obtener Firestore
const db = admin.firestore();

module.exports = {
  admin,
  db,
};
