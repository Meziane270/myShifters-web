import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import { PlusCircle, CalendarDays, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "../../../components/ui/button";

import StatusBanner from "../components/StatusBanner";
import ShiftCard from "./components/ShiftCard";
import ShiftFilters from "./components/ShiftFilters";
import CreateShiftDialog from "./CreateShiftDialog";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const canActFromStatus = (status) => status === "verified" || status === "active";

export default function ShiftsPage() {
    const { getAuthHeader, user } = useAuth();
    const [shifts, setShifts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [serviceFilter, setServiceFilter] = useState("all");
    const [activeTab, setActiveTab] = useState("upcoming"); // "upcoming", "filled-completed", "cancelled"

    const status = useMemo(() => {
        const v = user?.verification_status;
        const banned = user?.is_banned || user?.banned;
        const disabled = user?.is_disabled || user?.disabled;
        if (banned) return "banned";
        if (disabled) return "disabled";
        if (v === "verified") return "verified";
        return "pending";
    }, [user]);

    const canAct = useMemo(() => canActFromStatus(status), [status]);
    const isBlocked = useMemo(() => status === "banned" || status === "disabled", [status]);

    const fetchShifts = useCallback(async () => {
        try {
            const response = await axios.get(`${API}/hotel/shifts`, {
                headers: getAuthHeader()
            });
            setShifts(response.data || []);
        } catch {
            toast.error("Erreur lors du chargement des missions");
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    useEffect(() => {
        fetchShifts();
    }, [fetchShifts]);

    const handleDeleteShift = useCallback(async (shiftId) => {
        if (isBlocked) {
            toast.error("Votre compte est bloqué. Contactez le support.");
            return;
        }
        if (!canAct) {
            toast.error("Votre établissement doit être validé avant de modifier des missions.");
            return;
        }

        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette mission ?")) return;

        try {
            await axios.delete(`${API}/shifts/${shiftId}`, {
                headers: getAuthHeader()
            });
            toast.success("Mission supprimée");
            fetchShifts();
        } catch {
            toast.error("Erreur lors de la suppression");
        }
    }, [getAuthHeader, fetchShifts, canAct, isBlocked]);

    const sortedShifts = useMemo(() => {
        return [...shifts].sort((a, b) => {
            const dateA = Array.isArray(a.dates) ? a.dates[0] : a.date;
            const dateB = Array.isArray(b.dates) ? b.dates[0] : b.date;
            return new Date(dateA) - new Date(dateB);
        });
    }, [shifts]);

    const sections = useMemo(() => {
        const filtered = sortedShifts.filter((s) => {
            const okService = serviceFilter === "all" ? true : s.service_type === serviceFilter;
            return okService;
        });

        return {
            upcoming: filtered.filter(s => s.status === "open"),
            "filled-completed": filtered.filter(s => s.status === "filled" || s.status === "completed"),
            cancelled: filtered.filter(s => s.status === "cancelled"),
        };
    }, [sortedShifts, serviceFilter]);

    const currentShifts = sections[activeTab] || [];

    return (
        <div className="space-y-8" data-testid="shifts-page">
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                            Mes missions
                        </h1>
                        <p className="text-foreground/70">
                            Gérez vos offres de missions
                        </p>
                    </div>

                    <Button
                        className="bg-violet-600 hover:bg-violet-700 text-white font-medium"
                        disabled={!canAct || isBlocked}
                        onClick={() => setIsCreateOpen(true)}
                        data-testid="create-shift-btn"
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        Nouvelle mission
                    </Button>
                </div>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border">
                    <div className="flex gap-4">
                        <button
                            onClick={() => setActiveTab("upcoming")}
                            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                                activeTab === "upcoming"
                                    ? "border-violet-600 text-violet-600"
                                    : "border-transparent text-foreground/60 hover:text-foreground"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                À venir ({sections.upcoming.length})
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("filled-completed")}
                            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                                activeTab === "filled-completed"
                                    ? "border-violet-600 text-violet-600"
                                    : "border-transparent text-foreground/60 hover:text-foreground"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                Pourvues & Terminées ({sections["filled-completed"].length})
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("cancelled")}
                            className={`pb-3 text-sm font-semibold transition-colors border-b-2 ${
                                activeTab === "cancelled"
                                    ? "border-violet-600 text-violet-600"
                                    : "border-transparent text-foreground/60 hover:text-foreground"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <XCircle className="h-4 w-4" />
                                Annulées ({sections.cancelled.length})
                            </div>
                        </button>
                    </div>

                    <div className="pb-2">
                        <ShiftFilters
                            statusFilter="all"
                            onStatusChange={() => {}}
                            serviceFilter={serviceFilter}
                            onServiceChange={setServiceFilter}
                            hideStatus={true}
                        />
                    </div>
                </div>

                <StatusBanner user={user} />
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : currentShifts.length === 0 ? (
                <div className="text-center py-16 bg-card rounded-xl border border-border">
                    <CalendarDays className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                    <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                        Aucune mission
                    </h3>
                    <p className="text-foreground/70 mb-6">
                        {activeTab === "upcoming" ? "Créez votre première mission pour trouver des extras" : "Aucune mission dans cette catégorie"}
                    </p>
                    {activeTab === "upcoming" && (
                        <Button
                            onClick={() => setIsCreateOpen(true)}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                            disabled={!canAct || isBlocked}
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            Créer une mission
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid gap-4">
                    {currentShifts.map((shift) => (
                        <ShiftCard
                            key={shift.id}
                            shift={shift}
                            onDelete={handleDeleteShift}
                            canAct={canAct}
                            isBlocked={isBlocked}
                            onRefresh={fetchShifts}
                        />
                    ))}
                </div>
            )}

            <CreateShiftDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={fetchShifts}
                canAct={canAct}
                isBlocked={isBlocked}
            />
        </div>
    );
}
