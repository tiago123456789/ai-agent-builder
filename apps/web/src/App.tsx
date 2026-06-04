import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { clearSession, loadSession } from "./auth";

export default function App() {
  const navigate = useNavigate();
  const session = loadSession();

  return (
    <div className="shell">
      <header className="topbar">
        <div>
          <h1>AI Agent Builder</h1>
        </div>
        {session ? (
          <>
            <nav className="topbar-nav">
              <NavLink to="/" end className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                Chat
              </NavLink>
              {session.user.rule === "admin" ? (
                <>
                  <NavLink to="/agents" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    Agents
                  </NavLink>
                  <NavLink to="/skills" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    Skills
                  </NavLink>
                  <NavLink to="/tools" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    Tools
                  </NavLink>
                  <NavLink to="/mcps" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    MCPs
                  </NavLink>
                  <NavLink to="/rag-data-stores" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    RAG
                  </NavLink>
                  <NavLink to="/users" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                    Users
                  </NavLink>
                </>
              ) : (
                <NavLink to="/agents-allowed" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                  Allowed Agents
                </NavLink>
              )}
            </nav>
            <div className="topbar-actions">
              <div className="user-chip">
                <span>{session.user.name}</span>
                <small>{session.user.email}</small>
              </div>
              <button
                className="ghost-button"
                onClick={() => {
                  clearSession();
                  navigate("/login");
                }}
              >
                Logout
              </button>
            </div>
          </>
        ) : null}
      </header>
      <Outlet />
    </div>
  );
}
