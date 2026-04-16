import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { DitoSoul } from "../target/types/dito_soul";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { assert } from "chai";

describe("dito-soul", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.DitoSoul as Program<DitoSoul>;
  const authority = provider.wallet;

  // PDAs
  let globalStatePda: PublicKey;
  let treasuryStatePda: PublicKey;
  let userAccountPda: PublicKey;

  // Test USDC mint (devnet)
  const usdcMint = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");

  before(async () => {
    [globalStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      program.programId
    );
    [treasuryStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("treasury")],
      program.programId
    );
    [userAccountPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("user"), provider.wallet.publicKey.toBuffer()],
      program.programId
    );
  });

  it("initializes the program", async () => {
    // TODO: Implement — call program.methods.initialize(mintPrice)
    console.log("TODO: initialize test");
  });

  it("creates a user account", async () => {
    // TODO: Implement — call program.methods.createUser(displayName)
    console.log("TODO: create_user test");
  });

  it("mints a soul", async () => {
    // TODO: Implement — call program.methods.mintSoul(...)
    // Requires USDC token account setup
    console.log("TODO: mint_soul test");
  });

  it("records activity", async () => {
    // TODO: Implement — call program.methods.recordActivity()
    console.log("TODO: record_activity test");
  });

  it("updates stage", async () => {
    // TODO: Implement — call program.methods.updateStage(newStage)
    console.log("TODO: update_stage test");
  });

  it("applies decay to inactive soul", async () => {
    // TODO: Implement — call program.methods.applyDecay()
    console.log("TODO: apply_decay test");
  });

  it("applies strike to user", async () => {
    // TODO: Implement — call program.methods.applyStrike()
    console.log("TODO: apply_strike test");
  });

  it("verifies user identity", async () => {
    // TODO: Implement — call program.methods.verifyIdentity(true)
    console.log("TODO: verify_identity test");
  });

  it("withdraws from treasury", async () => {
    // TODO: Implement — call program.methods.withdrawTreasury(amount)
    console.log("TODO: withdraw_treasury test");
  });

  it("pauses and unpauses the program", async () => {
    // TODO: Implement — call program.methods.pause() / unpause()
    console.log("TODO: pause test");
  });

  it("rejects unauthorized access", async () => {
    // TODO: Implement — attempt operations with wrong authority
    console.log("TODO: auth rejection test");
  });

  it("prevents minting when paused", async () => {
    // TODO: Implement — pause, then try mint_soul
    console.log("TODO: pause enforcement test");
  });
});
