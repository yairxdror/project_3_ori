import type { User } from "../types/models";
import React, {
    createContext,
    useState,
    useEffect,
    type ReactNode,
} from "react";

import {
    login as apiLogin,
    register as apiRegister,
    getCurrentUser,
    type LoginRequest,
    type RegisterRequest,
} from "../api/authApi";

interface AuthContextValue {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    authError: string | null;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    reloadUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(
    undefined
);

interface AuthProviderProps {
    children: ReactNode;
}

function extractErrorMessage(error: any): string {
    // Try to extract an error message from the server response
    const messageFromResponse =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message;

    if (typeof messageFromResponse === "string") {
        return messageFromResponse;
    }

    return "Authentication error";
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(
        () => localStorage.getItem("authToken")
    );
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // Load user from server if a token is stored
    useEffect(() => {
        if (!token) return;

        const init = async () => {
            setIsLoading(true);
            setAuthError(null);
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);
            } catch (error) {
                console.error("Failed to load current user:", error);
                setUser(null);
                setToken(null);
                localStorage.removeItem("authToken");
            } finally {
                setIsLoading(false);
            }
        };

        init();
    }, [token]);

    // Login
    const handleLogin = async (data: LoginRequest): Promise<void> => {
        setIsLoading(true);
        setAuthError(null);

        try {
            const res = await apiLogin(data); // { token }
            localStorage.setItem("authToken", res.token);
            setToken(res.token);

            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error: any) {
            console.error("Login error:", error);
            const msg = extractErrorMessage(error);
            setAuthError(msg);
            setUser(null);
            setToken(null);
            localStorage.removeItem("authToken");
            throw error; // so the component can receive the error if it wants
        } finally {
            setIsLoading(false);
        }
    };

    // Register
    const handleRegister = async (data: RegisterRequest): Promise<void> => {
        setIsLoading(true);
        setAuthError(null);

        try {
            const res = await apiRegister(data); // { token }
            localStorage.setItem("authToken", res.token);
            setToken(res.token);

            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error: any) {
            console.error("Register error:", error);
            const msg = extractErrorMessage(error);
            setAuthError(msg);
            setUser(null);
            setToken(null);
            localStorage.removeItem("authToken");
            throw error;
        } finally {
            setIsLoading(false);
        }
    };

    // Logout
    const handleLogout = () => {
        setUser(null);
        setToken(null);
        setAuthError(null);
        localStorage.removeItem("authToken");
    };

    // Explicit reload of the current user
    const reloadUser = async (): Promise<void> => {
        if (!token) {
            setUser(null);
            return;
        }

        setIsLoading(true);
        setAuthError(null);

        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error("Reload user error:", error);
            setUser(null);
            setToken(null);
            localStorage.removeItem("authToken");
            const msg = extractErrorMessage(error);
            setAuthError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    const value: AuthContextValue = {
        user,
        token,
        isLoading,
        authError,
        login: handleLogin,
        register: handleRegister,
        logout: handleLogout,
        reloadUser,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};