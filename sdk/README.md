# DITO SDK

> JavaScript/TypeScript SDK for DITO - Talent Discovery & Soul Minting Platform

[![npm version](https://badge.fury.io/js/dito-sdk.svg)](https://www.npmjs.com/package/dito-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

[한국어](./README_KR.md) | English

## 🌟 What is DITO?

DITO is a revolutionary platform that helps people discover their hidden talents and mint them as Soul NFTs on Solana. Our mission is to unlock human potential through AI-powered talent discovery and blockchain technology.

## 🚀 Features

- **🔮 Soul Management**: Create and manage digital souls
- **🎨 Talent Discovery**: AI-powered talent analysis 
- **⚡ Ember System**: Talent currency and rewards
- **🏟️ Arena Events**: Competitive talent showcases
- **🔐 2FA Security**: Enhanced account protection
- **📊 Analytics**: Detailed talent progression tracking

## 📦 Installation

```bash
npm install dito-sdk
# or
yarn add dito-sdk
```

## 🏃 Quick Start

```typescript
import { DitoSDK } from 'dito-sdk';

// Initialize the SDK
const dito = new DitoSDK({
  apiUrl: 'https://gateway.dito.guru',
  authToken: 'your-auth-token'
});

// Get user's soul
const soul = await dito.souls.get('your-soul-id');
console.log('Soul:', soul);

// Check ember balance
const balance = await dito.ember.getBalance();
console.log('Ember Balance:', balance);

// Discover talents
const talents = await dito.talents.discover();
console.log('Recommended Talents:', talents);
```

## 📖 API Reference

### Authentication

```typescript
// Setup 2FA
await dito.auth.setup2FA();

// Verify 2FA code
await dito.auth.verify2FA('123456');

// Check authentication status
const status = await dito.auth.getStatus();
```

### Soul Management

```typescript
// Get soul information
const soul = await dito.souls.get(soulId);

// Update soul
await dito.souls.update(soulId, {
  seekerName: 'New Name',
  bio: 'Updated bio'
});

// List all souls
const souls = await dito.souls.list();
```

### Talent System

```typescript
// Get talent recommendations
const recommendations = await dito.talents.discover();

// Start talent journey
await dito.talents.startJourney('programming');

// Track talent progress
await dito.talents.addProgress(talentId, {
  evidence: 'Completed React project',
  hours: 10
});

// Get talent analytics
const analytics = await dito.talents.getAnalytics();
```

### Ember Economy

```typescript
// Get ember balance
const balance = await dito.ember.getBalance();

// Transfer ember
await dito.ember.transfer('recipient-id', 100);

// Get transaction history
const history = await dito.ember.getHistory();
```

### Arena Events

```typescript
// Get live arena events
const events = await dito.arena.getLive();

// Join an arena event
await dito.arena.join('event-id');

// Get leaderboard
const leaderboard = await dito.arena.getLeaderboard('event-id');
```

## 🔧 Configuration

```typescript
const dito = new DitoSDK({
  // Required: API endpoint
  apiUrl: 'https://gateway.dito.guru',
  
  // Required: Authentication token
  authToken: 'your-token',
  
  // Optional: Request timeout (default: 30000ms)
  timeout: 30000,
  
  // Optional: API version (default: 'v1')
  apiVersion: 'v1',
  
  // Optional: Debug mode (default: false)
  debug: false
});
```

## 🛠️ Error Handling

```typescript
try {
  const soul = await dito.souls.get('invalid-id');
} catch (error) {
  if (error instanceof DitoError) {
    console.error('DITO Error:', error.message);
    console.error('Error Code:', error.code);
    console.error('Status Code:', error.statusCode);
  }
}
```

## 🔐 Security Best Practices

1. **Never expose your auth token** in client-side code
2. **Use environment variables** for sensitive configuration
3. **Enable 2FA** for enhanced security
4. **Regularly rotate** your API tokens

```typescript
// ❌ Don't do this
const dito = new DitoSDK({
  apiUrl: 'https://gateway.dito.guru',
  authToken: 'hardcoded-token-123' // Never!
});

// ✅ Do this
const dito = new DitoSDK({
  apiUrl: process.env.DITO_API_URL,
  authToken: process.env.DITO_AUTH_TOKEN
});
```

## 🌐 Browser Support

This SDK works in both Node.js and modern browsers:

- **Node.js**: 14.0.0+
- **Chrome**: 80+
- **Firefox**: 75+
- **Safari**: 13+
- **Edge**: 80+

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs.dito.guru](https://docs.dito.guru)
- **Discord**: [Join our community](https://discord.gg/dito)
- **Issues**: [GitHub Issues](https://github.com/dargonne/dito-sdk/issues)
- **Email**: support@dito.guru

## 🗺️ Roadmap

- [ ] React Native support
- [ ] WebSocket real-time events
- [ ] GraphQL client
- [ ] Flutter SDK
- [ ] Unity SDK for gaming

## ⭐ Star History

If you find this SDK helpful, please consider giving us a star on GitHub!

---

Built with ❤️ by the [DITO Team](https://dito.guru)