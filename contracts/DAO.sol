// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.0;

import "hardhat/console.sol";
import "./Token.sol";
import "./CustomToken.sol";

contract DAO {
    address owner;
    Token public token;
    CustomToken public customToken;
    uint256 public quorum;

    struct Proposal {
        uint256 id;
        string name;
        uint256 amount;
        address payable recipient;
        uint256 upvotes;
        uint256 downvotes;
        bool finalized;
        string description;
    }

    uint256 public proposalCount;
    mapping(uint256 => Proposal) public proposals;
    mapping(address => mapping(uint256 => bool)) public upvotes;
    mapping(address => mapping(uint256 => bool)) public downvotes;

    event Propose(uint id, uint256 amount, address recipient, address creator);

    event Vote(uint256 id, address investor);
    event Finalize(uint256 id);

    constructor(Token _token, CustomToken _customToken, uint256 _quorum) {
        owner = msg.sender;
        token = _token;
        customToken = _customToken;
        quorum = _quorum;
    }

    receive() external payable {}

    modifier onlyInvestor() {
        require(token.balanceOf(msg.sender) > 0, "Must be token holder");
        _;
    }

    function createProposal(
        string memory _name,
        uint256 _amount,
        address payable _recipient,
        string memory _description
    ) external onlyInvestor {
        // require(address(this).balance >= _amount);
        require(
            customToken.balanceOf(address(this)) >= _amount,
            "Not enough tokens in treasury"
        );
        require(token.balanceOf(msg.sender) > 0, "Must be token holder");
        proposalCount++;

        proposals[proposalCount] = Proposal(
            proposalCount,
            _name,
            _amount,
            _recipient,
            0,
            0,
            false,
            _description
        );

        emit Propose(proposalCount, _amount, _recipient, msg.sender);
    }

    function upvote(uint256 _id) external onlyInvestor {
        Proposal storage proposal = proposals[_id];
        require(upvotes[msg.sender][_id] != true, "Avoid voting twice");
        require(downvotes[msg.sender][_id] != true, "Avoid voting twice");
        proposal.upvotes += token.balanceOf(msg.sender);
        upvotes[msg.sender][_id] = true;
        emit Vote(_id, msg.sender);
    }

    function downvote(uint256 _id) external onlyInvestor {
        Proposal storage proposal = proposals[_id];
        require(upvotes[msg.sender][_id] != true, "Avoid voting twice");
        require(downvotes[msg.sender][_id] != true, "Avoid voting twice");
        proposal.downvotes += token.balanceOf(msg.sender);
        downvotes[msg.sender][_id] = true;
        emit Vote(_id, msg.sender);
    }

    function finalizeProposal(uint256 _id) external onlyInvestor {
        // Fetch proposal
        Proposal storage proposal = proposals[_id];

        require(proposal.finalized == false, "proposal already finalized");
        // Mark as finalized
        proposal.finalized = true;
        // Check that proposal has enough upvotes
        require(
            proposal.upvotes >= quorum,
            "must reach quorum to finalize proposal"
        );
        // Transfer the funds
        // require(address(this).balance >= proposal.amount);
        // (bool sent, ) = proposal.recipient.call{value: proposal.amount}("");
        // require(sent);
        require(
            customToken.balanceOf(address(this)) >= proposal.amount,
            "Not enough tokens in treasury"
        );
        customToken.transfer(proposal.recipient, proposal.amount);

        // Emit the event
        emit Finalize(_id);
    }
}
