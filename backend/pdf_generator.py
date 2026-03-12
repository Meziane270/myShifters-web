from fpdf import FPDF
from datetime import datetime, timedelta

class MissionReportPDF(FPDF):
    def __init__(self, mission_data, worker_data, hotel_data, myshifters_data, commission_rate=0.15):
        super().__init__()
        self.mission = mission_data
        self.worker = worker_data
        self.hotel = hotel_data
        self.myshifters = myshifters_data
        self.commission_rate = commission_rate
        self.add_page()
        self.set_font("Arial", size=10)
        self.alias_nb_pages()

    def header(self):
        self.set_font("Arial", "B", 12)
        self.cell(0, 10, "RELEVÉ DE MISSION", 0, 1, "C")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", 0, 0, "C")

    def create_report(self):
        # Prestataire (MyShifters)
        self.set_font("Arial", "B", 10)
        self.cell(0, 5, "PRESTATAIRE", 0, 1)
        self.set_font("Arial", size=10)
        self.multi_cell(0, 5,
                        f"Société : {self.myshifters['company_name']}\n"
                        f"Siège social : {self.myshifters['address']}\n"
                        f"Téléphone : {self.myshifters['phone']}\n"
                        f"Email : {self.myshifters['email']}\n"
                        f"RCS Paris - SIREN : {self.myshifters['siren']}\n"
                        f"TVA Intracommunautaire : {self.myshifters['tva']}"
                        )
        self.ln(5)

        # Extra (Worker)
        current_y = self.get_y()
        self.set_xy(self.get_x() + 100, current_y - 40)
        self.set_font("Arial", "B", 10)
        self.cell(0, 5, "Extra", 0, 1)
        self.set_xy(self.get_x() + 100, self.get_y() - 5)
        self.set_font("Arial", size=10)
        self.multi_cell(0, 5,
                        f"Nom : {self.worker['first_name']} {self.worker['last_name']}\n"
                        f"Adresse : {self.worker['address']}, {self.worker['postal_code']} {self.worker['city']}\n"
                        f"Téléphone : {self.worker['phone']}\n"
                        f"Email : {self.worker['email']}\n"
                        f"SIRET : {self.worker['siret']}\n"
                        f"TVA Intracommunautaire : {self.worker['tva']}"
                        )
        self.ln(10)

        # Reset position
        self.set_y(max(current_y + 20, self.get_y()))

        # Mission Details Table
        self.set_fill_color(230, 230, 230)
        self.set_font("Arial", "B", 10)
        self.cell(60, 10, "Référence mission", 1, 0, "C", 1)
        self.cell(60, 10, "Date de fin de mission", 1, 0, "C", 1)
        self.cell(70, 10, "Délai de règlement", 1, 1, "C", 1)

        self.set_font("Arial", size=10)

        # Référence mission (compteur)
        mission_ref = self.mission.get('reference', self.mission.get('id', 'N/A'))
        self.cell(60, 10, str(mission_ref), 1, 0, "C")

        # Date de fin
        mission_end_date = "N/A"
        dates = self.mission.get('dates', [])
        if dates and len(dates) > 0:
            try:
                mission_end_date = datetime.strptime(dates[-1], "%Y-%m-%d").strftime("%d/%m/%Y")
            except (ValueError, TypeError):
                mission_end_date = "N/A"
        self.cell(60, 10, mission_end_date, 1, 0, "C")

        # Délai
        self.cell(70, 10, "Sous 15 jours ouvrés", 1, 1, "C")
        self.ln(10)

        # Désignation
        self.set_fill_color(230, 230, 230)
        self.set_font("Arial", "B", 10)
        self.cell(130, 10, "Désignation", 1, 0, "C", 1)
        self.cell(30, 10, "HT", 1, 0, "C", 1)
        self.cell(30, 10, "TVA (0%)", 1, 1, "C", 1)

        self.set_font("Arial", size=10)

        # Calcul du montant
        hourly_rate = self.mission.get('hourly_rate', 0)
        start_time_str = self.mission.get('start_time', '00:00')
        end_time_str = self.mission.get('end_time', '00:00')

        try:
            start_dt = datetime.strptime(start_time_str, "%H:%M")
            end_dt = datetime.strptime(end_time_str, "%H:%M")
            if end_dt <= start_dt:
                end_dt += timedelta(days=1)
            duration_hours = (end_dt - start_dt).total_seconds() / 3600
        except (ValueError, TypeError):
            duration_hours = 0

        nb_days = len(self.mission.get('dates', [])) or 1
        # Le montant pour le worker est le taux horaire * heures * jours
        total_amount = hourly_rate * duration_hours * nb_days

        # Texte de désignation
        first_date = "N/A"
        if dates and len(dates) > 0:
            try:
                first_date = datetime.strptime(dates[0], "%Y-%m-%d").strftime("%d %B %Y")
            except (ValueError, TypeError):
                first_date = "N/A"

        designation_text = (
            f"Autofacturation - Ré-édition des comptes suite à l'émission de la facture établie "
            f"par MyShifters au nom et pour le compte de l'EXTRA (1) envers le CLIENT :\n\n"
            f"Raison sociale : {self.hotel.get('hotel_name', 'N/A')}\n"
            f"Adresse : {self.hotel.get('hotel_address', 'N/A')}, {self.hotel.get('postal_code', 'N/A')} {self.hotel.get('city', 'N/A')}\n"
            f"Téléphone : {self.hotel.get('phone', 'N/A')}\n"
            f"Email : {self.hotel.get('email', 'N/A')}\n"
            f"SIRET : {self.hotel.get('siret', 'N/A')}\n"
            f"N° TVA Intracommunautaire : {self.hotel.get('tva', 'N/A')}\n\n"
            f"Ceci est un relevé d'informations reprenant le montant des revenus à déclarer "
            f"afin de s'acquitter des cotisations URSSAF.\n\n"
            f"Prestation de services en Accueil en qualité de {self.mission.get('service_type', 'N/A')} "
            f"effectuée par l'EXTRA :\n\n"
            f"{self.worker.get('first_name', 'N/A')} {self.worker.get('last_name', 'N/A')} - Travailleur indépendant\n"
            f"SIRET : {self.worker.get('siret', 'N/A')}\n"
            f"N° TVA Intracommunautaire : {self.worker.get('tva', 'N/A')}\n"
            f"{first_date} de {self.mission.get('start_time', 'N/A')} à {self.mission.get('end_time', 'N/A')}\n"
            f"{self.hotel.get('hotel_address', 'N/A')}, {self.hotel.get('postal_code', 'N/A')} {self.hotel.get('city', 'N/A')}"
        )

        x_before_mc = self.get_x()
        y_before_mc = self.get_y()
        self.multi_cell(130, 5, designation_text, 1, "L")
        mc_height = self.get_y() - y_before_mc

        self.set_xy(x_before_mc + 130, y_before_mc)
        self.cell(30, mc_height, f"{total_amount:.2f} €", 1, 0, "C")
        self.cell(30, mc_height, "0.00 €", 1, 1, "C")
        self.ln(5)

        self.set_font("Arial", "B", 10)
        self.cell(130, 10, "", 0, 0)
        self.cell(30, 10, "Montant TOTAL TTC", 1, 0, "C", 1)
        self.cell(30, 10, f"{total_amount:.2f} €", 1, 1, "C")

        self.ln(10)
        self.set_font("Arial", size=8)
        commission_percent = int(self.commission_rate * 100)
        self.multi_cell(0, 4,
                        f"(2) Prestation de mise en relation effectuée par MyShifters - Commission de {commission_percent}% - TVA à 20 % acquittée sur les débits"
                        )


class InvoicePDF(FPDF):
    def __init__(self, invoice_data, mission_data, worker_data, hotel_data, myshifters_data, commission_rate=0.15):
        super().__init__()
        self.invoice = invoice_data
        self.mission = mission_data
        self.worker = worker_data
        self.hotel = hotel_data
        self.myshifters = myshifters_data
        self.commission_rate = commission_rate
        self.add_page()
        self.set_font("Arial", size=10)
        self.alias_nb_pages()

    def header(self):
        self.set_font("Arial", "B", 12)
        self.cell(0, 10, "FACTURE", 0, 1, "C")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Arial", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", 0, 0, "C")

    def create_invoice(self):
        # Prestataire (MyShifters)
        self.set_font("Arial", "B", 10)
        self.cell(0, 5, "PRESTATAIRE", 0, 1)
        self.set_font("Arial", size=10)
        self.multi_cell(0, 5,
                        f"Société : {self.myshifters['company_name']}\n"
                        f"Siège social : {self.myshifters['address']}\n"
                        f"Téléphone : {self.myshifters['phone']}\n"
                        f"Email : {self.myshifters['email']}\n"
                        f"RCS Paris - SIREN : {self.myshifters['siren']}\n"
                        f"TVA Intracommunautaire : {self.myshifters['tva']}"
                        )
        self.ln(5)

        # Client (Hotel)
        current_y = self.get_y()
        self.set_xy(self.get_x() + 100, current_y - 40)
        self.set_font("Arial", "B", 10)
        self.cell(0, 5, "CLIENT", 0, 1)
        self.set_xy(self.get_x() + 100, self.get_y() - 5)
        self.set_font("Arial", size=10)
        self.multi_cell(0, 5,
                        f"Raison sociale : {self.hotel.get('hotel_name', 'N/A')}\n"
                        f"Dénomination commerciale : {self.hotel.get('hotel_name', 'N/A')}\n"
                        f"Adresse : {self.hotel.get('hotel_address', 'N/A')}, {self.hotel.get('postal_code', 'N/A')} {self.hotel.get('city', 'N/A')}\n"
                        f"Téléphone : {self.hotel.get('phone', 'N/A')}\n"
                        f"Email : {self.hotel.get('email', 'N/A')}\n"
                        f"N° Entreprise : {self.hotel.get('siret', 'N/A')}\n"
                        f"N° TVA Intracommunautaire : {self.hotel.get('tva', 'N/A')}"
                        )
        self.ln(10)

        self.set_y(max(current_y + 20, self.get_y()))

        # Facture Details Table
        self.set_fill_color(230, 230, 230)
        self.set_font("Arial", "B", 10)
        self.cell(40, 10, "Réf. mission", 1, 0, "C", 1)
        self.cell(50, 10, "N° facture", 1, 0, "C", 1)
        self.cell(30, 10, "Date facture", 1, 0, "C", 1)
        self.cell(30, 10, "Règlement", 1, 0, "C", 1)
        self.cell(40, 10, "Fin mission", 1, 1, "C", 1)

        self.set_font("Arial", size=10)

        # Date de fin de mission
        dates = self.mission.get('dates', [])
        mission_end_date = "N/A"
        if dates and len(dates) > 0:
            try:
                mission_end_date = datetime.strptime(dates[-1], "%Y-%m-%d").strftime("%d/%m/%Y")
            except (ValueError, TypeError):
                mission_end_date = "N/A"

        invoice_date = datetime.now().strftime("%d/%m/%Y")

        # Référence mission (compteur)
        mission_ref = self.mission.get('reference', self.mission.get('id', 'N/A'))

        # Numéro de facture
        invoice_number = self.invoice.get('invoice_number', 'N/A')

        self.cell(40, 10, str(mission_ref), 1, 0, "C")
        self.cell(50, 10, str(invoice_number), 1, 0, "C")
        self.cell(30, 10, invoice_date, 1, 0, "C")
        self.cell(30, 10, "Comptant", 1, 0, "C")
        self.cell(40, 10, mission_end_date, 1, 1, "C")
        self.ln(10)

        # Calcul des montants
        hourly_rate = self.mission.get('hourly_rate', 0)
        start_time_str = self.mission.get('start_time', '00:00')
        end_time_str = self.mission.get('end_time', '00:00')

        try:
            start_dt = datetime.strptime(start_time_str, "%H:%M")
            end_dt = datetime.strptime(end_time_str, "%H:%M")
            if end_dt <= start_dt:
                end_dt += timedelta(days=1)
            duration_hours = (end_dt - start_dt).total_seconds() / 3600
        except (ValueError, TypeError):
            duration_hours = 0

        nb_days = len(dates) or 1

        # Montant Extra (ce que le worker reçoit)
        amount_extra = hourly_rate * duration_hours * nb_days

        # Commission MyShifters (% du montant extra)
        commission_percent = int(self.commission_rate * 100)
        commission_ht = amount_extra * self.commission_rate

        # Sous-total HT
        subtotal_ht = amount_extra + commission_ht

        # TVA 20% sur le sous-total
        tva_amount = subtotal_ht * 0.20

        # Total TTC
        total_ttc = subtotal_ht + tva_amount

        # Première date formatée
        first_date = "N/A"
        if dates and len(dates) > 0:
            try:
                first_date = datetime.strptime(dates[0], "%Y-%m-%d").strftime("%d %B %Y")
            except (ValueError, TypeError):
                first_date = "N/A"

        # === TABLEAU PRINCIPAL ===
        self.set_fill_color(230, 230, 230)
        self.set_font("Arial", "B", 10)
        self.cell(130, 10, "Désignation", 1, 0, "C", 1)
        self.cell(30, 10, "Montant HT", 1, 0, "C", 1)
        self.cell(30, 10, "Montant TTC", 1, 1, "C", 1)

        self.set_font("Arial", size=10)

        # Ligne 1: Prestation Extra
        designation_extra = (
            f"Prestation de services effectuée par l'EXTRA :\n"
            f"{self.worker.get('first_name', '')} {self.worker.get('last_name', '')} - Micro-entrepreneur\n"
            f"SIRET : {self.worker.get('siret', 'N/A')}\n"
            f"Mission : {self.mission.get('service_type', 'N/A')}\n"
            f"Période : {first_date}\n"
            f"Horaires : {self.mission.get('start_time', 'N/A')} - {self.mission.get('end_time', 'N/A')}\n"
            f"Durée : {duration_hours:.1f}h x {nb_days} jour(s) x {hourly_rate:.2f}€/h"
        )

        x_before = self.get_x()
        y_before = self.get_y()
        self.multi_cell(130, 5, designation_extra, 1, "L")
        height_1 = self.get_y() - y_before

        self.set_xy(x_before + 130, y_before)
        self.cell(30, height_1, f"{amount_extra:.2f} €", 1, 0, "C")
        self.cell(30, height_1, f"{amount_extra:.2f} €", 1, 1, "C")

        # Ligne 2: Commission MyShifters
        self.set_font("Arial", size=10)
        designation_commission = f"Prestation de mise en relation effectuée par MyShifters {commission_percent}%"

        self.cell(130, 10, designation_commission, 1, 0, "L")
        self.cell(30, 10, f"{commission_ht:.2f} €", 1, 0, "C")
        self.cell(30, 10, f"{commission_ht:.2f} €", 1, 1, "C")

        # Ligne 3: TVA 20%
        self.cell(130, 10, "TVA 20%", 1, 0, "L")
        self.cell(30, 10, "", 1, 0, "C")
        self.cell(30, 10, f"{tva_amount:.2f} €", 1, 1, "C")

        self.ln(5)

        # === RÉCAPITULATIF ===
        self.set_font("Arial", "B", 10)
        self.set_fill_color(240, 240, 240)

        # Sous-total HT
        self.cell(130, 10, "", 0, 0)
        self.cell(30, 10, "Sous-total HT", 1, 0, "R", 1)
        self.cell(30, 10, f"{subtotal_ht:.2f} €", 1, 1, "C")

        # TVA
        self.cell(130, 10, "", 0, 0)
        self.cell(30, 10, "TVA 20%", 1, 0, "R", 1)
        self.cell(30, 10, f"{tva_amount:.2f} €", 1, 1, "C")

        # Total TTC
        self.set_fill_color(200, 200, 200)
        self.cell(130, 10, "", 0, 0)
        self.cell(30, 10, "TOTAL TTC", 1, 0, "R", 1)
        self.cell(30, 10, f"{total_ttc:.2f} €", 1, 1, "C")

        self.ln(10)

        # === DÉTAIL DES REVERSEMENTS ===
        self.set_font("Arial", "B", 10)
        self.cell(0, 8, "Détail des reversements :", 0, 1)
        self.set_font("Arial", size=10)
        self.cell(0, 6, f"- Montant reversé à l'EXTRA : {amount_extra:.2f} €", 0, 1)
        self.cell(0, 6, f"- Commission MyShifters HT : {commission_ht:.2f} €", 0, 1)
        self.cell(0, 6, f"- TVA collectée : {tva_amount:.2f} €", 0, 1)

        self.ln(10)

        # Mentions légales
        self.set_font("Arial", "B", 10)
        self.cell(0, 10, "Facture acquittée ce jour", 0, 1)
        self.set_font("Arial", size=8)
        self.multi_cell(0, 4,
                        "Le montant anticipé des factures ne donne lieu à aucun escompte. Toute somme demeurée impayée sera majorée "
                        "d'intérêts de retard au taux pratiqué par la Banque Centrale Européenne pour sa dernière opération de "
                        "refinancement, majoré de 10 points de pourcentage. Indemnité forfaitaire pour frais de recouvrement en cas "
                        "de retard de paiement : 40 €."
                        )


def generate_mission_report_pdf(mission_data, worker_data, hotel_data, commission_rate=0.15):
    myshifters_data = {
        "company_name": "MyShifters SAS",
        "address": "50 avenue des Champs-Élysées, 75008 Paris",
        "phone": "+33 1 83 81 15 30",
        "email": "contact@myshifters.com",
        "siren": "123456789",
        "tva": "FR12345678901"
    }
    pdf = MissionReportPDF(mission_data, worker_data, hotel_data, myshifters_data, commission_rate)
    pdf.create_report()
    return pdf.output(dest='S').encode('utf-8')


def generate_invoice_pdf(invoice_data, mission_data, worker_data, hotel_data, commission_rate=0.15):
    myshifters_data = {
        "company_name": "MyShifters SAS",
        "address": "50 avenue des Champs-Élysées, 75008 Paris",
        "phone": "+33 1 83 81 15 30",
        "email": "contact@myshifters.com",
        "siren": "123456789",
        "tva": "FR12345678901"
    }
    pdf = InvoicePDF(invoice_data, mission_data, worker_data, hotel_data, myshifters_data, commission_rate)
    pdf.create_invoice()
    return pdf.output(dest='S').encode('utf-8')