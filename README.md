# PropChain — Decentralized Real Estate Marketplace

> A full-stack decentralized application built on Ethereum that enables trustless real estate transactions through smart contracts, NFT property tokenisation, and a multi-party escrow system.

---

## Overview

PropChain allows property owners to list real estate as ERC-721 NFTs and buyers to purchase them using ETH — with no banks, no middlemen, and no paperwork. Every transaction is governed entirely by smart contracts deployed on the Ethereum blockchain.

The escrow flow requires sign-off from four parties before ownership transfers:

```
Buyer deposits earnest → Inspector approves → Buyer + Seller + Lender sign → Property NFT transfers
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Solidity ^0.8.0 |
| Contract Development | Hardhat |
| NFT Standard | OpenZeppelin ERC-721 |
| Frontend | Next.js 14 + TypeScript |
| Styling | Tailwind CSS |
| Blockchain Bridge | ethers.js v6 |
| Wallet | MetaMask |
| Testing | Mocha + Chai |
| Local Blockchain | Hardhat Network |
| Testnet | Sepolia |

---

## Smart Contracts

### `RealEstate.sol`
ERC-721 NFT contract. Each property is minted as a unique token representing on-chain ownership.

- Mint property tokens to a seller's address
- Store token metadata URI (IPFS-ready)
- Track total supply

### `Escrow.sol`
The core contract handling the full transaction lifecycle.

- Seller lists a property with a purchase price and escrow amount
- Buyer deposits earnest money (held in contract)
- Inspector updates inspection status (pass/fail)
- Buyer, Seller, and Lender each call `approveSale()`
- Once all conditions met, `finalizeSale()` transfers ETH to seller and NFT to buyer
- `cancelSale()` refunds buyer if inspection fails

---

## Project Structure

```
propchain/
├── contracts/
│   ├── RealEstate.sol      # ERC-721 NFT contract
│   └── Escrow.sol          # Multi-party escrow contract
├── scripts/
│   └── deploy.js           # Deployment script
├── test/
│   └── Escrow.js           # Unit tests (Mocha + Chai)
├── frontend/
│   └── app/
│       ├── page.tsx        # Main UI with wallet connection
│       └── config.json     # Contract addresses (auto-generated)
├── hardhat.config.js
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- MetaMask browser extension

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/propchain.git
cd propchain
npm install
npm install @openzeppelin/contracts
```

### Run locally

**Terminal 1 — Start local blockchain:**
```bash
npx hardhat node
```

**Terminal 2 — Deploy contracts:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

**Terminal 3 — Start frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`

### Run tests

```bash
npx hardhat test
```

---

## MetaMask Setup

1. Add custom network:
   - Network name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. Import test accounts using private keys printed by `npx hardhat node`:

| Role | Account # |
|---|---|
| Buyer | Account #0 |
| Seller | Account #1 |
| Inspector | Account #2 |
| Lender | Account #3 |

---

## Escrow Flow

1. **Buyer** connects wallet → clicks property → deposits earnest ETH
2. **Inspector** connects → passes or fails the inspection
3. **Buyer** connects → approves the sale
4. **Seller** connects → approves the sale
5. **Lender** connects → approves financing → clicks Finalize Sale
6. Property NFT transfers to Buyer, ETH transfers to Seller automatically

---

## Test Coverage

```
Escrow
  Listing
    ✔ updates ownership to escrow contract
    ✔ updates as listed
    ✔ stores the buyer correctly
  Deposits
    ✔ updates contract balance on earnest deposit
  Inspection
    ✔ updates inspection status
```

---

## License

MIT