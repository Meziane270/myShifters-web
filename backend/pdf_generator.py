from fpdf import FPDF
from datetime import datetime, timedelta

def encode_text(text):
    """Encode le texte pour éviter les problèmes avec les caractères spéciaux"""
    if text is None:
        return ""
    # Remplace le symbole euro par EUR pour éviter les problèmes d'encodage latin-1
    return str(text).replace("€", "EUR").replace("’", "'").replace("“", '"').replace("”", '"')

class MissionReportPDF(FPDF):
    def __init__(self, mission_data, worker_data, hotel_data, myshifters_data):
        super().__init__()
        self.mission = mission_data
        self.worker = worker_data
        self.hotel = hotel_data
        self.myshifters = myshifters_data
        self.add_page()
        self.set_font("Helvetica", size=10)
        self.alias_nb_pages()

    def header(self):
        self.set_font("Helvetica", "B", 12)
        self.cell(0, 10, encode_text("RELEVE DE MISSION"), 0, 1, "C")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", 0, 0, "C")

    def create_report(self):
        # Prestataire (MyShifters)
        self.set_font("Helvetica", "B", 10)
        self.cell(0, 5, encode_text("PRESTATAIRE"), 0, 1)
        self.set_font("Helvetica", size=10)
        self.multi_cell(0, 5,
                        f"Société : {encode_text(self.myshifters['company_name'])}\n"
                        f"Siège social : {encode_text(self.myshifters['address'])}\n"
                        f"Téléphone : {encode_text(self.myshifters['phone'])}\n"
                        f"Email : {encode_text(self.myshifters['email'])}\n"
                        f"RCS Paris - SIREN : {encode_text(self.myshifters['siren'])}\n"
                        f"TVA Intracommunautaire : {encode_text(self.myshifters['tva'])}"
                        )
        self.ln(5)

        # Extra (Worker)
        current_y = self.get_y()
        self.set_xy(self.get_x() + 100, current_y - 40)
        self.set_font("Helvetica", "B", 10)
        self.cell(0, 5, encode_text("Extra"), 0, 1)
        self.set_xy(self.get_x() + 100, self.get_y() - 5)
        self.set_font("Helvetica", size=10)
        self.multi_cell(0, 5,
                        f"Nom : {encode_text(self.worker['first_name'])} {encode_text(self.worker['last_name'])}\n"
                        f"Adresse : {encode_text(self.worker['address'])}, {encode_text(self.worker['postal_code'])} {encode_text(self.worker['city'])}\n"
                        f"Téléphone : {encode_text(self.worker['phone'])}\n"
                        f"Email : {encode_text(self.worker['email'])}\n"
                        f"SIRET : {encode_text(self.worker['siret'])}\n"
                        f"TVA Intracommunautaire : {encode_text(self.worker['tva'])}"
                        )
        self.ln(10)

        # Reset position
        self.set_y(max(current_y + 20, self.get_y()))

        # Mission Details Table
        self.set_fill_color(230, 230, 230)
        self.set_font("Helvetica", "B", 10)
        self.cell(60, 10, encode_text("Référence mission"), 1, 0, "C", 1)
        self.cell(60, 10, encode_text("Date de fin de mission"), 1, 0, "C", 1)
        self.cell(70, 10, encode_text("Délai de règlement"), 1, 1, "C", 1)

        self.set_font("Helvetica", size=10)

        # Référence mission
        self.cell(60, 10, encode_text(self.mission.get('id', 'N/A')), 1, 0, "C")

        # Date de fin
        mission_end_date = "N/A"
        dates = self.mission.get('dates', [])
        if dates and len(dates) > 0:
            try:
                mission_end_date = datetime.strptime(dates[-1], "%Y-%m-%d").strftime("%d/%m/%Y")
            except (ValueError, TypeError):
                mission_end_date = "N/A"
        self.cell(60, 10, encode_text(mission_end_date), 1, 0, "C")

        # Délai
        self.cell(70, 10, encode_text("Sous 15 jours ouvrés une fois la mission terminée"), 1, 1, "C")
        self.ln(10)

        # Désignation
        self.set_fill_color(230, 230, 230)
        self.set_font("Helvetica", "B", 10)
        self.cell(130, 10, encode_text("Désignation"), 1, 0, "C", 1)
        self.cell(30, 10, encode_text("HT"), 1, 0, "C", 1)
        self.cell(30, 10, encode_text("TVA (0%)"), 1, 1, "C", 1)

        self.set_font("Helvetica", size=10)

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
            f"Raison sociale : {encode_text(self.hotel.get('hotel_name', 'N/A'))}\n"
            f"Adresse : {encode_text(self.hotel.get('hotel_address', 'N/A'))}, {encode_text(self.hotel.get('postal_code', 'N/A'))} {encode_text(self.hotel.get('city', 'N/A'))}\n"
            f"Téléphone : {encode_text(self.hotel.get('phone', 'N/A'))}\n"
            f"Email : {encode_text(self.hotel.get('email', 'N/A'))}\n"
            f"SIRET : {encode_text(self.hotel.get('siret', 'N/A'))}\n"
            f"N° TVA Intracommunautaire : {encode_text(self.hotel.get('tva', 'N/A'))}\n\n"
            f"Ceci est un relevé d'informations reprenant le montant des revenus à déclarer "
            f"afin de s'acquitter des cotisations URSSAF.\n\n"
            f"Prestation de services en Accueil en qualité de {encode_text(self.mission.get('service_type', 'N/A'))} "
            f"effectuée par l'EXTRA :\n\n"
            f"{encode_text(self.worker.get('first_name', 'N/A'))} {encode_text(self.worker.get('last_name', 'N/A'))} - Travailleur indépendant\n"
            f"SIRET : {encode_text(self.worker.get('siret', 'N/A'))}\n"
            f"N° TVA Intracommunautaire : {encode_text(self.worker.get('tva', 'N/A'))}\n"
            f"{encode_text(first_date)} de {encode_text(self.mission.get('start_time', 'N/A'))} à {encode_text(self.mission.get('end_time', 'N/A'))}\n"
            f"{encode_text(self.hotel.get('hotel_address', 'N/A'))}, {encode_text(self.hotel.get('postal_code', 'N/A'))} {encode_text(self.hotel.get('city', 'N/A'))}"
        )

        x_before_mc = self.get_x()
        y_before_mc = self.get_y()
        self.multi_cell(130, 5, encode_text(designation_text), 1, "L")
        mc_height = self.get_y() - y_before_mc

        self.set_xy(x_before_mc + 130, y_before_mc)
        self.cell(30, mc_height, f"{total_amount:.2f} EUR", 1, 0, "C")
        self.cell(30, mc_height, "0.00 EUR", 1, 1, "C")
        self.ln(5)

        self.set_font("Helvetica", "B", 10)
        self.cell(130, 10, "", 0, 0)
        self.cell(30, 10, encode_text("Montant TOTAL TTC"), 1, 0, "C", 1)
        self.cell(30, 10, f"{total_amount:.2f} EUR", 1, 1, "C")

        self.ln(10)
        self.set_font("Helvetica", size=8)
        self.multi_cell(0, 4,
                        encode_text("(2) Prestation de mise en relation effectuée par MyShifters - TVA à 20 % acquittée sur les débits")
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
        self.set_font("Helvetica", size=10)
        self.alias_nb_pages()

    def header(self):
        self.set_font("Helvetica", "B", 12)
        self.cell(0, 10, encode_text("Facture"), 0, 1, "C")
        self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", 0, 0, "C")

    def create_invoice(self):
        # Prestataire (MyShifters)
        self.set_font("Helvetica", "B", 10)
        self.cell(0, 5, encode_text("PRESTATAIRE"), 0, 1)
        self.set_font("Helvetica", size=10)
        self.multi_cell(0, 5,
                        f"Société : {encode_text(self.myshifters['company_name'])}\n"
                        f"Siège social : {encode_text(self.myshifters['address'])}\n"
                        f"Téléphone : {encode_text(self.myshifters['phone'])}\n"
                        f"Email : {encode_text(self.myshifters['email'])}\n"
                        f"RCS Paris - SIREN : {encode_text(self.myshifters['siren'])}\n"
                        f"TVA Intracommunautaire : {encode_text(self.myshifters['tva'])}"
                        )
        self.ln(5)

        # Client (Hotel)
        current_y = self.get_y()
        self.set_xy(self.get_x() + 100, current_y - 40)
        self.set_font("Helvetica", "B", 10)
        self.cell(0, 5, encode_text("CLIENT"), 0, 1)
        self.set_xy(self.get_x() + 100, self.get_y() - 5)
        self.set_font("Helvetica", size=10)
        self.multi_cell(0, 5,
                        f"Raison sociale : {encode_text(self.hotel.get('hotel_name', 'N/A'))}\n"
                        f"Dénomination commerciale : {encode_text(self.hotel.get('hotel_name', 'N/A'))}\n"
                        f"Adresse : {encode_text(self.hotel.get('hotel_address', 'N/A'))}, {encode_text(self.hotel.get('postal_code', 'N/A'))} {encode_text(self.hotel.get('city', 'N/A'))}\n"
                        f"Téléphone : {encode_text(self.hotel.get('phone', 'N/A'))}\n"
                        f"Email : {encode_text(self.hotel.get('email', 'N/A'))}\n"
                        f"N° Entreprise : {encode_text(self.hotel.get('siret', 'N/A'))}\n"
                        f"N° TVA Intracommunautaire : {encode_text(self.hotel.get('tva', 'N/A'))}"
                        )
        self.ln(10)

        self.set_y(max(current_y + 20, self.get_y()))

        # Facture Details Table 1
        self.set_fill_color(230, 230, 230)
        self.set_font("Helvetica", "B", 10)
        self.cell(40, 10, encode_text("Référence mission"), 1, 0, "C", 1)
        self.cell(50, 10, encode_text("Numéro de facture"), 1, 0, "C", 1)
        self.cell(30, 10, encode_text("Date de commande"), 1, 0, "C", 1)
        self.cell(30, 10, encode_text("Délai de règlement"), 1, 0, "C", 1)
        self.cell(40, 10, encode_text("Date fin mission"), 1, 1, "C", 1)

        self.set_font("Helvetica", size=10)

        # Date de fin de mission
        dates = self.mission.get('dates', [])
        mission_end_date = "N/A"
        if dates and len(dates) > 0:
            try:
                mission_end_date = datetime.strptime(dates[-1], "%Y-%m-%d").strftime("%d/%m/%Y")
            except (ValueError, TypeError):
                mission_end_date = "N/A"

        invoice_date = datetime.now().strftime("%d/%m/%Y")

        self.cell(40, 10, encode_text(self.mission.get('id', 'N/A')), 1, 0, "C")
        self.cell(50, 10, encode_text(self.invoice.get('invoice_number', 'N/A')), 1, 0, "C")
        self.cell(30, 10, encode_text(invoice_date), 1, 0, "C")
        self.cell(30, 10, encode_text("Paiement comptant"), 1, 0, "C")
        self.cell(40, 10, encode_text(mission_end_date), 1, 1, "C")
        self.ln(10)

        # Désignation Section 1
        self.set_fill_color(230, 230, 230)
        self.set_font("Helvetica", "B", 10)
        self.cell(130, 10, encode_text("Désignation"), 1, 0, "C", 1)
        self.cell(30, 10, encode_text("HT"), 1, 0, "C", 1)
        self.cell(30, 10, encode_text("TVA (0%)"), 1, 1, "C", 1)

        self.set_font("Helvetica", size=10)

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
        total_amount_worker = hourly_rate * duration_hours * nb_days

        # Texte de désignation 1
        first_date = "N/A"
        if dates and len(dates) > 0:
            try:
                first_date = datetime.strptime(dates[0], "%Y-%m-%d").strftime("%d %B %Y")
            except (ValueError, TypeError):
                first_date = "N/A"

        designation_text_1 = (
            f"Prestation de services en Accueil en qualité de {encode_text(self.mission.get('service_type', 'N/A'))} "
            f"effectuée par l'EXTRA :\n\n"
            f"{encode_text(self.worker.get('first_name', 'N/A'))} {encode_text(self.worker.get('last_name', 'N/A'))} - Travailleur indépendant\n"
            f"SIRET : {encode_text(self.worker.get('siret', 'N/A'))}\n"
            f"N° TVA Intracommunautaire : {encode_text(self.worker.get('tva', 'N/A'))}\n"
            f"{encode_text(first_date)} de {encode_text(self.mission.get('start_time', 'N/A'))} à {encode_text(self.mission.get('end_time', 'N/A'))}\n"
            f"{encode_text(self.hotel.get('hotel_address', 'N/A'))}, {encode_text(self.hotel.get('postal_code', 'N/A'))} {encode_text(self.hotel.get('city', 'N/A'))}"
        )

        x_before_mc1 = self.get_x()
        y_before_mc1 = self.get_y()
        self.multi_cell(130, 5, encode_text(designation_text_1), 1, "L")
        mc1_height = self.get_y() - y_before_mc1

        self.set_xy(x_before_mc1 + 130, y_before_mc1)
        self.cell(30, mc1_height, f"{total_amount_worker:.2f} EUR", 1, 0, "C")
        self.cell(30, mc1_height, "0.00 EUR", 1, 1, "C")

        # Désignation Section 2
        self.set_font("Helvetica", size=10)
        commission_rate = 0.25
        commission_amount = total_amount_worker * commission_rate
        tva_amount = commission_amount * 0.20

        designation_text_2 = (
            f"(2) Prestation de mise en relation effectuée par MyShifters\n"
            f"TVA à 20 % acquittée sur les débits"
        )

        x_before_mc2 = self.get_x()
        y_before_mc2 = self.get_y()
        self.multi_cell(130, 5, encode_text(designation_text_2), 1, "L")
        mc2_height = self.get_y() - y_before_mc2

        self.set_xy(x_before_mc2 + 130, y_before_mc2)
        self.cell(30, mc2_height, f"{commission_amount:.2f} EUR", 1, 0, "C")
        self.cell(30, mc2_height, f"{tva_amount:.2f} EUR", 1, 1, "C")

        # Totals
        total_ht = total_amount_worker + commission_amount
        total_tva = tva_amount
        total_ttc = total_ht + total_tva

        self.set_font("Helvetica", "B", 10)
        self.cell(130, 10, "", 0, 0)
        self.cell(30, 10, "Total HT", 1, 0, "C", 1)
        self.cell(30, 10, f"{total_ht:.2f} EUR", 1, 1, "C")

        self.cell(130, 10, "", 0, 0)
        self.cell(30, 10, "Total TVA", 1, 0, "C", 1)
        self.cell(30, 10, f"{total_tva:.2f} EUR", 1, 1, "C")

        self.cell(130, 10, "", 0, 0)
        self.cell(30, 10, "Montant TOTAL TTC", 1, 0, "C", 1)
        self.cell(30, 10, f"{total_ttc:.2f} EUR", 1, 1, "C")


def generate_mission_report_pdf(mission_data, worker_data, hotel_data):
    myshifters_data = {
        "company_name": "MyShifters EURL",
        "address": "8 bis Rue Abel, 75012 Paris",
        "phone": "+33 7 49 06 03 05",
        "email": "contact@myshifters.fr",
        "siren": "en cours d'attribution",
        "tva": "en cours d'attribution"
    }
    pdf = MissionReportPDF(mission_data, worker_data, hotel_data, myshifters_data)
    pdf.create_report()
    return pdf.output()

def generate_invoice_pdf(invoice_data, mission_data, worker_data, hotel_data):
    myshifters_data = {
        "company_name": "MyShifters EURL",
        "address": "8 bis Rue Abel, 75012 Paris",
        "phone": "+33 7 49 06 03 05",
        "email": "contact@myshifters.fr",
        "siren": "en cours d'attribution",
        "tva": "en cours d'attribution"
    }
    pdf = InvoicePDF(invoice_data, mission_data, worker_data, hotel_data, myshifters_data)
    pdf.create_invoice()
    return pdf.output()
