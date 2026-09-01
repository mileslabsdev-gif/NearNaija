import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyCTbx0XYPMZ4ZiQ58Sj8jS3zkxeoJt-mOc',
  authDomain: 'temporary-quick-gold-9tdz3n4.vercel.app',
  projectId: 'nearnaija',
  storageBucket: 'nearnaija.firebasestorage.app',
  messagingSenderId: '265750470174',
  appId: '1:265750470174:web:0578fefb9af54bf54cd80f',
  measurementId: 'G-X9XXPTW1LS',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

isSupported()
  .then((ok) => {
    if (ok) getAnalytics(app);
  })
  .catch(() => {});
