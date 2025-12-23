import axios from "axios";
import { appConfig } from "../config/appConfig";

export const httpClient = axios.create({
    baseURL: appConfig.apiBaseUrl,
    withCredentials: false,
});

httpClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("authToken");
    if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

httpClient.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);