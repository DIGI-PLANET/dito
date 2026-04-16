# 💎 DITO Soul

> Solana smart contracts for Soul NFT minting and talent tokenization

[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)](https://rustlang.org)
[![Anchor](https://img.shields.io/badge/Anchor-0.29+-blue.svg)](https://anchor-lang.com)
[![Solana](https://img.shields.io/badge/Solana-1.16+-green.svg)](https://solana.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![DIGI-PLANET](https://img.shields.io/badge/Organization-DIGI--PLANET-purple)](https://github.com/DIGI-PLANET)

Part of the [DIGI-PLANET](https://github.com/DIGI-PLANET) ecosystem for transforming human potential into digital assets.

---

## 🌟 **Overview**

DITO Soul contains the Solana smart contracts that power the Soul NFT ecosystem. Built with the Anchor framework, these programs handle Soul NFT minting, talent verification, ownership transfer, and the decentralized reputation system.

### 🎯 **Key Features**

- **💎 Soul NFT Minting**: Create unique NFTs representing individual talents
- **🔐 Talent Verification**: On-chain proof of talent authenticity
- **⚡ Ember Integration**: Native token economy for talent transactions
- **🏆 Reputation System**: Decentralized talent scoring and validation
- **🔄 Cross-Chain Ready**: Architecture prepared for multi-chain expansion
- **📊 Analytics**: On-chain talent progression tracking

---

## 🚀 **Quick Start**

### **Prerequisites**
- Rust 1.70 or higher
- Anchor CLI 0.29 or higher
- Solana CLI 1.16 or higher

### **Installation**
```bash
# Clone the repository
git clone https://github.com/DIGI-PLANET/dito-soul.git
cd dito-soul

# Install Anchor CLI
npm install -g @coral-xyz/anchor-cli

# Install dependencies
anchor build
```

### **🔧 Local Development**
```bash
# Start local validator
solana-test-validator

# Deploy to local network
anchor deploy --program-name dito_soul

# Run tests
anchor test
```

---

## 🏗️ **Architecture**

### **📁 Project Structure**
```
dito-soul/
├── programs/
│   └── dito-soul/
│       ├── src/
│       │   ├── lib.rs              # Program entry point
│       │   ├── instructions/       # All instruction handlers
│       │   │   ├── mint_soul.rs    # Soul NFT minting
│       │   │   ├── verify_talent.rs # Talent verification
│       │   │   ├── transfer_soul.rs # Soul ownership transfer
│       │   │   └── update_reputation.rs # Reputation updates
│       │   ├── state/              # Account structures
│       │   │   ├── soul.rs         # Soul NFT state
│       │   │   ├── talent.rs       # Talent metadata
│       │   │   └── reputation.rs   # Reputation tracking
│       │   ├── errors.rs           # Custom error types
│       │   └── utils.rs            # Helper functions
│       └── Cargo.toml
├── tests/                          # Integration tests
├── migrations/                     # Deployment scripts
└── target/                         # Compiled programs
```

### **🔗 Program Accounts**

#### **Soul NFT Account**
```rust
#[account]
pub struct Soul {
    pub authority: Pubkey,           // Owner of the Soul
    pub seeker_name: String,         // Display name
    pub bio: String,                 // Description
    pub mint: Pubkey,                // NFT mint address
    pub talents: Vec<Talent>,        // Associated talents
    pub ember_balance: u64,          // Ember token balance
    pub reputation_score: u32,       // On-chain reputation
    pub created_at: i64,             // Creation timestamp
    pub updated_at: i64,             // Last update timestamp
    pub stage: SoulStage,            // Development stage
}
```

#### **Talent Account**
```rust
#[account]
pub struct Talent {
    pub talent_id: String,           // Unique identifier
    pub category: String,            // Talent category
    pub skill_level: u8,             // 1-10 skill level
    pub evidence_uri: String,        // IPFS link to evidence
    pub verified: bool,              // Verification status
    pub verifier: Option<Pubkey>,    // Who verified this talent
    pub ember_earned: u64,           // Ember earned from this talent
    pub progression_data: Vec<u8>,   // Serialized progress data
}
```

---

## 🎯 **Core Instructions**

### **💎 Soul Minting**
```rust
#[derive(Accounts)]
pub struct MintSoul<'info> {
    #[account(init, payer = authority, space = Soul::SIZE)]
    pub soul: Account<'info, Soul>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(mut)]
    pub mint: Account<'info, Mint>,
    
    #[account(mut)]
    pub token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

pub fn mint_soul(
    ctx: Context<MintSoul>,
    seeker_name: String,
    bio: String,
    metadata_uri: String,
) -> Result<()> {
    // Implementation for minting Soul NFTs
}
```

### **🔐 Talent Verification**
```rust
#[derive(Accounts)]
pub struct VerifyTalent<'info> {
    #[account(mut)]
    pub soul: Account<'info, Soul>,
    
    #[account(mut)]
    pub verifier: Signer<'info>,
    
    pub verifier_authority: Account<'info, VerifierAuthority>,
}

pub fn verify_talent(
    ctx: Context<VerifyTalent>,
    talent_id: String,
    verification_data: Vec<u8>,
) -> Result<()> {
    // Implementation for talent verification
}
```

### **⚡ Ember Operations**
```rust
#[derive(Accounts)]
pub struct TransferEmber<'info> {
    #[account(mut)]
    pub from_soul: Account<'info, Soul>,
    
    #[account(mut)]
    pub to_soul: Account<'info, Soul>,
    
    pub authority: Signer<'info>,
}

pub fn transfer_ember(
    ctx: Context<TransferEmber>,
    amount: u64,
) -> Result<()> {
    // Implementation for Ember transfers
}
```

---

## 🧪 **Testing**

### **🔧 Unit Tests**
```bash
# Run all tests
anchor test

# Run specific test file
anchor test --file tests/soul_minting.ts

# Test with verbose output
anchor test -- --verbose
```

### **📝 Test Examples**
```typescript
describe('Soul NFT Minting', () => {
  it('Successfully mints a new Soul NFT', async () => {
    const soulKeypair = anchor.web3.Keypair.generate();
    
    await program.methods
      .mintSoul("Alice", "Aspiring developer", "ipfs://metadata")
      .accounts({
        soul: soulKeypair.publicKey,
        authority: wallet.publicKey,
        // ... other accounts
      })
      .signers([soulKeypair])
      .rpc();
      
    // Verify Soul was created correctly
    const soul = await program.account.soul.fetch(soulKeypair.publicKey);
    assert.equal(soul.seekerName, "Alice");
  });
});
```

---

## 🔗 **Integration**

### **🌐 Frontend Integration**
```typescript
// Using @solana/web3.js with Anchor
import { Program, AnchorProvider } from '@coral-xyz/anchor';
import { Connection, PublicKey } from '@solana/web3.js';
import { DitoSoul } from './types/dito_soul';

// Initialize connection
const connection = new Connection('https://api.devnet.solana.com');
const provider = new AnchorProvider(connection, wallet, {});
const program = new Program<DitoSoul>(idl, programId, provider);

// Mint a Soul NFT
const mintSoul = async (seekerName: string, bio: string) => {
  const soulKeypair = Keypair.generate();
  
  const tx = await program.methods
    .mintSoul(seekerName, bio, metadataUri)
    .accounts({
      soul: soulKeypair.publicKey,
      authority: wallet.publicKey,
      // ... other accounts
    })
    .signers([soulKeypair])
    .rpc();
    
  return tx;
};
```

### **🔌 Backend Integration**
```rust
// Using anchor-client in Rust backend
use anchor_client::{Client, Cluster};
use solana_sdk::signature::Keypair;

let client = Client::new(Cluster::Devnet, Rc::new(keypair));
let program = client.program(DITO_SOUL_PROGRAM_ID);

// Call mint_soul instruction
let tx = program
    .request()
    .accounts(dito_soul::accounts::MintSoul {
        soul: soul_keypair.pubkey(),
        authority: authority.pubkey(),
        // ... other accounts
    })
    .args(dito_soul::instruction::MintSoul {
        seeker_name: "Bob".to_string(),
        bio: "Artist and creator".to_string(),
        metadata_uri: "ipfs://...".to_string(),
    })
    .send()?;
```

---

## 🌐 **Deployment**

### **🧪 Devnet Deployment**
```bash
# Configure Solana CLI for devnet
solana config set --url https://api.devnet.solana.com

# Build and deploy
anchor build
anchor deploy --program-name dito_soul

# Verify deployment
solana program show <PROGRAM_ID>
```

### **🚀 Mainnet Deployment**
```bash
# Configure for mainnet-beta
solana config set --url https://api.mainnet-beta.solana.com

# Deploy with verified build
anchor build --verifiable
anchor deploy --program-name dito_soul

# Verify on-chain program matches local build
anchor verify <PROGRAM_ID>
```

### **📊 Program Addresses**
- **Devnet**: `TBD` (To Be Deployed)
- **Mainnet**: `TBD` (To Be Deployed)

---

## 🔒 **Security**

### **🛡️ Security Features**
- **Authority Checks**: All instructions verify proper authority
- **Overflow Protection**: SafeMath for all arithmetic operations
- **Access Control**: Role-based permissions for verifiers
- **State Validation**: Comprehensive account state validation

### **🔍 Audit Checklist**
- [ ] Authority validation on all instructions
- [ ] Integer overflow/underflow protection
- [ ] Proper account ownership checks
- [ ] Cross-program invocation safety
- [ ] Re-entrancy protection
- [ ] Account size validation

### **🚨 Known Limitations**
- Maximum 10 talents per Soul (to prevent account size issues)
- Reputation scores capped at 1,000,000
- Metadata URIs limited to 200 characters

---

## 🎯 **Roadmap**

### **🎊 V1.0 (Current)**
- [x] Basic Soul NFT minting
- [x] Talent attachment system
- [x] Ember balance tracking
- [x] Simple verification system

### **🚀 V2.0 (Q2 2026)**
- [ ] Advanced reputation algorithms
- [ ] Staking mechanisms for verifiers
- [ ] Soul evolution/upgrade system
- [ ] Cross-program talent sharing

### **🌍 V3.0 (Q4 2026)**
- [ ] Cross-chain bridge to Ethereum
- [ ] Layer 2 scaling solutions
- [ ] DAO governance integration
- [ ] Marketplace royalty system

---

## 📊 **Performance & Costs**

### **⚡ Transaction Costs**
- **Mint Soul**: ~0.01 SOL (includes NFT minting)
- **Add Talent**: ~0.005 SOL
- **Verify Talent**: ~0.003 SOL
- **Transfer Ember**: ~0.002 SOL

### **💾 Storage Costs**
- **Soul Account**: ~0.01 SOL (rent-exempt)
- **Talent Account**: ~0.005 SOL per talent
- **Reputation Account**: ~0.003 SOL

---

## 🤝 **Contributing**

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### **🦀 Rust Guidelines**
- Follow Rust naming conventions
- Use `cargo clippy` for linting
- Write comprehensive tests
- Document all public interfaces

### **⚓ Anchor Best Practices**
- Use proper account constraints
- Validate all inputs
- Handle errors gracefully
- Optimize for transaction size

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🌍 **DIGI-PLANET Ecosystem**

Part of the larger [DIGI-PLANET](https://github.com/DIGI-PLANET) ecosystem:

- **[dito-gateway](https://github.com/DIGI-PLANET/dito-gateway)**: High-performance Go backend
- **[dito-guru](https://github.com/DIGI-PLANET/dito-guru)**: Next.js frontend application
- **[dito-sdk](https://github.com/DIGI-PLANET/dito-sdk)**: JavaScript/TypeScript SDK

---

**💎 Built with ❤️ by the [DIGI-PLANET](https://github.com/DIGI-PLANET) team**

*Immortalizing talents on the blockchain, one Soul at a time.*