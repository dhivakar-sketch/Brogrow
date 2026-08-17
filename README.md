# Sports Talent Assessment

This project combines a Java Spring Boot backend with a React frontend to help identify, assess, and track athlete performance using measurable sports data.

## Project structure

- backend: Java 17 + Spring Boot + Spring Security + JWT + Spring Data JPA + MySQL
- frontend: React + Vite UI for athlete and coach dashboard flows

## Local MySQL / MariaDB setup

1. Install MySQL 8.x or MariaDB 11.x.
2. Start the database service.
3. Open MySQL CLI or MySQL Workbench.
4. Create a local user and database if needed:

```sql
CREATE DATABASE IF NOT EXISTS sports_talent_assessment
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER IF NOT EXISTS 'sports_app'@'localhost' IDENTIFIED BY 'sports_app_password';
GRANT ALL PRIVILEGES ON sports_talent_assessment.* TO 'sports_app'@'localhost';
FLUSH PRIVILEGES;
```

5. Run the SQL script at `backend/mysql/setup.sql`.

```bash
mysql -u root -p < backend/mysql/setup.sql
```

If you are using a non-root account, replace `root` with your MySQL username and use the correct password.

## Database configuration

The backend datasource is configured in `backend/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/sports_talent_assessment?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
spring.datasource.username=root
spring.datasource.password=root
```

If you are using the custom user created above, update the values to:

```properties
spring.datasource.username=sports_app
spring.datasource.password=sports_app_password
```

The application also uses:

```properties
spring.jpa.hibernate.ddl-auto=update
jwt.secret=changeThisSecretKeyToAStrong256BitKeyForProductionUse
jwt.expirationMs=86400000
```

## Run the backend

From the project root:

```bash
cd backend
export JAVA_HOME="/path/to/jdk-17-or-later"
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd backend
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
mvn spring-boot:run
```

The backend API will run at:

- http://localhost:8080/api/auth/register
- http://localhost:8080/api/auth/login
- http://localhost:8080/api/assessments
- http://localhost:8080/api/dashboard

## Run the frontend

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0
```

Then open:

- http://localhost:5173/

## Sample login

The setup script seeds a sample athlete account:

- Email: priya@example.com
- Password: Password123!

## Production notes

- JWT secret should be replaced with a secure production secret.
- Use environment variables or a secrets manager in production.
- MySQL should be secured with a non-root user and least-privilege permissions.
- The app is structured to keep the Java backend as the source of truth for athlete, assessment, and coach data.

## Build verification

Frontend build status:

```bash
cd frontend
npm run build
```

Backend package build status:

```bash
cd backend
mvn package -DskipTests
```

Both are expected to succeed when MySQL is running and JDBC credentials are valid.
