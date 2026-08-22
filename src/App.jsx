import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { FoundationSettingsProvider } from "./context/FoundationSettingsContext";
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./layouts/MainLayout";
import AdminLayout from "./layouts/AdminLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import Team from "./pages/Team";
import Branches from "./pages/Branches";
import Projects from "./pages/Projects";
import Activities from "./pages/Activities";
import Donate from "./pages/Donate";
import Transparency from "./pages/Transparency";
import Gallery from "./pages/Gallery";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/admin/AdminLogin";
import Dashboard from "./pages/admin/Dashboard";
import Settings from "./pages/admin/Settings";
import Executives from "./pages/admin/Executives";
import Members from "./pages/admin/Members";
import BranchesAdmin from "./pages/admin/BranchesAdmin";
import AdminActivities from "./pages/admin/Activities";
import AdminGallery from "./pages/admin/GalleryAdmin";
import DonationMethods from "./pages/admin/DonationMethods";
import Donations from "./pages/admin/Donations";
import AdminProjects from "./pages/admin/Projects";
import AdminExpenses from "./pages/admin/Expenses";

export default function App() {
  return (
    <FoundationSettingsProvider>
    <AuthProvider>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/team" element={<Team />} />
          <Route path="/branches" element={<Branches />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/activities" element={<Activities />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/transparency" element={<Transparency />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Admin routes render outside MainLayout — no public navbar/footer. */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="executives" element={<Executives />} />
          <Route path="members" element={<Members />} />
          <Route path="branches" element={<BranchesAdmin />} />
          <Route path="activities" element={<AdminActivities />} />
          <Route path="gallery" element={<AdminGallery />} />
          <Route path="donation-methods" element={<DonationMethods />} />
          <Route path="donations" element={<Donations />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="expenses" element={<AdminExpenses />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AuthProvider>
    </FoundationSettingsProvider>
  );
}
