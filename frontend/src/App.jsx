import { Navigate, Route, Routes } from "react-router-dom";
import { useEffect } from "react";
import { Toaster } from "react-hot-toast";
import { Loader } from "lucide-react";

import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import WatchPage from "./pages/WatchPage";
import SearchPage from "./pages/SearchPage";
import SearchHistoryPage from "./pages/SearchHistoryPage";
import NotFoundPage from "./pages/404";
import VirtualTheatre from "./pages/VirtualTheatre";
import JoinVirtualTheatre from "./pages/JoinVirtualTheatre";

import { useAuthStore } from "./store/authUser";

function App() {
  const { user, isCheckingAuth, authCheck } = useAuthStore();

  useEffect(() => {
    authCheck(); // Check user authentication status on app load
  }, [authCheck]);

  if (isCheckingAuth) {
    // Display a loader while authentication check is in progress
    return (
      <div className="h-screen bg-black flex justify-center items-center">
        <Loader className="animate-spin text-red-600" size={40} />
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <SignUpPage /> : <Navigate to="/" />} />

        {/* Protected Routes */}
        <Route path="/watch/:id" element={user ? <WatchPage /> : <Navigate to="/login" />} />
        <Route path="/search" element={user ? <SearchPage /> : <Navigate to="/login" />} />
        <Route path="/history" element={user ? <SearchHistoryPage /> : <Navigate to="/login" />} />
        <Route path="/virtual-theatre" element={user ? <VirtualTheatre /> : <Navigate to="/login" />} />

        <Route path="/virtual-theatre/:roomId" element={<VirtualTheatre />} />

        {/* New Join Virtual Theatre Route */}
        <Route
          path="/join-virtual-theatre"
          element={user ? <JoinVirtualTheatre /> : <Navigate to="/login" />}
        />

        {/* Fallback Route for 404 Not Found */}
        <Route path="/*" element={<NotFoundPage />} />
      </Routes>

      {/* Global Toaster for Notifications */}
      <Toaster position="top-right" />
    </>
  );
}

export default App;
