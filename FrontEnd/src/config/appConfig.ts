export const appConfig = {
  apiBaseUrl: import.meta.env.PROD ? "/api" : "http://localhost:3030/api",
  imagesBaseUrl: import.meta.env.PROD ? "/images" : "http://localhost:3030/images",
};
