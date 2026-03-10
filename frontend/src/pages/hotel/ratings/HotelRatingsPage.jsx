import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "sonner";
import {
    Star, MessageSquare, Calendar, Send, Award,
    CheckCircle2, X, Clock, MapPin, Euro, User, History
} from "lucide-react";
import { Button } from "../../../components/ui/button";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SERVICE_LABELS = {
    reception: "Réception",
    housekeeping: "Housekeeping",
    maintenance: "Maintenance",
    restaurant: "Restauration",
};

function WorkerAvatar({ src, name, size = "lg" }) {
    const sz = size === "lg" ? "h-14 w-14 text-base" : "h-10 w-10 text-xs";
    const initials = name
        ? name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
        : "?";
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

function StarPicker({ value, onChange }) {
    const [hover, setHover] = useState(0);
    return (
        <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map(star => (
                <button
                    key={star}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => onChange(star)}
                    className="transition-transform hover:scale-125"
                >
                    <Star className={`h-9 w-9 transition-colors ${
                        star <= (hover || value)
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-200"
                    }`} />
                </button>
            ))}
        </div>
    );
}

export default function HotelRatingsPage() {
    const { getAuthHeader } = useAuth();
    const [loading, setLoading] = useState(true);
    const [missions, setMissions] = useState([]);
    const [evaluatedMissions, setEvaluatedMissions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selected, setSelected] = useState(null);
    const [form, setForm] = useState({ rating: 5, comment: "", landingPage: false });
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("to-evaluate"); // "to-evaluate" ou "evaluated"

    const fetchMissions = useCallback(async () => {
        setLoading(true);
        try {
            // Récupérer les missions complétées
            const res = await axios.get(`${API}/shifts/hotel?status=completed`, {
                headers: getAuthHeader()
            });

            // Récupérer les avis déjà laissés par l'hôtel
            const ratingsRes = await axios.get(`${API}/hotel/my-ratings`, {
                headers: getAuthHeader()
            });
            const ratedShiftIds = new Set(ratingsRes.data.map(r => r.shift_id));

            // Séparer les missions à évaluer et évaluées
            const toEvaluate = [];
            const evaluated = [];

            (res.data || []).forEach(mission => {
                if (ratedShiftIds.has(mission.id)) {
                    evaluated.push(mission);
                } else {
                    toEvaluate.push(mission);
                }
            });

            // Trier par date de fin décroissante
            const sortByDate = (a, b) => {
                const dateA = Array.isArray(a.dates) ? a.dates[a.dates.length - 1] : a.date;
                const dateB = Array.isArray(b.dates) ? b.dates[b.dates.length - 1] : b.date;
                return new Date(dateB) - new Date(dateA);
            };

            setMissions(toEvaluate.sort(sortByDate));
            setEvaluatedMissions(evaluated.sort(sortByDate));
        } catch (e) {
            console.error(e);
            toast.error("Erreur lors du chargement des missions");
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    useEffect(() => { fetchMissions(); }, [fetchMissions]);

    const openModal = useCallback((mission) => {
        setSelected(mission);
        setForm({ rating: 5, comment: "", landingPage: false });
        setShowModal(true);
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!form.comment.trim()) {
            toast.error("Veuillez laisser un commentaire");
            return;
        }
        setSubmitting(true);
        try {
            await axios.post(`${API}/ratings`, {
                shift_id: selected.id,
                worker_id: selected.worker_id,
                rating: form.rating,
                comment: form.comment,
                for_landing_page: form.landingPage
            }, { headers: getAuthHeader() });
            toast.success("Avis envoyé ! Il sera vérifié par l'administration.");
            setShowModal(false);
            fetchMissions();
        } catch (e) {
            toast.error(e?.response?.data?.detail || "Erreur lors de l'envoi de l'avis");
        } finally {
            setSubmitting(false);
        }
    }, [form, selected, getAuthHeader, fetchMissions]);

    const fmtDate = (d) => {
        if (!d) return "—";
        try {
            return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d));
        } catch { return d; }
    };

    const getMissionDates = (mission) => {
        if (Array.isArray(mission.dates) && mission.dates.length > 0) {
            const sorted = [...mission.dates].sort();
            if (sorted.length === 1) return fmtDate(sorted[0]);
            return `${fmtDate(sorted[0])} → ${fmtDate(sorted[sorted.length - 1])}`;
        }
        return fmtDate(mission.date);
    };

    const MissionCard = ({ mission, isEvaluated = false }) => (
        <div className="bg-card rounded-xl border border-border hover:border-violet-600/30 hover:shadow-md transition-all p-5">
            <div className="flex items-start gap-4">
                {/* Avatar worker */}
                <WorkerAvatar
                    src={mission.worker_avatar}
                    name={mission.worker_name}
                />

                {/* Infos */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h3 className="font-bold text-foreground text-base leading-tight">
                                {mission.worker_name || (
                                    <span className="flex items-center gap-1.5 text-foreground/50">
                                        <User className="h-4 w-4" />
                                        Extra Shifter
                                    </span>
                                )}
                            </h3>
                            {mission.worker_avg_rating && (
                                <div className="flex items-center gap-1 mt-0.5">
                                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                    <span className="text-xs font-bold text-amber-700">{mission.worker_avg_rating}</span>
                                    <span className="text-xs text-foreground/40">note moyenne</span>
                                </div>
                            )}
                        </div>
                        {!isEvaluated && (
                            <Button
                                size="sm"
                                className="bg-violet-600 hover:bg-violet-700 text-white gap-1.5 shrink-0"
                                onClick={() => openModal(mission)}
                            >
                                <Star className="h-3.5 w-3.5" />
                                Évaluer
                            </Button>
                        )}
                    </div>

                    {/* Détails mission */}
                    <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 gap-2 text-xs text-foreground/60">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-foreground/80 truncate">{mission.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-medium">
                                {SERVICE_LABELS[mission.service_type] || mission.service_type}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3 w-3 text-violet-500" />
                            {getMissionDates(mission)}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-violet-500" />
                            {mission.start_time} – {mission.end_time}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Euro className="h-3 w-3 text-violet-500" />
                            {mission.hourly_rate}€/h
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-violet-600" />
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">Avis & Retours</h1>
                    <p className="text-foreground/70 mt-1">Évaluez les extras ayant travaillé dans votre établissement</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Liste des missions */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Tabs */}
                    <div className="flex gap-2 border-b border-border">
                        <button
                            onClick={() => setActiveTab("to-evaluate")}
                            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
                                activeTab === "to-evaluate"
                                    ? "border-violet-600 text-violet-600"
                                    : "border-transparent text-foreground/60 hover:text-foreground"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Star className="h-4 w-4" />
                                À évaluer ({missions.length})
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab("evaluated")}
                            className={`px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
                                activeTab === "evaluated"
                                    ? "border-violet-600 text-violet-600"
                                    : "border-transparent text-foreground/60 hover:text-foreground"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4" />
                                Historique ({evaluatedMissions.length})
                            </div>
                        </button>
                    </div>

                    {/* Contenu des tabs */}
                    {loading ? (
                        <div className="flex items-center justify-center h-48">
                            <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : activeTab === "to-evaluate" ? (
                        missions.length === 0 ? (
                            <div className="bg-card rounded-xl border-2 border-dashed border-border p-16 text-center">
                                <MessageSquare className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
                                <p className="text-foreground/50 font-medium">Aucune mission terminée à évaluer.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {missions.map((mission) => (
                                    <MissionCard key={mission.id} mission={mission} isEvaluated={false} />
                                ))}
                            </div>
                        )
                    ) : (
                        evaluatedMissions.length === 0 ? (
                            <div className="bg-card rounded-xl border-2 border-dashed border-border p-16 text-center">
                                <History className="h-12 w-12 text-foreground/20 mx-auto mb-4" />
                                <p className="text-foreground/50 font-medium">Aucun avis laissé pour le moment.</p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {evaluatedMissions.map((mission) => (
                                    <MissionCard key={mission.id} mission={mission} isEvaluated={true} />
                                ))}
                            </div>
                        )
                    )}
                </div>

                {/* Panneau impact */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-violet-600" />
                        <h2 className="text-sm font-bold text-foreground/60 uppercase tracking-widest">Impact</h2>
                    </div>
                    <div className="bg-violet-950 rounded-2xl p-6 text-white space-y-5 shadow-xl">
                        <p className="text-sm text-white/70 leading-relaxed">
                            Vos avis aident les extras à s'améliorer et permettent à l'administration de maintenir un haut niveau de qualité sur la plateforme.
                        </p>
                        <div className="space-y-3 pt-4 border-t border-white/10">
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span className="text-xs font-medium">Avis vérifiés par l'administration</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span className="text-xs font-medium">Visibilité sur la Landing Page si coché</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                                <span className="text-xs font-medium">Avis automatique 5★ après 30 jours sans évaluation</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal d'évaluation */}
            {showModal && selected && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl space-y-6 relative">
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 text-gray-300 hover:text-gray-700 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        {/* En-tête avec infos worker */}
                        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                            <WorkerAvatar src={selected.worker_avatar} name={selected.worker_name} />
                            <div>
                                <h3 className="text-xl font-black text-gray-900">Évaluer l'extra</h3>
                                <p className="text-sm text-gray-500 font-medium">
                                    {selected.worker_name || "Extra Shifter"} — {selected.title}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">{getMissionDates(selected)}</p>
                            </div>
                        </div>

                        {/* Étoiles */}
                        <StarPicker value={form.rating} onChange={r => setForm(f => ({ ...f, rating: r }))} />

                        {/* Commentaire */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Votre commentaire
                            </label>
                            <textarea
                                value={form.comment}
                                onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
                                placeholder="Comment s'est passée la mission ?"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-50 transition-all text-sm text-gray-900 min-h-[100px] resize-none"
                            />
                        </div>

                        {/* Toggle landing page */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                            <div>
                                <p className="text-sm font-bold text-gray-900">Partager sur la Landing Page</p>
                                <p className="text-xs text-gray-400 mt-0.5">Visible par tous après validation admin</p>
                            </div>
                            <button
                                onClick={() => setForm(f => ({ ...f, landingPage: !f.landingPage }))}
                                className={`w-11 h-6 rounded-full transition-all relative ${form.landingPage ? "bg-violet-600" : "bg-gray-200"}`}
                            >
                                <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow transition-all ${form.landingPage ? "right-1" : "left-1"}`} />
                            </button>
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-2xl gap-2"
                        >
                            {submitting ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Envoyer l'avis
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
