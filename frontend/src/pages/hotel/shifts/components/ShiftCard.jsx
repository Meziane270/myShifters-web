import { useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import WorkerProfileDialog from "../../components/WorkerProfileDialog";
import {
    CalendarDays,
    Clock,
    Euro,
    Users,
    XCircle,
    ChevronDown,
    ChevronUp,
    Star,
    User,
    CheckCircle,
    XCircle as RejectIcon
} from "lucide-react";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SERVICE_LABELS = {
    reception: "Réception",
    housekeeping: "Housekeeping",
    maintenance: "Maintenance",
    restaurant: "Restauration",
};

const SERVICE_COLORS = {
    reception: "bg-violet-500/15 text-violet-700",
    housekeeping: "bg-emerald-500/15 text-emerald-700",
    maintenance: "bg-orange-500/15 text-orange-700",
    restaurant: "bg-purple-500/15 text-purple-700",
};

const STATUS_CONFIG = {
    open: { label: "Ouvert", cls: "bg-emerald-500/15 text-emerald-700" },
    filled: { label: "Pourvu", cls: "bg-violet-500/15 text-violet-700" },
    completed: { label: "Terminée", cls: "bg-sky-500/15 text-sky-700" },
    cancelled: { label: "Annulée", cls: "bg-red-500/15 text-red-700" },
};

function StarRating({ value }) {
    if (!value) return <span className="text-xs text-gray-400">—</span>;
    return (
        <span className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-xs font-bold text-amber-700">{value}</span>
        </span>
    );
}

function WorkerAvatar({ src, name, size = "md" }) {
    const sz = size === "sm" ? "h-9 w-9 text-xs" : "h-12 w-12 text-sm";
    const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
    return (
        <div className={`${sz} rounded-full bg-violet-100 border-2 border-white shadow flex items-center justify-center overflow-hidden shrink-0`}>
            {src ? (
                <img src={src} alt={name} className="h-full w-full object-cover" />
            ) : (
                <span className="font-bold text-violet-700">{initials}</span>
            )}
        </div>
    );
}

export default function ShiftCard({ shift, onDelete, canAct, isBlocked, onRefresh }) {
    const { getAuthHeader } = useAuth();
    const [showCandidates, setShowCandidates] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [workerDialogOpen, setWorkerDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    const handleDelete = useCallback(() => {
        onDelete(shift.id);
    }, [shift.id, onDelete]);

    const fetchCandidates = useCallback(async () => {
        if (candidates.length > 0) return; // cache
        setLoadingCandidates(true);
        try {
            const res = await axios.get(`${API}/applications/hotel/${shift.id}/workers`, {
                headers: getAuthHeader()
            });
            setCandidates(res.data || []);
        } catch {
            toast.error("Impossible de charger les candidatures");
        } finally {
            setLoadingCandidates(false);
        }
    }, [shift.id, getAuthHeader, candidates.length]);

    const toggleCandidates = useCallback(() => {
        const next = !showCandidates;
        setShowCandidates(next);
        if (next) fetchCandidates();
    }, [showCandidates, fetchCandidates]);

    const handleWorkerClick = useCallback((candidate) => {
        setSelectedWorker({
            first_name: candidate.worker_first_name,
            last_name: candidate.worker_last_name,
            email: candidate.worker_email,
            phone: candidate.worker_phone,
            avatar_url: candidate.worker_avatar,
            avg_rating: candidate.worker_avg_rating,
            ratings_count: candidate.worker_ratings_count,
            skills: candidate.worker_skills,
            experience_years: candidate.worker_experience_years,
            bio: candidate.worker_bio,
            siret: candidate.worker_siret,
            business_name: candidate.worker_business_name,
        });
        setWorkerDialogOpen(true);
    }, []);

    const handleApplicationAction = useCallback(async (appId, status) => {
        setActionLoading(appId);
        try {
            await axios.put(`${API}/applications/${appId}`, { status }, { headers: getAuthHeader() });
            toast.success(status === "accepted" ? "Worker sélectionné !" : "Candidature refusée");
            setCandidates([]);
            fetchCandidates();
            if (onRefresh) onRefresh();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Erreur lors de la mise à jour");
        } finally {
            setActionLoading(null);
        }
    }, [getAuthHeader, fetchCandidates, onRefresh]);

    const statusCfg = STATUS_CONFIG[shift.status] || { label: shift.status, cls: "bg-gray-100 text-gray-600" };
    const applicationsCount = shift.applications_count || 0;
    const canCancel = shift.status === "open" && canAct && !isBlocked;

    return (
        <div className="bg-card rounded-xl border border-border hover:border-violet-600/30 transition-colors overflow-hidden">
            {/* Carte principale */}
            <div className="p-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${SERVICE_COLORS[shift.service_type]}`}>
                                {SERVICE_LABELS[shift.service_type]}
                            </span>
                            <Badge className={`${statusCfg.cls} border-0`}>{statusCfg.label}</Badge>
                        </div>

                        <h3 className="font-display text-xl font-semibold text-foreground mb-2">{shift.title}</h3>
                        <p className="text-foreground/70 text-sm mb-4 line-clamp-2">{shift.description}</p>

                        <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-2 text-foreground/70">
                                <CalendarDays className="w-4 h-4 text-violet-600" />
                                {Array.isArray(shift.dates) ? shift.dates.join(", ") : shift.date}
                            </div>
                            <div className="flex items-center gap-2 text-foreground/70">
                                <Clock className="w-4 h-4 text-violet-600" />
                                {shift.start_time} - {shift.end_time}
                            </div>
                            <div className="flex items-center gap-2 text-foreground/70">
                                <Euro className="w-4 h-4 text-violet-600" />
                                {shift.hourly_rate}€/h
                            </div>
                            <div className="flex items-center gap-2 text-foreground/70">
                                <Users className="w-4 h-4 text-violet-600" />
                                {shift.positions_filled}/{shift.positions_available} postes
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                        {/* Bouton candidatures */}
                        {shift.status !== "cancelled" && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-foreground/25 text-foreground hover:bg-foreground/5 gap-1.5"
                                onClick={toggleCandidates}
                            >
                                <Users className="w-4 h-4" />
                                Candidatures
                                {applicationsCount > 0 && (
                                    <span className="bg-violet-600 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
                                        {applicationsCount}
                                    </span>
                                )}
                                {showCandidates ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>
                        )}

                        {/* Bouton annuler */}
                        {canCancel && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-500 hover:bg-red-500/10"
                                onClick={handleDelete}
                                disabled={!canAct || isBlocked}
                                title="Annuler la mission"
                            >
                                <XCircle className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Panneau candidatures inline */}
            {showCandidates && (
                <div className="border-t border-border bg-gray-50/50 px-6 py-4">
                    {loadingCandidates ? (
                        <div className="flex items-center justify-center py-6">
                            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : candidates.length === 0 ? (
                        <div className="text-center py-6 text-sm text-foreground/50">
                            <User className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            Aucune candidature pour cette mission
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest mb-3">
                                {candidates.length} candidat{candidates.length > 1 ? "s" : ""}
                            </p>
                            <div className="flex flex-wrap gap-3">
                                {candidates.map((candidate) => (
                                    <div
                                        key={candidate.id}
                                        className="group relative"
                                    >
                                        {/* Mini-carte worker */}
                                        <div
                                            className="flex flex-col items-center gap-1.5 p-3 bg-white rounded-2xl border border-gray-100 hover:border-violet-300 hover:shadow-md transition-all cursor-pointer w-20"
                                            onClick={() => handleWorkerClick(candidate)}
                                            title={`${candidate.worker_first_name} ${candidate.worker_last_name}`}
                                        >
                                            <WorkerAvatar
                                                src={candidate.worker_avatar}
                                                name={`${candidate.worker_first_name} ${candidate.worker_last_name}`}
                                                size="sm"
                                            />
                                            <span className="text-xs font-semibold text-gray-700 text-center leading-tight line-clamp-2">
                                                {candidate.worker_first_name}
                                            </span>
                                            <StarRating value={candidate.worker_avg_rating} />
                                            {/* Badge statut */}
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                candidate.status === "accepted"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : candidate.status === "rejected"
                                                        ? "bg-red-100 text-red-600"
                                                        : "bg-amber-100 text-amber-700"
                                            }`}>
                                                {candidate.status === "accepted" ? "Sélectionné" :
                                                    candidate.status === "rejected" ? "Refusé" : "En attente"}
                                            </span>
                                        </div>

                                        {/* Actions accepter/refuser (uniquement si pending et mission open) */}
                                        {candidate.status === "pending" && shift.status === "open" && canAct && (
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button
                                                    className="h-6 w-6 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg"
                                                    onClick={(e) => { e.stopPropagation(); handleApplicationAction(candidate.id, "accepted"); }}
                                                    disabled={actionLoading === candidate.id}
                                                    title="Accepter"
                                                >
                                                    <CheckCircle className="h-3.5 w-3.5" />
                                                </button>
                                                <button
                                                    className="h-6 w-6 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg"
                                                    onClick={(e) => { e.stopPropagation(); handleApplicationAction(candidate.id, "rejected"); }}
                                                    disabled={actionLoading === candidate.id}
                                                    title="Refuser"
                                                >
                                                    <RejectIcon className="h-3.5 w-3.5" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Dialog profil worker */}
            <WorkerProfileDialog
                isOpen={workerDialogOpen}
                onClose={() => setWorkerDialogOpen(false)}
                workerProfile={selectedWorker}
                loading={false}
                error={null}
            />
        </div>
    );
}
