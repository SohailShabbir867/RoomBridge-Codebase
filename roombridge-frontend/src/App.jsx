import React, { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { useDispatch } from "react-redux";
import AppRoutes from "./routes/AppRoutes";
import { SocketProvider } from "./context/SocketContext";
import authService from "./services/authService";
import { setCredentials, setAuthChecked } from "./redux/slices/authSlice";
import FeedbackModal from "./components/common/FeedbackModal";
import useFeedbackTimer from "./hooks/useFeedbackTimer";

/*
  App component structure (outer → inner):
    Provider (main.jsx)
      └─ App
           └─ Router              ← BrowserRouter for SPA routing
                └─ SocketProvider ← reads Redux auth state; must be INSIDE Router
                     └─ AppRoutes ← all page routes

  SESSION PERSISTENCE:
  On mount, App calls getMe() which sends the httpOnly JWT cookie to the
  backend. If the cookie is valid, the backend returns the user data and
  we set the Redux auth state — keeping the user logged in across page
  refreshes. If the cookie is expired/missing, we get 401 and just mark
  authChecked = true so ProtectedRoute stops showing the loading spinner.
*/
function App() {
  const dispatch = useDispatch();
  const { showModal, dismiss } = useFeedbackTimer();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await authService.getMe();
        // getMe returns { success, message, data: { user, preference } }
        const userData = res.data?.user || res.user;
        if (userData) {
          dispatch(setCredentials({ user: userData }));
        } else {
          dispatch(setAuthChecked());
        }
      } catch {
        // 401 = not logged in (expected when no cookie exists)
        // Just mark auth as checked so the app can render
        dispatch(setAuthChecked());
      }
    };

    checkSession();
  }, [dispatch]);

  return (
    <Router>
      <SocketProvider>
        <div className="min-h-screen flex flex-col bg-background">
          <AppRoutes />
          {showModal && <FeedbackModal onClose={dismiss} />}
        </div>
      </SocketProvider>
    </Router>
  );
}

export default App;
