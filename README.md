# INE Assignment

This repository contains the full-stack project codebase and associated documentation for the assignment.

---

## 📁 Repository Structure

```plaintext
ine-assignment/
├── frontend/        # Frontend user interface and web application
├── backend/         # Backend server, APIs, database models, and business logic
├── document/        # Architecture diagrams, specifications, documentation, and reports
├── .editorconfig    # Cross-editor formatting standards
├── .gitignore       # Git ignore rules for node, python, environment files, and builds
└── README.md        # Repository overview and setup instructions
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: `v18+` or `v20+` (LTS recommended)
- **npm** / **yarn** / **pnpm**
- **Python**: `3.10+` (if using Python for backend)
- **Git**

---

### Project Setup

#### 1. Clone the repository
```bash
git clone https://github.com/ishikamanchanda30/ine-assignment.git
cd ine-assignment
```

#### 2. Frontend Setup
Navigate to the frontend directory:
```bash
cd frontend
# Install dependencies
npm install

# Start the development server
npm run dev
```

#### 3. Backend Setup
Navigate to the backend directory:
```bash
cd backend
# Follow setup instructions according to the backend technology stack (e.g., Node/Express or Python/FastAPI)
```

---

## 📄 Documentation

All project documentation, design documents, API contracts, and architecture diagrams are maintained in the [`document/`](./document/) directory.

---

## 🛠️ Tech Stack & Conventions

- **Code Formatting**: Controlled via `.editorconfig` (2 spaces indentation, LF line endings, UTF-8).
- **Environment Config**: Store environment variables in `.env` files (never commit `.env` to Git; refer to `.gitignore`).
