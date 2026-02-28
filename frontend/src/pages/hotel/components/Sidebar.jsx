import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import {
    LayoutDashboard,
    CalendarDays,
    Users,
    FileText,
    User as UserIcon,
    Settings,
    LifeBuoy,
    LogOut,
    X,
    Star,
    Building2
} from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const hotelName = user?.hotel_name || user?.name || "Hôtel";
    const avatarUrl = user?.avatar_url || user?.avatar || user?.photo_url || "";

    const handleLogout = useCallback(() => {
        logout();
        navigate("/");
    }, [logout, navigate]);

    const navItems = useMemo(() => [
        { path: "/hotel", icon: LayoutDashboard, label: "Tableau de bord", exact: true },
        { path: "/hotel/shifts", icon: CalendarDays, label: "Mes missions" },
        { path: "/hotel/invoices", icon: FileText, label: "Mes Factures" },
        { path: "/hotel/ratings", icon: Star, label: "Avis Extras" },
        { path: "/hotel/profile", icon: UserIcon, label: "Mon Profil" },
        { path: "/hotel/settings", icon: Settings, label: "Paramètres" },
        { path: "/hotel/support", icon: LifeBuoy, label: "Support" },
    ], []);

    const isActive = useCallback((item) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    }, [location.pathname]);

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
                    {/* Header profil */}
                    <div className="shrink-0 px-6 py-7 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 min-w-0">
                                {/* Avatar */}
                                <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/10 shrink-0 shadow-lg">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={hotelName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center">
                                            <Building2 className="h-7 w-7 text-white/70" />
                                        </div>
                                    )}
                                </div>
                                {/* Nom + badge statut */}
                                <div className="min-w-0">
                                    <h3 className="font-black text-white truncate text-sm tracking-tight leading-tight">
                                        {hotelName}
                                    </h3>
                                    <span className={`inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-[0.15em] ${
                                        user?.verification_status === 'verified'
                                            ? 'bg-emerald-400/20 border-emerald-300/30 text-emerald-200'
                                            : 'bg-amber-400/20 border-amber-300/30 text-amber-200'
                                    }`}>
                                        <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${
                                            user?.verification_status === 'verified' ? 'bg-emerald-300' : 'bg-amber-300'
                                        }`}></span>
                                        {user?.verification_status === 'verified' ? 'Vérifié' : 'En attente'}
                                    </span>
                                </div>
                            </div>
                            {/* Bouton fermer mobile */}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="lg:hidden rounded-xl p-2 text-white/50 hover:bg-white/10 transition-all shrink-0"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
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
