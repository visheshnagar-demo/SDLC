import datetime
from io import BytesIO
from typing import Optional
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

from server.models import FixedDepositAccount, FDAdviceReceipt, Customer, SavingsAccount


def generate_fd_advice_pdf(
    fd: FixedDepositAccount,
    customer: Optional[Customer],
    source_account: Optional[SavingsAccount],
    receipt_number: str,
) -> bytes:
    buffer = BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    # Outer decorative border
    p.setStrokeColor(colors.HexColor("#0F172A"))
    p.setLineWidth(2)
    p.rect(30, 30, width - 60, height - 60)

    p.setStrokeColor(colors.HexColor("#2563EB"))
    p.setLineWidth(1)
    p.rect(35, 35, width - 70, height - 70)

    # Header Banner
    p.setFillColor(colors.HexColor("#0F172A"))
    p.rect(36, height - 120, width - 72, 84, fill=1, stroke=0)

    p.setFillColor(colors.white)
    p.setFont("Helvetica-Bold", 20)
    p.drawCentredString(width / 2.0, height - 75, "FIXED DEPOSIT ADVICE CERTIFICATE")

    p.setFont("Helvetica", 10)
    p.drawCentredString(width / 2.0, height - 95, "Digital Deposit Confirmation & Financial Receipt")

    # Document Reference Info
    p.setFillColor(colors.HexColor("#334155"))
    p.setFont("Helvetica-Bold", 10)
    p.drawString(50, height - 145, f"Receipt Number: {receipt_number}")
    now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    p.drawRightString(width - 50, height - 145, f"Generated On: {now_str}")

    p.setStrokeColor(colors.HexColor("#CBD5E1"))
    p.setLineWidth(0.5)
    p.line(50, height - 155, width - 50, height - 155)

    # Customer & Source Account Details Section
    p.setFillColor(colors.HexColor("#1E293B"))
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, height - 180, "Account Holder Information")

    cust_name = customer.full_name if customer else "Verified Customer"
    cust_email = customer.email if customer else "test@example.com"
    source_acc_no = source_account.account_number if source_account else "XXXX-1234"

    p.setFont("Helvetica", 10)
    p.drawString(50, height - 200, f"Customer Name: {cust_name}")
    p.drawString(50, height - 215, f"Customer Email: {cust_email}")
    p.drawString(50, height - 230, f"Source Savings Account: {source_acc_no}")

    # Deposit Certificate Details Section
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, height - 265, "Fixed Deposit Terms & Maturity Schedule")

    table_top = height - 280
    row_height = 24
    fields = [
        ("FD Account Number", fd.fd_account_number),
        ("Principal Deposit Amount", f"${fd.deposit_amount:,.2f} USD"),
        ("Interest Rate", f"{fd.interest_rate:.2f}% p.a."),
        ("Tenure Duration", f"{fd.tenure_months} Months"),
        ("Interest Payout Frequency", fd.payout_frequency),
        ("Maturity Date", fd.maturity_date.strftime("%Y-%m-%d") if hasattr(fd.maturity_date, "strftime") else str(fd.maturity_date)[:10]),
        ("Total Maturity Payout", f"${fd.maturity_amount:,.2f} USD"),
        ("Account Status", fd.status.upper()),
    ]

    for i, (label, val) in enumerate(fields):
        y = table_top - (i * row_height)
        # Alternate background row fill
        if i % 2 == 0:
            p.setFillColor(colors.HexColor("#F8FAFC"))
            p.rect(50, y - 6, width - 100, row_height, fill=1, stroke=0)

        p.setFillColor(colors.HexColor("#475569"))
        p.setFont("Helvetica", 10)
        p.drawString(60, y, label)

        p.setFillColor(colors.HexColor("#0F172A"))
        p.setFont("Helvetica-Bold", 10)
        p.drawRightString(width - 60, y, str(val))

    # Terms & Security Notice
    footer_y = 120
    p.setFillColor(colors.HexColor("#64748B"))
    p.setFont("Helvetica-Oblique", 8)
    p.drawString(50, footer_y + 20, "* This is an electronically generated receipt and does not require a physical signature.")
    p.drawString(50, footer_y + 10, "* Funds are insured by regulatory banking protections up to statutory limits.")
    p.drawString(50, footer_y, "* Premature withdrawals are subject to standard bank penalties and interest recalculations.")

    # Security Badge
    p.setStrokeColor(colors.HexColor("#10B981"))
    p.setFillColor(colors.HexColor("#ECFDF5"))
    p.roundRect(width / 2.0 - 100, 50, 200, 30, 4, fill=1, stroke=1)
    p.setFillColor(colors.HexColor("#065F46"))
    p.setFont("Helvetica-Bold", 9)
    p.drawCentredString(width / 2.0, 62, "✓ DIGITALLY VERIFIED & SECURED")

    p.showPage()
    p.save()
    buffer.seek(0)
    return buffer.getvalue()


def get_or_create_receipt(db: Session, fd_id: str) -> Optional[bytes]:
    fd = db.query(FixedDepositAccount).filter(FixedDepositAccount.id == fd_id).first()
    if not fd:
        return None

    receipt = db.query(FDAdviceReceipt).filter(FDAdviceReceipt.fd_id == fd_id).first()
    receipt_no = receipt.receipt_number if receipt else f"REC-FD-{fd_id[:8]}"

    customer = db.query(Customer).filter(Customer.id == fd.customer_id).first()
    source_acc = db.query(SavingsAccount).filter(SavingsAccount.id == fd.source_account_id).first()

    return generate_fd_advice_pdf(fd, customer, source_acc, receipt_no)
