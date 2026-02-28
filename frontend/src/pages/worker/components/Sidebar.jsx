import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import { 
    LogOut, 
    X, 
    LayoutDashboard, 
    User, 
    Briefcase, 
    FileText, 
    Star, 
    MessageSquare, 
    Settings 
} from "lucide-react";

export default function Sidebar({ isOpen, setIsOpen }) {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

    const navItems = [
        { path: "/worker", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
        { path: "/worker/profile", label: "Mon Profil", icon: User },
        { path: "/worker/missions", label: "Mes Missions", icon: Briefcase },
        { path: "/worker/invoices", label: "Mes factures", icon: FileText },
        { path: "/worker/ratings", label: "Mes avis", icon: Star },
        { path: "/worker/support", label: "Support", icon: MessageSquare },
        { path: "/worker/settings", label: "Paramètres", icon: Settings },
    ];

    const handleLogout = () => {
        logout();
        navigate("/");
    };

    const isActive = (item) => {
        if (item.exact) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    };

    const firstName = user?.first_name || user?.firstName || "";
    const lastName = user?.last_name || user?.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim() || user?.name || "Utilisateur";
    const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || "U";
    const avatarUrl = user?.avatar_url || user?.avatar || user?.photo_url || user?.profile_picture || "";

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
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
                            {/* Photo + infos côte à côte */}
                            <div className="flex items-center gap-4 min-w-0">
                                {/* Avatar */}
                                <div className="h-14 w-14 rounded-2xl overflow-hidden border-2 border-white/20 bg-white/10 shrink-0 shadow-lg">
                                    {avatarUrl ? (
                                        <img
                                            src={avatarUrl}
                                            alt={fullName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-full w-full flex items-center justify-center text-white font-black text-lg">
                                            {initials}
                                        </div>
                                    )}
                                </div>

                                {/* Nom + badge à droite de la photo */}
                                <div className="min-w-0">
                                    <h3 className="font-black text-white truncate text-sm tracking-tight leading-tight">
                                        {firstName} {lastName}
                                    </h3>
                                    <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-full bg-violet-400/20 border border-violet-300/30 text-[9px] font-black text-violet-200 uppercase tracking-[0.15em]">
                                        <span className="h-1.5 w-1.5 rounded-full bg-violet-300 animate-pulse"></span>
                                        Shifter
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
