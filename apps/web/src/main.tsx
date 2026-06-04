import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import App from "./App";
import { AgentChatPage } from "./pages/AgentChatPage";
import { AgentsAllowedPage } from "./pages/AgentsAllowedPage";
import { AgentsPage } from "./pages/AgentsPage";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";
import { McpsPage } from "./pages/McpsPage";
import { RagDataStoresPage } from "./pages/RagDataStoresPage";
import { SkillsPage } from "./pages/SkillsPage";
import { ToolsPage } from "./pages/ToolsPage";
import { UsersPage } from "./pages/UsersPage";
import { loadSession } from "./auth";
import "./styles.css";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const session = loadSession();
  return session ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const session = loadSession();
  if (!session) return <Navigate to="/login" replace />;
  if (session.user.rule !== "admin") return <Navigate to="/" replace />;
  return children;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "agents",
        element: (
          <AdminRoute>
            <AgentsPage />
          </AdminRoute>
        ),
      },
      {
        path: "agents-allowed",
        element: (
          <ProtectedRoute>
            <AgentsAllowedPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "skills",
        element: (
          <AdminRoute>
            <SkillsPage />
          </AdminRoute>
        ),
      },
      {
        path: "tools",
        element: (
          <AdminRoute>
            <ToolsPage />
          </AdminRoute>
        ),
      },
      {
        path: "mcps",
        element: (
          <AdminRoute>
            <McpsPage />
          </AdminRoute>
        ),
      },
      {
        path: "rag-data-stores",
        element: (
          <AdminRoute>
            <RagDataStoresPage />
          </AdminRoute>
        ),
      },
      {
        path: "users",
        element: (
          <AdminRoute>
            <UsersPage />
          </AdminRoute>
        ),
      },
      {
        path: "chats/agent/:agentSlug",
        element: (
          <ProtectedRoute>
            <AgentChatPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
