import React, { useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";

const WSO2_BASE = (window._env_ && window._env_.WSO2_BASE_URL) || "https://localhost:9443";
const SELF_REGISTER_URL = `${WSO2_BASE}/accountrecoveryendpoint/register.do`;

export default function LandingPage() {
  const { signIn, state } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn();
    } catch (err) {
      console.error("Login error:", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="page-center">
      <div className="card">
        {/* Logo / Icon */}
        <div className="logo-circle">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        </div>

        <h1 className="title">Welcome Back</h1>
        <p className="subtitle">Sign in to your account or create a new one</p>

        <div className="divider" />

        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={isLoading || state.isLoading}
        >
          {isLoading ? (
            <span className="btn-loading">
              <span className="spinner-sm" /> Redirecting…
            </span>
          ) : (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
              </svg>
              Sign In
            </>
          )}
        </button>

        <div className="or-separator">
          <span>or</span>
        </div>

        <a
          href={SELF_REGISTER_URL}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          Create an Account
        </a>

        <p className="register-note">
          Registration opens the WSO2 Identity Server self-registration portal.
        </p>
      </div>

      <p className="footer-note">
        Secured by WSO2 Identity Server 7.2.0
      </p>
    </div>
  );
}
