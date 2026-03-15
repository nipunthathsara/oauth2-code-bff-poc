import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@asgardeo/auth-react";
import App from "./App";
import "./index.css";

// window._env_ is injected by nginx/entrypoint.sh at container startup.
// It contains CLIENT_ID retrieved from WSO2 IS by the init-scripts container.
const authConfig = {
  signInRedirectURL: "http://localhost/callback",
  signOutRedirectURL: "http://localhost",
  clientID: (window._env_ && window._env_.CLIENT_ID) || "MISSING_CLIENT_ID",
  baseUrl: (window._env_ && window._env_.WSO2_BASE_URL) || "https://localhost:9443",
  scope: ["openid", "profile", "email"],
  disableTrySignInSilently: true,
};

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <AuthProvider config={authConfig}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
