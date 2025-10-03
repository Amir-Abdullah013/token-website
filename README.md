# TokenApp - Next.js + Supabase + Prisma

A modern web application built with Next.js, Supabase, and Prisma, featuring a clean folder structure, responsive design, and secure authentication.

## 🚀 Features

- **Fast Loading**: Built with Next.js for optimal performance
- **Secure Authentication**: Powered by Supabase Auth
- **Database**: PostgreSQL with Prisma ORM
- **Real-time Features**: Supabase real-time subscriptions
- **Responsive Design**: Works on all devices and screen sizes
- **Clean Architecture**: Well-organized folder structure
- **Modern UI**: Light, minimal, and fast-loading theme

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── layout.js          # Root layout
│   ├── page.js            # Home page
│   └── globals.css        # Global styles
├── components/            # Shared UI components
│   ├── Button.js          # Reusable button component
│   ├── Input.js           # Form input component
│   ├── Loader.js          # Loading spinner component
│   ├── Navbar.js          # Navigation bar
│   ├── Sidebar.js         # Sidebar navigation
│   ├── Layout.js          # Main layout wrapper
│   └── index.js           # Component exports
├── pages/                 # Page components
│   ├── user/              # User panel screens
│   │   └── dashboard.js   # User dashboard
│   └── admin/             # Admin panel screens
│       └── dashboard.js   # Admin dashboard
└── lib/                   # Utility functions
    ├── supabase.js        # Supabase client & auth helpers
    ├── prisma.js          # Prisma client
    └── database.js        # Database operations
```

## 🛠️ Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_DATABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Set up database**:
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

4. **Run the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Supabase Setup

1. Create a new project in your [Supabase Dashboard](https://supabase.com)
2. Copy your Project URL and Anon Key
3. Update the `.env.local` file with your credentials
4. Configure your authentication settings in Supabase Dashboard

### Environment Variables

- `NEXT_PUBLIC_DATABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key

## 🎨 Components

### Shared Components

- **Button**: Reusable button with multiple variants and sizes
- **Input**: Form input with label, error, and helper text support
- **Loader**: Loading spinner with customizable size and color
- **Navbar**: Responsive navigation bar with user authentication
- **Sidebar**: Collapsible sidebar for user/admin panels
- **Layout**: Main layout wrapper with authentication handling

### Usage Examples

```jsx
import { Button, Input, Layout } from '../components';

// Button with loading state
<Button loading={true} variant="primary" size="lg">
  Submit
</Button>

// Input with validation
<Input 
  label="Email" 
  type="email" 
  error="Invalid email format"
  placeholder="Enter your email"
/>

// Layout with sidebar
<Layout showSidebar={true}>
  <YourContent />
</Layout>
```

## 🔐 Authentication

The app includes built-in authentication helpers:

```javascript
import { authHelpers } from '../lib/supabase';

// Sign in
await authHelpers.signIn(email, password);

// Sign up
await authHelpers.signUp(email, password, name);

// Sign out
await authHelpers.signOut();

// Check authentication
const isAuth = await authHelpers.isAuthenticated();
```

## 📱 Responsive Design

- Mobile-first approach
- Collapsible sidebar on mobile
- Responsive navigation
- Touch-friendly interface

## 🚀 Deployment

1. **Build the project**:
   ```bash
   npm run build
   ```

2. **Start production server**:
   ```bash
   npm start
   ```

3. **Deploy to Vercel**:
   ```bash
   npx vercel
   ```

## 📄 License

This project is licensed under the MIT License.