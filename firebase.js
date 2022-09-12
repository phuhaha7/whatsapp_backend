import admin from 'firebase-admin';
import { initializeApp} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const firebaseApp = initializeApp({
    credential: admin.credential.cert(process.env.GOOGLE_APPLICATION_CREDENTIALS)
});

const auth = getAuth(firebaseApp);

export default auth;