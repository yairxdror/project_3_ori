import type { User } from "../types/models";
import { httpClient } from "./httpClient";

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
}

// POST /api/user/login
export async function login(data: LoginRequest): Promise<AuthResponse> {
    const res = await httpClient.post<AuthResponse>("/user/login", data);
    return res.data;
}

// POST /api/user/register
export async function register(data: RegisterRequest): Promise<AuthResponse> {
    const res = await httpClient.post<AuthResponse>("/user/register", data);
    return res.data;
}

// GET /api/user/check email
export async function checkEmailAvailability(
    email: string
): Promise<{ isFree: boolean }> {
    const res = await httpClient.get<{ isFree: boolean }>("/user/check-email", {
        params: { email },
    });
    return res.data;
}

// GET /api/user/me
export async function getCurrentUser(): Promise<User> {
    const res = await httpClient.get<User>("/user/me");
    return res.data;
}