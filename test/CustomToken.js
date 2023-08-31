const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CustomToken", function () {
  let CustomToken;
  let customToken;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    CustomToken = await ethers.getContractFactory("CustomToken");
    customToken = await CustomToken.connect(owner).deploy();
    await customToken.deployed();
  });

  it("Should have correct name, symbol, and initial supply", async function () {
    expect(await customToken.name()).to.equal("CustomToken");
    expect(await customToken.symbol()).to.equal("CTK");
    expect(await customToken.balanceOf(owner.address)).to.equal(
      ethers.utils.parseEther("1000000")
    );
  });

  it("Should allow minting and burning tokens", async function () {
    await customToken.connect(owner).mint(addr1.address, 1000);
    expect(await customToken.balanceOf(addr1.address)).to.equal(1000);

    await customToken.connect(owner).burn(addr1.address, 500);
    expect(await customToken.balanceOf(addr1.address)).to.equal(500);
  });

  it("Should not allow minting and burning from non-owner accounts", async function () {
    await expect(customToken.connect(addr1).mint(addr2.address, 1000)).to.be
      .reverted;
    await expect(customToken.connect(addr1).burn(addr2.address, 500)).to.be
      .reverted;
  });
});
