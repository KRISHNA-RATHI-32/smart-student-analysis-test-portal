# Exam Portal Platform

A full-stack, production-ready Exam Portal application designed to provide a comprehensive testing environment with role-based access for Admins, Teachers, and Students. The platform enables users to create tests, take exams, and view detailed performance analytics seamlessly.

## Features

*   **Role-Based Access Control**:
    *   **Admin**: Manage users (teachers and students), oversee platform activities, and view global statistics.
    *   **Teacher**: Create, edit, and manage tests/exams, view student submissions, and analyze results.
    *   **Student**: Access assigned tests, submit answers, view detailed personal analytics (speed vs. accuracy, topic weak points), and see leaderboard rankings.
*   **Authentication & Security**:
    *   Secure cookie-based authentication with JSON Web Tokens (JWT).
    *   Email OTP verification via Nodemailer for account creation.
*   **Test Management System**:
    *   Support for multiple question types (MCQ, multi-select, one-word).
    *   Time-bound test execution logic.
    *   Image/thumbnail uploads supporting Cloudinary integration.
*   **Analytics & Leaderboards**:
    *   Interactive data visualization with Recharts.
    *   Topic-based accuracy analysis.
    *   Real-time test leaderboard generation.

## Tech Stack

**Frontend**:
*   React 18 + Vite
*   TypeScript
*   Tailwind CSS
*   shadcn/ui (UI Components)
*   Recharts (Data Visualization)
*   React Router DOM (Routing)
*   Zod + React Hook Form (Validation)

**Backend**:
*   Node.js + Express.js
*   MongoDB + Mongoose (Database & ORM)
*   JSON Web Tokens (JWT) & bcrypt (Auth & Hashing)
*   Multer & Cloudinary (File Uploads)
*   Nodemailer (Email Service)
*   Mongoose Aggregate Paginate

## Project Structure

```
exam-portal/
├── backend/               # Node.js Express backend
│   ├── src/
│   │   ├── controllers/   # Request handlers for routes
│   │   ├── models/        # Mongoose database schemas
│   │   ├── routes/        # Express route definitions
│   │   ├── middlewares/   # Custom middlewares (Auth, Multer, Error handlers)
│   │   └── utils/         # Utility functions (ApiError, ApiResponse etc.)
│   └── package.json
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # Reusable UI components & layouts
│   │   ├── contexts/      # React context (Auth context)
│   │   ├── lib/           # Utility functions and API configuration
│   │   ├── pages/         # Page level components (Login, Dashboards, etc.)
│   │   └── App.tsx        # Application routing logic
│   └── package.json
└── Readme.md
```

## Getting Started

### Prerequisites
*   Node.js (v18 or higher recommended)
*   MongoDB Instance (Local or Atlas)
*   Cloudinary Account (Optional, for image uploads)

### Installation

1.  **Clone the repository** (if applicable) or navigate to the project directory.

2.  **Backend Setup**:
    ```bash
    cd backend
    npm install
    ```
    Create a `.env` file in the `backend` directory with the following variables:
    ```env
    PORT=5000
    MONGODB_URI=your_mongodb_connection_string
    CORS_ORIGIN=http://localhost:5173
    JWT_SECRET=your_jwt_secret
    JWT_EXPIRY=1d
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    SMTP_HOST=your_smtp_host
    SMTP_PORT=your_smtp_port
    SMTP_USER=your_smtp_user
    SMTP_PASS=your_smtp_password
    ```
    Run the server:
    ```bash
    npm run dev
    ```

3.  **Frontend Setup**:
    ```bash
    cd frontend
    npm install
    ```
    Create a `.env` file in the `frontend` directory:
    ```env
    VITE_API_URL=http://localhost:5000/api/v1
    ```
    Run the frontend development server:
    ```bash
    npm run dev
    ```

4.  **Access the application** at `http://localhost:5173`.

## License

ISC License