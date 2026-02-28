// src/pages/admin/components/StatusPill.jsx
import { Badge } from "../../../components/ui/badge";

const statusConfig = {
    // Support
    'support_open': { color: "bg-emerald-500/15 text-emerald-700", label: "Ouvert" },
    'support_pending': { color: "bg-orange-500/15 text-orange-700", label: "En attente" },
    'support_closed': { color: "bg-zinc-500/15 text-zinc-700", label: "Fermé" },

    // Verification
    'verification_verified': { color: "bg-emerald-500/15 text-emerald-700", label: "Vérifié" },
    'verification_rejected': { color: "bg-red-500/15 text-red-700", label: "Rejeté" },
    'verification_pending': { color: "bg-orange-500/15 text-orange-700", label: "En attente" },
    'verification_unverified': { color: "bg-zinc-500/15 text-zinc-700", label: "Non vérifié" },

    // Disputes (pas de contexte nécessaire - noms uniques)
    'under_review': { color: "bg-violet-500/15 text-violet-700", label: "En cours" },
    'resolved_hotel': { color: "bg-emerald-500/15 text-emerald-700", label: "Résolu (Hôtel)" },
    'resolved_worker': { color: "bg-emerald-500/15 text-emerald-700", label: "Résolu (Worker)" },
    'refunded': { color: "bg-purple-500/15 text-purple-700", label: "Remboursé" },

    // Invoices (pas de contexte nécessaire - noms uniques)
    'issued': { color: "bg-violet-500/15 text-violet-700", label: "Émise" },
    'paid': { color: "bg-emerald-500/15 text-emerald-700", label: "Payée" },
    'overdue': { color: "bg-red-500/15 text-red-700", label: "En retard" },
    'void': { color: "bg-zinc-500/15 text-zinc-700", label: "Annulée" },

    // Suspension
    'suspension_active': { color: "bg-red-500/15 text-red-700", label: "Suspendu" },
    'suspension_expired': { color: "bg-zinc-500/15 text-zinc-700", label: "Expiré" },
    'suspension_revoked': { color: "bg-emerald-500/15 text-emerald-700", label: "Révoqué" },

    // Applications
    'application_pending': { color: "bg-orange-500/15 text-orange-700", label: "En attente" },
    'application_accepted': { color: "bg-emerald-500/15 text-emerald-700", label: "Accepté" },
    'application_rejected': { color: "bg-red-500/15 text-red-700", label: "Rejeté" },

    // Shifts
    'shift_open': { color: "bg-emerald-500/15 text-emerald-700", label: "Ouvert" },
    'shift_filled': { color: "bg-violet-500/15 text-violet-700", label: "Pourvu" },
    'shift_completed': { color: "bg-purple-500/15 text-purple-700", label: "Terminé" },
    'shift_cancelled': { color: "bg-red-500/15 text-red-700", label: "Annulé" },

    // Documents
    'document_pending': { color: "bg-orange-500/15 text-orange-700", label: "En attente" },
    'document_approved': { color: "bg-emerald-500/15 text-emerald-700", label: "Approuvé" },
    'document_rejected': { color: "bg-red-500/15 text-red-700", label: "Rejeté" },
};

export default function StatusPill({ status, unread = 0, context }) {
    // 🔥 PLUS DE manualMapping - on utilise TOUJOURS le contexte ou les noms uniques

    let config;

    if (context) {
        config = statusConfig[`${context}_${status}`];
    } else {
        config = statusConfig[status];
    }

    // Fallback si pas trouvé
    if (!config) {
        config = {
            color: "bg-zinc-500/15 text-zinc-700",
            label: status
        };
    }

    return (
        <div className="flex items-center gap-2">
            <Badge className={`${config.color} border-0`}>
                {config.label}
            </Badge>
            {unread > 0 && (
                <Badge className="bg-violet-600/15 text-violet-600 border-0">
                    {unread} nouveau{unread > 1 ? 'x' : ''}
                </Badge>
            )}
        </div>
    );
}