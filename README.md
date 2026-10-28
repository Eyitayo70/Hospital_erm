# Wayfind General — Hospital Registry (React)

A React + TypeScript + Vite electronic medical record and hospital folder registry system, rewritten from the original Python/Flask codebase. All core features, business logic, workflows, confidentiality rules, and styling have been preserved.

## System Features & Portals

### 1. Patient Portal
- **Self-Registration:** Complete patient intake form with personal demographics, next of kin, and explicit informed consent tracking (`consent_given`, `consent_at`).
- **Read-Only Manila Folder:** Distinctive hospital folder aesthetic with color-coded department tabs, MRN badge (`HF-YYYY-XXXXX`), and demographic details.
- **Appointments:** Real-time visibility into upcoming scheduled visits and historical records, with printable appointment cards.
- **Complaints & Inquiries:** Direct submission channel to hospital front desk, with status tracking (`open`, `in-progress`, `resolved`) and officer responses.

### 2. Health Officer & Staff Portal
- **Two-Step Verification:** Email + password authentication paired with a 6-digit one-time verification code (with `123456` testing fallback and instant on-screen code generator).
- **Front Desk Dashboard:** Today's appointments schedule, recent patient folders, folders on file count, and status breakdown.
- **Patient Registry:** Searchable by name, MRN, phone number, and admitting department; grouped chronologically by month.
- **Folder Management:** Open new folders with automatic sequence-based MRN generation, edit demographics, and manage patient records.
- **Confidential Doctor's Reports:** Strictly confidential medical records hidden from patient portals. Includes ICD-10 diagnostic coding (common catalog or custom entry), vital signs monitoring (systolic/diastolic BP, temperature, pulse, respiratory rate, weight, height), and clinical visit notes.
- **Appointment Scheduling:** Book visits for any registered patient across departments, update status (`scheduled`, `checked-in`, `completed`, `cancelled`, `no-show`), and generate printable appointment cards.
- **Complaints Management:** Review patient concerns and send official administrative responses.
- **Accountability & Audit Logging:** Comprehensive audit log recording who did what, to which record, and when, segmented into Staff Activity and Patient Activity.
- **HL7 FHIR R4 Interoperability:** Standards-based FHIR resource generator for `Patient`, `Encounter`, `Condition`, and `Observation` (with standard LOINC and ICD-10 mappings).

## Development & Build

```bash
# Install dependencies
npm install

# Start Vite development server on port 3000
npm run dev

# Build for production
npm run build
```
