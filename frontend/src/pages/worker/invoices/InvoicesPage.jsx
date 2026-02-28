import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { 
    FileText, 
    Download, 
    Calendar, 
    Clock, 
    Loader2,
    CheckCircle2,
    Clock4,
    Send,
    TrendingUp,
    Upload,
    X,
    AlertCircle
} from "lucide-react";
import { useWorkerData } from "../../../hooks/useWorkerData";
import { toast } from "sonner";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function InvoicesPage() {
    const { fetchData, loading } = useWorkerData();
    const { getAuthHeader } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [earnings, setEarnings] = useState({ total: 0, paid: 0, pending: 0 });
    const [activeTab, setActiveTab] = useState("to_transmit");
    const [uploading, setUploading] = useState({});

    const loadData = useCallback(async () => {
        try {
            const [invs, earn] = await Promise.all([
                fetchData('/worker/invoices').catch(() => []),
                fetchData('/worker/earnings').catch(() => ({ total: 0, paid: 0, pending: 0 }))
            ]);
            setInvoices(invs || []);
            setEarnings(earn);
        } catch (err) {
            console.error("Erreur chargement données financières:", err);
        }
    }, [fetchData]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleUploadInvoice = async (invoiceId, file) => {
        if (!file) return;
        if (file.type !== 'application/pdf') {
            toast.error("Seuls les fichiers PDF sont acceptés");
            return;
        }
        setUploading(prev => ({ ...prev, [invoiceId]: true }));
        const formData = new FormData();
        formData.append('file', file);
        formData.append('invoice_id', invoiceId);
        try {
            await axios.post(`${API}/worker/invoices/${invoiceId}/upload`, formData, {
                headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Facture transmise avec succès !");
            loadData();
        } catch (err) {
            toast.error("Erreur lors de l'envoi de la facture");
        } finally {
            setUploading(prev => ({ ...prev, [invoiceId]: false }));
        }
    };

    // Factures à transmettre : status "to_submit" (créées auto après mission terminée)
    const toTransmit = useMemo(() => invoices.filter(inv => inv.status === 'to_submit'), [invoices]);
    // Factures soumises en attente de vérification admin
    const submitted = useMemo(() => invoices.filter(inv => inv.status === 'submitted'), [invoices]);
    // Factures en attente de paiement (vérifiées par admin)
    const pendingPayment = useMemo(() => invoices.filter(inv => inv.status === 'pending' || inv.status === 'verified'), [invoices]);
    // Factures payées
    const paidInvoices = useMemo(() => invoices.filter(inv => inv.status === 'paid'), [invoices]);
    // Factures rejetées
    const rejectedInvoices = useMemo(() => invoices.filter(inv => inv.status === 'rejected'), [invoices]);

    const tabCount = (tab) => {
        if (tab === 'to_transmit') return toTransmit.length + submitted.length;
        if (tab === 'pending') return pendingPayment.length;
        if (tab === 'paid') return paidInvoices.length;
        return 0;
    };

    if (loading && invoices.length === 0) {
        return (
            <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
                <p className="text-slate-500 font-medium">Chargement de vos factures...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 animate-fade-in pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight font-display">Mes Factures</h1>
                    <p className="text-slate-500 font-medium">Gérez vos paiements et transmettez vos factures.</p>
                </div>
                
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 group hover:shadow-xl transition-all">
                    <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-110 transition-transform">
                        <TrendingUp className="h-7 w-7" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">CA Réel Total</p>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{(earnings.total || 0).toLocaleString('fr-FR')} €</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 p-2 bg-white border border-slate-100 rounded-[2rem] shadow-sm">
                {[
                    { id: 'to_transmit', label: 'À transmettre', icon: Send, color: 'text-violet-600' },
                    { id: 'pending', label: 'En attente de paiement', icon: Clock4, color: 'text-orange-500' },
                    { id: 'paid', label: 'Payées', icon: CheckCircle2, color: 'text-emerald-500' }
                ].map((tab) => {
                    const count = tabCount(tab.id);
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold text-sm transition-all ${
                                activeTab === tab.id 
                                ? 'bg-violet-600 text-white shadow-xl shadow-violet-600/20' 
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            <tab.icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-white' : tab.color}`} />
                            {tab.label}
                            {count > 0 && (
                                <span className={`h-5 w-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                                    activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-violet-600/10 text-violet-600'
                                }`}>{count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="grid gap-6">
                {activeTab === 'to_transmit' && (
                    <div className="space-y-4">
                        {toTransmit.length === 0 && submitted.length === 0 ? (
                            <EmptyState icon={FileText} text="Aucune facture à transmettre pour le moment." subtext="Les factures apparaissent automatiquement lorsqu'une mission est marquée terminée." />
                        ) : (
                            <>
                                {toTransmit.map((inv) => (
                                    <InvoiceCard 
                                        key={inv.id} 
                                        item={inv} 
                                        type="to_transmit" 
                                        onUpload={handleUploadInvoice}
                                        uploading={uploading[inv.id]}
                                    />
                                ))}
                                {submitted.map((inv) => (
                                    <InvoiceCard 
                                        key={inv.id} 
                                        item={inv} 
                                        type="submitted" 
                                        onUpload={handleUploadInvoice}
                                        uploading={uploading[inv.id]}
                                    />
                                ))}
                                {rejectedInvoices.map((inv) => (
                                    <InvoiceCard 
                                        key={inv.id} 
                                        item={inv} 
                                        type="rejected" 
                                        onUpload={handleUploadInvoice}
                                        uploading={uploading[inv.id]}
                                    />
                                ))}
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {pendingPayment.length > 0 ? (
                            pendingPayment.map((inv) => (
                                <InvoiceCard key={inv.id} item={inv} type="pending" />
                            ))
                        ) : (
                            <EmptyState icon={Clock4} text="Aucune facture en attente de paiement." />
                        )}
                    </div>
                )}

                {activeTab === 'paid' && (
                    <div className="space-y-4">
                        {paidInvoices.length > 0 ? (
                            paidInvoices.map((inv) => (
                                <InvoiceCard key={inv.id} item={inv} type="paid" />
                            ))
                        ) : (
                            <EmptyState icon={CheckCircle2} text="Aucune facture payée pour le moment." />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function InvoiceCard({ item, type, onUpload, uploading }) {
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const hotelName = item.hotel_name || "Hôtel Partenaire";
    const title = item.shift_title || "Mission";
    const dates = item.dates || [];
    const firstDate = dates.length > 0 ? dates[0] : (item.date || "");
    const hours = item.start_time && item.end_time ? `${item.start_time} - ${item.end_time}` : "";

    // Calcul du montant
    let amount = 0;
    if (item.hourly_rate && item.start_time && item.end_time) {
        const [sh, sm] = item.start_time.split(':').map(Number);
        const [eh, em] = item.end_time.split(':').map(Number);
        let startMin = sh * 60 + sm;
        let endMin = eh * 60 + em;
        if (endMin <= startMin) endMin += 24 * 60;
        const duration = (endMin - startMin) / 60;
        const nbDays = dates.length || 1;
        amount = item.hourly_rate * duration * nbDays;
    }

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && onUpload) onUpload(item.id, file);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file && onUpload) onUpload(item.id, file);
    };

    const statusBadge = {
        to_submit: { label: "À transmettre", color: "bg-violet-600/10 text-violet-600" },
        submitted: { label: "En cours de vérification", color: "bg-violet-100 text-violet-700" },
        verified: { label: "Vérifiée", color: "bg-emerald-100 text-emerald-700" },
        pending: { label: "En attente de paiement", color: "bg-orange-100 text-orange-700" },
        paid: { label: "Payée", color: "bg-emerald-100 text-emerald-700" },
        rejected: { label: "Rejetée", color: "bg-red-100 text-red-700" }
    }[type] || { label: type, color: "bg-slate-100 text-slate-700" };

    return (
        <div className={`bg-white p-8 rounded-[2.5rem] border shadow-sm transition-all ${
            type === 'rejected' ? 'border-red-200 bg-red-50' :
            dragOver ? 'border-violet-600 border-2 shadow-xl shadow-violet-600/10' : 'border-slate-100 hover:shadow-xl hover:border-violet-600/20'
        }`}
            onDragOver={type === 'to_submit' ? (e) => { e.preventDefault(); setDragOver(true); } : undefined}
            onDragLeave={type === 'to_submit' ? () => setDragOver(false) : undefined}
            onDrop={type === 'to_submit' ? handleDrop : undefined}
        >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-8 flex-1">
                    <div className={`h-20 w-20 rounded-3xl flex items-center justify-center shadow-inner transition-all ${
                        type === 'paid' ? 'bg-emerald-50 text-emerald-500' : 
                        type === 'pending' || type === 'verified' ? 'bg-orange-50 text-orange-500' : 
                        type === 'rejected' ? 'bg-red-100 text-red-500' :
                        type === 'submitted' ? 'bg-violet-50 text-violet-500' :
                        'bg-violet-600/5 text-violet-600'
                    }`}>
                        <FileText className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h4 className="font-black text-slate-900 text-xl tracking-tight">{title}</h4>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusBadge.color}`}>
                                {statusBadge.label}
                            </span>
                        </div>
                        <p className="text-violet-600 font-bold text-sm">{hotelName}</p>
                        <div className="flex flex-wrap gap-6">
                            {firstDate && (
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                    <Calendar className="h-4 w-4 text-violet-600" />
                                    {dates.length > 1 ? `${dates.length} jours` : firstDate}
                                </div>
                            )}
                            {hours && (
                                <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
                                    <Clock className="h-4 w-4 text-violet-600" />
                                    {hours}
                                </div>
                            )}
                        </div>
                        {type === 'rejected' && item.rejection_reason && (
                            <div className="flex items-center gap-2 text-red-600 text-sm font-bold mt-1">
                                <AlertCircle className="h-4 w-4" />
                                Motif : {item.rejection_reason}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-12 border-t lg:border-t-0 pt-6 lg:pt-0 border-slate-50">
                    {amount > 0 && (
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Montant TTC</p>
                            <p className="text-3xl font-black text-violet-600 tracking-tighter">{amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</p>
                        </div>
                    )}

                    {(type === 'to_submit' || type === 'rejected') && (
                        <div className="flex flex-col items-center gap-2">
                            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={handleFileSelect} />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                                className={`h-16 px-8 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all shadow-xl ${
                                    dragOver 
                                    ? 'bg-violet-600 text-white scale-105 shadow-violet-600/30' 
                                    : uploading 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-violet-600 text-white hover:bg-violet-600-light shadow-violet-600/20'
                                }`}
                            >
                                {uploading ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <Upload className="h-5 w-5" />
                                )}
                                {type === 'rejected' ? 'Renvoyer' : 'Transmettre'}
                            </button>
                            <p className="text-[10px] text-slate-400 font-bold">ou glissez-déposez ici</p>
                        </div>
                    )}

                    {type === 'submitted' && (
                        <div className="flex items-center gap-3 px-6 py-4 bg-violet-50 rounded-2xl">
                            <Clock className="h-5 w-5 text-violet-500" />
                            <span className="text-violet-700 font-bold text-sm">En cours de vérification</span>
                        </div>
                    )}

                    {(type === 'paid' || type === 'pending' || type === 'verified') && item.url && (
                        <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="h-16 w-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-violet-600 transition-all shadow-xl shadow-slate-200 hover:shadow-violet-600/20"
                        >
                            <Download className="h-7 w-7" />
                        </a>
                    )}
                </div>
            </div>

            {/* Zone drag & drop visuelle */}
            {type === 'to_submit' && dragOver && (
                <div className="mt-6 border-2 border-dashed border-violet-600 rounded-2xl p-6 text-center text-violet-600 font-bold text-sm bg-violet-600/5 animate-pulse">
                    Relâchez pour envoyer votre facture PDF
                </div>
            )}
        </div>
    );
}

function EmptyState({ icon: Icon, text, subtext }) {
    return (
        <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-20 text-center">
            <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                <Icon className="h-10 w-10" />
            </div>
            <p className="text-slate-400 font-bold">{text}</p>
            {subtext && <p className="text-slate-300 text-sm mt-2">{subtext}</p>}
        </div>
    );
}
