import React, { useEffect, useState } from "react";
import { useAuthContext } from "@asgardeo/auth-react";

export default function HomePage() {
  const { signOut, getBasicUserInfo, state } = useAuthContext();
  const [user, setUser] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    getBasicUserInfo().then((info) => {
      setUser(info);
    }).catch(console.error);
  }, []); // eslint-disable-line

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (err) {
      console.error("Logout error:", err);
      setIsSigningOut(false);
    }
  };

  const displayName =
    user?.displayName ||
    (user?.givenName && user?.familyName ? `${user.givenName} ${user.familyName}` : null) ||
    user?.username ||
    "User";

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="page-center">
      <div className="card card-wide">
        {/* Header */}
        <div className="home-header">
          <div className="avatar">{initials}</div>
          <div>
            <h1 className="title" style={{ marginBottom: 4 }}>Hello, {displayName}!</h1>
            <p className="subtitle" style={{ marginTop: 0 }}>You're successfully signed in</p>
          </div>
        </div>

        <div className="divider" />

        {/* User info */}
        {user && (
          <div className="info-grid">
            {user.email && (
              <InfoRow icon="✉️" label="Email" value={user.email} />
            )}
            {user.username && (
              <InfoRow icon="👤" label="Username" value={user.username} />
            )}
            {user.givenName && (
              <InfoRow icon="🏷️" label="First Name" value={user.givenName} />
            )}
            {user.familyName && (
              <InfoRow icon="🏷️" label="Last Name" value={user.familyName} />
            )}
            {user.sub && (
              <InfoRow icon="🔑" label="Subject (sub)" value={user.sub} mono />
            )}
          </div>
        )}

        <div className="divider" />

        {/* Token info note */}
        <div className="info-box">
          <strong>✅ OIDC Authentication Active</strong>
          <p>Your session is secured with a JWT access token issued by WSO2 Identity Server.</p>
        </div>

        <button
          className="btn btn-danger"
          onClick={handleLogout}
          disabled={isSigningOut}
        >
          {isSigningOut ? (
            <span className="btn-loading"><span className="spinner-sm" /> Signing out…</span>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: 8}}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign Out
            </>
          )}
        </button>
      </div>

      <p className="footer-note">Secured by WSO2 Identity Server 7.2.0</p>
    </div>
  );
}

function InfoRow({ icon, label, value, mono }) {
  return (
    <div className="info-row">
      <span className="info-icon">{icon}</span>
      <div>
        <div className="info-label">{label}</div>
        <div className={`info-value ${mono ? "mono" : ""}`}>{value}</div>
      </div>
    </div>
  );
}
