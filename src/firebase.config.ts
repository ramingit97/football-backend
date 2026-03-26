import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

const serviceAccountVal: ServiceAccount = {
    projectId: 'placeholder-project-id',
    clientEmail: 'placeholder@test.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\nplaceholder\n-----END PRIVATE KEY-----\n',
};

let serviceAccount = serviceAccountVal;

try {
    const key = require('../firebase-adminsdk.json');
    serviceAccount = key;
} catch {
    console.warn("Firebase Admin SDK key not found. Place 'firebase-adminsdk.json' in 'backend' root.");
}

let firebaseApp: admin.app.App;

if (admin.apps.length === 0) {
    firebaseApp = admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }, 'notifications');
} else {
    firebaseApp = admin.apps.find(a => a?.name === 'notifications') || admin.apps[0]!;
}

export { firebaseApp };
