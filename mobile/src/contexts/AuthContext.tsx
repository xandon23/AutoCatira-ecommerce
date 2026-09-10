import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { STORAGE_KEYS } from "../constants/storage";

import * as SecureStore from "expo-secure-store";

import api from "../services/api";
import { IUser, LoginResponse } from "../types";

interface AuthContextData {
  user: IUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoredSession() {
      try {
        const token = await SecureStore.getItemAsync(STORAGE_KEYS.TOKEN);

        const storedUser = await SecureStore.getItemAsync(STORAGE_KEYS.USER);

        if (token && storedUser) {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;

          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Erro ao recuperar sessão:", error);
      } finally {
        setLoading(false);
      }
    }

    loadStoredSession();
  }, []);

  async function signIn(email: string, password: string) {
    const response = await api.post<LoginResponse>("/auth/login", {
      email,
      password,
    });

    const { token, user } = response.data;

    await SecureStore.setItemAsync(STORAGE_KEYS.TOKEN, token);

    await SecureStore.setItemAsync(STORAGE_KEYS.USER, JSON.stringify(user));

    api.defaults.headers.common.Authorization = `Bearer ${token}`;

    setUser(user);
  }

  async function signOut() {
    await SecureStore.deleteItemAsync(STORAGE_KEYS.TOKEN);
    await SecureStore.deleteItemAsync(STORAGE_KEYS.USER);

    delete api.defaults.headers.common.Authorization;

    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
