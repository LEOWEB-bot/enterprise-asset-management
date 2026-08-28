# Security Policy & Vulnerability Disclosure

Code security, data integrity, and asset privacy are foundational pillars of the **Enterprise Asset Management (EAM)** architecture. This document outlines our built-in defense-in-depth security model, production VPS server hardening guidelines, and responsible vulnerability disclosure procedures.

> 🌐 **Bahasa / Language**: **English** | [Bahasa Indonesia](#kebijakan-keamanan-sistem-versi-bahasa-indonesia)

---

## 1. Supported Versions

We actively maintain and provide security patches for the following versions:

| Version | Security Support Status |
| :--- | :--- |
| `1.0.x` (Current Production) | Fully Supported (Security Patches, Vulnerability Fixes & Hotfixes) |
| `< 1.0.0` | Unsupported (Please upgrade to latest) |

---

## 2. Reporting a Vulnerability (Responsible Disclosure)

If you discover a potential security vulnerability, **DO NOT** create a public issue on GitHub.

Please report it privately and responsibly to our security team:

- **Security Team Email**: [`decepti0n13lack@gmail.com`](mailto:decepti0n13lack@gmail.com)
- **Email Subject**: `[SECURITY] Vulnerability Report - Enterprise Asset Management`

### Required Information in Report:
1. **Summary of Finding**: Description of the vulnerability and its potential impact on Confidentiality, Integrity, or Availability.
2. **Proof of Concept (PoC)**: Detailed, reproducible step-by-step instructions.
3. **Affected Component**: Specific modules involved (e.g., RBAC Matrix, TOTP 2FA Verification, CSV Schema Validation, Webhook API, SHA-256 Digital Twin).
4. **Remediation Recommendation**: Proposed code patch or mitigation steps if available.

Our security team will acknowledge receipt within **24 hours** and provide regular status updates until a security patch is deployed.

---

## 3. Built-in Security Architecture (Defense-in-Depth)

Designed adhering to **ISO 27001 (Information Security Management)** standards:

### A. Multi-Layer Authentication & Granular RBAC
- **Role-Based Access Control (RBAC)**: All asset transactions (registration, movements, disposals, maintenance, stocktake audits, system configurations) are verified against strict granular permissions.
- **Two-Factor Authentication (TOTP 2FA)**: RFC 6238 compliant 6-digit Time-based One-Time Passwords compatible with Google Authenticator, Microsoft Authenticator, and Authy.
- **Session Governance**: Automatic inactivity timeouts prevent unauthorized access on unattended workstations.

### B. Digital Twin Cryptographic Integrity (SHA-256 Digest)
- Every registered asset computes a canonical **SHA-256** hash digest using the industry-standard Web Crypto API.
- Public QR codes link to verified authenticity certificates without exposing internal database credentials.

### C. Secret Hygiene & Environment Isolation
- **Zero Hardcoded Secrets**: No API keys, WhatsApp gateway tokens, webhook secrets, or passwords exist in the codebase.
- **`.env` Isolation**: Sensitive variables are strictly confined to local/server `.env` files protected by `.gitignore` and `.dockerignore`.

### D. Injection Prevention & Data Sanitization
- **XSS & DOM Protection**: All user text inputs, formulas, and activity logs are sanitized before DOM rendering.
- **CSV Formula Injection Protection**: The batch importer strips dangerous formula prefixes (`=`, `+`, `-`, `@`) and enforces rigid data typing.
- **Safe JSON Import/Export**: Structural schema verification before data restoration.

---

## 4. Production VPS Server Hardening Checklist

When deploying to a self-hosted Linux VPS (Ubuntu/Debian):

### 1. System Firewall (UFW)
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP (Let's Encrypt)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 2. Web Server Security Headers (Nginx Hardening)
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; img-src 'self' data: https: blob:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com;" always;
```

### 3. Transport Layer Encryption (TLS/SSL)
- Enforce **TLS 1.2** and **TLS 1.3** with Let's Encrypt Certbot. Disable deprecated protocols (SSLv3, TLS 1.0, TLS 1.1).

### 4. Dependency Security Audits
```bash
npm audit
```

---

## Kebijakan Keamanan Sistem (Versi Bahasa Indonesia)

Keamanan kode (*code security*), integritas data, dan privasi aset organisasi adalah prioritas utama dalam arsitektur **Enterprise Asset Management (EAM)**.

- **Email Pelaporan Kerentanan**: [`decepti0n13lack@gmail.com`](mailto:decepti0n13lack@gmail.com)
- **Subjek Laporan**: `[SECURITY] Temuan Kerentanan - Enterprise Asset Management`
- **Arsitektur Bawaan**: Granular RBAC, TOTP 2FA (RFC 6238), Integritas SHA-256 Digital Twin, Sanitasi Formula CSV, dan Bebas Kredensial Hardcoded (*Zero Hardcoded Secrets*).
- **Pengerasan Server VPS**: Firewall UFW, Nginx Security Headers, Enkripsi SSL HTTPS TLS 1.2/1.3, dan Audit Dependensi Rutin (`npm audit`).
