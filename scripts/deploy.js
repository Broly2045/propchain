const hre = require("hardhat");
const fs = require("fs");

const tokens = (n) => hre.ethers.parseUnits(n.toString(), "ether");

async function main() {
  const [deployer, seller, inspector, lender] = await hre.ethers.getSigners();
  const buyer = deployer;

  console.log("Deploying with:", deployer.address);
  console.log("Seller:", seller.address);
  console.log("Inspector:", inspector.address);
  console.log("Lender:", lender.address);
  console.log("Buyer:", buyer.address);

  // 1. Deploy RealEstate NFT
  const RealEstate = await hre.ethers.getContractFactory("RealEstate");
  const realEstate = await RealEstate.deploy();
  await realEstate.waitForDeployment();
  console.log("RealEstate deployed to:", realEstate.target);

  // 2. Deploy Escrow
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(
    realEstate.target,
    seller.address,
    inspector.address,
    lender.address
  );
  await escrow.waitForDeployment();
  console.log("Escrow deployed to:", escrow.target);

  // 3. Mint + List 3 properties
 const properties = [
    { name: "3BHK Apartment, Bhubaneswar", price: "10", escrow: "10", uri: "https://ipfs.io/ipfs/QmHash1" },
    { name: "Villa, Goa",                  price: "25", escrow: "25", uri: "https://ipfs.io/ipfs/QmHash2" },
    { name: "Commercial Space, Bengaluru", price: "50", escrow: "50", uri: "https://ipfs.io/ipfs/QmHash3" },
];

  for (let i = 0; i < properties.length; i++) {
    const p = properties[i];
    const tokenId = i + 1;

    // Mint to seller
    let tx = await realEstate.connect(seller).mint(seller.address, p.uri);
    await tx.wait();
    console.log(`Minted property ${tokenId}: ${p.name}`);

    // Seller approves escrow
    tx = await realEstate.connect(seller).approve(escrow.target, tokenId);
    await tx.wait();

    // Seller lists in escrow with buyer = deployer (Account #0)
    tx = await escrow.connect(seller).list(
      tokenId,
      buyer.address,
      tokens(p.price),
      tokens(p.escrow)
    );
    await tx.wait();
    console.log(`Listed property ${tokenId} in escrow`);
  }

  // 4. Save config
  const config = {
    realEstateAddress: realEstate.target,
    escrowAddress: escrow.target,
    sellerAddress: seller.address,
    inspectorAddress: inspector.address,
    lenderAddress: lender.address,
    buyerAddress: buyer.address,
    properties: properties.map((p, i) => ({
      id: i + 1,
      name: p.name,
      price: p.price,
      escrowAmount: p.escrow,
    })),
  };

  fs.writeFileSync("./frontend/app/config.json", JSON.stringify(config, null, 2));
  console.log("Config saved!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});