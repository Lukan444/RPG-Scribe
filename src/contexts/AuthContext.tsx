import { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  confirmPasswordReset,
  GoogleAuthProvider,
  FacebookAuthProvider,
  TwitterAuthProvider,
  GithubAuthProvider,
  signInWithPopup,
  getRedirectResult,
  AuthProvider as FirebaseAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  updateProfile as firebaseUpdateProfile
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { logActivity } from '../utils/activityLogger';
import { ActivityAction } from '../models/ActivityLog';
import { UserService } from '../services/user.service';
import { User } from '../types/user';

// User type is imported from '../types/user'

// Define auth context type
interface AuthContextType {
  user: User | null;
  currentUser: User | null; // Alias for user for backward compatibility
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithFacebook: () => Promise<void>;
  loginWithTwitter: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginWithProvider: (provider: FirebaseAuthProvider) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (oobCode: string, password: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  updateUserProfile: (profile: { displayName?: string | null; photoURL?: string | null }) => Promise<void>;
  clearError: () => void;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create user service instance
const userService = new UserService();

// Convert Firebase user to our User type and sync with Firestore
const formatUser = async (firebaseUser: FirebaseUser): Promise<User> => {
  // List of admin email addresses
  const adminEmails = ['lukan444@gmail.com'];

  // Determine role based on email
  const role = adminEmails.includes(firebaseUser.email || '') ? 'admin' : 'user';

  // Create user object
  const user: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL,
    role, // Assign role based on email
    providerId: firebaseUser.providerData[0]?.providerId || 'unknown',
    emailVerified: firebaseUser.emailVerified
  };

  // Sync with Firestore
  try {
    return await userService.createOrUpdateUser(user);
  } catch (error) {
    console.error('Error syncing user with Firestore:', error);
    return user;
  }
};

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we're in development mode with demo credentials
  const isDevelopmentWithDemoCredentials = useCallback(() => {
    return process.env.NODE_ENV === 'development' &&
           (!process.env.REACT_APP_FIREBASE_API_KEY ||
            process.env.REACT_APP_FIREBASE_API_KEY === 'your-api-key' ||
            process.env.REACT_APP_FIREBASE_API_KEY === 'demo-api-key');
  }, []); // Empty dependency array as it doesn't depend on other hooks or props from AuthProvider

  // Listen for auth state changes
  useEffect(() => {
    // If we're in development with demo credentials, don't set up Firebase auth listeners
    if (isDevelopmentWithDemoCredentials()) {
      console.log('Using mock auth state in development mode');
      setLoading(false);
      return () => {}; // No cleanup needed
    }

    // Real Firebase implementation
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // User is signed in
        formatUser(firebaseUser)
          .then(formattedUser => {
            setUser(formattedUser);
            setLoading(false);
          })
          .catch(err => { // Changed variable name
            console.error('Error formatting user:', err);
            setError((err as Error).message || 'Error formatting user'); // Provide a fallback message
            setLoading(false);
          });
      } else {
        // User is signed out
        setUser(null);
        setLoading(false);
      }
    });

    // Check for redirect result
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) {
          try {
            const formattedUser = await formatUser(result.user);
            setUser(formattedUser);
          } catch (err) { // Changed variable name
            console.error('Error formatting redirect user:', err);
            setError((err as Error).message || 'Error formatting redirect user'); // Provide a fallback message
          }
        }
      })
      .catch((err) => { // Changed variable name
        // Only log real errors, not the expected ones in development mode
        if (!isDevelopmentWithDemoCredentials()) {
          console.error('Redirect sign-in error:', err);
          setError(err.message);
        }
      });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [isDevelopmentWithDemoCredentials]); // isDevelopmentWithDemoCredentials is defined above

  // Mock user for development
  const createMockUser = useCallback((email: string, name?: string): User => {
    const adminEmails = ['lukan444@gmail.com'];
    const role = adminEmails.includes(email) ? 'admin' : 'user';
    return {
      id: '1',
      email: email,
      name: name || email.split('@')[0],
      photoURL: null,
      role,
      providerId: 'password',
      emailVerified: false
    };
  }, []);

  // Login with email/password
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // If we're in development with demo credentials, use mock implementation
      if (isDevelopmentWithDemoCredentials()) {
        console.log('Using mock login in development mode');
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (email && password) {
          const mockUser = createMockUser(email);
          setUser(mockUser);
        } else {
          throw new Error('Invalid credentials');
        }
      } else {
        // Real Firebase implementation
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const formattedUser = await formatUser(userCredential.user);
        setUser(formattedUser);

        // Log the activity
        logActivity(ActivityAction.LOGIN, 'User logged in with email');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isDevelopmentWithDemoCredentials, createMockUser, setUser, setLoading, setError]);

  // Register with email/password
  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // If we're in development with demo credentials, use mock implementation
      if (isDevelopmentWithDemoCredentials()) {
        console.log('Using mock registration in development mode');
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (name && email && password) {
          const mockUser = createMockUser(email, name);
          setUser(mockUser);
        } else {
          throw new Error('Invalid registration data');
        }
      } else {
        // Real Firebase implementation
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update profile with display name
        await firebaseUpdateProfile(userCredential.user, {
          displayName: name
        });

        const formattedUser = await formatUser(userCredential.user);
        setUser(formattedUser);

        // Log the activity
        logActivity(ActivityAction.REGISTER, 'User registered with email');
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isDevelopmentWithDemoCredentials, createMockUser, setUser, setLoading, setError]);

  // Generic social login function
  const loginWithProvider = useCallback(async (provider: FirebaseAuthProvider) => {
    try {
      setLoading(true);
      setError(null);

      // If we're in development with demo credentials, use mock implementation
      if (isDevelopmentWithDemoCredentials()) {
        console.log('Using mock social login in development mode');
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Create a mock user based on the provider
        let providerName = 'unknown';
        if (provider instanceof GoogleAuthProvider) providerName = 'google.com';
        else if (provider instanceof FacebookAuthProvider) providerName = 'facebook.com';
        else if (provider instanceof TwitterAuthProvider) providerName = 'twitter.com';
        else if (provider instanceof GithubAuthProvider) providerName = 'github.com';

        // For testing, we'll use a specific email for Google login
        const mockEmail = provider instanceof GoogleAuthProvider
          ? 'lukan444@gmail.com'
          : `user@${providerName.split('.')[0]}.com`;

        // List of admin email addresses
        const adminEmails = ['lukan444@gmail.com'];

        // Determine role based on email
        const role = adminEmails.includes(mockEmail) ? 'admin' : 'user';

        const mockUser: User = {
          id: '1',
          email: mockEmail,
          name: provider instanceof GoogleAuthProvider
            ? 'Lukan'
            : `${providerName.split('.')[0].charAt(0).toUpperCase() + providerName.split('.')[0].slice(1)} User`,
          photoURL: null,
          role,
          providerId: providerName,
          emailVerified: true // Social logins are typically pre-verified
        };

        setUser(mockUser);
      } else {
        // Real Firebase implementation
        // You can use either popup or redirect based on your preference
        const userCredential = await signInWithPopup(auth, provider);
        const formattedUser = await formatUser(userCredential.user);
        setUser(formattedUser);

        // Determine provider name for logging
        let providerName = 'unknown';
        if (provider instanceof GoogleAuthProvider) providerName = 'Google';
        else if (provider instanceof FacebookAuthProvider) providerName = 'Facebook';
        else if (provider instanceof TwitterAuthProvider) providerName = 'Twitter';
        else if (provider instanceof GithubAuthProvider) providerName = 'GitHub';

        // Log the activity
        logActivity(ActivityAction.SOCIAL_LOGIN, `User logged in with ${providerName}`);
      }
    } catch (err: any) {
      console.error('Social login failed:', err);
      setError(err.message || 'Social login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isDevelopmentWithDemoCredentials, setUser, setLoading, setError]);

  // Login with Google
  const loginWithGoogle = useCallback(async () => {
    const provider = new GoogleAuthProvider();
    return loginWithProvider(provider);
  }, [loginWithProvider]);

  // Login with Facebook
  const loginWithFacebook = useCallback(async () => {
    const provider = new FacebookAuthProvider();
    return loginWithProvider(provider);
  }, [loginWithProvider]);

  // Login with Twitter
  const loginWithTwitter = useCallback(async () => {
    const provider = new TwitterAuthProvider();
    return loginWithProvider(provider);
  }, [loginWithProvider]);

  // Login with GitHub
  const loginWithGithub = useCallback(async () => {
    const provider = new GithubAuthProvider();
    return loginWithProvider(provider);
  }, [loginWithProvider]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setLoading(true);

      // If we're in development with demo credentials, use mock implementation
      if (isDevelopmentWithDemoCredentials()) {
        console.log('Using mock logout in development mode');
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        setUser(null);
      } else {
        // Real Firebase implementation
        await signOut(auth);

        // Log the activity before clearing the user
        logActivity(ActivityAction.LOGOUT, 'User logged out');

        setUser(null);
      }
    } catch (err: any) {
      console.error('Logout failed:', err);
      setError(err.message || 'Logout failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isDevelopmentWithDemoCredentials, setUser, setLoading, setError]);

  // Forgot password function
  const forgotPassword = useCallback(async (email: string) => {
    try {
      setLoading(true);
      setError(null);

      // If we're in development with demo credentials, use mock implementation
      if (isDevelopmentWithDemoCredentials()) {
        console.log('Using mock forgot password in development mode');
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Password reset email would be sent to ${email}`);
      } else {
        // Real Firebase implementation
        await sendPasswordResetEmail(auth, email);
      }
    } catch (err: any) {
      console.error('Forgot password failed:', err);
      setError(err.message || 'Forgot password failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isDevelopmentWithDemoCredentials, setLoading, setError]);

  // Reset password function
  const resetPassword = useCallback(async (oobCode: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // If we're in development with demo credentials, use mock implementation
      if (isDevelopmentWithDemoCredentials()) {
        console.log('Using mock reset password in development mode');
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log(`Password would be reset with code ${oobCode}`);
      } else {
        // Real Firebase implementation
        await confirmPasswordReset(auth, oobCode, password);
      }
    } catch (err: any) {
      console.error('Reset password failed:', err);
      setError(err.message || 'Reset password failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isDevelopmentWithDemoCredentials, setLoading, setError]);

  // Email verification function
  const verifyEmail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // If we're in development with demo credentials, use mock implementation
      if (isDevelopmentWithDemoCredentials()) {
        console.log('Using mock email verification in development mode');
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Verification email would be sent');
      } else {
        // Real Firebase implementation
        if (auth.currentUser) {
          await sendEmailVerification(auth.currentUser);

          // Log the activity
          logActivity(ActivityAction.EMAIL_VERIFICATION_REQUESTED, 'User requested email verification');
        } else {
          throw new Error('No user is currently signed in');
        }
      }
    } catch (err: any) {
      console.error('Email verification failed:', err);
      setError(err.message || 'Email verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isDevelopmentWithDemoCredentials, setLoading, setError]);

  // Update user profile function
  const updateUserProfile = useCallback(async (profile: { displayName?: string | null; photoURL?: string | null }) => {
    try {
      setLoading(true);
      setError(null);

      // If we're in development with demo credentials, use mock implementation
      if (isDevelopmentWithDemoCredentials()) {
        console.log('Using mock profile update in development mode');
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (user) {
          const updatedUser = {
            ...user,
            name: profile.displayName !== undefined ? profile.displayName : user.name,
            photoURL: profile.photoURL !== undefined ? profile.photoURL : user.photoURL
          };
          setUser(updatedUser);
        }
      } else {
        // Real Firebase implementation
        if (auth.currentUser) {
          await firebaseUpdateProfile(auth.currentUser, {
            displayName: profile.displayName,
            photoURL: profile.photoURL
          });

          // Update user in Firestore and local state
          if (user) {
            // Create updated user object
            const updatedUser = {
              ...user,
              name: profile.displayName !== undefined ? profile.displayName : user.name,
              photoURL: profile.photoURL !== undefined ? profile.photoURL : user.photoURL
            };

            // Update user in Firestore
            const syncedUser = await userService.createOrUpdateUser(updatedUser);
            setUser(syncedUser);

            // Log the activity
            const changes = [];
            if (profile.displayName !== undefined) changes.push('display name');
            if (profile.photoURL !== undefined) changes.push('profile picture');
            logActivity(ActivityAction.PROFILE_UPDATE, `User updated ${changes.join(' and ')}`);
          }
        } else {
          throw new Error('No user is currently signed in');
        }
      }
    } catch (err: any) {
      console.error('Profile update failed:', err);
      setError(err.message || 'Profile update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isDevelopmentWithDemoCredentials, user, setUser, setLoading, setError, userService]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  // Create context value
  const value = useMemo(() => ({
    user,
    currentUser: user, // Alias for backward compatibility
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    loginWithFacebook,
    loginWithTwitter,
    loginWithGithub,
    loginWithProvider,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    updateUserProfile,
    clearError,
  }), [
    user, loading, error, login, register, loginWithGoogle, loginWithFacebook,
    loginWithTwitter, loginWithGithub, loginWithProvider, logout, forgotPassword,
    resetPassword, verifyEmail, updateUserProfile, clearError
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
