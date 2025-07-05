#!/bin/bash

# HotelLux Visual Studio Code Setup Script
echo "🏨 Setting up HotelLux for Visual Studio Code development..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# Check if Node.js is installed
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js is installed: $NODE_VERSION"
else
    print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check if MySQL is installed
if command -v mysql &> /dev/null; then
    print_status "MySQL is available"
else
    print_warning "MySQL not found. Please install MySQL 8.0+ for database functionality."
    echo "  Ubuntu/Debian: sudo apt install mysql-server"
    echo "  macOS: brew install mysql"
    echo "  Windows: Download from https://dev.mysql.com/downloads/installer/"
fi

# Install npm dependencies
print_status "Installing npm dependencies..."
npm install

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    print_status "Creating .env file from template..."
    cp .env.example .env
    print_warning "Please edit .env file with your database credentials and API keys"
else
    print_status ".env file already exists"
fi

# Create database (optional - requires MySQL credentials)
read -p "Do you want to create the MySQL database now? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    read -p "Enter MySQL root password: " -s mysql_password
    echo
    read -p "Enter database name (default: hotellux): " db_name
    db_name=${db_name:-hotellux}
    read -p "Enter database user (default: hotellux): " db_user
    db_user=${db_user:-hotellux}
    read -p "Enter database password: " -s db_password
    echo

    print_status "Creating MySQL database and user..."
    mysql -u root -p$mysql_password -e "
        CREATE DATABASE IF NOT EXISTS $db_name;
        CREATE USER IF NOT EXISTS '$db_user'@'localhost' IDENTIFIED BY '$db_password';
        GRANT ALL PRIVILEGES ON $db_name.* TO '$db_user'@'localhost';
        FLUSH PRIVILEGES;
    " 2>/dev/null

    if [ $? -eq 0 ]; then
        print_status "Database created successfully"
        
        # Update .env file with database URL
        sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=mysql://$db_user:$db_password@localhost:3306/$db_name|" .env
        print_status "Updated .env file with database URL"
    else
        print_error "Failed to create database. Please create it manually."
    fi
fi

# Push database schema
if [ -f .env ] && grep -q "DATABASE_URL=mysql://" .env; then
    print_status "Pushing database schema..."
    npm run db:push
    
    # Seed database
    read -p "Do you want to seed the database with sample data? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Seeding database with sample data..."
        npm run seed
    fi
fi

# Generate secrets if script exists
if [ -f generate-secrets.js ]; then
    print_status "Generating security secrets..."
    node generate-secrets.js
fi

print_status "Setup complete!"
echo
echo "📋 Next Steps:"
echo "  1. Edit .env file with your API keys (Google OAuth, Stripe, SendGrid)"
echo "  2. Open the project in Visual Studio Code"
echo "  3. Install recommended extensions when prompted"
echo "  4. Run 'npm run dev' to start development server"
echo
echo "📖 Documentation:"
echo "  • README_VSCODE.md - Visual Studio Code setup guide"
echo "  • MYSQL_SETUP.md - Detailed MySQL configuration"
echo "  • .vscode/settings.json - Optimized VS Code settings"
echo
echo "🚀 Test accounts (after seeding):"
echo "  • Admin: admin@hotellux.com / admin123"
echo "  • Customer: customer@hotellux.com / customer123"
echo
echo "Happy coding! 🎉"