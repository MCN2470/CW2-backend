# Wanderlust Travel API

A RESTful API backend for the Wanderlust Travel booking system built with Koa.js, TypeScript, MySQL, and Sequelize.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Hotel Management**: CRUD operations for hotel listings with operator permissions
- **User Management**: Public user registration and profile management
- **Favorites System**: Users can favorite hotels
- **Messaging System**: Direct messaging between users and operators
- **File Upload**: Profile photo upload support
- **External API Integration**: Hotel and flight data from external providers
- **Social Media Integration**: Automatic posting to social media feeds
- **Comprehensive Testing**: Full test suite with Jest and Supertest
- **API Documentation**: OpenAPI/Swagger specification

## 🛠️ Tech Stack

- **Framework**: Koa.js with TypeScript
- **Database**: MySQL with Sequelize ORM
- **Authentication**: Passport.js with JWT strategy
- **Validation**: Zod schema validation
- **Testing**: Jest + Supertest
- **Documentation**: OpenAPI/Swagger

## 📋 Prerequisites

- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

## 🔧 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd wanderlust-api
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your configuration.

4. Set up the database:

```bash
npm run db:create
npm run db:migrate
npm run db:seed
```

5. Start the development server:

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## 📝 Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

## 📚 API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:3001/docs`
- OpenAPI JSON: `http://localhost:3001/api-docs`

## 🔐 Environment Variables

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=wanderlust_travel
DB_USER=your_username
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# External API Keys
HOTELBEDS_API_KEY=your_hotelbeds_key
FLIGHT_DATA_API_KEY=your_flight_api_key

# Social Media
FACEBOOK_ACCESS_TOKEN=your_facebook_token
TWITTER_ACCESS_TOKEN=your_twitter_token
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 📁 Project Structure

```
src/
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/         # Sequelize models
├── routes/         # API routes
├── services/       # Business logic
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── config/         # Configuration files
└── tests/          # Test files
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
