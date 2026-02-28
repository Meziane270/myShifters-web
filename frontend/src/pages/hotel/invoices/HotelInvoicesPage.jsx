import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../../../context/AuthContext";
import axios from "axios";
import { toast } from "sonner";
import {
    FileText, Euro, Building2, Calendar, Clock,
    Upload, CheckCircle, AlertCircle, Loader2,
    TrendingUp, Percent, Receipt, CreditCard, ExternalLink
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_CONFIG = {
    sent: { label: "En attente de règlement", cls: "bg-amber-500/15 text-amber-700" },
    payment_submitted: { label: "Paiement soumis", cls: "bg-violet-500/15 text-violet-700" },
    paid: { label: "Payée", cls: "bg-emerald-500/15 text-emerald-700" },
    draft: { label: "Brouillon", cls: "bg-gray-100 text-gray-600" },
};

function StatCard({ icon: Icon, label, value, sub, color = "violet" }) {
    const colors = {
        violet: "bg-violet-50 border-violet-100 text-violet-700",
        emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
        amber: "bg-amber-50 border-amber-100 text-amber-700",
        sky: "bg-sky-50 border-sky-100 text-sky-700",
    };
    return (
        <div className={`rounded-2xl border p-5 ${colors[color]}`}>
            <div className="flex items-center gap-3 mb-2">
                <Icon className="w-5 h-5 opacity-70" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-70">{label}</span>
            </div>
            <div className="text-2xl font-black">{value}</div>
            {sub && <div className="text-xs mt-1 opacity-60">{sub}</div>}
        </div>
    );
}

function InvoiceCard({ invoice, onSubmitPayment }) {
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef();
    const { getAuthHeader } = useAuth();

    const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);
    const fmtDate = (d) => d ? new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(d)) : "—";

    const handleFile = useCallback(async (file) => {
        if (!file) return;
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("file", file);
            fd.append("payment_method", "transfer");
            await axios.post(`${API}/hotel/invoices/${invoice.id}/payment`, fd, {
                headers: { ...getAuthHeader() }
            });
            toast.success("Avis de virement transmis !");
            onSubmitPayment();
        } catch {
            toast.error("Erreur lors de l'envoi");
        } finally {
            setUploading(false);
        }
    }, [invoice.id, getAuthHeader, onSubmitPayment]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleMarkPaid = useCallback(async () => {
        setUploading(true);
        try {
            const fd = new FormData();
            fd.append("payment_method", "bank_transfer");
            await axios.post(`${API}/hotel/invoices/${invoice.id}/payment`, fd, {
                headers: { ...getAuthHeader() }
            });
            toast.success("Paiement signalé !");
            onSubmitPayment();
        } catch {
            toast.error("Erreur");
        } finally {
            setUploading(false);
        }
    }, [invoice.id, getAuthHeader, onSubmitPayment]);

    const cfg = STATUS_CONFIG[invoice.status] || { label: invoice.status, cls: "bg-gray-100 text-gray-600" };
    const canSubmit = invoice.status === "sent";

    return (
        <div className="bg-card rounded-xl border border-border hover:border-violet-600/30 transition-colors p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Badge className={`${cfg.cls} border-0`}>{cfg.label}</Badge>
                        {invoice.file_name && (
                            <span className="text-xs text-foreground/50 font-mono">{invoice.file_name}</span>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-foreground/70">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-violet-600" />
                            {fmtDate(invoice.sent_at || invoice.created_at)}
                        </div>
                        {invoice.amount_total && (
                            <div className="flex items-center gap-2 font-semibold text-foreground">
                                <Euro className="w-4 h-4 text-violet-600" />
                                {fmt(invoice.amount_total)}
                            </div>
                        )}
                    </div>
                </div>
                {invoice.file_url && (
                    <a href={invoice.file_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" />
                            Voir
                        </Button>
                    </a>
                )}
            </div>

            {/* Zone drag & drop avis de virement */}
            {canSubmit && (
                <div
                    className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer ${
                        dragging ? "border-violet-500 bg-violet-50" : "border-border hover:border-violet-400 hover:bg-violet-50/30"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileRef.current?.click()}
                >
                    <input ref={fileRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={e => handleFile(e.target.files[0])} />
                    {uploading ? (
                        <div className="flex items-center justify-center gap-2 text-violet-600">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span className="text-sm font-medium">Envoi en cours...</span>
                        </div>
                    ) : (
                        <>
                            <Upload className="w-6 h-6 text-violet-400 mx-auto mb-2" />
                            <p className="text-sm font-medium text-foreground/70">
                                Glissez votre avis de virement ici
                            </p>
                            <p className="text-xs text-foreground/40 mt-1">ou cliquez pour sélectionner (PDF, JPG, PNG)</p>
                        </>
                    )}
                </div>
            )}

            {/* Bouton marquer comme payé */}
            {canSubmit && (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-2"
                    onClick={handleMarkPaid}
                    disabled={uploading}
                >
                    <CheckCircle className="w-4 h-4" />
                    Marquer comme payé (virement effectué)
                </Button>
            )}

            {/* Preuve de paiement soumise */}
            {invoice.status === "payment_submitted" && (
                <div className="flex items-center gap-2 p-3 bg-violet-50 rounded-lg text-sm text-violet-700">
                    <CheckCircle className="w-4 h-4" />
                    <span>Paiement soumis — en attente de validation par l'administration</span>
                    {invoice.payment_proof_url && (
                        <a href={invoice.payment_proof_url} target="_blank" rel="noreferrer" className="ml-auto text-xs underline">
                            Voir preuve
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}

export default function HotelInvoicesPage() {
    const { getAuthHeader } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending");

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/hotel/invoices/stats`, { headers: getAuthHeader() });
            setStats(res.data);
        } catch {
            toast.error("Erreur lors du chargement des données financières");
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n || 0);
    const fmtPct = (n) => `${Math.round((n || 0) * 100)}%`;

    const invoices = stats?.invoices || [];
    const pendingInvoices = invoices.filter(i => i.status === "sent");
    const submittedInvoices = invoices.filter(i => i.status === "payment_submitted");
    const paidInvoices = invoices.filter(i => i.status === "paid");

    const tabs = [
        { id: "pending", label: "En attente de règlement", count: pendingInvoices.length, color: "amber" },
        { id: "submitted", label: "Paiement soumis", count: submittedInvoices.length, color: "violet" },
        { id: "paid", label: "Payées", count: paidInvoices.length, color: "emerald" },
    ];

    const currentInvoices = activeTab === "pending" ? pendingInvoices
        : activeTab === "submitted" ? submittedInvoices
            : paidInvoices;

    return (
        <div className="space-y-8">
            <div>
                <div className="flex items-center gap-3">
                    <Receipt className="w-8 h-8 text-violet-600" />
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Mes Factures</h1>
                        <p className="text-foreground/70 mt-1">Suivi financier et règlement de vos factures</p>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Statistiques financières */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatCard
                            icon={TrendingUp}
                            label="Chiffre d'affaires HT"
                            value={fmt(stats?.total_ca_ht)}
                            sub={`${stats?.completed_missions || 0} mission(s) terminée(s)`}
                            color="violet"
                        />
                        <StatCard
                            icon={Percent}
                            label="Commission plateforme"
                            value={fmt(stats?.commission_amount)}
                            sub={`Taux : ${fmtPct(stats?.commission_rate)}`}
                            color="amber"
                        />
                        <StatCard
                            icon={Euro}
                            label="TVA"
                            value={fmt(stats?.tva_amount)}
                            sub={`Taux : ${fmtPct(stats?.tva_rate)}`}
                            color="sky"
                        />
                        <StatCard
                            icon={CreditCard}
                            label="Total TTC"
                            value={fmt(stats?.total_ttc)}
                            sub="Montant total à régler"
                            color="emerald"
                        />
                    </div>

                    {/* Onglets factures */}
                    <div>
                        <div className="flex gap-2 mb-6 border-b border-border">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
                                        activeTab === tab.id
                                            ? "border-violet-600 text-violet-600"
                                            : "border-transparent text-foreground/50 hover:text-foreground"
                                    }`}
                                >
                                    {tab.label}
                                    {tab.count > 0 && (
                                        <span className={`text-xs rounded-full px-2 py-0.5 font-bold ${
                                            tab.color === "amber" ? "bg-amber-100 text-amber-700" :
                                                tab.color === "violet" ? "bg-violet-100 text-violet-700" :
                                                    "bg-emerald-100 text-emerald-700"
                                        }`}>
                                            {tab.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {currentInvoices.length === 0 ? (
                            <div className="text-center py-16 bg-card rounded-xl border border-border">
                                <FileText className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                                    Aucune facture
                                </h3>
                                <p className="text-foreground/70">
                                    {activeTab === "pending"
                                        ? "Vous n'avez aucune facture en attente de règlement"
                                        : activeTab === "submitted"
                                            ? "Aucun paiement soumis en attente de validation"
                                            : "Aucune facture payée pour le moment"}
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {currentInvoices.map(invoice => (
                                    <InvoiceCard
                                        key={invoice.id}
                                        invoice={invoice}
                                        onSubmitPayment={fetchStats}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
