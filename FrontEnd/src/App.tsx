import React from "react";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Home from "./Home/Home";
import "./App.css";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ToastProvider>
        <Home />
      </ToastProvider>
    </AuthProvider>
  );
};

export default App;
