import os
import pymupdf

os.makedirs("samples", exist_ok=True)

# 1. AWS Cloud Services Invoice
doc1 = pymupdf.open()
page1 = doc1.new_page()
sample_text_1 = """AMAZON WEB SERVICES, INC.
Invoice Number: AWS-982144
Invoice Date: 2024-10-12
Due Date: 2024-11-12
Currency: USD

Billing Summary:
------------------------------------------
Compute Instances (EC2 Linux):     $120.00
Storage Buckets (S3 Standard):      $24.50
Relational Database (RDS Postgres): $55.50
------------------------------------------
Subtotal:                          $200.00
Tax / GST:                          $20.00
Total Due:                         $220.00

Expense Category: Software and subscriptions
Document Type: Invoice
Description: Monthly cloud hosting and infrastructure usage
"""
page1.insert_text((50, 60), sample_text_1, fontsize=12)
doc1.save("samples/aws_cloud_invoice.pdf")
doc1.close()

# 2. Uber Travel Receipt
doc2 = pymupdf.open()
page2 = doc2.new_page()
sample_text_2 = """UBER B.V. RIDE RECEIPT
Invoice Number: UBR-77341
Invoice Date: 2024-10-14
Currency: USD

Trip Details:
Airport Terminal 2 to Downtown Tech Hub
Trip Fare:                          $42.00
Tolls & Surcharges:                  $5.50
------------------------------------------
Subtotal:                           $47.50
Tax:                                 $4.50
Total:                              $52.00

Expense Category: Travel
Document Type: Receipt
Description: Airport ground transportation ride
"""
page2.insert_text((50, 60), sample_text_2, fontsize=12)
doc2.save("samples/uber_travel_receipt.pdf")
doc2.close()

print("Sample invoices created successfully in samples/")
