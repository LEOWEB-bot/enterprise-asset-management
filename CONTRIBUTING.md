# Contributing Guidelines

Thank you for your interest in contributing to **Enterprise Asset Management (EAM)**. To maintain code security, data privacy, and clean architecture standards, please follow these guidelines.

> 🌐 **Bahasa / Language**: **English** | [Bahasa Indonesia](#panduan-kontribusi-versi-bahasa-indonesia)

---

## 1. Absolute Code of Conduct & Rules

1. **Security & Privacy**:
   - **Never commit real API keys, secrets, tokens, passwords, or credentials** to the repository.
   - All secret variables must reside in your local `.env` (registered in `.gitignore`).
2. **Zero Emoji Rule on UI Components**:
   - Do not use native OS text emojis anywhere in UI components.
   - All iconography must strictly use the **`lucide-react`** SVG vector library (`stroke-width: 2px`).
3. **Design System & Responsiveness**:
   - Adhere to the *Organic Spatial UI* design tokens and *Tri-Form Factor* responsiveness (Desktop Full-Width, Tablet 2-Column Bento, Mobile Bottom Dock) detailed in [DESIGN.md](DESIGN.md).

---

## 2. Development Workflow

### A. Local Setup
```bash
# 1. Clone repository
git clone https://github.com/username/enterprise-asset-management.git
cd enterprise-asset-management

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env

# 4. Start local development server
npm run dev
```

### B. Git Branch Naming
- `feature/feature-name` (e.g., `feature/rfid-batch-reader`)
- `fix/issue-description` (e.g., `fix/csv-parser-encoding`)
- `refactor/target-module` (e.g., `refactor/depreciation-calc`)
- `security/vulnerability-patch` (e.g., `security/sanitize-formula-import`)

### C. Conventional Commit Messages
- `feat: Add batch QR sticker label printing studio`
- `fix: Correct salvage value calculation in declining balance depreciation`
- `docs: Update Docker and Nginx deployment guide in README`
- `style: Adjust bento card padding on tablet breakpoint`
- `refactor: Optimize stream parser in CSV batch import`
- `test: Add schema validation test scenario for master assets`

---

## 3. Pre-Pull Request (PR) Checklist

Before submitting a *Pull Request*, verify all checks pass:

```bash
# Verify TypeScript strict types and production build
npm run build
```

- [ ] Clean compilation with zero TypeScript errors (`npm run build` succeeds).
- [ ] Zero high/critical dependency vulnerabilities (`npm audit`).
- [ ] Zero hardcoded credentials or secret tokens in code.
- [ ] Zero text emojis in UI components (100% `lucide-react`).
- [ ] UI tested across **Desktop, Tablet, and Mobile** viewports.
- [ ] Changes documented in [CHANGELOG.md](CHANGELOG.md).

---

## 4. Reporting Issues & Vulnerabilities

- For **General Bugs / Feature Proposals**: Open a *GitHub Issue*.
- For **Security Vulnerabilities**: **DO NOT** open a public issue. Report privately to [`decepti0n13lack@gmail.com`](mailto:decepti0n13lack@gmail.com) following [SECURITY.md](SECURITY.md).

---

## Panduan Kontribusi (Versi Bahasa Indonesia)

- **Aturan Mutlak**: Dilarang keras commit kredensial/API key rahasia ke Git; Dilarang menggunakan teks emoji di UI (100% `lucide-react`); Wajib mematuhi desain *Organic Spatial UI* dan responsif *Tri-Form Factor*.
- **Alur Kerja**: Gunakan branch deskriptif (`feature/*`, `fix/*`), ikuti konvensi commit, dan pastikan `npm run build` lolos tanpa error sebelum mengajukan Pull Request.
