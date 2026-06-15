import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { IUser } from "../types/index";

interface AuthContextType {
  currentUser: IUser | null;
  setCurrentUser: (user: IUser | null) => void;
  handleLogin: (userData: IUser, token: string) => void;
  handleLogout: () => void;
}

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setCurrentUser(null);
  }, []);

  useEffect(() => {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (user && token) {
      try {
        const parsedUser = JSON.parse(user);
        if (parsedUser && (parsedUser.id || parsedUser._id)) {
          setCurrentUser(parsedUser);
        } else {
          handleLogout();
        }
      } catch (error) {
        handleLogout();
      }
    }
    setLoading(false);
  }, [handleLogout]);

  const handleLogin = (userData: IUser, token: string) => {
    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    setCurrentUser(userData);
  };

  return (
    <AuthContext.Provider
      value={{ currentUser, setCurrentUser, handleLogin, handleLogout }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}
