import { Button, Table } from "react-bootstrap";
import { ethers } from "ethers";

const Proposals = ({
  account,
  provider,
  dao,
  proposals,
  quorum,
  balance,
  recipientBalances,
  displayVotes,
  setIsLoading,
}) => {
  const upvoteHandler = async (id) => {
    try {
      const signer = await provider.getSigner();
      const transaction = await dao.connect(signer).upvote(id);
      await transaction.wait();
    } catch {
      window.alert("User rejected or transaction reverted");
    }
    setIsLoading(true);
  };

  const downvoteHandler = async (id) => {
    try {
      const signer = await provider.getSigner();
      const transaction = await dao.connect(signer).downvote(id);
      await transaction.wait();
    } catch {
      window.alert("User rejected or transaction reverted");
    }
    setIsLoading(true);
  };

  const finalizeHandler = async (id) => {
    try {
      const signer = await provider.getSigner();
      const transaction = await dao.connect(signer).finalizeProposal(id);
      await transaction.wait();
    } catch {
      window.alert("User rejected or transaction reverted");
    }
    setIsLoading(true);
  };

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>#</th>
          <th>Proposal</th>
          <th>Recipient Address</th>
          <th>Recipient Balance</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Status</th>
          <th>Upvotes</th>
          <th>Downvotes</th>
          <th>Cast Vote</th>
          <th>Finalize</th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal, index) => (
          <tr key={index}>
            <td>{proposal.id.toString()}</td>
            <td>{proposal.name}</td>
            <td>{proposal.recipient}</td>
            <td>{recipientBalances[index]}</td>
            <td>{proposal.description}</td>
            <td>{ethers.utils.formatUnits(proposal.amount, "ether")} ETH</td>
            <td>{proposal.finalized ? "Approved" : "In Progress"}</td>
            <td>{proposal.upvotes.toString()}</td>
            <td>{proposal.downvotes.toString()}</td>

            <td>
              {!proposal.finalized && balance !== "0" && displayVotes[index] && (
                <Button
                  variant="primary"
                  style={{ width: "100%" }}
                  onClick={() => upvoteHandler(proposal.id)}
                >
                  Upvote
                </Button>
              )}
              {!proposal.finalized && balance !== "0" && displayVotes[index] && (
                <Button
                  variant="primary"
                  style={{ width: "100%" }}
                  onClick={() => downvoteHandler(proposal.id)}
                >
                  Downvote
                </Button>
              )}
            </td>
            <td>
              {!proposal.finalized &&
                balance !== "0" &&
                proposal.upvotes > quorum && (
                  <Button
                    variant="primary"
                    style={{ width: "100%" }}
                    onClick={() => finalizeHandler(proposal.id)}
                  >
                    Finalize
                  </Button>
                )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default Proposals;
