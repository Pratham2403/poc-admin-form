# Hush Poll - Form Management System

A full-stack form management application with role-based access control, Google Sheets integration, and a modern admin interface.

## Features

### Core Features
- ✅ **User Authentication** - Cookie-based JWT authentication with login/register
- ✅ **Role-Based Access Control** - Admin and User roles with protected routes
- ✅ **Form Builder** - Create forms with multiple question types
- ✅ **Form Renderer** - Fill out forms with validation
- ✅ **Response Management** - View and edit submitted responses
- ✅ **Google Sheets Integration** - Sync responses to Google Sheets
- ✅ **Dark Mode** - Toggle between light, dark, and system themes

### Question Types
- Short Answer
- Paragraph
- Multiple Choice
- Checkboxes
- Dropdown
- Date
- Time

### Admin Features
- Dashboard with form statistics
- Create, edit, and delete forms
- Publish/unpublish forms
- Copy shareable form links
- Enable/disable response editing
- Link forms to Google Sheets

### User Features
- Browse available forms
- Fill out forms with validation
- View submitted responses
- Edit responses (if allowed)

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS v4 for styling
- React Router for navigation
- Axios for API calls

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- JWT for authentication
- Google Sheets API

## Project Structure

```
poc-admin-form/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── pages/          # Page components
│   │   ├── routes/         # Route definitions
│   │   ├── services/       # API service functions
│   │   └── lib/            # Utility functions
│   └── package.json
├── server/                 # Backend Express application
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # Express routes
│   │   ├── scripts/        # Utility scripts
│   │   └── services/       # Business logic services
│   └── package.json
└── shared/                 # Shared types and interfaces
    └── src/
        ├── enums/          # Shared enums
        └── interfaces/     # Shared interfaces
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Cloud Service Account (for Sheets integration)

### Installation

1. Clone the repository and install dependencies:

```bash
# Install shared package
cd shared
npm install

# Install server dependencies
cd ../server
npm install

# Install client dependencies
cd ../client
npm install
```

2. Configure environment variables:

Create `server/.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/poc-admin-form
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
NODE_ENV=development

# Admin seed credentials
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
ADMIN_NAME=Administrator
```

3. Set up Google Service Account:

   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select existing
   - Enable Google Sheets API
   - Create a Service Account with Editor role
   - Download the JSON key and save as `server/src/config/google-service-account.config.json`
   - Share your Google Sheets with the service account email

4. Seed the admin user:

```bash
cd server
npm run seed:admin
```

### Running the Application

**Development mode:**

```bash
# Terminal 1 - Start server
cd server
npm run dev

# Terminal 2 - Start client
cd client
npm run dev
```

**Production build:**

```bash
# Build server
cd server
npm run build

# Build client
cd client
npm run build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### Forms
- `GET /api/forms` - Get all forms (filtered by role)
- `GET /api/forms/:id` - Get form by ID
- `POST /api/forms` - Create form (Admin only)
- `PUT /api/forms/:id` - Update form (Admin only)
- `DELETE /api/forms/:id` - Delete form (Admin only)

### Responses
- `POST /api/responses` - Submit form response
- `GET /api/responses/my` - Get current user's responses
- `PUT /api/responses/:id` - Update response

## Google Sheets Integration

When a form has a Google Sheet URL configured:
1. Responses are appended as new rows when submitted
2. The row number is stored in MongoDB
3. When editing a response, the corresponding row is updated

Make sure to:
1. Share the Google Sheet with your service account email
2. The sheet should have headers matching question IDs (auto-created on first submission)

## Default Credentials

After running `npm run seed:admin`:
- **Email:** admin@example.com
- **Password:** admin123

⚠️ **Change these credentials in production!**

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the ISC License.
