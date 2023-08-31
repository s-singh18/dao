// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const config = require("../src/config.json");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

async function main() {
  console.log(`Fetching accounts & network... \n`);

  const accounts = await ethers.getSigners();
  const funder = accounts[0];
  const investor1 = accounts[1];
  const investor2 = accounts[2];
  const investor3 = accounts[3];
  const investor4 = accounts[4];
  const recipient = accounts[5];

  let transaction;

  const { chainId } = await ethers.provider.getNetwork();

  console.log(`Fetching token and transferring to accounts... \n`);

  const token = await ethers.getContractAt(
    "Token",
    config[chainId].token.address
  );
  console.log(`Token fetched: ${token.address}`);

  const customToken = await ethers.getContractAt(
    "CustomToken",
    config[chainId].customToken.address
  );
  console.log(`CustomToken fetched: ${customToken.address}`);

  transaction = await token.transfer(investor1.address, tokens(200000));
  await transaction.wait();

  transaction = await token.transfer(investor2.address, tokens(200000));
  await transaction.wait();

  transaction = await token.transfer(investor3.address, tokens(200000));
  await transaction.wait();

  console.log(`Fetching dao...\n`);

  const dao = await ethers.getContractAt("DAO", config[chainId].dao.address);
  console.log(`DAO fetched: ${dao.address}\n`);

  transaction = await customToken.transfer(dao.address, tokens(1000000));
  await transaction.wait();
  console.log(`Sent funds to dao treasury`);

  for (let i = 0; i < 3; i++) {
    transaction = await dao
      .connect(investor1)
      .createProposal(
        `Proposal ${i + 1}`,
        ether(100),
        recipient.address,
        `P${i + 1}`
      );
    await transaction.wait();

    transaction = await dao.connect(investor1).upvote(i + 1);
    await transaction.wait();

    transaction = await dao.connect(investor2).upvote(i + 1);
    await transaction.wait();

    transaction = await dao.connect(investor3).upvote(i + 1);
    await transaction.wait();

    transaction = await dao.connect(investor1).finalizeProposal(i + 1);
    await transaction.wait();

    console.log(`Created & Finalized Proposal ${i + 1}\n`);
  }

  console.log(`Creating one more proposal...\n`);

  transaction = await dao
    .connect(investor1)
    .createProposal(`Proposal 4`, ether(100), recipient.address, `P4`);
  await transaction.wait();

  transaction = await dao.connect(investor2).upvote(4);
  await transaction.wait();

  transaction = await dao.connect(investor3).upvote(4);
  await transaction.wait();

  console.log(`Finished.\n`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
