# Akwa Ibom State Human Capital Development (AKS-HCD) Platform

> **Official Monitoring, Tracking, and Impact Analytics Portal for Akwa Ibom State's ARISE Agenda**

The **AKS-HCD Platform** is an enterprise-grade Progressive Web Application (PWA) designed to track, audit, and analyze Human Capital Development initiatives across all 31 Local Government Areas (LGAs) of Akwa Ibom State. Built with offline-first capabilities, real-time Supabase cloud synchronization, cryptographic audit logging, and geospatial intelligence.

---

## 🌟 Key Features

### 1. Multi-Tier Role-Based Architecture
- **Public Portal**: Transparent citizen dashboard featuring governor's address, verified state impact metrics, sectoral drill-downs, and interactive LGA map.
- **Field Officer Mode**: On-ground data collection with 5-stage validation wizard, offline draft storage, and automatic queueing.
- **LGA Supervisor Review**: Quality assurance desk with granular audit trails, return-for-correction capabilities, and one-click approvals.
- **Executive Council Panel**: High-level ministerial insights, comparative LGA performance charts, budget allocation vs. impact analysis, and PDF/CSV report generation.

### 2. Robust Offline-First PWA & Synchronization
- Seamless offline operation in low-connectivity rural LGAs.
- IndexedDB and localStorage persistent queues with collision handling.
- Automatic background synchronization when network connectivity restores.
- Post-Transaction Reconciliation (PTR) verification engine for data integrity.

### 3. Real-Time Cloud Persistence (Supabase)
- Pre-configured for Supabase PostgreSQL database (`https://refjawgovrmsyigtcfdl.supabase.co`).
- Automated data schemas for `activities`, `audit_logs`, and `ptr_test_logs`.
- In-app Supabase Connection & Schema Management Modal with one-click test and data seeding.

### 4. Interactive Geospatial Mapping
- Custom SVG map of Akwa Ibom State showing all 31 LGAs.
- Dynamic color-coding based on active project status and beneficiary coverage.
- Detailed modal inspection for each LGA's healthcare, education, agriculture, and skills development programs.

---

## 🚀 Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Database & Sync**: Supabase (`@supabase/supabase-js`), REST APIs
- **Icons**: Lucide React
- **PWA & Offline**: Vite PWA Plugin, Workbox Service Worker
- **Visualizations**: Custom SVG Cartography, Recharts / HTML5 Canvas trends

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or bun

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/Moses004/Aks-HCD.git
   cd Aks-HCD
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Configure your Supabase credentials:
   ```env
   VITE_SUPABASE_URL="https://refjawgovrmsyigtcfdl.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-public-key-here"
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

---

## 🗄️ Database Setup (Supabase)

To enable live persistence with your Supabase database, run the following SQL script in your [Supabase SQL Editor](https://app.supabase.com):

```sql
-- 1. AKS-HCD Activities Table
CREATE TABLE IF NOT EXISTS public.activities (
  id TEXT PRIMARY KEY,
  lga_id TEXT NOT NULL,
  lga_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  sector TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  beneficiaries INTEGER DEFAULT 0,
  budget NUMERIC DEFAULT 0,
  location TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  reported_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sync_status TEXT DEFAULT 'SYNCED',
  verification_notes TEXT
);

-- 2. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  activity_id TEXT,
  action TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  user_role TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  details JSONB
);

-- 3. PTR Test & Health Logs
CREATE TABLE IF NOT EXISTS public.ptr_test_logs (
  id TEXT PRIMARY KEY,
  test_type TEXT NOT NULL,
  status TEXT NOT NULL,
  details JSONB,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ptr_test_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access with anon key
CREATE POLICY "Allow public read activities" ON public.activities FOR SELECT USING (true);
CREATE POLICY "Allow public insert activities" ON public.activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update activities" ON public.activities FOR UPDATE USING (true);
CREATE POLICY "Allow public delete activities" ON public.activities FOR DELETE USING (true);

CREATE POLICY "Allow public read audit_logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert audit_logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read ptr_test_logs" ON public.ptr_test_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert ptr_test_logs" ON public.ptr_test_logs FOR INSERT WITH CHECK (true);
```

---

## 🏛️ Akwa Ibom State ARISE Agenda

The Human Capital Development initiatives in this portal directly support Governor Umo Eno's ARISE Agenda pillars:
- **A** - Agricultural Revolution
- **R** - Rural Development
- **I** - Infrastructural Maintenance
- **S** - Security Management
- **E** - Educational Advancement & Economic Empowerment

---

## 📄 License
Government of Akwa Ibom State & Project Contributors.
