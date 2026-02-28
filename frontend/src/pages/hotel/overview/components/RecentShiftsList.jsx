import { Badge } from "../../../../components/ui/badge";

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

export default function RecentShiftsList({ shifts }) {
    return (
        <div className="space-y-3">
            {shifts.map((shift) => (
                <div
                    key={shift.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border border-border"
                >
                    <div className="flex items-center gap-4">
                        <div className={`px-3 py-1 rounded-full text-xs font-medium ${SERVICE_COLORS[shift.service_type]}`}>
                            {SERVICE_LABELS[shift.service_type]}
                        </div>
                        <div>
                            <p className="text-foreground font-medium">{shift.title}</p>
                            <p className="text-foreground/60 text-sm">
                                {shift.date} • {shift.start_time} - {shift.end_time}
                            </p>
                        </div>
                    </div>

                    <Badge
                        className={
                            shift.status === "open"
                                ? "bg-emerald-500/15 text-emerald-700 border-0"
                                : "bg-violet-500/15 text-violet-700 border-0"
                        }
                    >
                        {shift.status === "open" ? "Ouvert" : shift.status === "filled" ? "Pourvu" : shift.status}
                    </Badge>
                </div>
            ))}
        </div>
    );
}