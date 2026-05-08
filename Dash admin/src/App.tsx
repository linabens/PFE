import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPage from "@/pages/DashboardPage";
import LiveOrdersPage from "@/pages/LiveOrdersPage";
import ProductsPage from "@/pages/ProductsPage";
import CategoriesPage from "@/pages/CategoriesPage";
import RevenuePage from "@/pages/RevenuePage";
import LoyaltyPage from "@/pages/LoyaltyPage";
import TablesPage from "@/pages/TablesPage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import LoginPage from "@/pages/LoginPage";
import AssistancePage from "@/pages/AssistancePage";
import AnalyticsPage from "@/pages/AnalyticsPage";
import StaffAccountsPage from "@/pages/StaffAccountsPage";
import PromotionsPage from "@/pages/PromotionsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "./pages/NotFound.tsx";
import { ThemeProvider } from "@/components/theme-provider";

const queryClient = new QueryClient();

import { useAppStore } from "@/stores/appStore";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('coffee_admin_token');
  const userStr = localStorage.getItem('coffee_admin_user');

  if (!token || !userStr) return <Navigate to="/login" replace />;

  try {
    const user = JSON.parse(userStr);
    // RBAC: Only admin and staff can access the dashboard
    if (user.role !== 'admin' && user.role !== 'staff') {
      localStorage.removeItem('coffee_admin_token');
      localStorage.removeItem('coffee_admin_user');
      return <Navigate to="/login" replace />;
    }
  } catch (e) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin } = useAppStore();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="coffee-theme" attribute="class">
      <TooltipProvider>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--espresso))',
              color: 'hsl(var(--latte))',
              border: '1px solid hsla(var(--caramel), 0.15)',
            },
          }}
        />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/orders" element={<LiveOrdersPage />} />
              <Route path="/products" element={<AdminRoute><ProductsPage /></AdminRoute>} />
              <Route path="/categories" element={<AdminRoute><CategoriesPage /></AdminRoute>} />
              <Route path="/tables" element={<TablesPage />} />
              <Route path="/loyalty" element={<LoyaltyPage />} />
              <Route path="/assistance" element={<AssistancePage />} />
              <Route path="/revenue" element={<AdminRoute><RevenuePage /></AdminRoute>} />
              <Route path="/analytics" element={<AdminRoute><AnalyticsPage /></AdminRoute>} />
              <Route path="/promotions" element={<AdminRoute><PromotionsPage /></AdminRoute>} />
              <Route path="/staff" element={<AdminRoute><StaffAccountsPage /></AdminRoute>} />
              <Route path="/system" element={<AdminRoute><PlaceholderPage title="System Settings" /></AdminRoute>} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
