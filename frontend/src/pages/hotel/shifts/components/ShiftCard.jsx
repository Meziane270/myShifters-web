import { useState, useCallback, useRef } from "react";
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
    ChevronLeft,
    ChevronRight,
    Star,
    User,
    CheckCircle,
    XCircle as RejectIcon,
    TimerReset,
} from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../../../components/ui/dialog";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";

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
    const sz = size === "sm" ? "h-12 w-12 text-sm" : "h-16 w-16 text-base";
    const initials = name ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() : "?";
    return (
        <div className={`${sz} rounded-full bg-violet-100 border-2 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0`}>
            {src ? (
                <img src={src} alt={name} className="h-full w-full object-cover" />
            ) : (
                <span className="font-bold text-violet-700">{initials}</span>
            )}
        </div>
    );
}

/** Calcule si la fenêtre de prolongation est encore ouverte */
function isExtensionOpen(shift) {
    if (shift.status !== "completed") return false;
    if (shift.extension_expired) return false;
    const deadline = shift.extension_deadline;
    if (!deadline) return false;
    try {
        return new Date() < new Date(deadline);
    } catch {
        return false;
    }
}

/** Formate le temps restant avant expiration */
function timeUntilDeadline(deadlineStr) {
    if (!deadlineStr) return null;
    const diff = new Date(deadlineStr) - new Date();
    if (diff <= 0) return null;
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    if (hours > 0) return `${hours}h${minutes > 0 ? ` ${minutes}min` : ""} restantes`;
    return `${minutes} min restantes`;
}

export default function ShiftCard({ shift, onDelete, canAct, isBlocked, onRefresh }) {
    const { getAuthHeader } = useAuth();
    const [showCandidates, setShowCandidates] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [loadingCandidates, setLoadingCandidates] = useState(false);
    const [selectedWorker, setSelectedWorker] = useState(null);
    const [workerDialogOpen, setWorkerDialogOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);

    // Prolongation
    const [extendOpen, setExtendOpen] = useState(false);
    const [extendLoading, setExtendLoading] = useState(false);
    const [extendForm, setExtendForm] = useState({
        new_end_date: "",
        new_end_time: shift.end_time || "18:00",
    });

    // Slider
    const sliderRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const updateScrollButtons = useCallback(() => {
        const el = sliderRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 0);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    }, []);

    const scrollSlider = useCallback((dir) => {
        const el = sliderRef.current;
        if (!el) return;
        el.scrollBy({ left: dir * 260, behavior: "smooth" });
        setTimeout(updateScrollButtons, 350);
    }, [updateScrollButtons]);

    const handleDelete = useCallback(() => {
        onDelete(shift.id);
    }, [shift.id, onDelete]);

    const fetchCandidates = useCallback(async () => {
        if (candidates.length > 0) return;
        setLoadingCandidates(true);
        try {
            const res = await axios.get(`${API}/applications/hotel/${shift.id}/workers`, {
                headers: getAuthHeader()
            });
            setCandidates(res.data || []);
            setTimeout(updateScrollButtons, 100);
        } catch {
            toast.error("Impossible de charger les candidatures");
        } finally {
            setLoadingCandidates(false);
        }
    }, [shift.id, getAuthHeader, candidates.length, updateScrollButtons]);

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

    const handleExtendSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!extendForm.new_end_date || !extendForm.new_end_time) {
            toast.error("Veuillez renseigner la nouvelle date et heure de fin");
            return;
        }
        setExtendLoading(true);
        try {
            await axios.post(
                `${API}/shifts/${shift.id}/extend`,
                {
                    new_end_date: extendForm.new_end_date,
                    new_end_time: extendForm.new_end_time,
                },
                { headers: getAuthHeader() }
            );
            toast.success("Mission prolongée avec succès !");
            setExtendOpen(false);
            if (onRefresh) onRefresh();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Erreur lors de la prolongation");
        } finally {
            setExtendLoading(false);
        }
    }, [extendForm, shift.id, getAuthHeader, onRefresh]);

    const statusCfg = STATUS_CONFIG[shift.status] || { label: shift.status, cls: "bg-gray-100 text-gray-600" };
    const applicationsCount = shift.applications_count || 0;
    const canCancel = shift.status === "open" && canAct && !isBlocked;
    const canExtend = isExtensionOpen(shift) && canAct && !isBlocked;
    const remaining = canExtend ? timeUntilDeadline(shift.extension_deadline) : null;

    // Aujourd'hui en format YYYY-MM-DD pour le min du date input
    const todayStr = new Date().toISOString().split("T")[0];

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
                            {canExtend && remaining && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700 border border-amber-200 flex items-center gap-1">
                                    <TimerReset className="w-3 h-3" />
                                    Prolongation possible · {remaining}
                                </span>
                            )}
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

                    <div className="flex gap-2 shrink-0 flex-wrap justify-end">
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

                        {/* Bouton prolonger */}
                        {canExtend && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-amber-400 text-amber-700 hover:bg-amber-50 gap-1.5"
                                onClick={() => setExtendOpen(true)}
                            >
                                <TimerReset className="w-4 h-4" />
                                Prolonger
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

            {/* Panneau candidatures — slider horizontal */}
            {showCandidates && (
                <div className="border-t border-border bg-gray-50/50 dark:bg-gray-900/30 px-6 py-5">
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
                            <div className="flex items-center justify-between mb-4">
                                <p className="text-xs font-bold text-foreground/50 uppercase tracking-widest">
                                    {candidates.length} candidat{candidates.length > 1 ? "s" : ""}
                                </p>
                                {/* Flèches de navigation */}
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => scrollSlider(-1)}
                                        disabled={!canScrollLeft}
                                        className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-foreground/60 hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Précédent"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => scrollSlider(1)}
                                        disabled={!canScrollRight}
                                        className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-foreground/60 hover:bg-foreground/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                        title="Suivant"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Slider */}
                            <div
                                ref={sliderRef}
                                onScroll={updateScrollButtons}
                                className="flex gap-4 overflow-x-auto pb-2 scroll-smooth"
                                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                            >
                                {candidates.map((candidate) => (
                                    <div
                                        key={candidate.id}
                                        className="group relative flex-shrink-0 w-44"
                                    >
                                        {/* Carte candidat — plus grande */}
                                        <div
                                            className="flex flex-col items-center gap-2 p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-violet-400 hover:shadow-lg transition-all cursor-pointer"
                                            onClick={() => handleWorkerClick(candidate)}
                                            title={`${candidate.worker_first_name} ${candidate.worker_last_name}`}
                                        >
                                            <WorkerAvatar
                                                src={candidate.worker_avatar}
                                                name={`${candidate.worker_first_name} ${candidate.worker_last_name}`}
                                                size="md"
                                            />
                                            <div className="text-center w-full">
                                                <p className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                                                    {candidate.worker_first_name}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                    {candidate.worker_last_name}
                                                </p>
                                            </div>
                                            <StarRating value={candidate.worker_avg_rating} />
                                            {candidate.worker_experience_years > 0 && (
                                                <span className="text-[10px] text-gray-400">
                                                    {candidate.worker_experience_years} an{candidate.worker_experience_years > 1 ? "s" : ""} exp.
                                                </span>
                                            )}
                                            {/* Badge statut */}
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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

                                        {/* Actions accepter/refuser */}
                                        {candidate.status === "pending" && shift.status === "open" && canAct && (
                                            <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                <button
                                                    className="h-7 w-7 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-lg"
                                                    onClick={(e) => { e.stopPropagation(); handleApplicationAction(candidate.id, "accepted"); }}
                                                    disabled={actionLoading === candidate.id}
                                                    title="Accepter"
                                                >
                                                    <CheckCircle className="h-4 w-4" />
                                                </button>
                                                <button
                                                    className="h-7 w-7 rounded-full bg-red-500 hover:bg-red-400 text-white flex items-center justify-center shadow-lg"
                                                    onClick={(e) => { e.stopPropagation(); handleApplicationAction(candidate.id, "rejected"); }}
                                                    disabled={actionLoading === candidate.id}
                                                    title="Refuser"
                                                >
                                                    <RejectIcon className="h-4 w-4" />
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

            {/* Dialog prolongation */}
            <Dialog open={extendOpen} onOpenChange={setExtendOpen}>
                <DialogContent className="bg-card border-border text-foreground max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-display text-xl flex items-center gap-2">
                            <TimerReset className="w-5 h-5 text-amber-500" />
                            Prolonger la mission
                        </DialogTitle>
                    </DialogHeader>
                    <div className="text-sm text-foreground/70 mb-4">
                        Vous pouvez prolonger cette mission en définissant une nouvelle date et heure de fin.
                        {remaining && (
                            <p className="mt-1 text-amber-600 font-medium">⏱ {remaining} pour prolonger</p>
                        )}
                    </div>
                    <form onSubmit={handleExtendSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-foreground">Nouvelle date de fin</Label>
                            <Input
                                type="date"
                                min={todayStr}
                                value={extendForm.new_end_date}
                                onChange={(e) => setExtendForm(prev => ({ ...prev, new_end_date: e.target.value }))}
                                required
                                className="bg-background border-border text-foreground"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-foreground">Nouvelle heure de fin</Label>
                            <Input
                                type="time"
                                value={extendForm.new_end_time}
                                onChange={(e) => setExtendForm(prev => ({ ...prev, new_end_time: e.target.value }))}
                                required
                                className="bg-background border-border text-foreground"
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1 border-border"
                                onClick={() => setExtendOpen(false)}
                                disabled={extendLoading}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className="flex-1 bg-violet-600 hover:bg-violet-700 text-white"
                                disabled={extendLoading}
                            >
                                {extendLoading ? "Prolongation..." : "Confirmer la prolongation"}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
