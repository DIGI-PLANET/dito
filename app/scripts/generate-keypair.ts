/**
 * Generate a Solana keypair for mint authority.
 * Run: npx tsx scripts/generate-keypair.ts
 * Copy the output to .env.local as MINT_AUTHORITY_SECRET
 */
import { Keypair } from '@solana/web3.js';

const keypair = Keypair.generate();
console.log('Public Key:', keypair.publicKey.toBase58());
console.log('');
console.log('Add this to .env.local:');
console.log(`MINT_AUTHORITY_SECRET=[${Array.from(keypair.secretKey).toString()}]`);
console.log('');
console.log('Fund this wallet on devnet:');
console.log(`solana airdrop 2 ${keypair.publicKey.toBase58()} --url devnet`);
