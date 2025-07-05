# MySQL Setup Guide for HotelLux

## Prerequisites
- MySQL 8.0 or higher
- Node.js 18+ and npm
- Git

## Installation Steps

### 1. Install MySQL
**Windows:**
```bash
# Download and install MySQL from https://dev.mysql.com/downloads/installer/
# Or use Chocolatey:
choco install mysql
```

**Mac:**
```bash
brew install mysql
brew services start mysql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2. Configure MySQL
Run MySQL secure installation:
```bash
sudo mysql_secure_installation
```

Create database and user:
```sql
mysql -u root -p
CREATE DATABASE hotellux;
CREATE USER 'hotellux'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON hotellux.* TO 'hotellux'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### 3. Environment Setup
Create `.env` file in project root:
```
DATABASE_URL=mysql://hotellux:your_password@localhost:3306/hotellux
JWT_SECRET=your_jwt_secret_here
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_session_secret
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run Database Migrations
```bash
npm run db:push
```

### 6. Seed Database (Optional)
```bash
npm run seed
```

### 7. Start Development Server
```bash
npm run dev
```

## Troubleshooting

### Connection Issues
- Verify MySQL is running: `sudo systemctl status mysql`
- Check MySQL port: `netstat -tlnp | grep 3306`
- Test connection: `mysql -u hotellux -p -h localhost`

### Authentication Issues
- Use `mysql_native_password` plugin for compatibility
- Reset password if needed: `ALTER USER 'hotellux'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';`

## Visual Studio Code Extensions
Install these extensions for better development experience:
- MySQL (by cweijan)
- SQLTools (by Matheus Teixeira)
- Prettier (by Prettier)
- ESLint (by Microsoft)
- TypeScript Importer (by pmneo)

## Database Schema
The project uses Drizzle ORM with MySQL. Schema is defined in `shared/schema.ts`.

## Testing
- Frontend: http://localhost:5000
- Admin login: admin@hotellux.com / admin123
- Customer login: customer@hotellux.com / customer123