import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// Trigger Vercel Build

// Auth
import Login from "./pages/Auth/Login";
import UstazRegister from "./pages/Auth/UstazRegister";

// Admin
import AdminDashboard from "./pages/Admin/AdminDashboard";
import RegisterStudent from "./pages/Admin/RegisterStudent";
import AllStudents from "./pages/Admin/AllStudents";
import UnassignedStudents from "./pages/Admin/UnassignedStudents";
import AdminSettings from "./pages/Admin/AdminSettings";
import AdminLayout from "./components/Layout/AdminLayout";

// Ustaz
import UstazDashboard from "./pages/Ustaz/UstazDashboard";
import AttendancePage from "./pages/Ustaz/AttendancePage";
import WeeklyAbsentees from "./pages/Ustaz/WeeklyAbsentees";
import UstazSettings from "./pages/Ustaz/UstazSettings";
import UstazManageStudent from "./pages/Ustaz/UstazManageStudent";
import UstazLayout from "./components/Layout/UstazLayout";

// Common
import Exams from "./pages/Common/Exams";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/ustaz-register" element={<UstazRegister />} />

        {/* Admin Routes with Layout */}
        <Route
          path="/admin"
          element={
            <AdminLayout>
              <AdminDashboard />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/register-student"
          element={
            <AdminLayout>
              <RegisterStudent />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/students"
          element={
            <AdminLayout>
              <AllStudents />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/unassigned-students"
          element={
            <AdminLayout>
              <UnassignedStudents />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/exams"
          element={
            <AdminLayout>
              <Exams />
            </AdminLayout>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminLayout>
              <AdminSettings />
            </AdminLayout>
          }
        />

        {/* Add more admin routes here later */}

        {/* Ustaz Routes with Layout */}
        <Route
          path="/ustaz"
          element={
            <UstazLayout>
              <UstazDashboard />
            </UstazLayout>
          }
        />
        <Route
          path="/ustaz/weekly-absentees"
          element={
            <UstazLayout>
              <WeeklyAbsentees />
            </UstazLayout>
          }
        />
        <Route
          path="/ustaz/attendance"
          element={
            <UstazLayout>
              <AttendancePage />
            </UstazLayout>
          }
        />
        <Route
          path="/ustaz/exams"
          element={
            <UstazLayout>
              <Exams />
            </UstazLayout>
          }
        />
        <Route
          path="/ustaz/settings"
          element={
            <UstazLayout>
              <UstazSettings />
            </UstazLayout>
          }
        />
        <Route
          path="/ustaz/manage-students"
          element={
            <UstazLayout>
              <UstazManageStudent />
            </UstazLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
