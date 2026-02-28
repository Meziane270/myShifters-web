import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import {
    LayoutDashboard,
    Shield,
    Users,
    LifeBuoy,
    Star,
    DollarSign,
    LogOut,
    X,
    Settings,
    ClipboardList,
    Bell,
    Briefcase
} from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const navItems = [
        { path: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
        { path: "/admin/verifications", label: "Vérifications", icon: Shield },
        { path: "/admin/users", label: "Utilisateurs", icon: Users },
        { path: "/admin/shifts", label: "Missions", icon: Briefcase },
        { path: "/admin/support", label: "Support", icon: LifeBuoy },
        { path: "/admin/reviews", label: "Avis", icon: Star },
        { path: "/admin/revenue", label: "Revenus", icon: DollarSign },
        { path: "/admin/notifications", label: "Notifications", icon: Bell },
        { path: "/admin/audit", label: "Audit", icon: ClipboardList },
        { path: "/admin/settings", label: "Paramètres", icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    };

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsOpen(false)}
                />
            )}
            <aside
                className={`fixed left-0 top-0 z-50 h-full w-72 transform border-r border-violet-100 bg-gradient-to-b from-violet-950 to-violet-900 transition-transform duration-300 lg:translate-x-0 ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="shrink-0 px-6 py-7 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                                {/* Logo */}
                                <div className="h-14 w-14 rounded-2xl bg-white/10 border-2 border-white/20 flex items-center justify-center shrink-0 shadow-lg">
                                    <span className="font-black text-white text-sm tracking-tighter">MS</span>
                                </div>
                                {/* Titre + badge */}
                                <div className="min-w-0">
                                    <h2 className="font-black text-white tracking-tighter text-sm truncate">ADMINISTRATION</h2>
                                    <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full bg-violet-400/20 border border-violet-300/30 text-[9px] font-black text-violet-200 uppercase tracking-[0.15em]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-violet-300 animate-pulse"></span>
                                        Admin
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="lg:hidden rounded-xl p-2 text-white/50 hover:bg-white/10 transition-all shrink-0"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <p className="text-[10px] font-semibold text-white/40 mt-3 truncate">
                            {user?.email || "admin@myshifters.com"}
                        </p>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                        {navItems.map((item) => {
                            const active = isActive(item);
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-all duration-200 ${
                                        active
                                            ? "bg-white text-violet-900 shadow-lg shadow-black/20"
                                            : "text-white/60 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <Icon className={`h-5 w-5 shrink-0 ${active ? "text-violet-700" : "text-white/50"}`} />
                                    <span className="font-bold text-sm tracking-tight">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Déconnexion */}
                    <div className="shrink-0 px-4 py-5 border-t border-white/10">
                        <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-3.5 text-red-300 font-bold text-sm transition-all hover:bg-red-500/10 hover:text-red-200"
                        >
                            <LogOut className="h-5 w-5 shrink-0" />
                            <span>Déconnexion</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}
