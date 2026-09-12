@echo off
title UIU Smart Campus - Spring Boot Launcher
echo =====================================================================
echo   UIU SMART CAMPUS (AOOP UPDATE 1)
echo =====================================================================
echo   Starting Spring Boot with XAMPP MySQL Support...
echo   Please ensure XAMPP MySQL is running on localhost:3306.
echo.
echo   Web Portal URL: http://localhost:8085/login
echo.
echo   Demo Accounts:
echo     [Admin]    admin-demo    / demo-admin-pass
echo     [Teacher]  teacher-demo  / demo-teacher-pass
echo     [Student]  student-demo  / demo-student-pass
echo     [Security] security-demo / demo-security-pass
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

"%MAVEN_EXE%" -DskipTests package
if errorlevel 1 (
    echo.
    echo Build failed. Please check the messages above.
    pause
    exit /b 1
)

java -jar "%~dp0target\smart-campus-1.0.0-SNAPSHOT.jar"
pause
