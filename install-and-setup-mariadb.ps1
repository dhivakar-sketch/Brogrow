$ErrorActionPreference = 'Stop'

$DBName = 'sports_talent_assessment'
$DBUser = 'sports_app'
$DBPassword = 'sports_app_password'
$RootPassword = 'root'
$ProjectRoot = 'C:\Users\dhiva\Desktop\Sports talent assessment'
$SqlScript = Join-Path $ProjectRoot 'backend\mysql\setup.sql'

Write-Host 'Checking whether MariaDB/MySQL is already installed...'
$clientExe = $null

$mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
if ($mysqlCmd) {
    $clientExe = $mysqlCmd.Source
}

if (-not $clientExe) {
    $mariaCmd = Get-Command mariadb -ErrorAction SilentlyContinue
    if ($mariaCmd) {
        $clientExe = $mariaCmd.Source
    }
}

if (-not $clientExe) {
    Write-Host 'MariaDB/MySQL not found. Installing official MariaDB package from winget...'
    winget install --id MariaDB.Server --source winget --accept-source-agreements --accept-package-agreements --silent --disable-interactivity

    $env:Path = [System.Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path', 'User')

    $mysqlCmd = Get-Command mysql -ErrorAction SilentlyContinue
    if ($mysqlCmd) {
        $clientExe = $mysqlCmd.Source
    } else {
        $mariaCmd = Get-Command mariadb -ErrorAction SilentlyContinue
        if ($mariaCmd) {
            $clientExe = $mariaCmd.Source
        }
    }

    if (-not $clientExe) {
        throw 'MariaDB/MySQL is still not available after installation. Please install MariaDB manually from https://mariadb.org/download/'
    }
}

Write-Host "Using MariaDB client: $clientExe"

# Ensure service is started
$service = Get-Service MariaDB -ErrorAction SilentlyContinue
if (-not $service) {
    $service = Get-Service MySQL -ErrorAction SilentlyContinue
}
if (-not $service) {
    throw 'No MariaDB/MySQL service was found after installation.'
}

Write-Host "Starting MariaDB service: $($service.Name)"
Start-Service $service.Name
Start-Sleep -Seconds 3

# Find mysqladmin
$binDir = Split-Path $clientExe -Parent
$mysqlAdmin = Join-Path $binDir 'mysqladmin.exe'
if (-not (Test-Path $mysqlAdmin)) {
    $mysqlAdmin = Join-Path $binDir 'mariadb-admin.exe'
}
if (-not (Test-Path $mysqlAdmin)) {
    throw "mysqladmin.exe or mariadb-admin.exe not found in $binDir"
}

Write-Host 'Setting MariaDB root password...'
& $mysqlAdmin -u root password $RootPassword

Write-Host "Creating database and user: $DBName / $DBUser"
& $clientExe -u root -p$RootPassword -e "
CREATE DATABASE IF NOT EXISTS $DBName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '$DBUser'@'localhost' IDENTIFIED BY '$DBPassword';
ALTER USER '$DBUser'@'localhost' IDENTIFIED BY '$DBPassword';
GRANT ALL PRIVILEGES ON $DBName.* TO '$DBUser'@'localhost';
FLUSH PRIVILEGES;
"

Write-Host "Importing schema and seed data from $SqlScript"
if (-not (Test-Path $SqlScript)) {
    throw "Schema script not found: $SqlScript"
}
& $clientExe -u root -p$RootPassword $DBName < $SqlScript

Write-Host 'Validating DB access for the Spring Boot app user...'
& $clientExe -u $DBUser -p$DBPassword -e "USE $DBName; SHOW TABLES; SELECT 'DB_CONNECTION_OK' AS status;"

Write-Host 'Database setup and validation complete.'
Write-Host 'You can now start the Spring Boot backend with:'
Write-Host '  cd "C:\Users\dhiva\Desktop\Sports talent assessment\backend"'
Write-Host '  mvn spring-boot:run'
Write-Host 'Or:'
Write-Host '  java -jar target\sports-talent-backend-0.0.1-SNAPSHOT.jar'
