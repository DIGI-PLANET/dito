# ✨ DITO Guru

> Beautiful Next.js frontend for the DITO talent discovery platform

[![Next.js](https://img.shields.io/badge/Next.js-14.0+-black.svg)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-18.0+-blue.svg)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DIGI-PLANET](https://img.shields.io/badge/Organization-DIGI--PLANET-purple)](https://github.com/DIGI-PLANET)

Part of the [DIGI-PLANET](https://github.com/DIGI-PLANET) ecosystem for transforming human potential into digital assets.

---

## 🌟 **Overview**

DITO Guru is the beautiful, user-facing application that helps people discover their hidden talents and transform them into valuable Soul NFTs. Built with modern React and Next.js, it provides an intuitive interface for the DITO platform.

### 🎯 **Key Features**

- **🔮 Talent Discovery**: AI-powered analysis to uncover hidden abilities
- **💎 Soul Creation**: Mint your talents as unique Soul NFTs on Solana
- **⚡ Ember Economy**: Earn and spend Ember tokens for talent development
- **🏟️ Arena Events**: Compete with others in talent-based competitions
- **📊 Progress Tracking**: Visualize your talent growth over time
- **🔐 Secure Authentication**: 2FA integration with the DITO Gateway

---

## 🚀 **Quick Start**

### **Prerequisites**
- Node.js 18.0 or higher
- npm or yarn package manager

### **Installation**
```bash
# Clone the repository
git clone https://github.com/DIGI-PLANET/dito-guru.git
cd dito-guru

# Install dependencies
npm install
# or
yarn install

# Copy environment configuration
cp .env.example .env.local

# Start development server
npm run dev
# or
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🔧 **Configuration**

### **Environment Variables**

Create a `.env.local` file with:

```bash
# DITO Gateway API
NEXT_PUBLIC_API_URL=http://localhost:8099
NEXT_PUBLIC_WS_URL=ws://localhost:8099

# Supabase (Optional - Gateway handles most data)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
NEXT_PUBLIC_JWT_SECRET=your_jwt_secret

# Solana Network
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com

# Features
NEXT_PUBLIC_ENABLE_2FA=true
NEXT_PUBLIC_ENABLE_ARENA=true
NEXT_PUBLIC_ENABLE_EMBER=true
```

### **Development vs Production**
- **Development**: Uses local DITO Gateway (`localhost:8099`)
- **Production**: Uses deployed Gateway endpoint

---

## 🏗️ **Architecture**

### **📁 Project Structure**
```
dito-guru/
├── src/
│   ├── app/                    # Next.js 14 App Router
│   │   ├── dashboard/          # User dashboard
│   │   ├── souls/              # Soul management
│   │   ├── talents/            # Talent discovery
│   │   ├── arena/              # Competition events
│   │   └── auth/               # Authentication
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Base UI components
│   │   ├── souls/              # Soul-specific components
│   │   ├── talents/            # Talent-specific components
│   │   └── common/             # Shared components
│   ├── lib/                    # Utilities and integrations
│   │   ├── agent-api.ts        # DITO Gateway API client
│   │   ├── store-agent.ts      # State management
│   │   ├── types.ts            # TypeScript definitions
│   │   └── utils.ts            # Helper functions
│   └── styles/                 # Global styles and themes
├── public/                     # Static assets
├── scripts/                    # Build and deployment scripts
└── docs/                       # Documentation
```

### **🔀 API Integration**

The frontend communicates with the [DITO Gateway](https://github.com/DIGI-PLANET/dito-gateway) backend:

```typescript
import { AgentAPI } from '@/lib/agent-api';

// Initialize API client
const api = new AgentAPI({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  authToken: userToken
});

// Discover talents
const talents = await api.talents.discover();

// Create a Soul
const soul = await api.souls.create({
  seekerName: 'John Doe',
  bio: 'Aspiring developer'
});

// Check Ember balance
const balance = await api.ember.getBalance();
```

---

## 🎨 **Design System**

### **🎭 UI Components**
- **Design Framework**: Custom components built on Tailwind CSS
- **Color Palette**: DITO brand colors (purple, blue, gold gradients)
- **Typography**: Modern, readable fonts with good contrast
- **Responsive**: Mobile-first design approach

### **🌈 Theme System**
```typescript
// Theme configuration
const theme = {
  colors: {
    primary: '#6366f1',      // Indigo for main actions
    secondary: '#8b5cf6',    // Purple for accents  
    ember: '#f59e0b',        // Amber for Ember currency
    soul: '#ec4899',         # Pink for Soul NFTs
    success: '#10b981',      // Green for success states
    danger: '#ef4444'        // Red for errors
  },
  gradients: {
    talent: 'from-purple-500 to-indigo-600',
    soul: 'from-pink-500 to-rose-600', 
    ember: 'from-amber-500 to-orange-600'
  }
}
```

---

## 🔮 **Core Features**

### **👤 Talent Discovery**
- **AI Analysis**: Upload examples of your work for AI evaluation
- **Skill Assessment**: Take interactive quizzes and challenges
- **Growth Tracking**: Monitor talent development over time
- **Recommendations**: Get personalized suggestions for skill improvement

### **💎 Soul Management**
- **Soul Creation**: Transform talents into unique NFTs
- **Soul Gallery**: Browse and showcase your Soul collection
- **Soul Trading**: Buy, sell, and trade Soul NFTs (coming soon)
- **Soul Evolution**: Upgrade Souls as talents grow

### **⚡ Ember Economy**
- **Earn Ember**: Complete challenges and milestones
- **Spend Ember**: Unlock premium features and assessments
- **Transfer Ember**: Send tokens to other users
- **Ember History**: Track all your transactions

### **🏟️ Arena Events**
- **Live Competitions**: Real-time talent competitions
- **Leaderboards**: See how you rank against others
- **Prizes**: Win Ember and exclusive Soul variants
- **Team Events**: Collaborate with others in group challenges

---

## 📱 **Mobile Experience**

### **📲 Progressive Web App (PWA)**
- **Offline Support**: Cache key features for offline use
- **Push Notifications**: Stay updated on Arena events and achievements
- **Home Screen Install**: Add DITO to your device's home screen
- **Native Feel**: Smooth animations and native-like interactions

### **🔍 Responsive Design**
- **Mobile-First**: Designed for mobile, enhanced for desktop
- **Touch-Friendly**: Large tap targets and swipe gestures
- **Fast Loading**: Optimized images and code splitting
- **Accessibility**: WCAG 2.1 compliant design

---

## 🧪 **Testing**

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Lint code
npm run lint

# Type checking
npm run type-check
```

---

## 🚀 **Deployment**

### **▲ Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod
```

### **🐳 Docker**
```bash
# Build Docker image
docker build -t dito-guru .

# Run container
docker run -p 3000:3000 dito-guru
```

### **📦 Static Export**
```bash
# Generate static files
npm run build
npm run export
```

---

## 🔒 **Security & Privacy**

### **🛡️ Authentication**
- **JWT Tokens**: Secure token-based authentication
- **2FA Support**: Time-based one-time passwords
- **Session Management**: Automatic token refresh
- **Secure Headers**: CSP, CSRF protection

### **🔐 Data Protection**
- **Client-Side Encryption**: Sensitive data encrypted before storage
- **No Sensitive Storage**: Tokens stored securely, no plaintext secrets
- **Privacy-First**: Minimal data collection, user consent required
- **GDPR Compliant**: Right to deletion and data portability

---

## 📊 **Performance**

### **⚡ Optimization Features**
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Next.js Image component with WebP support
- **Caching Strategy**: Aggressive caching for static assets
- **Bundle Analysis**: Regular bundle size monitoring

### **📈 Metrics**
- **Lighthouse Score**: 95+ on all metrics
- **First Contentful Paint**: <1.5s
- **Largest Contentful Paint**: <2.5s
- **Cumulative Layout Shift**: <0.1

---

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### **🎨 Design Guidelines**
- Follow the DITO design system
- Use Tailwind CSS utilities
- Maintain accessibility standards
- Test on mobile devices

### **💻 Code Guidelines**
- TypeScript for all new code
- ESLint + Prettier configuration
- Write tests for new features
- Update documentation

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌍 **DIGI-PLANET Ecosystem**

Part of the larger [DIGI-PLANET](https://github.com/DIGI-PLANET) ecosystem:

- **[dito-gateway](https://github.com/DIGI-PLANET/dito-gateway)**: High-performance Go backend
- **[dito-soul](https://github.com/DIGI-PLANET/dito-soul)**: Solana Soul NFT smart contracts
- **[dito-sdk](https://github.com/DIGI-PLANET/dito-sdk)**: JavaScript/TypeScript SDK

---

**✨ Built with ❤️ by the [DIGI-PLANET](https://github.com/DIGI-PLANET) team**

*Discover your talents. Create your Soul. Transform your potential.*