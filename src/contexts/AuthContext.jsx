import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const AuthContext = createContext();

const DEFAULT_USER_DATA = {
  points: 0,
  unlockedTrees: ['sprout'],
  selectedTree: 'sprout',
  goals: [],
  tasks: [],
  routines: [],
  adhkarCounts: {}
};

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(DEFAULT_USER_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            let data = { ...DEFAULT_USER_DATA, ...docSnap.data() };
            
            // --- Auto Reset Logic ---
            const today = new Date().toDateString();
            const currentWeek = (() => {
              const d = new Date();
              d.setHours(0, 0, 0, 0);
              d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
              const week1 = new Date(d.getFullYear(), 0, 4);
              return d.getFullYear() + '-W' + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
            })();
            const currentMonth = new Date().getFullYear() + '-' + new Date().getMonth();

            let needsUpdate = false;
            let updatedFields = {};

            if (data.lastDailyReset !== today) {
              updatedFields.lastDailyReset = today;
              updatedFields.adhkarCounts = {};
              if (data.goals && Array.isArray(data.goals)) {
                updatedFields.goals = data.goals.map(g => g.category === 'daily' ? { ...g, progress: 0 } : g);
              }
              needsUpdate = true;
            }

            if (data.lastWeeklyReset !== currentWeek) {
              updatedFields.lastWeeklyReset = currentWeek;
              if (data.goals && Array.isArray(data.goals)) {
                updatedFields.goals = (updatedFields.goals || data.goals).map(g => g.category === 'weekly' ? { ...g, progress: 0 } : g);
              }
              needsUpdate = true;
            }

            if (data.lastMonthlyReset !== currentMonth) {
              updatedFields.lastMonthlyReset = currentMonth;
              if (data.goals && Array.isArray(data.goals)) {
                updatedFields.goals = (updatedFields.goals || data.goals).map(g => g.category === 'monthly' ? { ...g, progress: 0 } : g);
              }
              needsUpdate = true;
            }

            if (needsUpdate) {
              data = { ...data, ...updatedFields };
              setDoc(userDocRef, updatedFields, { merge: true });
            }
            // -----------------------

            setUserData(data);
          } else {
            setDoc(userDocRef, DEFAULT_USER_DATA, { merge: true });
            setUserData(DEFAULT_USER_DATA);
          }
          setLoading(false);
        }, (error) => {
          console.error("Firestore listener error:", error);
          setLoading(false);
        });
      } else {
        if (unsubscribeSnapshot) unsubscribeSnapshot();
        setUserData(DEFAULT_USER_DATA);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const signup = async (email, password) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    return userCredential;
  };

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = () => {
    return signInWithPopup(auth, googleProvider);
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = (email) => {
    return sendPasswordResetEmail(auth, email);
  };

  // Function to update user data both locally and in Firestore
  const updateUserData = async (newDataFields) => {
    if (!currentUser) return;
    
    // Optimistic local update
    setUserData(prev => ({ ...prev, ...newDataFields }));
    
    // Firestore update
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      // Using merge true so we don't overwrite the whole document if we only pass a partial update
      await setDoc(userDocRef, newDataFields, { merge: true });
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const value = {
    currentUser,
    userData,
    updateUserData,
    login,
    signup,
    loginWithGoogle,
    logout,
    resetPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
