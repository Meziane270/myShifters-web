import { Link } from "react-router-dom";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { FileText, AlertTriangle, Mail, Sun, Moon, Globe, ArrowLeft } from "lucide-react";

const ASSETS = {
    flagFR: "/assets/img/drapeau-fr.webp",
    flagEN: "/assets/img/drapeau-uk.webp",
    logo: "/assets/img/logo.webp",
};

// ========== UTILS ==========
const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 100;
    window.scrollTo({ top: y, behavior: "smooth" });
};

export default function CGS() {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const { i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);
    const currentTheme = mounted ? (resolvedTheme || theme) : "light";

    const lang = i18n.language?.startsWith("en") ? "en" : "fr";

    const toggleLang = useCallback(() => {
        i18n.changeLanguage(lang === "en" ? "fr" : "en");
    }, [i18n, lang]);

    // ========== CONTENU BILINGUE ==========
    const content = useMemo(() => {
        const fr = {
            navBadge: "CGS",
            back: "Retour",
            effectiveDate: "27 janvier 2026",
            badge: "Date d'entrée en vigueur :",
            title: "Conditions Générales de Services (CGS)",
            description:
                "Contrat professionnel régissant l'utilisation des services de mise en relation MyShifters.",
            summary: "Sommaire",
            acceptTitle: "Pour accepter les présentes CGS",
            acceptDesc:
                "L'acceptation peut se faire par retour d'email signifiant \"J'accepte les CGS\", par signature électronique, ou par tout moyen manifestant un consentement clair.",
            acceptButton: "Accepter par email",
            warningTitle: "AVERTISSEMENT IMPORTANT :",
            warningText:
                "Les présentes Conditions Générales de Services (CGS) constituent un contrat juridiquement contraignant entre l'Établissement Client et MYSHIFTERS. En acceptant ces CGS, vous reconnaissez avoir lu, compris et accepté l'intégralité de leurs dispositions. Il est recommandé de les imprimer et/ou de les conserver.",
            footer: {
                legal: "Mentions légales",
                privacy: "Politique de confidentialité",
                cgu: "Conditions générales d'utilisation",
            },
            sections: [
                { id: "art1", title: "ARTICLE 1 - OBJET ET DÉFINITIONS" },
                { id: "art2", title: "ARTICLE 2 - ACCEPTATION ET INSCRIPTION" },
                { id: "art3", title: "ARTICLE 3 - PROCESSUS DE COMMANDE D'UNE MISSION" },
                { id: "art4", title: "ARTICLE 4 - OBLIGATIONS DU CLIENT" },
                { id: "art5", title: "ARTICLE 5 - TARIFS, FACTURATION ET PAIEMENT" },
                { id: "art6", title: "ARTICLE 6 - RESPONSABILITÉS ET GARANTIES" },
                { id: "art7", title: "ARTICLE 7 - ANNULATION ET MODIFICATION" },
                { id: "art8", title: "ARTICLE 8 - DONNÉES PERSONNELLES" },
                { id: "art9", title: "ARTICLE 9 - PROPRIÉTÉ INTELLECTUELLE" },
                { id: "art10", title: "ARTICLE 10 - DURÉE, RÉSILIATION ET SUSPENSION" },
                { id: "art11", title: "ARTICLE 11 - LITIGES ET DROIT APPLICABLE" },
                { id: "art12", title: "ARTICLE 12 - DISPOSITIONS DIVERSES" },
            ],
        };

        const en = {
            navBadge: "Terms of Service",
            back: "Back",
            effectiveDate: "January 27, 2026",
            badge: "Effective date:",
            title: "Terms of Service",
            description:
                "Professional contract governing the use of MyShifters matching services.",
            summary: "Summary",
            acceptTitle: "To accept these Terms of Service",
            acceptDesc:
                'Acceptance can be made by return email stating "I accept the Terms of Service", by electronic signature, or by any means demonstrating clear consent.',
            acceptButton: "Accept by email",
            warningTitle: "IMPORTANT NOTICE:",
            warningText:
                "These Terms of Service constitute a legally binding contract between the Client Establishment and MYSHIFTERS. By accepting these Terms, you acknowledge that you have read, understood and accepted all of their provisions. It is recommended to print and/or keep them.",
            footer: {
                legal: "Legal notice",
                privacy: "Privacy policy",
                cgu: "Terms of use",
            },
            sections: [
                { id: "art1", title: "ARTICLE 1 - PURPOSE AND DEFINITIONS" },
                { id: "art2", title: "ARTICLE 2 - ACCEPTANCE AND REGISTRATION" },
                { id: "art3", title: "ARTICLE 3 - MISSION ORDERING PROCESS" },
                { id: "art4", title: "ARTICLE 4 - CLIENT OBLIGATIONS" },
                { id: "art5", title: "ARTICLE 5 - PRICES, INVOICING AND PAYMENT" },
                { id: "art6", title: "ARTICLE 6 - RESPONSIBILITIES AND GUARANTEES" },
                { id: "art7", title: "ARTICLE 7 - CANCELLATION AND MODIFICATION" },
                { id: "art8", title: "ARTICLE 8 - PERSONAL DATA" },
                { id: "art9", title: "ARTICLE 9 - INTELLECTUAL PROPERTY" },
                { id: "art10", title: "ARTICLE 10 - TERM, TERMINATION AND SUSPENSION" },
                { id: "art11", title: "ARTICLE 11 - DISPUTES AND APPLICABLE LAW" },
                { id: "art12", title: "ARTICLE 12 - MISCELLANEOUS PROVISIONS" },
            ],
        };

        return lang === "en" ? en : fr;
    }, [lang]);

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="mx-auto max-w-5xl px-6">
                    <div className="flex h-16 items-center justify-between">
                        {/* Logo + badge de la page */}
                        <div className="flex items-center gap-3">
                            <Link
                                to="/"
                                className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-muted/60"
                                aria-label="Go to top"
                            >
                                <img
                                    src={ASSETS.logo}
                                    alt="MyShifters"
                                    className="h-8 w-8 rounded-md object-contain"
                                />
                                <span className="text-lg font-bold tracking-tight sm:text-xl">
                                    MyShifters<span className="text-blue-500">.</span>
                                </span>
                            </Link>
                            <div className="hidden sm:block text-sm text-muted-foreground">
                                {content.navBadge}
                            </div>
                        </div>

                        {/* Toggles et retour */}
                        <div className="flex items-center gap-2">
                            {/* Language toggle */}
                            <button
                                onClick={toggleLang}
                                className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/60"
                                aria-label="Toggle language"
                            >
                                <img
                                    src={lang === "en" ? ASSETS.flagEN : ASSETS.flagFR}
                                    alt={lang === "en" ? "English" : "Français"}
                                    className="h-4 w-4 rounded-sm object-cover"
                                />
                                <span className="hidden sm:inline">
                                    {lang === "en" ? "EN" : "FR"}
                                </span>
                                <Globe className="h-4 w-4 text-muted-foreground" />
                            </button>

                            {/* Theme toggle */}
                            <button
                                onClick={() => setTheme(currentTheme === "dark" ? "light" : "dark")}
                                className="inline-flex items-center justify-center rounded-md border p-2 hover:bg-muted/60"
                                aria-label="Toggle theme"
                            >
                                {currentTheme === "dark" ? (
                                    <Sun className="h-4 w-4" />
                                ) : (
                                    <Moon className="h-4 w-4" />
                                )}
                            </button>

                            {/* Bouton retour */}
                            <Button variant="outline" asChild className="gap-2">
                                <Link to="/">
                                    <ArrowLeft className="h-4 w-4" />
                                    {content.back}
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main */}
            <main className="mx-auto max-w-5xl px-6 py-12">
                {/* Title avec badge date */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
                        <FileText className="h-4 w-4" />
                        {content.badge}{" "}
                        <span className="font-semibold">{content.effectiveDate}</span>
                    </div>

                    <h1 className="mt-4 text-3xl md:text-4xl font-bold tracking-tight">
                        {content.title}
                    </h1>
                    <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
                        {content.description}
                    </p>
                </div>

                {/* Sommaire */}
                <section className="mb-8 rounded-3xl border bg-card p-6 shadow-sm">
                    <div className="text-lg font-semibold mb-4">{content.summary}</div>
                    <div className="grid gap-2 md:grid-cols-2">
                        {content.sections.map((s) => (
                            <button
                                key={s.id}
                                onClick={() => scrollToId(s.id)}
                                className="rounded-xl border border-border/60 bg-background/50 px-4 py-3 text-left text-sm text-muted-foreground transition hover:bg-muted/40 hover:text-foreground"
                            >
                                {s.title}
                            </button>
                        ))}
                    </div>
                </section>

                {/* IMPORTANT NOTE */}
                <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-foreground/90 leading-relaxed">
                            <strong>{content.warningTitle}</strong> {content.warningText}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* ARTICLE 1 */}
                    <Section id="art1" title={content.sections[0].title}>
                        <SubTitle>1.1 Objet</SubTitle>
                        <p>
                            Les présentes Conditions Générales de Services (ci-après les « CGS ») ont pour objet de définir les
                            conditions dans lesquelles la société <strong>MYSHIFTERS</strong> (ci-après « la Plateforme ») met à
                            disposition des Établissements Clients (ci-après « le Client ») un service de mise en relation avec des
                            travailleurs indépendants immatriculés en qualité d'auto-entrepreneurs (ci-après « le(s) Prestataire(s) »)
                            pour l'exécution de missions temporaires (ci-après « la Mission ») au sein de l'établissement du Client.
                        </p>

                        <div className="mt-4 rounded-xl border bg-muted/30 p-4">
                            <p className="text-sm leading-relaxed">
                                <strong>RÔLE DE MYSHIFTERS :</strong> MYSHIFTERS agit exclusivement en tant que{" "}
                                <strong>plateforme de mise en relation technique et administrative</strong>. MYSHIFTERS n'est pas un
                                employeur, n'exerce aucun lien de subordination à l'égard des Prestataires, et n'est pas partie au
                                contrat d'exécution de la Mission qui s'établit directement entre le Client et le Prestataire. MYSHIFTERS
                                intervient comme mandataire de paiement et organisateur de la mise en relation.
                            </p>
                        </div>

                        <SubTitle>1.2 Définitions</SubTitle>
                        <div className="mt-3 rounded-xl border bg-blue-500/5 p-4 text-sm">
                            <ul className="space-y-2">
                                <li>
                                    <strong>« Plateforme »</strong> : Désigne le service digital MYSHIFTERS, accessible par tout moyen
                                    électronique, permettant la mise en relation entre Clients et Prestataires.
                                </li>
                                <li>
                                    <strong>« Client »</strong> : Tout établissement hôtelier, résidence touristique ou établissement de
                                    loisirs ayant souscrit aux présentes CGS pour commander des Missions.
                                </li>
                                <li>
                                    <strong>« Prestataire »</strong> : Travailleur indépendant immatriculé en qualité d'auto-entrepreneur,
                                    ayant signé une Convention de Prestation Indépendante avec MYSHIFTERS, et inscrit sur la Plateforme
                                    pour exécuter des Missions.
                                </li>
                                <li>
                                    <strong>« Mission »</strong> : Prestation de service temporaire et ponctuelle, définie par un poste,
                                    une date, des horaires et un lieu d'exécution précis, confiée par un Client à un Prestataire via la
                                    Plateforme.
                                </li>
                                <li>
                                    <strong>« Commission »</strong> : Rémunération de la Plateforme, correspondant à un pourcentage du
                                    montant total de la Mission, prélevé sur le paiement effectué par le Client avant reversement au
                                    Prestataire.
                                </li>
                                <li>
                                    <strong>« Contrat de Mission »</strong> : Accord commercial direct et ponctuel qui se forme entre le
                                    Client et le Prestataire dès l'acceptation par le Prestataire d'une Mission proposée via la Plateforme.
                                </li>
                            </ul>
                        </div>
                    </Section>

                    {/* ARTICLE 2 */}
                    <Section id="art2" title={content.sections[1].title}>
                        <p>2.1 L'accès au Service est réservé aux professionnels. Toute inscription sur la Plateforme vaut acceptation pleine et entière des présentes CGS.</p>
                        <p>2.2 Le Client garantit l'exactitude et la sincérité des informations fournies lors de son inscription (raison sociale, SIRET, adresse, représentant légal).</p>
                        <p>2.3 Le compte du Client est personnel et confidentiel. Le Client est responsable de toute utilisation faite de son compte.</p>
                    </Section>

                    {/* ARTICLE 3 */}
                    <Section id="art3" title={content.sections[2].title}>
                        <p>3.1 Le Client formule une demande de Mission via la Plateforme, par email, ou par téléphone, en précisant : le poste requis, la date, les horaires, le lieu, et toute compétence spécifique nécessaire.</p>
                        <p>3.2 MYSHIFTERS recherche parmi ses Prestataires disponibles et qualifiés, et propose un ou plusieurs profils au Client.</p>
                        <p>3.3 Le Client sélectionne le Prestataire proposé. Cette sélection constitue une offre de Mission.</p>
                        <p>3.4 MYSHIFTERS transmet l'offre de Mission au Prestataire. La Mission est confirmée uniquement lorsque le Prestataire l'accepte explicitement.</p>
                        <p>3.5 MYSHIFTERS notifie la confirmation de la Mission au Client, avec les coordonnées du Prestataire.</p>
                    </Section>

                    {/* ARTICLE 4 */}
                    <Section id="art4" title={content.sections[3].title}>
                        <p>4.1 Le Client s'engage à fournir au Prestataire un <strong>environnement de travail sécurisé</strong> et conforme à la réglementation en vigueur.</p>
                        <p>4.2 Le Client doit accueillir le Prestataire, lui fournir les instructions et informations nécessaires à la bonne exécution de la Mission, ainsi que le matériel spécifique à l'établissement si nécessaire (ex: logiciel de réservation, badge).</p>
                        <p>4.3 Le Client traitera le Prestataire avec respect et reconnaîtra son statut d'<strong>indépendant</strong>. Aucun lien de subordination ne doit être exercé.</p>
                        <p>4.4 Le Client doit signaler à MYSHIFTERS, dans les plus brefs délais, tout problème survenant pendant l'exécution de la Mission.</p>
                        <p>4.5 Le Client s'engage à ne pas entrer en relation directe avec un Prestataire rencontré via la Plateforme pour lui commander des Missions en dehors de la Plateforme, pendant une durée de <strong>12 mois</strong> suivant la dernière Mission effectuée via MYSHIFTERS (clause de non-détournement).</p>
                    </Section>

                    {/* ARTICLE 5 */}
                    <Section id="art5" title={content.sections[4].title}>
                        <SubTitle>5.1 Tarifs</SubTitle>
                        <p>Les tarifs des Missions sont communiqués au Client avant validation. Ils varient selon le poste, la durée, le moment (week-end, jour férié) et le délai de la demande (urgence). Les tarifs sont indiqués en Euros, toutes taxes comprises (TTC).</p>

                        <SubTitle>5.2 Facturation et Paiement par le Client</SubTitle>
                        <p>5.2.1 MYSHIFTERS adresse au Client une <strong>facture</strong> pour le montant total de la Mission, dès confirmation de celle-ci.</p>
                        <p>5.2.2 Le paiement de la facture est exigible à réception. Le délai de paiement est de <strong>30 jours fin de mois</strong> à compter de la date de facture.</p>
                        <p>5.2.3 Le paiement s'effectue par virement bancaire sur le compte indiqué sur la facture.</p>
                        <p>5.2.4 Tout retard de paiement entraîne de plein droit l'application de pénalités d'un montant égal à trois fois le taux d'intérêt légal, et une indemnité forfaitaire de 40€ pour frais de recouvrement.</p>

                        <SubTitle>5.3 Rétribution du Prestataire</SubTitle>
                        <p>5.3.1 MYSHIFTERS reverse au Prestataire le montant convenu pour la Mission, après prélèvement de sa Commission.</p>
                        <p>5.3.2 <strong>Condition suspensive absolue :</strong> Le reversement n'intervient qu'après réception par MYSHIFTERS d'une <strong>facture régulière</strong> émise par le Prestataire au nom de MYSHIFTERS, correspondant précisément à la Mission exécutée.</p>
                        <p>5.3.3 Le délai de reversement au Prestataire est de <strong>7 jours ouvrés</strong> après réception du paiement intégral du Client par MYSHIFTERS.</p>

                        <div className="mt-4 rounded-xl border bg-muted/30 p-4">
                            <p className="text-sm font-semibold mb-2">SCHEMA FINANCIER :</p>
                            <ol className="list-decimal list-inside space-y-1 text-sm">
                                <li>Client paye 100€ TTC à MYSHIFTERS pour une Mission.</li>
                                <li>MYSHIFTERS prélève sa Commission (ex: 20%).</li>
                                <li>MYSHIFTERS reçoit la facture de 80€ du Prestataire.</li>
                                <li>MYSHIFTERS reverse 80€ au Prestataire.</li>
                            </ol>
                        </div>
                    </Section>

                    {/* ARTICLE 6 */}
                    <Section id="art6" title={content.sections[5].title}>
                        <SubTitle>6.1 Rôle et Responsabilité Limitée de MYSHIFTERS</SubTitle>
                        <p>6.1.1 MYSHIFTERS met en œuvre ses meilleurs efforts pour proposer des Prestataires qualifiés, mais ne garantit pas les résultats de la Mission. La sélection finale du Prestataire appartient au Client.</p>
                        <p>6.1.2 <strong>MYSHIFTERS N'EST EN AUCUN CAS RESPONSABLE</strong> de l'exécution de la Mission, qui relève de la relation directe entre le Client et le Prestataire. MYSHIFTERS décline toute responsabilité en cas de faute, négligence, dommage ou vol imputable au Prestataire ou au Client.</p>
                        <p>6.1.3 MYSHIFTERS n'est pas responsable des annulations, retards ou absences d'un Prestataire, mais s'engage à tout mettre en œuvre pour trouver un remplaçant dans les meilleurs délais.</p>

                        <SubTitle>6.2 Responsabilité du Client</SubTitle>
                        <p>Le Client est seul responsable de la sécurité du Prestataire au sein de son établissement, et des dommages causés par ou au Prestataire pendant la Mission, dans les conditions du droit commun.</p>

                        <SubTitle>6.3 Assurance</SubTitle>
                        <p>6.3.1 MYSHIFTERS est couverte par une assurance <strong>Responsabilité Civile Professionnelle</strong> pour son activité de mise en relation.</p>
                        <p>6.3.2 Chaque Prestataire inscrit sur la Plateforme doit être titulaire d'une <strong>assurance RC Pro en cours de validité</strong> couvrant son activité. MYSHIFTERS vérifie cette assurance lors de l'inscription mais ne peut en garantir le maintien. Le Client peut en demander une attestation au Prestataire.</p>
                    </Section>

                    {/* ARTICLE 7 */}
                    <Section id="art7" title={content.sections[6].title}>
                        <p>7.1 <strong>Annulation par le Client :</strong></p>
                        <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>Plus de 72h avant la Mission : Aucuns frais.</li>
                            <li>Entre 72h et 24h avant la Mission : Facturation de 50% du montant de la Mission.</li>
                            <li>Moins de 24h avant la Mission : Facturation de 100% du montant de la Mission.</li>
                        </ul>
                        <p className="mt-2">7.2 <strong>Annulation par le Prestataire :</strong> MYSHIFTERS s'engage à rechercher activement un Prestataire de remplacement. En cas d'impossibilité, la Mission est annulée sans frais pour le Client.</p>
                    </Section>

                    {/* ARTICLE 8 */}
                    <Section id="art8" title={content.sections[7].title}>
                        <p>Les données personnelles collectées sont traitées conformément à notre <Link to="/politique-de-confidentialite" className="text-blue-500 hover:underline">Politique de Confidentialité</Link>. Elles sont utilisées pour la gestion des Missions, la facturation et la relation commerciale.</p>
                    </Section>

                    {/* ARTICLE 9 */}
                    <Section id="art9" title={content.sections[8].title}>
                        <p>La Plateforme, son contenu, son savoir-faire et sa base de données sont la propriété exclusive de MYSHIFTERS. Le Client s'interdit toute reproduction ou utilisation non autorisée.</p>
                    </Section>

                    {/* ARTICLE 10 */}
                    <Section id="art10" title={content.sections[9].title}>
                        <p>10.1 Les présentes CGS sont conclues pour une durée indéterminée à compter de leur acceptation.</p>
                        <p>10.2 Chaque partie peut y mettre fin à tout moment, par notification écrite avec un préavis de <strong>30 jours</strong>.</p>
                        <p>10.3 En cas de manquement grave d'une partie à ses obligations, l'autre partie peut résilier les présentes immédiatement, de plein droit.</p>
                        <p>10.4 MYSHIFTERS se réserve le droit de suspendre immédiatement l'accès du Client à la Plateforme en cas de défaut de paiement ou de comportement contraire aux présentes CGS.</p>
                    </Section>

                    {/* ARTICLE 11 */}
                    <Section id="art11" title={content.sections[10].title}>
                        <p>11.1 Les présentes CGS sont régies par le droit français.</p>
                        <p>11.2 En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire.</p>
                        <p>11.3 À défaut d'accord amiable, tout litige relèvera de la compétence exclusive des <strong>Tribunaux compétents du siège social de MYSHIFTERS</strong>, nonobstant la pluralité de défendeurs ou d'appel en garantie.</p>
                    </Section>

                    {/* ARTICLE 12 */}
                    <Section id="art12" title={content.sections[11].title}>
                        <p>12.1 <strong>Modification :</strong> MYSHIFTERS se réserve le droit de modifier les présentes CGS. Les nouvelles versions seront notifiées par email et disponibles sur la Plateforme. Leur utilisation continue du Service vaut acceptation.</p>
                        <p>12.2 <strong>Nullité partielle :</strong> Si une clause des présentes CGS était jugée invalide, les autres clauses resteraient pleinement en vigueur.</p>
                        <p>12.3 <strong>Intégralité :</strong> Les présentes CGS constituent l'intégralité de l'accord entre les parties concernant l'objet des CGS.</p>
                    </Section>
                </div>

                {/* Accept by email */}
                <div className="mt-10 rounded-3xl border bg-muted/20 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white mb-3">
                        <Mail className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-semibold">{content.acceptTitle}</h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {content.acceptDesc}
                    </p>

                    <Button asChild className="mt-4">
                        <a
                            href="mailto:contact@myshifters.fr?subject=Acceptation%20des%20CGS%20MyShifters&body=Je%20soussign%C3%A9(e)%20[Pr%C3%A9nom%20Nom]%2C%20repr%C3%A9sentant%20de%20[RAISON%20SOCIALE]%2C%20accepte%20les%20Conditions%20G%C3%A9n%C3%A9rales%20de%20Services%20de%20MyShifters."
                        >
                            {content.acceptButton}
                        </a>
                    </Button>
                </div>

                {/* Footer links */}
                <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
                    <Link to="/mentions-legales" className="hover:underline">
                        {content.footer.legal}
                    </Link>
                    <Link to="/politique-de-confidentialite" className="hover:underline">
                        {content.footer.privacy}
                    </Link>
                    <Link to="/cgu" className="hover:underline">
                        {content.footer.cgu}
                    </Link>
                </div>
            </main>
        </div>
    );
}

/* ------------------ UI helpers ------------------ */

function Section({ id, title, children }) {
    return (
        <section id={id} className="rounded-3xl border bg-card p-6 shadow-sm scroll-mt-24">
            <h2 className="text-lg font-semibold">{title}</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground">{children}</div>
        </section>
    );
}

function SubTitle({ children }) {
    return <h3 className="mt-3 text-base font-semibold text-foreground">{children}</h3>;
}
