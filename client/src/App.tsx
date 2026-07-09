import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import AuthLayout from "@/components/layout/AuthLayout";
import Dashboard from "@/pages/Dashboard";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Upload from "@/pages/Upload";
import Decisions from "@/pages/Decisions";
import Chat from "@/pages/Chat";
import Landing from "@/pages/Landing";
import Documentation from "@/pages/Documentation";
import Integrations from "@/pages/Integrations";

function App() {
  return (
    <Router>
      <div className="noise-bg" />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/docs" element={<Documentation />} />
        
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/decisions" element={<Decisions />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/integrations" element={<Integrations />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
