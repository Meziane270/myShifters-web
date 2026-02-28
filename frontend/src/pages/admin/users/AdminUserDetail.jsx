// src/pages/admin/users/AdminUserDetail.jsx
import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "sonner";
import { Button } from "../../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { Badge } from "../../../components/ui/badge";
import StatusPill from "../components/StatusPill";
import UserSuspensionModal from "./components/UserSuspensionModal";
import PasswordResetModal from "./components/PasswordResetModal";
import {
    ArrowLeft,
    User,
    Building2,
    Briefcase,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Award,
    FileText,
    CreditCard,
    AlertTriangle,
    Key,
    Ban,
    Clock,
    DollarSign,
    CheckCircle2,
    XCircle,
    Eye,
    BadgeCheck
} from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminUserDetail() {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { getAuthHeader } = useAuth();
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [suspensionModalOpen, setSuspensionModalOpen] = useState(false);
    const [passwordResetModalOpen, setPasswordResetModalOpen] = useState(false);
    const [updatingDoc, setUpdatingDoc] = useState(null);
    const [updatingSkill, setUpdatingSkill] = useState(null);
    const [previewDoc, setPreviewDoc] = useState(null);

    const fetchUser = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/admin/users/${userId}`, {
                headers: getAuthHeader()
            });
            setUserData(res.data);
        } catch (e) {
            toast.error("Impossible de charger le profil utilisateur");
            navigate("/admin/users");
        } finally {
            setLoading(false);
        }
    }, [userId, getAuthHeader, navigate]);

    const handleDocumentAction = useCallback(async (docId, status, reason = "") => {
        setUpdatingDoc(docId);
        try {
            await axios.put(`${API}/admin/documents/${docId}/status`, { status, reason }, { headers: getAuthHeader() });
            toast.success(status === 'verified' ? 'Document approuvé ✓' : 'Document rejeté');
            fetchUser();
        } catch (e) {
            toast.error(e?.response?.data?.detail || 'Erreur lors de la mise à jour du document');
        } finally {
            setUpdatingDoc(null);
        }
    }, [getAuthHeader, fetchUser]);

    const handleSkillAction = useCallback(async (skill, action) => {
        setUpdatingSkill(skill);
        try {
            await axios.put(`${API}/admin/users/${userId}/skills`, { skill, action }, { headers: getAuthHeader() });
            toast.success(action === 'approve' ? `Métier "${skill}" approuvé ✓` : `Métier "${skill}" rejeté`);
            fetchUser();
        } catch (e) {
            toast.error(e?.response?.data?.detail || 'Erreur lors de la mise à jour du métier');
        } finally {
            setUpdatingSkill(null);
        }
    }, [getAuthHeader, userId, fetchUser]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    if (loading || !userData) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const { user } = userData;
    const isHotel = user.role === 'hotel';
    const isWorker = user.role === 'worker';
    // Se baser uniquement sur le champ is_suspended du user (source de vérité)
    const isSuspended = user.is_suspended === true;

    const getDocTypeLabel = (type) => {
        const labels = {
            cv: 'CV', rib: 'RIB', identity: "Pièce d'identité",
            business_proof: 'Justificatif AE', other: 'Autre'
        };
        return labels[type] || type;
    };

    const getStatusBadge = (status) => {
        if (status === 'verified') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (status === 'rejected') return 'bg-red-100 text-red-700 border-red-200';
        return 'bg-amber-100 text-amber-700 border-amber-200';
    };

    const getStatusLabel = (status) => {
        if (status === 'verified') return 'Vérifié';
        if (status === 'rejected') return 'Rejeté';
        return 'En attente';
    };

    return (
        <div className="space-y-6">
            {/* Preview Modal */}
            {previewDoc && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setPreviewDoc(null)}>
                    <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-4 border-b">
                            <h3 className="font-bold text-slate-900">{previewDoc.label}</h3>
                            <button onClick={() => setPreviewDoc(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                <XCircle className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>
                        <div className="p-4 h-[75vh]">
                            {previewDoc.mime_type?.startsWith('image/') ? (
                                <img src={previewDoc.url} alt={previewDoc.label} className="w-full h-full object-contain" />
                            ) : (
                                <iframe src={previewDoc.url} title={previewDoc.label} className="w-full h-full border-0 rounded-lg" />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="outline" className="border-border" onClick={() => navigate("/admin/users")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Retour
                </Button>
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">
                        {isHotel ? user.hotel_name || user.name : `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.name}
                    </h1>
                    <p className="text-foreground/70">Profil {isHotel ? "hôtel" : isWorker ? "worker" : "admin"}</p>
                </div>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-violet-600/10 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                            <div className="text-xs text-foreground/60">Membre depuis</div>
                            <div className="font-medium text-foreground">
                                {new Date(user.created_at).toLocaleDateString('fr-FR')}
                            </div>
                        </div>
                    </div>
                </div>

                {isWorker && (
                    <>
                        <div className="p-4 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Briefcase className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-foreground/60">Missions</div>
                                    <div className="font-medium text-foreground">{user.total_completed || 0}</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-foreground/60">Gagné</div>
                                    <div className="font-medium text-foreground">{user.total_earned?.toLocaleString() || 0} €</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {isHotel && (
                    <>
                        <div className="p-4 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                    <Clock className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-foreground/60">Shifts créés</div>
                                    <div className="font-medium text-foreground">{user.total_shifts || 0}</div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-card rounded-xl border border-border">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-violet-600" />
                                </div>
                                <div>
                                    <div className="text-xs text-foreground/60">Dépensé</div>
                                    <div className="font-medium text-foreground">{user.total_spent?.toLocaleString() || 0} €</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}

                <div className="p-4 bg-card rounded-xl border border-border">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            user.verification_status === 'verified' ? 'bg-emerald-500/10' : 'bg-orange-500/10'
                        }`}>
                            <Award className={`w-5 h-5 ${user.verification_status === 'verified' ? 'text-emerald-600' : 'text-orange-600'}`} />
                        </div>
                        <div>
                            <div className="text-xs text-foreground/60">Vérification</div>
                            <StatusPill status={user.verification_status} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 p-4 bg-card border border-border rounded-xl">
                <Button variant="outline" className="border-border" onClick={() => setPasswordResetModalOpen(true)}>
                    <Key className="w-4 h-4 mr-2" />
                    Réinitialiser mot de passe
                </Button>
                {isSuspended ? (
                    <Button variant="outline" className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10" onClick={() => setSuspensionModalOpen(true)}>
                        <Ban className="w-4 h-4 mr-2" />
                        Lever la suspension
                    </Button>
                ) : (
                    <Button variant="outline" className="border-red-500/50 text-red-600 hover:bg-red-500/10" onClick={() => setSuspensionModalOpen(true)}>
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Suspendre
                    </Button>
                )}

            </div>

            {/* Tabs */}
            <Tabs defaultValue="info" className="space-y-6">
                <TabsList className="bg-background border border-border flex-wrap h-auto gap-1 p-1">
                    <TabsTrigger value="info">Informations</TabsTrigger>
                    {isWorker && (
                        <>
                            <TabsTrigger value="documents">Documents</TabsTrigger>
                            <TabsTrigger value="metiers">
                                Métiers
                                {(user.pending_skills?.length > 0) && (
                                    <span className="ml-1.5 bg-amber-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">
                                        {user.pending_skills.length}
                                    </span>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="paiement">Paiement</TabsTrigger>
                            <TabsTrigger value="experiences">Expériences</TabsTrigger>
                        </>
                    )}
                    {isHotel && <TabsTrigger value="factures">Factures</TabsTrigger>}
                    <TabsTrigger value="suspensions">Suspensions</TabsTrigger>
                    <TabsTrigger value="audit">Audit</TabsTrigger>
                </TabsList>

                {/* Informations */}
                <TabsContent value="info" className="space-y-4">
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="font-semibold text-foreground mb-4">Informations personnelles</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-foreground/60">Email</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Mail className="w-4 h-4 text-foreground/50" />
                                    <span className="text-foreground">{user.email}</span>
                                </div>
                            </div>
                            {user.phone && (
                                <div>
                                    <div className="text-xs text-foreground/60">Téléphone</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Phone className="w-4 h-4 text-foreground/50" />
                                        <span className="text-foreground">{user.phone}</span>
                                    </div>
                                </div>
                            )}
                            {user.date_of_birth && (
                                <div>
                                    <div className="text-xs text-foreground/60">Date de naissance</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Calendar className="w-4 h-4 text-foreground/50" />
                                        <span className="text-foreground">
                                            {new Date(user.date_of_birth).toLocaleDateString('fr-FR')}
                                        </span>
                                    </div>
                                </div>
                            )}
                            {isHotel && user.hotel_address && (
                                <div className="col-span-2">
                                    <div className="text-xs text-foreground/60">Adresse</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <MapPin className="w-4 h-4 text-foreground/50" />
                                        <span className="text-foreground">{user.hotel_address}</span>
                                    </div>
                                </div>
                            )}
                            {isWorker && user.address && (
                                <div className="col-span-2">
                                    <div className="text-xs text-foreground/60">Adresse</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <MapPin className="w-4 h-4 text-foreground/50" />
                                        <span className="text-foreground">{user.address}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {isWorker && (
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-semibold text-foreground mb-4">Compétences vérifiées</h3>
                            <div className="flex flex-wrap gap-2">
                                {user.skills?.length > 0 ? user.skills.map((skill) => (
                                    <Badge key={skill} variant="secondary">{skill}</Badge>
                                )) : <span className="text-sm text-foreground/50">Aucune compétence vérifiée</span>}
                            </div>
                            {user.bio && (
                                <div className="mt-4">
                                    <div className="text-xs text-foreground/60 mb-2">Bio</div>
                                    <p className="text-foreground/70">{user.bio}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {isHotel && user.business_profile && (
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-semibold text-foreground mb-4">Informations entreprise</h3>
                            <div className="space-y-3">
                                <div>
                                    <div className="text-xs text-foreground/60">Nom de l'entreprise</div>
                                    <div className="text-foreground">{user.business_profile.business_name}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-foreground/60">SIRET</div>
                                    <div className="text-foreground">{user.business_profile.siret}</div>
                                </div>
                                <div>
                                    <div className="text-xs text-foreground/60">Adresse</div>
                                    <div className="text-foreground">{user.business_profile.business_address}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Documents */}
                {isWorker && (
                    <TabsContent value="documents">
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-semibold text-foreground mb-6">Documents fournis</h3>
                            {!user.documents?.length ? (
                                <div className="text-center py-12 text-foreground/50">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>Aucun document soumis</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {user.documents.map((doc) => (
                                        <div key={doc.id} className="p-5 bg-background rounded-xl border border-border space-y-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                                    doc.status === 'verified' ? 'bg-emerald-100' :
                                                        doc.status === 'rejected' ? 'bg-red-100' : 'bg-amber-100'
                                                }`}>
                                                    <FileText className={`w-5 h-5 ${
                                                        doc.status === 'verified' ? 'text-emerald-600' :
                                                            doc.status === 'rejected' ? 'text-red-600' : 'text-amber-600'
                                                    }`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="text-sm font-semibold text-foreground">
                                                        {getDocTypeLabel(doc.type)}
                                                    </div>
                                                    <div className="text-xs text-foreground/50 truncate">
                                                        {doc.file?.filename || 'Document'}
                                                    </div>
                                                </div>
                                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${getStatusBadge(doc.status)}`}>
                                                    {getStatusLabel(doc.status)}
                                                </span>
                                            </div>

                                            {doc.rejection_reason && (
                                                <div className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
                                                    Motif : {doc.rejection_reason}
                                                </div>
                                            )}

                                            <div className="flex items-center gap-2 pt-1">
                                                {doc.url && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-border text-xs h-8 px-3 flex items-center gap-1.5"
                                                        onClick={() => setPreviewDoc({ ...doc, label: getDocTypeLabel(doc.type) })}
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        Prévisualiser
                                                    </Button>
                                                )}
                                                <div className="flex-1" />
                                                {doc.status !== 'verified' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 text-xs h-8 px-3"
                                                        onClick={() => handleDocumentAction(doc.id, 'verified')}
                                                        disabled={updatingDoc === doc.id}
                                                    >
                                                        {updatingDoc === doc.id ? '...' : (
                                                            <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approuver</>
                                                        )}
                                                    </Button>
                                                )}
                                                {doc.status !== 'rejected' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500/50 text-red-600 hover:bg-red-500/10 text-xs h-8 px-3"
                                                        onClick={() => handleDocumentAction(doc.id, 'rejected')}
                                                        disabled={updatingDoc === doc.id}
                                                    >
                                                        {updatingDoc === doc.id ? '...' : (
                                                            <><XCircle className="w-3.5 h-3.5 mr-1" />Rejeter</>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                )}

                {/* Métiers */}
                {isWorker && (
                    <TabsContent value="metiers">
                        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
                            <h3 className="font-semibold text-foreground">Gestion des Métiers</h3>

                            {/* Métiers vérifiés */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Métiers vérifiés ({user.skills?.length || 0})
                                </h4>
                                {user.skills?.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {user.skills.map((skill) => (
                                            <span key={skill} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-sm font-medium text-emerald-800">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-foreground/50 italic">Aucun métier vérifié</p>
                                )}
                            </div>

                            {/* Métiers en attente */}
                            {user.pending_skills?.length > 0 && (
                                <div className="space-y-3">
                                    <h4 className="text-sm font-semibold text-foreground/70 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-500" />
                                        En attente de vérification ({user.pending_skills.length})
                                    </h4>
                                    <div className="space-y-2">
                                        {user.pending_skills.map((skill) => (
                                            <div key={skill} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                                                <div className="flex items-center gap-2">
                                                    <BadgeCheck className="w-4 h-4 text-amber-500" />
                                                    <span className="text-sm font-medium text-amber-900">{skill}</span>
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                                        En attente
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-emerald-500/50 text-emerald-600 hover:bg-emerald-500/10 text-xs h-8 px-3"
                                                        onClick={() => handleSkillAction(skill, 'approve')}
                                                        disabled={updatingSkill === skill}
                                                    >
                                                        {updatingSkill === skill ? '...' : (
                                                            <><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Approuver</>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-500/50 text-red-600 hover:bg-red-500/10 text-xs h-8 px-3"
                                                        onClick={() => handleSkillAction(skill, 'reject')}
                                                        disabled={updatingSkill === skill}
                                                    >
                                                        {updatingSkill === skill ? '...' : (
                                                            <><XCircle className="w-3.5 h-3.5 mr-1" />Rejeter</>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!user.skills?.length && !user.pending_skills?.length && (
                                <div className="text-center py-12 text-foreground/50">
                                    <BadgeCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
                                    <p>Aucun métier soumis par ce worker</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                )}

                {/* Paiement */}
                {isWorker && (
                    <TabsContent value="paiement">
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-semibold text-foreground mb-4">Compte de paiement</h3>
                            {user.payout_account ? (
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-xs text-foreground/60">IBAN</div>
                                        <div className="text-foreground font-mono">{user.payout_account.iban}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-foreground/60">BIC</div>
                                        <div className="text-foreground font-mono">{user.payout_account.bic}</div>
                                    </div>
                                    <div className="pt-2">
                                        <StatusPill status={user.payout_account.status} />
                                    </div>
                                </div>
                            ) : (
                                <p className="text-foreground/70">Aucun compte de paiement configuré</p>
                            )}
                        </div>
                    </TabsContent>
                )}

                {/* Expériences */}
                {isWorker && (
                    <TabsContent value="experiences">
                        <div className="bg-card border border-border rounded-xl p-6">
                            <h3 className="font-semibold text-foreground mb-4">Expériences professionnelles</h3>
                            {!user.experiences?.length ? (
                                <p className="text-foreground/70">Aucune expérience enregistrée</p>
                            ) : (
                                <div className="space-y-4">
                                    {user.experiences.map((exp) => (
                                        <div key={exp.id} className="p-4 bg-background rounded-lg border border-border">
                                            <div className="font-medium text-foreground">{exp.role_title}</div>
                                            <div className="text-sm text-foreground/70">{exp.company}</div>
                                            <div className="text-xs text-foreground/50 mt-1">
                                                {exp.start_date} - {exp.end_date || 'Présent'}
                                            </div>
                                            {exp.description && (
                                                <p className="text-sm text-foreground/70 mt-2">{exp.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                )}

                {/* Suspensions */}
                <TabsContent value="suspensions">
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="font-semibold text-foreground mb-4">Historique des suspensions</h3>
                        {!user.suspensions?.length ? (
                            <p className="text-foreground/70">Aucune suspension</p>
                        ) : (
                            <div className="space-y-4">
                                {user.suspensions.map((s) => (
                                    <div key={s.id} className="p-4 bg-background rounded-lg border border-border">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Ban className={`w-4 h-4 ${s.status === 'active' ? 'text-red-500' : 'text-foreground/50'}`} />
                                                <span className="font-medium text-foreground">
                                                    {s.status === 'active' ? 'Active' : s.status}
                                                </span>
                                            </div>
                                            <StatusPill status={s.status} />
                                        </div>
                                        <p className="text-sm text-foreground/70 mt-2">{s.reason}</p>
                                        <div className="text-xs text-foreground/50 mt-2">
                                            Par {s.suspended_by_email} • {new Date(s.suspended_at).toLocaleDateString('fr-FR')}
                                            {s.expires_at && ` • Expire le ${new Date(s.expires_at).toLocaleDateString('fr-FR')}`}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>

                {/* Audit */}
                <TabsContent value="audit">
                    <div className="bg-card border border-border rounded-xl p-6">
                        <h3 className="font-semibold text-foreground mb-4">Journal d'audit</h3>
                        {!user.audit_log?.length ? (
                            <p className="text-foreground/70">Aucune action enregistrée</p>
                        ) : (
                            <div className="space-y-3">
                                {user.audit_log.map((log) => (
                                    <div key={log.id} className="p-3 bg-background rounded-lg border border-border">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-foreground">{log.action}</span>
                                            <span className="text-xs text-foreground/50">
                                                {new Date(log.created_at).toLocaleString('fr-FR')}
                                            </span>
                                        </div>
                                        <div className="text-xs text-foreground/70 mt-1">Par {log.admin_email}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <UserSuspensionModal
                isOpen={suspensionModalOpen}
                onClose={() => setSuspensionModalOpen(false)}
                user={user}
                isSuspended={isSuspended}
                onSuccess={fetchUser}
            />

            <PasswordResetModal
                isOpen={passwordResetModalOpen}
                onClose={() => setPasswordResetModalOpen(false)}
                user={user}
                onSuccess={fetchUser}
            />
        </div>
    );
}
