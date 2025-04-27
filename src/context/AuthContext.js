import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { auth } from '../services/firebase.js';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult(true);
          console.log("User claims:", idTokenResult.claims);
          const isAdmin = idTokenResult.claims.admin === true;

          if (isAdmin) {
            console.log("User IS an admin.");
          } else {
            console.log("User is NOT an admin.");
          }

          const userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            isAdmin: isAdmin
          };
          setCurrentUser(userData);
          setError(null);

        } catch (error) {
          console.error("Error getting ID token result or processing user:", error);
          setCurrentUser(null);
          setError('Failed to process user data.');
        }
      } else {
        console.log("No user logged in.");
        setCurrentUser(null);
        setError(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const login = async (email, password) => {
    try {
      setError(null);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    return signOut(auth);
  };

  const resetPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const updateProfile = async (data) => {
    try {
      setError(null);
      if (auth.currentUser) {
        await firebaseUpdateProfile(auth.currentUser, data);
        setCurrentUser({ ...auth.currentUser });
      }
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 