import React, { useState, useEffect } from "react";
import { Save, Loader2, Camera, User } from "lucide-react";
import { toast } from "sonner";

export default function PersonalInfoForm({ profile, onSave, saving }) {
    const verificationStatus = profile?.verification_status || 'pending';
    const getVerifBadge = () => {
        switch (verificationStatus) {
            case 'verified': return { label: 'Vérifié', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
            case 'rejected': return { label: 'Rejeté', cls: 'bg-red-100 text-red-700 border-red-200' };
            default: return { label: 'En cours de vérification', cls: 'bg-amber-100 text-amber-700 border-amber-200' };
        }
    };
    const verifBadge = getVerifBadge();

    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        date_of_birth: "",
        address: "",
        city: "",
        postal_code: "",
        avatar_url: "",
    });

    useEffect(() => {
        if (profile) {
            // Normalise la date de naissance : accepte ISO (2000-01-15T00:00:00Z) ou YYYY-MM-DD
            let dob = profile.date_of_birth || "";
            if (dob && dob.includes("T")) {
                dob = dob.split("T")[0];
            }
            setFormData({
                first_name: profile.first_name || "",
                last_name: profile.last_name || "",
                email: profile.email || "",
                phone: profile.phone || "",
                date_of_birth: dob,
                address: profile.address || "",
                city: profile.city || "",
                postal_code: profile.postal_code || "",
                avatar_url: profile.avatar_url || profile.avatar || profile.photo_url || profile.profile_picture || "",
            });
        }
    }, [profile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Le téléphone est bloqué, on ignore toute modification
        if (name === "phone") return;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            toast.error("La photo ne doit pas dépasser 10 Mo");
            return;
        }

        const formDataFile = new FormData();
        formDataFile.append('file', file);

        if (onSave) {
            await onSave(formDataFile, true);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.first_name || !formData.last_name || !formData.email) {
            toast.error("Le prénom, le nom et l'email sont requis");
            return;
        }

        // On exclut avatar_url, phone (non modifiable) et email de l'envoi
        const { avatar_url, phone, email, ...updateData } = formData;
        // Ne pas envoyer date_of_birth vide (garder la valeur existante)
        if (!updateData.date_of_birth) {
            delete updateData.date_of_birth;
        }
        if (onSave) {
            await onSave(updateData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-12">
            <div className="flex flex-col items-center gap-6 pb-10 border-b border-slate-50">
                <div className="relative group">
                    <div className="h-40 w-40 rounded-[3rem] overflow-hidden border-8 border-white shadow-2xl bg-slate-50 flex items-center justify-center transition-transform group-hover:scale-105 duration-500">
                        {formData.avatar_url ? (
                            <img src={formData.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                        ) : (
                            <div className="h-full w-full flex items-center justify-center bg-violet-600/5 text-violet-600">
                                <User className="h-16 w-16" />
                            </div>
                        )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 h-14 w-14 bg-violet-600 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-2xl hover:bg-violet-600-light hover:scale-110 transition-all border-4 border-white">
                        <Camera className="h-6 w-6" />
                        <input type="file" className="hidden" accept="image/*" onChange={handlePhotoChange} />
                    </label>
                </div>
                <div className="text-center">
                    <p className="text-lg font-black text-slate-900 tracking-tight">Votre Photo de Profil</p>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Format JPG ou PNG • Max 10 Mo</p>
                    <span className={`inline-flex items-center gap-1.5 mt-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${verifBadge.cls}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                        Statut : {verifBadge.label}
                    </span>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-x-10 gap-y-8">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Prénom *</label>
                    <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all font-bold text-slate-900"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nom *</label>
                    <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleChange}
                        required
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all font-bold text-slate-900"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Professionnel</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        disabled
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed font-bold"
                    />
                </div>

                {/* Téléphone : affiché mais non modifiable */}
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                        Téléphone Mobile
                        <span className="ml-2 text-[9px] text-slate-300 normal-case tracking-normal font-medium">(non modifiable)</span>
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        readOnly
                        disabled
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-100 text-slate-400 cursor-not-allowed font-bold"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Date de naissance</label>
                    <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all font-bold text-slate-900"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Ville de résidence</label>
                    <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all font-bold text-slate-900"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Code postal</label>
                    <input
                        type="text"
                        name="postal_code"
                        value={formData.postal_code}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all font-bold text-slate-900"
                    />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Adresse Complète</label>
                    <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all font-bold text-slate-900"
                    />
                </div>
            </div>

            <div className="flex justify-end pt-6">
                <button
                    type="submit"
                    disabled={saving}
                    className="px-12 py-5 bg-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-violet-600-light transition-all flex items-center gap-3 shadow-xl shadow-violet-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Enregistrement...
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            Mettre à jour mon profil
                        </>
                    )}
                </button>
            </div>
        </form>
    );
}
