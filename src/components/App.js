import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { ethers } from "ethers";

// Components
import Navigation from "./Navigation";
import Create from "./Create";
import Proposals from "./Proposals";
import Loading from "./Loading";

// ABIs: Import your contract ABIs here
import DAO_ABI from "../abis/DAO.json";
import TOKEN_ABI from "../abis/Token.json";

// Config: Import your network config here
import config from "../config.json";

function App() {
  const [provider, setProvider] = useState(null);
  const [dao, setDao] = useState(null);
  const [token, setToken] = useState(null);
  const [treasuryBalance, setTreasuryBalance] = useState(0);

  const [account, setAccount] = useState(null);

  const [proposals, setProposals] = useState(null);

  const [quorum, setQuorum] = useState(null);
  const [displayVotes, setDisplayVotes] = useState(null);
  const [tokenBalance, setTokenBalance] = useState(null);
  const [recipientBalances, setRecipientBalances] = useState(null);

  const [isLoading, setIsLoading] = useState(true);

  const loadBlockchainData = async () => {
    // Initiate provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    setProvider(provider);

    // Initiate contracts
    const dao = new ethers.Contract(
      config[31337].dao.address,
      DAO_ABI,
      provider
    );
    setDao(dao);

    const token = new ethers.Contract(
      config[31337].token.address,
      TOKEN_ABI,
      provider
    );
    setToken(token);

    const customToken = new ethers.Contract(
      config[31337].customToken.address,
      TOKEN_ABI,
      provider
    );
    setToken(token);

    // Fetch treasury balance
    let treasuryBalance = await customToken.balanceOf(dao.address);
    treasuryBalance = ethers.utils.formatUnits(treasuryBalance, 18);
    setTreasuryBalance(treasuryBalance);

    // Fetch accounts
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);

    // Fetch proposals count
    const count = await dao.proposalCount();
    const items = [];
    const displayVotes = [];
    const recipientBalances = [];

    for (var i = 0; i < count; i++) {
      const proposal = await dao.proposals(i + 1);
      items.push(proposal);
      const upvote = await dao.upvotes(account, proposal.id);
      const downvote = await dao.downvotes(account, proposal.id);

      const recipientBalance = ethers.utils.formatUnits(
        (await customToken.balanceOf(proposal.recipient)).toString(),
        18
      );
      recipientBalances.push(recipientBalance + " CTK");

      !upvote && !downvote ? displayVotes.push(true) : displayVotes.push(false);
    }

    setRecipientBalances(recipientBalances);

    setProposals(items);

    setDisplayVotes(displayVotes);

    // Fetch quorum
    const quorum = await dao.quorum();
    setQuorum(quorum.toString());

    const tokenBalance = (await token.balanceOf(account)).toString();
    setTokenBalance(tokenBalance);

    setIsLoading(false);
  };

  useEffect(() => {
    if (isLoading) {
      loadBlockchainData();
    }
  }, [isLoading]);

  return (
    <Container>
      <Navigation account={account} />

      <h1 className="my-4 text-center">Welcome to our DAO!</h1>
      <h4 className="my-4 text-center">Quorum: {quorum}</h4>
      {isLoading ? (
        <Loading />
      ) : (
        <>
          <Create provider={provider} dao={dao} setIsLoading={setIsLoading} />

          <hr />

          <p className="text-center">
            <strong>Treasury Balance:</strong> {treasuryBalance} CTK
          </p>

          <hr />

          <Proposals
            account={account}
            provider={provider}
            dao={dao}
            proposals={proposals}
            quorum={quorum}
            balance={tokenBalance}
            recipientBalances={recipientBalances}
            displayVotes={displayVotes}
            setIsLoading={setIsLoading}
          />
        </>
      )}
    </Container>
  );
}

export default App;
