# Plain Text Invoice Export

This feature allows you to export invoice items as readable text files suitable for manual invoice creation.

## Features

- **Readable Format**: Exports invoices in a well-formatted, human-readable text format
- **Client Grouping**: Option to create separate files for each client or combine all items
- **Swedish Format**: Uses Swedish date format, currency (SEK), and includes VAT calculations
- **Complete Invoice Data**: Includes all necessary information for manual invoice creation
- **Automatic Download**: Downloads .txt files directly to your computer

## Usage

### From the Invoicing Dashboard

1. Navigate to the **Invoicing** page
2. In the **Quick Actions** card, click **"Export as Text"**
3. Select the invoice items you want to export
4. Choose export options:
   - **Group by client**: Creates separate files for each client
   - **Invoice number**: Optional custom invoice number (otherwise uses placeholder)
5. Click **"Export Text Files"**

The system will:
- Download one or more .txt files to your computer
- Mark the exported items as "sent" status
- Display a success confirmation

### Text File Format

The exported text file includes:

```
============================================================
                         FAKTURA
============================================================

Fakturanummer: INV-2025-001
Fakturadatum: 2025-08-29
Förfallodatum: 2025-09-28
Valuta: SEK

KUND:
--------------------
Företag: Tech Solutions AB
Namn: John Doe
E-post: contact@techsolutions.se

FAKTURARADER:
------------------------------------------------------------
Beskrivning                    Tim/Ant      Pris     Summa
------------------------------------------------------------
Web development - Frontend...      8.50   800,00 kr  6 800,00 kr
Database optimization...           4.00   800,00 kr  3 200,00 kr
Project setup (fixed)             1.00  5 000,00 kr  5 000,00 kr
------------------------------------------------------------

SUMMERING:
------------------------------
Summa exkl. moms:    15 000,00 kr
Moms (25%):           3 750,00 kr
TOTALT:              18 750,00 kr

BETALNINGSINFORMATION:
------------------------------
Betalningsvillkor: 30 dagar
Dröjsmålsränta: 2% per månad

DETALJERADE BESKRIVNINGAR:
----------------------------------------
1. Web development - Frontend React components
   Anteckningar: Implemented user authentication and dashboard layout
   8.5 timmar à 800,00 kr

2. Database optimization and API improvements
   Anteckningar: Optimized queries and improved response times
   4 timmar à 800,00 kr

3. Project setup and documentation
   Anteckningar: Initial project setup, documentation, and planning

Exporterad från Konsult Tid System - 2025-08-29 12:34:56
============================================================
```

## Benefits

- **Manual Invoice Creation**: Perfect for when you need to create invoices manually in other systems
- **Client Communication**: Send readable summaries to clients before formal invoicing
- **Record Keeping**: Keep text-based records of all invoiced work
- **No API Dependencies**: Works without any external service configuration
- **Immediate Access**: No need to wait for API responses or deal with integration issues

## Technical Details

- **File Format**: Plain text (.txt) with UTF-8 encoding
- **Filename Pattern**: `faktura_{client_name}_{date}.txt`
- **Currency**: Swedish Krona (SEK) with proper formatting
- **VAT**: Automatically calculates 25% Swedish VAT
- **Date Format**: Swedish format (YYYY-MM-DD)

This feature complements the existing Fortnox integration, giving you flexibility in how you handle your invoicing workflow.
