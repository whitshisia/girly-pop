import { useState, useEffect, createContext, useContext } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInAnonymously
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Create Auth Context
const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            isAnonymous: firebaseUser.isAnonymous,
            ...userData
          });
        } catch (error) {
          console.error('Error loading user data:', error);
          setUser({
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            isAnonymous: firebaseUser.isAnonymous
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password, userData) => {
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      
      if (userData.name) {
        await updateProfile(firebaseUser, { displayName: userData.name });
      }
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        ...userData,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      return firebaseUser;
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  };

  const login = async (email, password) => {
    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last login
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: new Date()
      }, { merge: true });
      
      return firebaseUser;
    } catch (error) {
      console.error('Error logging in:', error);
      throw error;
    }
  };

  const loginAnonymously = async (displayName = 'Anonymous User') => {
    try {
      const { user: firebaseUser } = await signInAnonymously(auth);
      
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: displayName,
        isAnonymous: true,
        createdAt: new Date(),
        lastLogin: new Date()
      });
      
      return firebaseUser;
    } catch (error) {
      console.error('Error with anonymous login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signup,
    login,
    loginAnonymously,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};