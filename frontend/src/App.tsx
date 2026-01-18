// ABOUTME: Main application component with routing
// ABOUTME: Sets up routes for home and dashboard pages

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { UserEmailProvider } from "./contexts/UserEmailContext";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import { DashboardPage } from "./pages/DashboardPage";
import { GroupPage } from "./pages/GroupPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <UserEmailProvider>
          <Header />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/group/:groupId" element={<GroupPage />} />
            </Routes>
          </main>
        </UserEmailProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
