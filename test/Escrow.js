const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => ethers.parseUnits(n.toString(), "ether");

describe("Escrow", () => {
  let buyer, seller, inspector, lender;
  let realEstate, escrow;

  beforeEach(async () => {
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    // Deploy RealEstate NFT contract
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();
    await realEstate.waitForDeployment();

    // Mint a property as seller
    let tx = await realEstate.connect(seller).mint(
      seller.address,
      "https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPkkEhWhwFM1UGZQEkLcK"
    );
    await tx.wait();

    // Deploy Escrow contract
    const Escrow = await ethers.getContractFactory("Escrow");
    escrow = await Escrow.deploy(
      realEstate.target,
      seller.address,
      inspector.address,
      lender.address
    );
    await escrow.waitForDeployment();

    // Approve escrow to handle the NFT
    await realEstate.connect(seller).approve(escrow.target, 1);

    // List the property
    await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5));
  });

  describe("Listing", () => {
    it("updates ownership to escrow contract", async () => {
      expect(await realEstate.ownerOf(1)).to.equal(escrow.target);
    });

    it("updates as listed", async () => {
      expect(await escrow.isListed(1)).to.equal(true);
    });

    it("stores the buyer correctly", async () => {
      expect(await escrow.buyer(1)).to.equal(buyer.address);
    });
  });

  describe("Deposits", () => {
    it("updates contract balance on earnest deposit", async () => {
      await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
      expect(await escrow.getBalance()).to.equal(tokens(5));
    });
  });

  describe("Inspection", () => {
    it("updates inspection status", async () => {
      await escrow.connect(inspector).updateInspectionStatus(1, true);
      expect(await escrow.inspectionPassed(1)).to.equal(true);
    });
  });
});