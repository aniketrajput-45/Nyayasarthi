# Project Nyayasarthi: Technical & Functional Improvisations

This document outlines the critical steps required to transition this prototype into a feasible, production-ready Digital Justice Infrastructure.

## 1. Architectural & Technical Debt
*   **Persistent SOS State:** Currently, if a citizen refreshes their page, the "Live Patrol Tracker" disappears even if the SOS is active in the database. 
    *   *Fix:* Implement an "Active Session" check on login/mount to resume tracking UI if an SOS hasn't been "resolved" or "cancelled."
*   **File Handling (The "Blob" Problem):** The project currently sends Base64 strings in JSON for document uploads. This will crash the server with large PDFs and is extremely inefficient.
    *   *Fix:* Implement multipart/form-data uploads using **Multer** and store files in **AWS S3** or **Google Cloud Storage**.
*   **Socket Scalability:** SOS alerts are currently broadcast to *all* users with the 'police' role. In a real-world scenario with 100,000 officers, this would crash the frontend and create massive noise.
    *   *Fix:* Implement **Geo-sharding** or **Socket Rooms** based on City/District codes so only relevant officers receive the alert.

## 2. Security & Integrity
*   **Zero-Knowledge Proofs (ZKP):** The "Vault" claims to be encrypted but the encryption happens/is managed on the server. True "Vault" storage should use client-side encryption where the server never sees the raw file.
*   **Audit Logging:** For a legal app, every action (viewing a case, downloading a notice) must be immutable.
    *   *Fix:* Implement a "Chain of Custody" log, ideally using a private Blockchain or an immutable ledger (like Amazon QLDB).
*   **Auth Vulnerability:** Ensure JWT secrets are strictly managed via ENV and implement Refresh Tokens to prevent session hijacking.

## 3. Real-World Feasibility (The "Justice" Gap)
*   **Offline Capability:** SOS features are useless in low-network areas.
    *   *Fix:* Implement **PWA (Progressive Web App)** features with Background Sync and SMS-fallback for SOS alerts.
*   **BNSS Integration:** The app mentions BNSS (Bharatiya Nagarik Suraksha Sanhita) but it's mostly cosmetic labels.
    *   *Fix:* Integrate a RAG-based AI (Retrieval-Augmented Generation) that actually references specific legal sections when a case is filed.
*   **Verification:** There is no "Identity Verification."
    *   *Fix:* Integrate **Aadhaar/eSign** or **DigiLocker API** to verify that users are who they say they are before they can file legal cases.

## 4. UI/UX Refinement
*   **Accessibility:** [IMPLEMENTED] The "Dark/Cinematic" theme is now augmented with "Light Mode" and "High Contrast Mode" for better readability.
    *   *Update:* Added a Theme System with a toggle in dashboards.
*   **Performance:** The heavy use of blurs and gradients in Tailwind/CSS can lag on mid-range smartphones. Optimize CSS and use GPU-accelerated transitions.
