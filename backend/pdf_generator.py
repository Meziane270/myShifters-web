from fpdf import FPDF
from datetime import datetime, timedelta

class MissionReportPDF(FPDF):
    def __init__(self, mission_data, worker_data, hotel_data, myshifters_data):
        super().__init__()
        self.mission = mission_data
        self.worker = worker_data
        self.hotel = hotel_data
        self.myshifters = myshifters_data
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

        # Référence mission
        self.cell(60, 10, self.mission.get('id', 'N/A'), 1, 0, "C")

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
        self.cell(70, 10, "Sous 15 jours ouvrés une fois la mission terminée", 1, 1, "C")
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
        self.multi_cell(0, 4,
                        "(2) Prestation de mise en relation effectuée par MyShifters - TVA à 20 % acquittée sur les débits"
                        )


class InvoicePDF(FPDF):
    def __init__(self, invoice_data, mission_data, worker_data, hotel_data, myshifters_data):
        super().__init__()
        self.invoice = invoice_data
        self.mission = mission_data
        self.worker = worker_data
        self.hotel = hotel_data
        self.myshifters = myshifters_data
        self.add_page()
        self.set_font("Arial", size=10)
        self.alias_nb_pages()

    def header(self):
        self.set_font("Arial", "B", 12)
        self.cell(0, 10, "Facture", 0, 1, "C")
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

        # Facture Details Table 1
        self.set_fill_color(230, 230, 230)
        self.set_font("Arial", "B", 10)
        self.cell(40, 10, "Référence mission", 1, 0, "C", 1)
        self.cell(50, 10, "Numéro de facture", 1, 0, "C", 1)
        self.cell(30, 10, "Date de commande", 1, 0, "C", 1)
        self.cell(30, 10, "Délai de règlement", 1, 0, "C", 1)
        self.cell(40, 10, "Date fin mission", 1, 1, "C", 1)

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

        self.cell(40, 10, self.mission.get('id', 'N/A'), 1, 0, "C")
        self.cell(50, 10, self.invoice.get('invoice_number', 'N/A'), 1, 0, "C")
        self.cell(30, 10, invoice_date, 1, 0, "C")
        self.cell(30, 10, "Paiement comptant", 1, 0, "C")
        self.cell(40, 10, mission_end_date, 1, 1, "C")
        self.ln(10)

        # Désignation Section 1
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

        nb_days = len(dates) or 1
        amount_to_worker_ht = hourly_rate * duration_hours * nb_days

        # Première date formatée
        first_date = "N/A"
        if dates and len(dates) > 0:
            try:
                first_date = datetime.strptime(dates[0], "%Y-%m-%d").strftime("%d %B %Y")
            except (ValueError, TypeError):
                first_date = "N/A"

        designation_text_1 = (
            f"Autofacturation - Facture établie par MyShifters au nom et pour le compte de l'EXTRA (1)\n\n"
            f"Prestation de services en Accueil en qualité de {self.mission.get('service_type', 'N/A')} "
            f"effectuée par l'EXTRA :\n\n"
            f"{self.worker.get('first_name', 'N/A')} {self.worker.get('last_name', 'N/A')} - EI - Micro-entrepreneur\n"
            f"{self.worker.get('address', 'N/A')}, {self.worker.get('postal_code', 'N/A')} {self.worker.get('city', 'N/A')}\n"
            f"N° Entreprise : {self.worker.get('siret', 'N/A')}\n"
            f"N° TVA Intracommunautaire : {self.worker.get('tva', 'N/A')}\n\n"
            f"Période : {first_date} de {self.mission.get('start_time', 'N/A')} à {self.mission.get('end_time', 'N/A')}\n"
            f"Lieu de la prestation : {self.hotel.get('hotel_address', 'N/A')}, {self.hotel.get('postal_code', 'N/A')} {self.hotel.get('city', 'N/A')}"
        )

        x_before_mc = self.get_x()
        y_before_mc = self.get_y()
        self.multi_cell(130, 5, designation_text_1, 1, "L")
        mc_height = self.get_y() - y_before_mc

        self.set_xy(x_before_mc + 130, y_before_mc)
        self.cell(30, mc_height, f"{amount_to_worker_ht:.2f} €", 1, 0, "C")
        self.cell(30, mc_height, "0.00 €", 1, 1, "C")
        self.ln(5)

        self.set_font("Arial", "B", 10)
        self.cell(130, 10, "", 0, 0)
        self.cell(30, 10, "Montant TOTAL TTC reversé à l'EXTRA", 1, 0, "C", 1)
        self.cell(30, 10, f"{amount_to_worker_ht:.2f} €", 1, 1, "C")
        self.ln(10)

        # Désignation Section 2 (Commission)
        self.set_fill_color(230, 230, 230)
        self.set_font("Arial", "B", 10)
        self.cell(130, 10, "Désignation", 1, 0, "C", 1)
        self.cell(30, 10, "HT", 1, 0, "C", 1)
        self.cell(30, 10, "TVA (20%)", 1, 1, "C", 1)

        self.set_font("Arial", size=10)
        commission_rate = 0.25  # À récupérer depuis les settings
        # Montant total payé par le client = montant_worker / (1 - commission_rate)
        total_client_ht = amount_to_worker_ht / (1 - commission_rate) if commission_rate < 1 else 0
        commission_ht = total_client_ht - amount_to_worker_ht
        commission_tva = commission_ht * 0.20

        designation_text_2 = f"Commission de {commission_rate*100:.0f}% pour la mise en relation entre le CLIENT et l'EXTRA (2)"

        x_before_mc = self.get_x()
        y_before_mc = self.get_y()
        self.multi_cell(130, 5, designation_text_2, 1, "L")
        mc_height = self.get_y() - y_before_mc

        self.set_xy(x_before_mc + 130, y_before_mc)
        self.cell(30, mc_height, f"{commission_ht:.2f} €", 1, 0, "C")
        self.cell(30, mc_height, f"{commission_tva:.2f} €", 1, 1, "C")
        self.ln(5)

        self.set_font("Arial", "B", 10)
        self.cell(130, 10, "", 0, 0)
        self.cell(30, 10, "Montant TOTAL TTC reversé à MyShifters", 1, 0, "C", 1)
        self.cell(30, 10, f"{commission_ht + commission_tva:.2f} €", 1, 1, "C")
        self.ln(5)

        total_paid_by_client = amount_to_worker_ht + commission_ht + commission_tva
        self.set_font("Arial", "B", 10)
        self.cell(130, 10, "", 0, 0)
        self.cell(30, 10, "Montant TOTAL TTC payé par le CLIENT", 1, 0, "C", 1)
        self.cell(30, 10, f"{total_paid_by_client:.2f} €", 1, 1, "C")
        self.ln(10)

        # Facture acquittée ce jour
        self.set_font("Arial", "B", 10)
        self.cell(0, 10, "Facture acquittée ce jour", 0, 1)
        self.set_font("Arial", size=10)
        self.multi_cell(0, 5,
                        "Le montant anticipé des factures ne donne lieu à aucun escompte. Toute somme demeurée impayée sera majorée "
                        "d'intérêts de retard au taux pratiqué par la Banque Centrale Européenne pour sa dernière opération de "
                        "refinancement, majoré de 10 points de pourcentage. Indemnité forfaitaire pour frais de recouvrement en cas "
                        "de retard de paiement : 40 €."
                        )


def generate_mission_report_pdf(mission_data, worker_data, hotel_data):
    myshifters_data = {
        "company_name": "MyShifters SAS",
        "address": "50 avenue des Champs-Élysées, 75008 Paris",
        "phone": "+33 1 83 81 15 30",
        "email": "contact@myshifters.com",
        "siren": "123456789",      # À remplacer par une vraie valeur
        "tva": "FR12345678901"     # À remplacer par une vraie valeur
    }
    pdf = MissionReportPDF(mission_data, worker_data, hotel_data, myshifters_data)
    pdf.create_report()
    return pdf.output(dest='S').encode('utf-8')


def generate_invoice_pdf(invoice_data, mission_data, worker_data, hotel_data):
    myshifters_data = {
        "company_name": "MyShifters SAS",
        "address": "50 avenue des Champs-Élysées, 75008 Paris",
        "phone": "+33 1 83 81 15 30",
        "email": "contact@myshifters.com",
        "siren": "123456789",      # À remplacer par une vraie valeur
        "tva": "FR12345678901"     # À remplacer par une vraie valeur
    }
    pdf = InvoicePDF(invoice_data, mission_data, worker_data, hotel_data, myshifters_data)
    pdf.create_invoice()
    return pdf.output(dest='S').encode('utf-8')