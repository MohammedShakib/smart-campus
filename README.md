<div align="center">
  <img src="frontend/src/assets/smart-campus-logo-full.png" alt="Smart Campus Logo" width="300" />
  <br />
  <br />

  **A real-time Smart Campus platform for centralized campus operations, role-based dashboards, maintenance tracking, and campus notices.**

  [![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
  [![React](https://img.shields.io/badge/React-19.1.1-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
  [![Java](https://img.shields.io/badge/Java-21-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/)
  [![Vite](https://img.shields.io/badge/Vite-7.1.7-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
</div>

---

## 🚀 Overview

**Smart Campus** is a full-stack university project built with a Spring Boot backend and a Vite + React frontend. It provides a centralized digital environment for university operations, offering distinct role-based experiences for administrators, faculty, students, and campus security.

## 🎯 Key Features

- **Role-Based Access Control:** Dedicated dashboards for Admin, Teacher, Student, and Security roles.
- **Spring Security Authentication:** Encrypted credentials using BCrypt password hashing.
- **Campus Notices:** Real-time general and academic announcements.
- **Maintenance Queue:** Submission and tracking system for facility repair requests.
- **System Telemetry Logs:** Administrative tracking of system operations and calibrations.
- **React-Based UI:** Modern frontend powered by Vite and `lucide-react` icons.
- **MySQL Persistence:** Relational database backing with Spring Data JPA.

## ⚙️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 19, Vite 7 |
| **Backend** | Spring Boot 3.3.4, Spring Security |
| **Language** | Java 21, JavaScript |
| **Database** | MySQL |
| **ORM** | Spring Data JPA / Hibernate |
| **Build** | Maven Wrapper, npm |
| **UI Icons** | `lucide-react` |

## 🛠️ Requirements

- **☕ Java 21+**
- **📦 Node.js & npm** (compatible with Vite 7)
- **🐬 MySQL Server** running on `localhost:3306` (XAMPP MySQL is supported)

> **Note:** A global Maven installation is not required as the project includes the Maven Wrapper (`mvnw`).

---

## 🏃 Quick Start

### 1. Build the Frontend

The React application must be built into static assets before the Spring Boot backend can serve them.

```bash
cd frontend
npm install
npm run build
```

### 2. Run the Backend

Start the Spring Boot application from the root directory:

**Windows (using provided script):**
```bash
run.bat
```
*(The `run.bat` script automatically locates a local JDK from `C:\Program Files\Java\jdk-*` if `JAVA_HOME` is missing.)*

**Or directly via Maven Wrapper:**
```bash
mvnw.cmd spring-boot:run
```

### 3. Access the Portal

Open your browser and navigate to the local server port configured in `application.properties`:
👉 **[http://localhost:8085/login](http://localhost:8085/login)**

---

## 🔐 Demo Accounts

The database is automatically seeded upon startup with the following demonstration accounts:

| Role | Username (Email) | Password |
| :--- | :--- | :--- |
| 🛡️ **Admin** | `admin-demo` | `demo-admin-pass` |
| 👨‍🏫 **Teacher** | `teacher-demo` | `demo-teacher-pass` |
| 🎓 **Student** | `student-demo` | `demo-student-pass` |
| 👮 **Security** | `security-demo` | `demo-security-pass` |

---

## 📁 Project Structure

```text
smart-campus/
├── src/main/java/       # ☕ Spring Boot backend source code
├── src/main/resources/  # ⚙️ application.properties & frontend static output
├── frontend/            # ⚛️ React 19 source code (Vite)
├── pom.xml              # 📦 Maven dependencies configuration
├── mvnw, mvnw.cmd       # 📜 Maven wrapper executables
└── run.bat              # 🏃 Startup script
```
