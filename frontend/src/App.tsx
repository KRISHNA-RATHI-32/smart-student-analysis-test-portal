import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import ChangePassword from "./pages/ChangePassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import UserManagement from "./pages/admin/UserManagement";
import BatchManagement from "./pages/admin/BatchManagement";
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import CreateTest from "./pages/teacher/CreateTest";
import TeacherResults from "./pages/teacher/TeacherResults";
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentResults from "./pages/student/StudentResults";
import StudentAnalytics from "./pages/student/StudentAnalytics";
import Leaderboard from "./pages/student/Leaderboard";
import TestEnvironment from "./pages/test/TestEnvironment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-otp" element={<VerifyOtpPage />} />

            {/* Change Password — all authenticated roles */}
            <Route path="/change-password" element={<ProtectedRoute allowedRoles={["admin", "teacher", "student"]}><ChangePassword /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={["admin"]}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={["admin"]}><UserManagement /></ProtectedRoute>} />
            <Route path="/admin/batches" element={<ProtectedRoute allowedRoles={["admin"]}><BatchManagement /></ProtectedRoute>} />

            {/* Teacher */}
            <Route path="/teacher/dashboard" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherDashboard /></ProtectedRoute>} />
            <Route path="/teacher/create-test" element={<ProtectedRoute allowedRoles={["teacher"]}><CreateTest /></ProtectedRoute>} />
            <Route path="/teacher/results" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherResults /></ProtectedRoute>} />
            <Route path="/teacher/results/:testId" element={<ProtectedRoute allowedRoles={["teacher"]}><TeacherResults /></ProtectedRoute>} />

            {/* Student */}
            <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={["student"]}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/results" element={<ProtectedRoute allowedRoles={["student"]}><StudentResults /></ProtectedRoute>} />
            <Route path="/student/analytics" element={<ProtectedRoute allowedRoles={["student"]}><StudentAnalytics /></ProtectedRoute>} />
            <Route path="/student/leaderboard" element={<ProtectedRoute allowedRoles={["student"]}><Leaderboard /></ProtectedRoute>} />
            <Route path="/test/:testId" element={<ProtectedRoute allowedRoles={["student"]}><TestEnvironment /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
