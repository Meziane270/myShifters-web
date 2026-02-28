import React, { useState, useEffect, useCallback } from "react";
import { Briefcase, Trash2, Plus, Loader2, Save, Calendar, Building2, BadgeCheck, Clock, CheckCircle2, XCircle } from "lucide-react";
import axios from "axios";
import { useAuth } from "../../../../context/AuthContext";
import { toast } from "sonner";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const SERVICE_TYPES = [
    { id: 'reception', label: 'Réception' },
    { id: 'housekeeping', label: 'Housekeeping' },
    { id: 'restaurant', label: 'Restauration & Salle' },
    { id: 'maintenance', label: 'Maintenance Technique' },
];

export default function ExperienceList({ experiences = [], workerSkills = [], onAddExperience, onDeleteExperience, saving }) {
    const { getAuthHeader } = useAuth();
    const [showAddForm, setShowAddForm] = useState(false);
    const [showAddSkill, setShowAddSkill] = useState(false);
    const [skills, setSkills] = useState(workerSkills || []);
    const [pendingSkills, setPendingSkills] = useState([]);
    const [loadingSkills, setLoadingSkills] = useState(false);
    const [selectedSkill, setSelectedSkill] = useState("");
    const [newExp, setNewExp] = useState({
        company: "",
        role_title: "",
        service_type: "reception",
        start_date: "",
        end_date: "",
        description: "",
        is_current: false
    });

    const loadSkills = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/worker/skills`, { headers: getAuthHeader() });
            setSkills(res.data.skills || []);
            setPendingSkills(res.data.pending_skills || []);
        } catch (err) {
            console.error("Erreur chargement métiers:", err);
        }
    }, [getAuthHeader]);

    useEffect(() => {
        loadSkills();
    }, [loadSkills]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (typeof onAddExperience === 'function') {
            onAddExperience(newExp);
            setShowAddForm(false);
            setNewExp({
                company: "",
                role_title: "",
                service_type: "reception",
                start_date: "",
                end_date: "",
                description: "",
                is_current: false
            });
        }
    };

    const handleAddSkill = async () => {
        if (!selectedSkill) {
            toast.error("Veuillez sélectionner un métier");
            return;
        }
        setLoadingSkills(true);
        try {
            await axios.post(`${API}/worker/skills`, { skill: selectedSkill }, { headers: getAuthHeader() });
            toast.success("Métier soumis à vérification !");
            setShowAddSkill(false);
            setSelectedSkill("");
            await loadSkills();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Erreur lors de l'ajout du métier");
        } finally {
            setLoadingSkills(false);
        }
    };

    const handleRemoveSkill = async (skill) => {
        setLoadingSkills(true);
        try {
            await axios.delete(`${API}/worker/skills/${encodeURIComponent(skill)}`, { headers: getAuthHeader() });
            toast.success("Métier retiré");
            await loadSkills();
        } catch (err) {
            toast.error("Erreur lors de la suppression");
        } finally {
            setLoadingSkills(false);
        }
    };

    const getSkillLabel = (skillId) => {
        const skill = SERVICE_TYPES.find(s => s.id === skillId || s.label === skillId);
        return skill ? skill.label : skillId;
    };

    // Métiers disponibles à ajouter (pas déjà dans skills ni pending)
    const availableSkills = SERVICE_TYPES.filter(
        s => !skills.includes(s.id) && !skills.includes(s.label) &&
            !pendingSkills.includes(s.id) && !pendingSkills.includes(s.label)
    );

    return (
        <div className="p-10 space-y-12">
            {/* Section Métiers */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-violet-600/10 text-violet-600 flex items-center justify-center">
                            <BadgeCheck className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">Mes Métiers</h3>
                            <p className="text-sm text-slate-500">Métiers vérifiés et en attente de validation.</p>
                        </div>
                    </div>
                    {availableSkills.length > 0 && (
                        <button
                            onClick={() => setShowAddSkill(!showAddSkill)}
                            className="flex items-center gap-2 px-5 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-600-light transition-all shadow-lg shadow-violet-600/20"
                        >
                            <Plus className="h-4 w-4" />
                            Ajouter un métier
                        </button>
                    )}
                </div>

                {showAddSkill && (
                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 flex flex-col sm:flex-row gap-4 items-end animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Sélectionnez un métier</label>
                            <select
                                value={selectedSkill}
                                onChange={(e) => setSelectedSkill(e.target.value)}
                                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all font-bold text-slate-900"
                            >
                                <option value="">-- Choisir --</option>
                                {availableSkills.map(s => (
                                    <option key={s.id} value={s.label}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setShowAddSkill(false)}
                                className="px-6 py-4 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-2xl transition-all"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                onClick={handleAddSkill}
                                disabled={loadingSkills || !selectedSkill}
                                className="px-6 py-4 bg-violet-600 text-white rounded-2xl font-bold text-sm hover:bg-violet-600-light transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2 disabled:opacity-50"
                            >
                                {loadingSkills ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                Soumettre
                            </button>
                        </div>
                    </div>
                )}

                <div className="flex flex-wrap gap-3">
                    {/* Métiers vérifiés */}
                    {skills.map((skillId) => (
                        <div key={`skill-${skillId}`} className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border border-emerald-100 rounded-xl group">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                            <span className="text-emerald-800 font-bold text-sm">{getSkillLabel(skillId)}</span>
                            <button
                                onClick={() => handleRemoveSkill(skillId)}
                                className="ml-1 text-emerald-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                title="Retirer ce métier"
                            >
                                <XCircle className="h-4 w-4" />
                            </button>
                        </div>
                    ))}

                    {/* Métiers en attente */}
                    {pendingSkills.map((skillId) => (
                        <div key={`pending-${skillId}`} className="flex items-center gap-2 px-5 py-3 bg-amber-50 border border-amber-100 rounded-xl group">
                            <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="text-amber-800 font-bold text-sm">{getSkillLabel(skillId)}</span>
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest ml-1">En attente</span>
                            <button
                                onClick={() => handleRemoveSkill(skillId)}
                                className="ml-1 text-amber-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                title="Annuler la demande"
                            >
                                <XCircle className="h-4 w-4" />
                            </button>
                        </div>
                    ))}

                    {skills.length === 0 && pendingSkills.length === 0 && (
                        <p className="text-sm text-slate-400 italic">Aucun métier ajouté. Cliquez sur "Ajouter un métier" pour en soumettre un.</p>
                    )}
                </div>
            </div>

            <div className="h-px bg-slate-100 w-full" />

            {/* Section Expériences */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-violet-600/10 text-violet-600 flex items-center justify-center">
                        <Briefcase className="h-6 w-6" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-900 tracking-tight">Expériences Professionnelles</h3>
                        <p className="text-sm text-slate-500">Ajoutez vos expériences passées dans l'hôtellerie.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-bold text-sm hover:bg-violet-600-light transition-all shadow-lg shadow-violet-600/20"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter
                </button>
            </div>

            {showAddForm && (
                <form onSubmit={handleSubmit} className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Établissement</label>
                            <input
                                type="text"
                                required
                                value={newExp.company}
                                onChange={(e) => setNewExp({ ...newExp, company: e.target.value })}
                                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all font-bold text-slate-900"
                                placeholder="Nom de l'hôtel / restaurant"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Métier / Poste</label>
                            <select
                                value={newExp.role_title}
                                onChange={(e) => setNewExp({ ...newExp, role_title: e.target.value, service_type: e.target.value.toLowerCase() })}
                                required
                                className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all font-bold text-slate-900"
                            >
                                <option value="">Sélectionnez un métier</option>
                                {SERVICE_TYPES.map(s => (
                                    <option key={s.id} value={s.label}>{s.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Début</label>
                                <input
                                    type="date"
                                    required
                                    value={newExp.start_date}
                                    onChange={(e) => setNewExp({ ...newExp, start_date: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all font-bold text-slate-900"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Fin</label>
                                <input
                                    type="date"
                                    disabled={newExp.is_current}
                                    value={newExp.end_date}
                                    onChange={(e) => setNewExp({ ...newExp, end_date: e.target.value })}
                                    className="w-full px-6 py-4 rounded-2xl border border-slate-100 bg-white focus:border-violet-600 focus:ring-4 focus:ring-violet-600/5 outline-none transition-all font-bold text-slate-900 disabled:opacity-50"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 ml-2">
                        <input
                            type="checkbox"
                            id="is_current"
                            checked={newExp.is_current}
                            onChange={(e) => setNewExp({ ...newExp, is_current: e.target.checked, end_date: e.target.checked ? "" : newExp.end_date })}
                            className="h-5 w-5 rounded border-slate-300 text-violet-600 focus:ring-violet-600"
                        />
                        <label htmlFor="is_current" className="text-sm font-bold text-slate-600">Poste actuel</label>
                    </div>
                    <div className="flex justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => setShowAddForm(false)}
                            className="px-8 py-4 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-2xl transition-all"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-8 py-4 bg-violet-600 text-white rounded-2xl font-bold text-sm hover:bg-violet-600-light transition-all shadow-lg shadow-violet-600/20 flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Enregistrer l'expérience
                        </button>
                    </div>
                </form>
            )}

            <div className="space-y-6">
                {experiences.length > 0 ? (
                    experiences.map((exp) => (
                        <div key={exp.id} className="group bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-violet-600/10 group-hover:text-violet-600 transition-all">
                                    <Building2 className="h-8 w-8" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg leading-tight">{exp.role_title}</h4>
                                    <p className="text-violet-600 font-bold text-sm">{exp.company}</p>
                                    <div className="flex flex-wrap gap-4 mt-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                        <span className="flex items-center gap-1.5">
                                            <Calendar className="h-3 w-3" />
                                            {exp.start_date} - {exp.is_current ? "Aujourd'hui" : exp.end_date}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => typeof onDeleteExperience === 'function' && onDeleteExperience(exp.id)}
                                className="p-4 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                            >
                                <Trash2 className="h-6 w-6" />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="bg-white rounded-[3rem] border-2 border-dashed border-slate-100 p-20 text-center">
                        <div className="h-20 w-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                            <Briefcase className="h-10 w-10" />
                        </div>
                        <p className="text-slate-400 font-bold">Vous n'avez pas encore ajouté d'expériences.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
