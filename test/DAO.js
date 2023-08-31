const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

const ether = tokens;

describe("DAO", () => {
  let token, dao, customToken;
  let deployer,
    funder,
    investor1,
    investor2,
    investor3,
    investor4,
    investor5,
    recipient,
    user;

  beforeEach(async () => {
    [
      deployer,
      funder,
      investor1,
      investor2,
      investor3,
      investor4,
      investor5,
      recipient,
      user,
    ] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy("Dapp University", "DAPP", "1000000");

    const CustomToken = await ethers.getContractFactory("CustomToken");
    customToken = await CustomToken.deploy();

    transaction = await token
      .connect(deployer)
      .transfer(investor1.address, tokens(200000));
    await transaction.wait();

    transaction = await token
      .connect(deployer)
      .transfer(investor2.address, tokens(200000));
    await transaction.wait();

    transaction = await token
      .connect(deployer)
      .transfer(investor3.address, tokens(200000));
    await transaction.wait();

    transaction = await token
      .connect(deployer)
      .transfer(investor4.address, tokens(200000));
    await transaction.wait();

    transaction = await token
      .connect(deployer)
      .transfer(investor5.address, tokens(200000));
    await transaction.wait();

    const DAO = await ethers.getContractFactory("DAO");
    dao = await DAO.deploy(
      token.address,
      customToken.address,
      "500000000000000000000001"
    );

    transaction = await customToken
      .connect(deployer)
      .transfer(dao.address, tokens(1000000));
    await transaction.wait();
  });

  describe("Deployment", () => {
    it("Should send customToken to the DAO treasury", async () => {
      expect(await customToken.balanceOf(dao.address)).to.equal(
        tokens(1000000)
      );
    });

    it("Should have correct token address", async () => {
      expect(await dao.token()).to.equal(token.address);
    });

    it("Should have correct custom token address", async () => {
      expect(await dao.customToken()).to.equal(customToken.address);
    });

    it("Should return quorum", async () => {
      expect(await dao.quorum()).to.equal("500000000000000000000001");
    });
  });

  describe("Proposal creation", () => {
    let transaction, result;

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await dao
          .connect(investor1)
          .createProposal("Proposal 1", tokens(100), recipient.address, "");
        result = await transaction.wait();
      });

      it("Should update proposal count", async () => {
        expect(await dao.proposalCount()).to.equal(1);
      });

      it("Should update proposal mapping", async () => {
        const proposal = await dao.proposals(1);
        expect(proposal.id).to.equal(1);
        expect(proposal.amount).to.equal(tokens(100));
        expect(proposal.recipient).to.equal(recipient.address);
        expect(proposal.description).to.equal("");
      });

      it("Should emit a propose event", async () => {
        await expect(transaction)
          .to.emit(dao, "Propose")
          .withArgs(1, tokens(100), recipient.address, investor1.address);
      });
    });

    describe("Failure", () => {
      it("Should reject invalid amount", async () => {
        await expect(
          dao
            .connect(investor1)
            .createProposal(
              "Proposal 1",
              tokens(10000000),
              recipient.address,
              ""
            )
        ).to.be.reverted;
      });

      it("Should reject non-investors", async () => {
        await expect(
          dao
            .connect(user)
            .createProposal("Proposal 2", tokens(1000), recipient.address, "")
        ).to.be.reverted;
      });
    });
  });

  describe("Upvoting", () => {
    let transaction, result;

    beforeEach(async () => {
      transaction = await dao
        .connect(investor1)
        .createProposal("Proposal 1", tokens(100), recipient.address, "");
      result = await transaction.wait();
    });

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await dao.connect(investor1).upvote(1);
        result = await transaction.wait();
      });

      it("Should update upvote count", async () => {
        const proposal = await dao.proposals(1);
        expect(proposal.upvotes).to.equal(tokens(200000));
      });

      it("Should emit vote event", async () => {
        await expect(transaction)
          .to.emit(dao, "Vote")
          .withArgs(1, investor1.address);
      });
    });

    describe("Failure", () => {
      it("Should reject up voting", async () => {
        expect(await dao.connect(investor1).upvote(1)).to.be.reverted;
      });

      it("Should reject non-investors", async () => {
        await expect(dao.connect(user).upvote(1)).to.be.reverted;
      });
    });
  });

  describe("Downvoting", () => {
    let transaction, result;

    beforeEach(async () => {
      transaction = await dao
        .connect(investor1)
        .createProposal("Proposal 1", tokens(100), recipient.address, "");
      result = await transaction.wait();
    });

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await dao.connect(investor1).downvote(1);
        result = await transaction.wait();
      });

      it("Should update downvote count", async () => {
        const proposal = await dao.proposals(1);
        expect(proposal.downvotes).to.equal(tokens(200000));
      });

      it("Should emit vote event", async () => {
        await expect(transaction)
          .to.emit(dao, "Vote")
          .withArgs(1, investor1.address);
      });
    });

    describe("Failure", () => {
      it("Should reject double voting", async () => {
        expect(await dao.connect(investor1).downvote(1)).to.be.reverted;
      });

      it("Should reject non-investors", async () => {
        await expect(dao.connect(user).downvote(1)).to.be.reverted;
      });
    });
  });

  describe("Governance", () => {
    let transaction, result;

    describe("Success", () => {
      beforeEach(async () => {
        transaction = await dao
          .connect(investor1)
          .createProposal("Proposal 1", tokens(102), recipient.address, "");
        result = await transaction.wait();

        transaction = await dao.connect(investor1).upvote(1);
        result = await transaction.wait();

        transaction = await dao.connect(investor2).upvote(1);
        result = await transaction.wait();

        transaction = await dao.connect(investor3).upvote(1);
        result = await transaction.wait();

        transaction = await dao.connect(investor1).finalizeProposal(1);
        result = await transaction.wait();
      });

      it("Should update the proposal to finalized", async () => {
        const proposal = await dao.proposals(1);
        expect(proposal.finalized).to.equal(true);
      });

      it("Should transfer funds to recipient", async () => {
        expect(await customToken.balanceOf(recipient.address)).to.equal(
          tokens(102)
        );
      });

      it("Should emit a Finalize event", async () => {
        await expect(transaction).to.emit(dao, "Finalize").withArgs(1);
      });
    });

    describe("Failure", () => {
      beforeEach(async () => {
        transaction = await dao
          .connect(investor1)
          .createProposal("Proposal 1", tokens(1000000), recipient.address, "");
        result = await transaction.wait();

        transaction = await dao.connect(investor1).upvote(1);
        result = await transaction.wait();

        transaction = await dao.connect(investor2).upvote(1);
        result = await transaction.wait();
      });

      it("Should reject finalization from non-investor", async () => {
        transaction = await dao.connect(investor3).upvote(1);
        result = await transaction.wait();

        await expect(dao.connect(user).finalizeProposal(1)).to.be.reverted;
      });

      it("Should reject finalization if not enough votes", async () => {
        await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted;
      });

      it("Should reject proposal if already finalized", async () => {
        transaction = await dao.connect(investor3).upvote(1);
        result = await transaction.wait();

        transaction = await dao.connect(investor1).finalizeProposal(1);
        result = await transaction.wait();

        await expect(dao.connect(investor1).finalizeProposal(1)).to.be.reverted;
      });

      it("Should reject proposal if drained of funds", async () => {
        transaction = await dao.connect(investor3).upvote(1);
        result = await transaction.wait();

        transaction = await dao.connect(investor1).finalizeProposal(1);
        result = await transaction.wait();

        await expect(
          dao
            .connect(investor1)
            .createProposal("Proposal 1", tokens(1), recipient.address, "")
        ).to.be.reverted;
      });
    });
  });
});
