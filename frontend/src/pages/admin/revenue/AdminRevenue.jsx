// src/pages/admin/revenue/AdminRevenue.jsx
import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import {
    RefreshCw,
    Euro,
    FileText,
    TrendingUp,
    CheckCircle,
    XCircle,
    Clock,
    Upload,
    Eye,
    Building2,
    User,
    Banknote
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const formatCurrency = (amount) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);

const formatDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const statusBadge = (status) => {
    const map = {
        submitted: { label: 'Soumise', color: 'bg-amber-100 text-amber-700 border-amber-200' },
        verified: { label: 'Vérifiée', color: 'bg-violet-100 text-violet-700 border-violet-200' },
        pending: { label: 'En attente paiement', color: 'bg-violet-100 text-violet-700 border-violet-200' },
        paid: { label: 'Payée', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
        rejected: { label: 'Rejetée', color: 'bg-red-100 text-red-700 border-red-200' },
        sent: { label: 'Envoyée', color: 'bg-sky-100 text-sky-700 border-sky-200' },
        draft: { label: 'Brouillon', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    };
    const s = map[status] || { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.color}`}>{s.label}</span>;
};

export default function AdminRevenue() {
    const { getAuthHeader } = useAuth();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [rejectModal, setRejectModal] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [hotelUploadModal, setHotelUploadModal] = useState(false);
    const [hotelList, setHotelList] = useState([]);
    const [selectedHotel, setSelectedHotel] = useState('');
    const [hotelFile, setHotelFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/admin/revenue`, { headers: getAuthHeader() });
            setData(res.data);
        } catch {
            toast.error("Impossible de charger les données de revenus");
        } finally {
            setLoading(false);
        }
    }, [getAuthHeader]);

    const fetchHotels = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/admin/users?role=hotel`, { headers: getAuthHeader() });
            setHotelList(res.data?.users || []);
        } catch {}
    }, [getAuthHeader]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleInvoiceAction = async (invoiceId, status, reason = '') => {
        setActionLoading(invoiceId);
        try {
            await axios.put(`${API}/admin/invoices/${invoiceId}`, { status, rejection_reason: reason }, { headers: getAuthHeader() });
            toast.success(status === 'verified' ? 'Facture validée' : status === 'paid' ? 'Facture marquée payée' : 'Facture rejetée');
            fetchData();
        } catch {
            toast.error("Erreur lors de la mise à jour");
        } finally {
            setActionLoading(null);
            setRejectModal(null);
            setRejectReason('');
        }
    };

    const handleHotelInvoiceUpload = async () => {
        if (!selectedHotel || !hotelFile) return;
        const formData = new FormData();
        formData.append('hotel_id', selectedHotel);
        formData.append('file', hotelFile);
        try {
            await axios.post(`${API}/admin/invoices/hotel`, formData, {
                headers: { ...getAuthHeader(), 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Facture envoyée à l'hôtel");
            setHotelUploadModal(false);
            setSelectedHotel('');
            setHotelFile(null);
            fetchData();
        } catch {
            toast.error("Erreur lors de l'envoi");
        }
    };

    const WorkerInvoiceCard = ({ invoice, showActions = false, showPaidAction = false }) => (
        <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-violet-200 transition-colors">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <User className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm">{invoice.worker_name || 'Worker'}</p>
                    <p className="text-xs text-gray-500">{invoice.shift_title || 'Mission'} · {formatDate(invoice.created_at)}</p>
                    <p className="text-xs text-gray-500">{invoice.worker_email}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="text-right">
                    <p className="font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                    {statusBadge(invoice.status)}
                </div>
                {invoice.file_url && (
                    <a href={invoice.file_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="border-gray-200">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </a>
                )}
                {showActions && (
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            className="bg-violet-600 hover:bg-violet-500 text-white"
                            disabled={actionLoading === invoice.id}
                            onClick={() => handleInvoiceAction(invoice.id, 'verified')}
                        >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Valider
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => setRejectModal(invoice)}
                        >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeter
                        </Button>
                    </div>
                )}
                {showPaidAction && (
                    <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white"
                        disabled={actionLoading === invoice.id}
                        onClick={() => handleInvoiceAction(invoice.id, 'paid')}
                    >
                        <Banknote className="h-4 w-4 mr-1" />
                        Marquer payée
                    </Button>
                )}
            </div>
        </div>
    );

    const HotelInvoiceCard = ({ invoice }) => (
        <div className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-violet-200 transition-colors">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-sky-600" />
                </div>
                <div>
                    <p className="font-semibold text-gray-900 text-sm">{invoice.hotel_name || 'Hôtel'}</p>
                    <p className="text-xs text-gray-500">{invoice.file_name} · {formatDate(invoice.sent_at || invoice.created_at)}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                {statusBadge(invoice.status)}
                {invoice.file_url && (
                    <a href={invoice.file_url} target="_blank" rel="noreferrer">
                        <Button variant="outline" size="sm" className="border-gray-200">
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                        </Button>
                    </a>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-gray-900">Revenus</h1>
                    <p className="text-gray-500 mt-1">Chiffre d'affaires, commissions et factures</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        className="border-gray-200"
                        onClick={() => { fetchHotels(); setHotelUploadModal(true); }}
                    >
                        <Upload className="w-4 h-4 mr-2" />
                        Envoyer facture hôtel
                    </Button>
                    <Button variant="outline" className="border-gray-200" onClick={fetchData}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Actualiser
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                                    <Euro className="h-5 w-5 text-violet-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Chiffre d'affaires</span>
                            </div>
                            <p className="text-2xl font-black text-gray-900">{formatCurrency(data?.total_ca)}</p>
                            <p className="text-xs text-gray-400 mt-1">{data?.completed_shifts_count || 0} mission{data?.completed_shifts_count > 1 ? 's' : ''} terminée{data?.completed_shifts_count > 1 ? 's' : ''}</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Commission plateforme</span>
                            </div>
                            <p className="text-2xl font-black text-gray-900">{formatCurrency(data?.commission_amount)}</p>
                            <p className="text-xs text-gray-400 mt-1">Taux : {((data?.commission_rate || 0.15) * 100).toFixed(0)}%</p>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                                    <FileText className="h-5 w-5 text-amber-600" />
                                </div>
                                <span className="text-sm font-medium text-gray-500">Factures à traiter</span>
                            </div>
                            <p className="text-2xl font-black text-gray-900">
                                {(data?.worker_invoices_to_review?.length || 0) + (data?.worker_invoices_pending_payment?.length || 0)}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                {data?.worker_invoices_to_review?.length || 0} à vérifier · {data?.worker_invoices_pending_payment?.length || 0} en attente paiement
                            </p>
                        </div>
                    </div>

                    {/* Factures */}
                    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                        <Tabs defaultValue="to_review">
                            <div className="px-6 pt-6 border-b border-gray-100">
                                <h2 className="font-bold text-gray-900 mb-4">Gestion des factures</h2>
                                <TabsList className="bg-gray-50 border border-gray-200">
                                    <TabsTrigger value="to_review" className="data-[state=active]:bg-white data-[state=active]:text-violet-700">
                                        Factures extras à approuver
                                        {data?.worker_invoices_to_review?.length > 0 && (
                                            <span className="ml-2 bg-amber-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold">
                                                {data.worker_invoices_to_review.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger value="pending_payment" className="data-[state=active]:bg-white data-[state=active]:text-violet-700">
                                        Factures hôtels à envoyer
                                    </TabsTrigger>
                                    <TabsTrigger value="sent" className="data-[state=active]:bg-white data-[state=active]:text-violet-700">
                                        Factures envoyées
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Onglet 1 : Factures extras à approuver */}
                            <TabsContent value="to_review" className="p-6">
                                <div className="space-y-3">
                                    {data?.worker_invoices_to_review?.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                            <p className="font-medium">Aucune facture en attente de validation</p>
                                        </div>
                                    ) : (
                                        data.worker_invoices_to_review.map(inv => (
                                            <WorkerInvoiceCard key={inv.id} invoice={inv} showActions />
                                        ))
                                    )}
                                </div>
                                {/* Factures en attente de paiement */}
                                {data?.worker_invoices_pending_payment?.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-violet-500" />
                                            En attente de paiement ({data.worker_invoices_pending_payment.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {data.worker_invoices_pending_payment.map(inv => (
                                                <WorkerInvoiceCard key={inv.id} invoice={inv} showPaidAction />
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {/* Factures payées */}
                                {data?.worker_invoices_paid?.length > 0 && (
                                    <div className="mt-6">
                                        <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-emerald-500" />
                                            Payées ({data.worker_invoices_paid.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {data.worker_invoices_paid.map(inv => (
                                                <WorkerInvoiceCard key={inv.id} invoice={inv} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </TabsContent>

                            {/* Onglet 2 : Factures hôtels à envoyer */}
                            <TabsContent value="pending_payment" className="p-6">
                                <div className="mb-4 flex justify-end">
                                    <Button
                                        className="bg-violet-600 hover:bg-violet-500 text-white"
                                        onClick={() => { fetchHotels(); setHotelUploadModal(true); }}
                                    >
                                        <Upload className="h-4 w-4 mr-2" />
                                        Envoyer une facture à un hôtel
                                    </Button>
                                </div>
                                <div className="space-y-3">
                                    {data?.hotel_invoices_to_send?.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                            <p className="font-medium">Aucune facture hôtel en brouillon</p>
                                        </div>
                                    ) : (
                                        data.hotel_invoices_to_send.map(inv => (
                                            <HotelInvoiceCard key={inv.id} invoice={inv} />
                                        ))
                                    )}
                                </div>
                            </TabsContent>

                            {/* Onglet 3 : Factures envoyées */}
                            <TabsContent value="sent" className="p-6">
                                <div className="space-y-3">
                                    {data?.hotel_invoices_sent?.length === 0 ? (
                                        <div className="text-center py-12 text-gray-400">
                                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                            <p className="font-medium">Aucune facture envoyée</p>
                                        </div>
                                    ) : (
                                        data.hotel_invoices_sent.map(inv => (
                                            <HotelInvoiceCard key={inv.id} invoice={inv} />
                                        ))
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </>
            )}

            {/* Modal rejet facture */}
            {rejectModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-bold text-gray-900 mb-4">Rejeter la facture</h3>
                        <textarea
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500"
                            rows={4}
                            placeholder="Motif du rejet..."
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value)}
                        />
                        <div className="flex gap-3 mt-4">
                            <Button variant="outline" className="flex-1 border-gray-200" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
                                Annuler
                            </Button>
                            <Button
                                className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                                disabled={!rejectReason.trim()}
                                onClick={() => handleInvoiceAction(rejectModal.id, 'rejected', rejectReason)}
                            >
                                Confirmer le rejet
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal upload facture hôtel */}
            {hotelUploadModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                        <h3 className="font-bold text-gray-900 mb-4">Envoyer une facture à un hôtel</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1.5">Hôtel destinataire</label>
                                <select
                                    className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    value={selectedHotel}
                                    onChange={e => setSelectedHotel(e.target.value)}
                                >
                                    <option value="">Sélectionner un hôtel...</option>
                                    {hotelList.map(h => (
                                        <option key={h.id} value={h.id}>{h.hotel_name || h.email}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 block mb-1.5">Fichier (PDF)</label>
                                <div
                                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragOver ? 'border-violet-500 bg-violet-50' : 'border-gray-200 hover:border-violet-300'}`}
                                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) setHotelFile(f); }}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.png" className="hidden" onChange={e => setHotelFile(e.target.files[0])} />
                                    {hotelFile ? (
                                        <p className="text-sm font-medium text-violet-700">{hotelFile.name}</p>
                                    ) : (
                                        <>
                                            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm text-gray-500">Glissez-déposez ou cliquez pour sélectionner</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button variant="outline" className="flex-1 border-gray-200" onClick={() => { setHotelUploadModal(false); setSelectedHotel(''); setHotelFile(null); }}>
                                Annuler
                            </Button>
                            <Button
                                className="flex-1 bg-violet-600 hover:bg-violet-500 text-white"
                                disabled={!selectedHotel || !hotelFile}
                                onClick={handleHotelInvoiceUpload}
                            >
                                Envoyer
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
