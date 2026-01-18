// ABOUTME: Context for tracking the user's email across the app
// ABOUTME: Persists email in localStorage after joining a study group

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

const STORAGE_KEY = "cu_study_groups_user_email";

interface UserEmailContextType {
  userEmail: string | null;
  setUserEmail: (email: string) => void;
  clearUserEmail: () => void;
}

const UserEmailContext = createContext<UserEmailContextType | null>(null);

interface UserEmailProviderProps {
  children: ReactNode;
}

export function UserEmailProvider({ children }: UserEmailProviderProps) {
  const [userEmail, setUserEmailState] = useState<string | null>(() => {
    // Initialize from localStorage
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY);
    }
    return null;
  });

  // Sync with localStorage
  useEffect(() => {
    if (userEmail) {
      localStorage.setItem(STORAGE_KEY, userEmail);
    }
  }, [userEmail]);

  const setUserEmail = useCallback((email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    setUserEmailState(normalizedEmail);
    localStorage.setItem(STORAGE_KEY, normalizedEmail);
  }, []);

  const clearUserEmail = useCallback(() => {
    setUserEmailState(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  return (
    <UserEmailContext.Provider
      value={{ userEmail, setUserEmail, clearUserEmail }}
    >
      {children}
    </UserEmailContext.Provider>
  );
}

export function useUserEmail(): UserEmailContextType {
  const context = useContext(UserEmailContext);
  if (!context) {
    throw new Error("useUserEmail must be used within a UserEmailProvider");
  }
  return context;
}
