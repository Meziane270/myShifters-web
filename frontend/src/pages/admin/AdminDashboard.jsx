// src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Menu } from "lucide-react";

// Components
import Sidebar from "./components/Sidebar";

// Pages
import AdminOverview from "./overview/AdminOverview";
import AdminSupportInbox from "./support/AdminSupportInbox";
import AdminVerifications from "./verifications/AdminVerifications";
import AdminUsers from "./users/AdminUsers";
import AdminUserDetail from "./users/AdminUserDetail";
import AdminDisputes from "./disputes/AdminDisputes";
import AdminDisputeDetail from "./disputes/AdminDisputeDetail";
import AdminReviews from "./reviews/AdminReviews";
import AdminRevenue from "./revenue/AdminRevenue";
import AdminSettings from "./settings/AdminSettings";
import AdminAuditLog from "./audit/AdminAuditLog";
import AdminNotifications from "./notifications/AdminNotifications";
import AdminShifts from "./shifts/AdminShifts";

export default function AdminDashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const { setTheme } = useTheme();

    useEffect(() => {
        if (user?.role !== "admin") {
            toast.error("Accès non autorisé");
            navigate("/");
        }
        // Forcer le mode clair sur tout le dashboard admin
        setTheme("light");
    }, [user, navigate, setTheme]);

    return (
        <div className="light min-h-screen bg-[#F8FAFC] text-slate-900">
            <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />

            {/* Mobile header */}
            <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-100 z-40 flex items-center justify-between px-4">
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="text-slate-900 p-2 hover:bg-slate-50 rounded-xl transition-colors"
                >
                    <Menu className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-violet-900 rounded-lg flex items-center justify-center">
                        <span className="font-black text-white text-xs">MS</span>
                    </div>
                    <span className="font-black text-slate-900 tracking-tighter text-sm">ADMIN</span>
                </div>
                <div className="w-9" />
            </header>

            <main className="lg:ml-72 min-h-screen pt-16 lg:pt-0">
                <div className="p-6 lg:p-10">
                    <Routes>
                        <Route index element={<AdminOverview />} />
                        <Route path="support" element={<AdminSupportInbox />} />
                        <Route path="verifications" element={<AdminVerifications />} />
                        <Route path="users" element={<AdminUsers />} />
                        <Route path="users/:userId" element={<AdminUserDetail />} />
                        <Route path="disputes" element={<AdminDisputes />} />
                        <Route path="disputes/:disputeId" element={<AdminDisputeDetail />} />
                        <Route path="reviews" element={<AdminReviews />} />
                        <Route path="revenue" element={<AdminRevenue />} />
                        <Route path="settings" element={<AdminSettings />} />
                        <Route path="audit" element={<AdminAuditLog />} />
                        <Route path="notifications" element={<AdminNotifications />} />
                        <Route path="shifts" element={<AdminShifts />} />
                    </Routes>
                </div>
            </main>
        </div>
    );
}
