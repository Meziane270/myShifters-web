// src/pages/worker/shifts/components/ShiftDetailModal.jsx
import { useState, useCallback, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Textarea } from "../../../../components/ui/textarea";
import {
    Building2,
    MapPin,
    Calendar,
    Clock,
    Euro,
    Briefcase,
    Send,
    Info,
    Loader2,
    XCircle,
    AlertTriangle
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SERVICE_LABELS = {
    reception: "Réception",
    housekeeping: "Housekeeping",
    restaurant: "Restauration & Salle",
    maintenance: "Maintenance technique",
    bar: "Bar",
    spa: "Spa & Bien-être",
    events: "Événementiel",
    other: "Autre",
};

export default function ShiftDetailModal({ shift, application, isOpen, onClose, onSuccess }) {
    const { getAuthHeader, user } = useAuth();
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    const currentApplication = application || shift?._application || null;
    const isApplication = !!currentApplication;
    const isVerified = user?.verification_status === "verified";
    const isCancelled = shift?.status === "cancelled";

    // Soumettre une candidature
    const handleApply = useCallback(async () => {
        if (!shift?.id) return;
        if (!isVerified) {
            toast.error("Votre profil doit être vérifié pour postuler.");
            return;
        }
        setLoading(true);
        try {
            await axios.post(
                `${API}/applications`,
                { shift_id: shift.id, message: message.trim() || undefined },
                { headers: getAuthHeader() }
            );
            toast.success("Candidature envoyée avec succès !");
            setMessage("");
            onSuccess?.();
            onClose?.();
        } catch (e) {
            const errorMsg = e?.response?.data?.detail || "Erreur lors de la candidature.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [shift, message, getAuthHeader, onSuccess, onClose, isVerified]);

    // Annuler une candidature
    const handleCancelApplication = useCallback(async () => {
        if (!currentApplication?.id) return;
        setLoading(true);
        try {
            await axios.delete(`${API}/applications/${currentApplication.id}`, {
                headers: getAuthHeader(),
            });
            toast.success("Candidature annulée.");
            onSuccess?.();
            onClose?.();
        } catch (e) {
            const errorMsg = e?.response?.data?.detail || "Erreur lors de l'annulation.";
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, [currentApplication, getAuthHeader, onSuccess, onClose]);

    const calculateTotalPay = useMemo(() => {
        if (!shift) return "0.00";
        const rate = shift.hourly_rate || 0;
        let duration = 0;
        if (shift.start_time && shift.end_time) {
            try {
                const [startH, startM] = shift.start_time.split(":").map(Number);
                const [endH, endM] = shift.end_time.split(":").map(Number);
                let startMinutes = startH * 60 + startM;
                let endMinutes = endH * 60 + endM;
                if (endMinutes <= startMinutes) endMinutes += 24 * 60;
                duration = (endMinutes - startMinutes) / 60;
            } catch {}
        }
        const days = Array.isArray(shift.dates) ? shift.dates.length : 1;
        return (rate * duration * days).toFixed(2);
    }, [shift]);

    if (!shift) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        try {
            return new Date(dateStr).toLocaleDateString("fr-FR", {
                weekday: "short",
                day: "numeric",
                month: "short",
            });
        } catch {
            return dateStr;
        }
    };

    // Dates triées par ordre chronologique
    const sortedDates = useMemo(() => {
        if (!Array.isArray(shift.dates) || shift.dates.length === 0) return [];
        return [...shift.dates].sort((a, b) => new Date(a) - new Date(b));
    }, [shift.dates]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg bg-white rounded-3xl border border-slate-100 shadow-2xl p-0 overflow-hidden">
                {/* Header */}
                <div className={`px-7 pt-7 pb-5 ${isCancelled ? "bg-red-50 border-b border-red-100" : "bg-gradient-to-br from-violet-950 to-violet-800"}`}>
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isCancelled ? "text-red-400" : "text-violet-300"}`}>
                                {isCancelled ? "Mission annulée" : "Détails de la mission"}
                            </p>
                            <h2 className={`text-xl font-black leading-tight ${isCancelled ? "text-red-700" : "text-white"}`}>
                                {shift.title || "Mission"}
                            </h2>
                            <div className={`flex items-center gap-2 mt-1.5 text-sm font-bold ${isCancelled ? "text-red-500" : "text-violet-200"}`}>
                                <Building2 className="h-4 w-4 shrink-0" />
                                <span className="truncate">{shift.hotel_name || "Hôtel"}</span>
                            </div>
                        </div>
                        {isCancelled && (
                            <span className="shrink-0 px-3 py-1.5 bg-red-100 text-red-700 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-200">
                                Annulée
                            </span>
                        )}
                    </div>
                </div>

                {/* Corps */}
                <div className="px-7 py-5 space-y-4 max-h-[55vh] overflow-y-auto">
                    {isCancelled && (
                        <div className="flex items-start gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-sm text-red-700 font-medium">
                                Cette mission a été annulée par l'établissement.
                            </p>
                        </div>
                    )}

                    {/* Dates triées */}
                    {sortedDates.length > 0 && (
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                <Calendar className="h-3 w-3" /> Dates
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {sortedDates.map((d, i) => (
                                    <span key={i} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-xl text-xs font-bold border border-violet-100">
                                        {formatDate(d)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Horaires + Lieu */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" /> Horaires
                            </p>
                            <p className="font-bold text-slate-900 text-sm">{shift.start_time} — {shift.end_time}</p>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3" /> Lieu
                            </p>
                            <p className="font-bold text-slate-900 text-sm truncate">{shift.hotel_city || "Paris"}</p>
                        </div>
                    </div>

                    {/* Service + Rémunération */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Briefcase className="h-3 w-3" /> Service
                            </p>
                            <p className="font-bold text-slate-900 text-sm">
                                {SERVICE_LABELS[shift.service_type] || shift.service_type || "—"}
                            </p>
                        </div>
                        <div className="p-3 bg-violet-50 rounded-2xl border border-violet-100">
                            <p className="text-[10px] font-black text-violet-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Euro className="h-3 w-3" /> Rémunération
                            </p>
                            <p className="font-black text-violet-900 text-sm">{shift.hourly_rate}€/h</p>
                            <p className="text-xs font-bold text-violet-600 mt-0.5">Total : {calculateTotalPay}€</p>
                        </div>
                    </div>

                    {/* Description */}
                    {shift.description && (
                        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                                <Info className="h-3 w-3" /> Description
                            </p>
                            <p className="text-sm text-slate-600 leading-relaxed">{shift.description}</p>
                        </div>
                    )}

                    {/* Message de motivation (uniquement si pas encore candidaté et pas annulé) */}
                    {!isApplication && !isCancelled && (
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Message de motivation (optionnel)
                            </label>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Parlez-nous de votre expérience..."
                                className="bg-slate-50 border-slate-100 rounded-2xl min-h-[80px] text-sm"
                            />
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-7 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-slate-200 rounded-xl px-6 font-bold text-sm"
                    >
                        Fermer
                    </Button>

                    {/* Candidature en attente → annuler */}
                    {isApplication && !isCancelled && currentApplication?.status === "pending" && (
                        <Button
                            onClick={handleCancelApplication}
                            disabled={loading}
                            className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-6 font-bold text-sm shadow-lg shadow-red-200"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XCircle className="w-4 h-4 mr-2" />}
                            Annuler ma candidature
                        </Button>
                    )}

                    {/* Pas encore candidaté et mission ouverte → postuler */}
                    {!isApplication && !isCancelled && (
                        <Button
                            onClick={handleApply}
                            disabled={loading || !isVerified}
                            className="bg-violet-800 hover:bg-violet-700 text-white rounded-xl px-6 font-bold text-sm shadow-lg shadow-violet-200 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                            Envoyer ma candidature
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
