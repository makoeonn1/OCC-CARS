import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import StudentDashboard from "./pages/student-dashboard.jsx";
import StudentActivity from "./pages/student-activity.jsx";
import StudentReg from "./pages/student-reg.jsx";
import StudentConsultation from "./pages/student-consultation.jsx";
import StudentNotif from "./pages/student-notif.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/student-dashboard" element={<StudentDashboard />} />
      <Route path="/student-activity" element={<StudentActivity />} />
      <Route path="/student-reg" element={<StudentReg />} />
      <Route path="/student-consultation" element={<StudentConsultation />} />
      <Route path="/student-notif" element={<StudentNotif />} />
      {/* the login page still sends students to /dashboard, so forward it */}
      <Route path="/dashboard" element={<Navigate to="/student-dashboard" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}