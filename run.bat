@echo off
title UIU Real-Time Smart Campus Digital Twin - Spring Boot Launcher
echo =====================================================================
echo   UIU REAL-TIME SMART CAMPUS DIGITAL TWIN (AOOP UPDATE 1)
echo =====================================================================
echo   Starting Spring Boot with XAMPP MySQL Support...
echo   Please ensure XAMPP MySQL is running on localhost:3306.
echo.
echo   Web Portal URL: http://localhost:8085/login
echo.
echo   Demo Accounts:
echo     [Admin]    admin@uiu.ac.bd    / admin123
echo     [Teacher]  teacher@uiu.ac.bd  / teacher123
echo     [Student]  student@uiu.ac.bd  / student123
echo     [Security] security@uiu.ac.bd / security123
echo =====================================================================

if defined JAVA_HOME if not exist "%JAVA_HOME%\bin\java.exe" set "JAVA_HOME="
if not defined JAVA_HOME (
    for /d %%J in ("C:\Program Files\Java\jdk-*") do set "JAVA_HOME=%%~fJ"
)
if defined JAVA_HOME set "PATH=%JAVA_HOME%\bin;%PATH%"

set "MAVEN_EXE=%~dp0mvnw.cmd"
if not exist "%MAVEN_EXE%" (
    set "MAVEN_EXE=mvn"
)

"%MAVEN_EXE%" spring-boot:run
pause
