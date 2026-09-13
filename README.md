<div align="center">
  <img src="frontend/src/assets/smart-campus-visual.png" alt="Smart Campus Visualization" width="600" />

  # 🎓 Smart Campus

  **A modern, real-time web application for centralized campus operations and management.**

  [![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-6DB33F?style=flat-square&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
  [![React](https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
  [![Java](https://img.shields.io/badge/Java-21+-ED8B00?style=flat-square&logo=openjdk&logoColor=white)](https://openjdk.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
</div>

---

## 🚀 Overview

**Smart Campus** is a full-stack system integrating a Spring Boot backend with a Vite + React frontend. It offers real-time dashboards for students, teachers, security, and administrative personnel to seamlessly track shuttles, book rooms, and monitor campus health.

## ⚙️ Requirements

Before running the project, ensure you have the following installed:

- **☕ Java 21** or newer
- **🐬 XAMPP / MySQL Server** running on `localhost:3306`
- **📦 Node.js & npm** (for frontend development)

> **Note**: This project uses the Maven Wrapper (`mvnw`), so a separate, global Maven installation is not required!

---

## 🛠️ Quick Start

### 1. Build the Frontend

The React application must be built and injected into Spring Boot's static resources. Open your terminal in the root directory and run:

```bash
cd frontend
npm install
npm run build
```

### 2. Run the Application

You can start the Spring Boot server using the provided startup script:

```bash
# Windows
run.bat
```
*(The script will automatically attempt to locate a local JDK from `C:\Program Files\Java\jdk-*` if `JAVA_HOME` is missing).*

**Alternatively, use the Maven Wrapper directly:**
```bash
mvnw.cmd spring-boot:run
```

### 3. Access the Portal

Once the server is running, open your browser and navigate to:
👉 **[http://localhost:8085/login](http://localhost:8085/login)**

---

## 🔐 Demo Accounts

Use these pre-configured credentials to explore the different role-based dashboards:

| Role | Email / Username | Password |
| :--- | :--- | :--- |
| 🛡️ **Admin** | `admin-demo` | `demo-admin-pass` |
| 👨‍🏫 **Teacher** | `teacher-demo` | `demo-teacher-pass` |
| 🎓 **Student** | `student-demo` | `demo-student-pass` |
| 👮 **Security** | `security-demo` | `demo-security-pass` |

---

## 📁 Project Structure

```text
smart-campus/
├── src/main/java/       # ☕ Java source code (Controllers, Services, Models)
├── src/main/resources/  # ⚙️ Application configs (application.properties) & static assets
├── frontend/            # ⚛️ ReactJS frontend source (Vite + React)
├── pom.xml              # 📦 Maven project dependencies
├── mvnw, mvnw.cmd       # 📜 Maven wrapper scripts
└── .mvn/wrapper/        # 🛠️ Maven wrapper configurations
```

> **Note**: Directories like `target/` and files such as `*.log` or `*.dat` are generated dynamically and should not be committed to version control.
