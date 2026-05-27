# Feelin Backend

Backend API for the Feelin platform, built with Node.js, Express, and Clean Architecture.

## Architecture
This project follows **Clean Architecture** principles to ensure scalability and maintainability.
- **Domain**: Entities and Repository Interfaces.
- **Application**: Use Cases (Business Logic).
- **Infrastructure**: Database implementation (Prisma), external services.
- **Presentation**: Controllers and Routes.

## Environment Variables
Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration (MySQL)
DB_USER=root
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=3306
DB_NAME=feelin_db
DATABASE_URL="mysql://root:your_password@localhost:3306/feelin_db"

# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:3000

# Security
JWT_SECRET="your_jwt_secret_key"
ENCRYPTION_KEY="your_encryption_key_32_chars"

# Redis Cache (Optional - improves performance)
REDIS_URL=redis://localhost:6379
```

## Redis Setup (Optional but Recommended)

Redis is used for caching to improve performance. While optional, it's highly recommended for production.

### Installing Memurai (Redis for Windows)

1. Download **Memurai Developer** (free) from: https://www.memurai.com/get-memurai
2. Run the `.msi` installer
3. Memurai will install as a Windows service and start automatically

### Verify Installation

```powershell
# Check if Memurai service is running
Get-Service Memurai

# Test connection
memurai-cli ping
# Should respond: PONG
```

### For Linux/Production

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

Once Redis is running, add `REDIS_URL=redis://localhost:6379` to your `.env` file.

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run with hot-reload (Development)**:
    ```bash
    npm run dev
    ```

3.  **Build**:
    ```bash
    npm run build
    ```

4.  **Start Production Server**:
    ```bash
    npm start
    ```
