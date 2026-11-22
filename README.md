# Melsta URL Shortener & Analytics Engine

A production-grade, full-stack URL shortening service and real-time analytics dashboard built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS**, and **SQLite (`better-sqlite3`)** operating in high-concurrency WAL mode.

---

## 🚀 Key Features

### 1. 🔗 High-Performance URL Shortening
- Instant alphanumeric short-code generation with collision avoidance (`nanoid`).
- Robust URL validation ensuring strict protocol adherence (`http://` and `https://`).
- Protection against loopback / localhost recursion and SSRF attempts.
- Instant single-click clipboard copying with visual confirmation.

### 2. ⚡ Dynamic Non-Cached Redirection (`/[code]`)
- Fast server-side lookup with `O(1)` indexed resolution.
- Dynamic HTTP 307 Temporary Redirect ensuring browser caching does not suppress click tracking metrics.
- Automatic asynchronous click telemetry recording (timestamps, User-Agent, Referer).

### 3. 📊 Real-Time Analytics Dashboard
- Comprehensive listing of all shortened links with creation dates and original destinations.
- Live click-counter updates and interactive modal drilldown.
- Time-series breakdown of clicks with granular timestamps.
- Device & User-Agent telemetry analysis.

### 4. 🛡️ Resilient Local Database Architecture
- Embedded SQLite via `better-sqlite3` — zero cloud dependencies or external database credentials required.
- **WAL Mode (`Write-Ahead Logging`)** with `NORMAL` synchronicity and busy timeouts to guarantee ACID transactions under concurrent load without `SQLITE_BUSY` locks.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 14.2 (React 18, App Router) |
| **Language** | TypeScript 5 (Strict Mode) |
| **Styling** | Tailwind CSS 3, Lucide React |
| **Database** | SQLite3 via `better-sqlite3` (WAL Mode) |
| **Identifier Engine** | Nanoid (64-alphabet custom nanoid) |
| **Testing** | Node.js Verification & QA Test Harnesses |

---

## 📁 Repository Structure

```text
├── app/
│   ├── [code]/
│   │   └── route.ts                 # Dynamic redirect route handler (307 redirect + click logging)
│   ├── api/
│   │   ├── shorten/
│   │   │   └── route.ts             # POST: Shorten long URL
│   │   ├── urls/
│   │   │   ├── [code]/
│   │   │   │   └── analytics/
│   │   │   │       └── route.ts     # GET: Link analytics & click history
│   │   │   └── route.ts             # GET: Fetch all shortened URLs
│   ├── globals.css                  # Tailwind CSS root styling
│   ├── layout.tsx                   # Root HTML shell & metadata
│   └── page.tsx                     # Main dashboard page
├── components/
│   ├── UrlAnalyticsModal.tsx        # Granular analytics & telemetry viewer modal
│   ├── UrlList.tsx                  # Shortened URLs directory with copy & details actions
│   └── UrlShortenerForm.tsx         # URL submission form with validation & feedback
├── data/
│   └── .gitkeep                     # Preserves data storage directory in git
├── lib/
│   ├── analytics.ts                 # Analytics computation & click retrieval
│   ├── db.ts                        # SQLite database connection & schema initializers
│   ├── shortener.ts                 # Short code generation & URL storage logic
│   └── tracker.ts                   # Click logging & metadata capture
├── scripts/
│   ├── qa-suite.mjs                 # Edge-case & security validation test harness
│   └── verify-all.mjs               # End-to-end integration verification suite
├── POF.txt                          # Points of Failure & Risk Severity Matrix
├── implementation.txt               # Architectural design & implementation blueprint
├── problemstatement.txt             # Original technical requirements specification
└── package.json
```

---

## 🗄️ Database Schema

### `urls` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` | Unique UUID / nanoid identifier |
| `code` | `TEXT` | `UNIQUE NOT NULL` | Indexed short-link slug |
| `original_url` | `TEXT` | `NOT NULL` | Sanitized destination URL |
| `created_at` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Creation timestamp |

### `clicks` Table
| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `TEXT` | `PRIMARY KEY` | Unique click record identifier |
| `url_id` | `TEXT` | `NOT NULL REFERENCES urls(id) ON DELETE CASCADE` | Associated URL identifier |
| `timestamp` | `DATETIME` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Click event timestamp |
| `user_agent` | `TEXT` | `NULLABLE` | Client browser / device user agent |
| `referer` | `TEXT` | `NULLABLE` | Referring URL header |

---

## 🚦 API Reference

### 1. Shorten URL
- **Endpoint:** `POST /api/shorten`
- **Request Body:**
  ```json
  {
    "url": "https://example.com/very/long/url"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "ck34...",
    "code": "aB3x9Z",
    "shortUrl": "http://localhost:3000/aB3x9Z",
    "originalUrl": "https://example.com/very/long/url",
    "createdAt": "2026-11-22T10:00:00.000Z"
  }
  ```

### 2. List All URLs
- **Endpoint:** `GET /api/urls`
- **Response (200 OK):**
  ```json
  [
    {
      "id": "ck34...",
      "code": "aB3x9Z",
      "originalUrl": "https://example.com/very/long/url",
      "createdAt": "2026-11-22T10:00:00.000Z",
      "totalClicks": 12
    }
  ]
  ```

### 3. Detailed URL Analytics
- **Endpoint:** `GET /api/urls/[code]/analytics`
- **Response (200 OK):**
  ```json
  {
    "url": {
      "code": "aB3x9Z",
      "originalUrl": "https://example.com/very/long/url",
      "createdAt": "2026-11-22T10:00:00.000Z"
    },
    "totalClicks": 12,
    "clicks": [
      {
        "id": "cl98...",
        "timestamp": "2026-11-22T10:05:00.000Z",
        "userAgent": "Mozilla/5.0 ...",
        "referer": "https://twitter.com"
      }
    ]
  }
  ```

---

## 🏃 Getting Started

### Prerequisites
- **Node.js**: v18.17.0+ or v20.x+
- **npm**: v9.x+

### Installation
```bash
# Clone the repository
git clone git@github.com:gaurish676/URL_shortner.git
cd URL_shortner

# Install dependencies
npm install
```

### Running Locally
```bash
# Start Next.js development server
npm run dev

# Open in browser
http://localhost:3000
```

### Production Build
```bash
# Compile optimized production bundle
npm run build

# Start production server
npm run start
```

---

## 🧪 Testing & Verification

Run the automated validation suites:
```bash
# 1. Start dev server in one terminal
npm run dev

# 2. Run the end-to-end verification script
node scripts/verify-all.mjs

# 3. Run the security & edge-case QA suite
node scripts/qa-suite.mjs
```

---

## 📄 License
MIT
