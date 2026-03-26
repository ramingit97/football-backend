"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseApp = void 0;
const admin = require("firebase-admin");
const serviceAccountVal = {
    projectId: 'placeholder-project-id',
    clientEmail: 'placeholder@test.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nplaceholder\n-----END PRIVATE KEY-----\n',
};
let serviceAccount = serviceAccountVal;
try {
    const key = require('../firebase-adminsdk.json');
    serviceAccount = key;
}
catch {
    console.warn("Firebase Admin SDK key not found. Place 'firebase-adminsdk.json' in 'backend' root.");
}
let firebaseApp;
if (admin.apps.length === 0) {
    exports.firebaseApp = firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, 'notifications');
}
else {
    exports.firebaseApp = firebaseApp = admin.apps.find(a => a?.name === 'notifications') || admin.apps[0];
}
//# sourceMappingURL=firebase.config.js.map