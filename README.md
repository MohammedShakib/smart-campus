# Smart Campus Digital Twin

Spring Boot web application for a real-time smart campus digital twin demo.

## Requirements

- Java 21 or newer
- XAMPP MySQL running on `localhost:3306`

The project includes the Maven wrapper, so a separate Maven installation is not required.

## Run

From this folder:

```bat
run.bat
```

Or directly:

```bat
mvnw.cmd spring-boot:run
```

`run.bat` will try to use a local JDK from `C:\Program Files\Java\jdk-*` if `JAVA_HOME` is missing or invalid. For direct `mvnw.cmd` usage, make sure `JAVA_HOME` points to a valid Java 21+ JDK.

Open:

```text
http://localhost:8085/login
```

## Demo Accounts

```text
Admin:    admin@uiu.ac.bd    / admin123
Teacher:  teacher@uiu.ac.bd  / teacher123
Student:  student@uiu.ac.bd  / student123
Security: security@uiu.ac.bd / security123
```

## Source Layout

```text
src/main/java        Java source code
src/main/resources   application config, templates, static assets
pom.xml              Maven project definition
mvnw, mvnw.cmd       Maven wrapper scripts
.mvn/wrapper         Maven wrapper configuration
```

## Not Source

These are generated locally and should not be committed:

```text
target/
*.log
*.dat
```
