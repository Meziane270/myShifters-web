import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    FileText,
    Download,
    Calendar,
    Clock,
    Loader2,
    CheckCircle2,
    Clock4,
    TrendingUp,
    AlertCircle,
    FileCheck
} from "lucide-react";
import { useWorkerData } from "../../../hooks/useWorkerData";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "sonner";

export default function InvoicesPage() {
    const { fetchData, loading } = useWorkerData();
    const [invoices, setInvoices] = useState([]);
    const [earnings, setEarnings] = useState({ total: 0, paid: 0, pending: 0 });
    const [activeTab, setActiveTab] = useState("pending");

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

    // Factures en attente de paiement (inclut désormais celles à transmettre et soumises)
    const pendingPayment = useMemo(() => invoices.filter(inv =>
        inv.status === 'to_submit' ||
        inv.status === 'submitted' ||
        inv.status === 'pending' ||
        inv.status === 'verified' ||
        inv.status === 'rejected'
    ), [invoices]);

    // Factures payées
    const paidInvoices = useMemo(() => invoices.filter(inv => inv.status === 'paid'), [invoices]);

    const tabCount = (tab) => {
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
                    <p className="text-slate-500 font-medium">Gérez vos paiements et consultez vos documents de mission.</p>
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
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        {pendingPayment.length > 0 ? (
                            pendingPayment.map((inv) => (
                                <InvoiceCard key={inv.id} item={inv} />
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
                                <InvoiceCard key={inv.id} item={inv} />
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

function InvoiceCard({ item }) {
    const { getAuthHeader } = useAuth();
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

    const getStatusConfig = (status) => {
        switch (status) {
            case 'paid': return { label: "Payée", color: "bg-emerald-100 text-emerald-700" };
            case 'rejected': return { label: "Rejetée", color: "bg-red-100 text-red-700" };
            case 'submitted': return { label: "Vérification", color: "bg-violet-100 text-violet-700" };
            case 'verified':
            case 'pending': return { label: "Validée", color: "bg-orange-100 text-orange-700" };
            default: return { label: "En attente", color: "bg-slate-100 text-slate-700" };
        }
    };

    const statusCfg = getStatusConfig(item.status);

    const handlePreviewReport = async () => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URL}/api/invoices/${item.id}/mission-report`,
                { headers: getAuthHeader() }
            );
            if (!response.ok) throw new Error('Erreur lors de la prévisualisation');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (err) {
            toast.error('Erreur lors de la prévisualisation');
        }
    };

    const handlePreviewInvoice = async () => {
        try {
            const response = await fetch(
                `${process.env.REACT_APP_BACKEND_URL}/api/invoices/${item.id}/invoice-pdf`,
                { headers: getAuthHeader() }
            );
            if (!response.ok) throw new Error('Erreur lors de la prévisualisation');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            setTimeout(() => window.URL.revokeObjectURL(url), 100);
        } catch (err) {
            toast.error('Erreur lors de la prévisualisation');
        }
    };

    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-violet-600/20 transition-all">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div className="flex items-center gap-8 flex-1">
                    <div className={`h-20 w-20 rounded-3xl flex items-center justify-center shadow-inner transition-all ${
                        item.status === 'paid' ? 'bg-emerald-50 text-emerald-500' :
                            'bg-violet-600/5 text-violet-600'
                    }`}>
                        <FileText className="h-10 w-10" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-3">
                            <h4 className="font-black text-slate-900 text-xl tracking-tight">{title}</h4>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusCfg.color}`}>
                                {statusCfg.label}
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
                        {item.status === 'rejected' && item.rejection_reason && (
                            <div className="flex items-center gap-2 text-red-600 text-sm font-bold mt-1">
                                <AlertCircle className="h-4 w-4" />
                                Motif : {item.rejection_reason}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center justify-between lg:justify-end gap-12 border-t lg:border-t-0 pt-6 lg:pt-0 border-slate-50">
                    {amount > 0 && (
                        <div className="text-right min-w-[120px]">
                            <p className="text-2xl font-black text-slate-900 tracking-tighter">{amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT</p>
                        </div>
                    )}

                    <div className="flex flex-col items-center gap-3">
                        <button
                            onClick={() => handlePreviewReport()}
                            className="px-6 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-700 transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2 min-w-[180px] justify-center"
                        >
                            <FileCheck className="h-4 w-4" />
                            Relevé de mission
                        </button>
                        <button
                            onClick={() => handlePreviewInvoice()}
                            className="text-violet-600 font-bold text-sm hover:text-violet-800 transition-colors"
                        >
                            Facture
                        </button>
                    </div>
                </div>
            </div>
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
