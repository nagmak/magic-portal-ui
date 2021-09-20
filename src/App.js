import './App.css';
import { ethers } from "ethers";
import Web3 from 'web3';
import * as React from 'react';
import abi from "./utils/CastSpellPortal.json";
import timeSince, { truncateMiddle, truncateAmount } from './utils/appUtils';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { CircularProgress } from "@chakra-ui/react"
import WalletConnectProvider from "@walletconnect/web3-provider";
import WalletsModal from './WalletsModal/WalletsModal';
import { useDisclosure } from "@chakra-ui/react"

library.add(fab, fas);

function App() {
  const [currAccount, setCurrAccount] = React.useState("");
  const [currBalance, setCurrBalance] = React.useState(0);
  const [isSpellCasted, setIsSpellCasted] = React.useState(false);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [spellName, setSpellName] = React.useState("");
  const [allSpellsCast, setAllSpellsCast] = React.useState([]);
  const [isPrizeWon, setIsPrizeWon] = React.useState(false);
  const [spellMsg, setSpellMsg] = React.useState("");
  const [spellCount, setSpellCount] = React.useState(0);
  const [winnerCount, setWinnerCount] = React.useState(0);
  const [prizeAmount, setPrizeAmount] = React.useState(0);
  const [walletMessage, setWalletMessage] = React.useState("Connect your Ethereum wallet and cast a spell!");
  const contractAddress = "0x1D79975F067C805D74E497bAC5251c08d60dB407";
  const contractABI = abi.abi;
  const { isOpen, onOpen, onClose } = useDisclosure();
  
    //  Create WalletConnect Provider
  const provider = new WalletConnectProvider({
      rpc: {
        1: "https://eth-rinkeby.alchemyapi.io/v2/vEWURu0OwIpyaF2-v6ANM9mmJ21JBRZX",
      },
      qrcodeModalOptions: {
        mobileLinks: [
          "rainbow",
          "metamask",
          "argent",
          "trust",
          "imtoken",
          "pillar",
        ],
      },
    });

  const checkIfWalletIsConnected = () => {
    const { ethereum } = window;
    const web3 = new Web3(provider);

    if (!ethereum) {
      console.log("Connect your ethereum wallet!");
      return
    } else {
      console.log("Your magical ethereum object has been found", ethereum);
      setWalletMessage("Your wallet is connected. You may now cast a spell!");
    }

    ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account: ", account);
          setCurrAccount(account);
          getAllSpellsCast();
          setIsFormVisible(true);
          if (account) {
            web3.eth.getBalance(account).then(e => setCurrBalance(e/10**18));
          }
        } else {
          setIsFormVisible(false);
          console.log("No authorized account found!");
        }
      })
  }

  const connectWallet = () => {
    const { ethereum } = window;
    const web3 = new Web3(provider);

    if (!ethereum) {
      alert("Please get an ethereum wallet!");
    }
    setIsSubmitted(true);
      ethereum.request({ method: 'eth_requestAccounts' })
        .then(accounts => {
          console.log("Connected to: ", accounts[0]);
          setCurrAccount(accounts[0]);
          if (accounts[0]) {
            web3.eth.getBalance(accounts[0]).then(e => setCurrBalance(e/10**18));
          }
          setIsSubmitted(false);
          setIsFormVisible(true);
        })
        .catch(err => console.log(err));
}
  const handleMetamask = () => {
    connectWallet();
  }

  const handleWalletConnect = async() => {
      //  Enable session (triggers QR Code modal)
      await provider.enable().catch(err => console.log(err));
  }

  const spell = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const spellPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

    let count = await spellPortalContract.getTotalSpells();
    console.log("All the spells are counted...", count.toNumber());

    const spellTxn = await spellPortalContract.getSpell(signer.getAddress(), spellMsg, {gasLimit: 300000});

    console.log("Mining...", spellTxn.hash);
    await spellTxn.wait();
    console.log("Mined -- ", spellTxn.hash);
    console.log(spellTxn);
    count = await spellPortalContract.getTotalSpells();
    console.log("All the spells are counted...", count.toNumber());
    setIsSpellCasted(true);

    const spellName = await spellPortalContract.getSpellName();
    setSpellName(spellName);
    setIsSubmitted(false);
  }

  async function getAllSpellsCast() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const spellPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

    let spellsCast = await spellPortalContract.getAllSpellsCast();
    let winnerCount = await spellPortalContract.getWinnerCount();

    console.log(spellsCast);
    let spellsCleaned = [];
    if (spellsCast) {
      spellsCast.forEach(spellCast => {
        let timestamp = spellCast.timestamp.toNumber();
        spellsCleaned.push({
          address: spellCast.spellCaster,
          timestamp: timeSince(new Date(timestamp*1000)),
          message: spellCast.message,
          isWinner: spellCast.isWinner,
        })
      });

    setWinnerCount(winnerCount.toNumber());
    setAllSpellsCast(spellsCleaned); // posts for each spell cast
    setSpellCount(spellsCleaned.length); // total number of spells cast so far

    spellPortalContract.on("NewSpellCast", (from, timestamp, message, isWinner) => {
      console.log("New Spell Cast!", from, timestamp, message, isWinner);
      setAllSpellsCast(oldArray => [...oldArray, {
        address: from,
        timestamp: timeSince(new Date(timestamp*1000)),
        message: message,
        isWinner: isWinner,
      }])
    });

    spellPortalContract.on("PrizeWinner", (from, prizeAmount) => {
      console.log("Someone won a prize!", from, prizeAmount);
      setIsPrizeWon(true);
      setWinnerCount(prevCount => prevCount + 1);
      setPrizeAmount(prizeAmount.toNumber()/(10**18));
    });
  }
  }

  React.useEffect(() => {
    checkIfWalletIsConnected();
    //eslint-disable-next-line
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log(spellMsg);
    setIsSubmitted(true);
    spell();
    setSpellMsg("");
  }

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">{
          currAccount ? 
          <div className="wallet-info">
            <div className="wallet-name">{truncateMiddle(currAccount)}</div>
            <div className="wallet-amount">{truncateAmount(currBalance)} eth</div>
          </div> : null}

        <img src="littlewitch.svg" alt="Little Witch" style={{width: "138px"}}></img>
        <div className="leaderboard">
          <div className="leaderboard-text">
            <p className="spells-cast-text">Spells cast</p>
            <p className="winners-text">Winners</p>
          </div>
          <div className="leaderboard-num">
            <p className="spells-cast-num">{spellCount}</p>
            <p className="winners-num">{winnerCount}</p>
          </div>
        </div>
        
        {currAccount ? null: (
          <div>
          <button className="spellButton" onClick={onOpen}>
          Connect Wallet {isSubmitted ? <CircularProgress size="22px" thickness="4px" isIndeterminate color="#3C2E26" /> : null}
          </button>
           <WalletsModal isOpen={isOpen} onClose={onClose} selectMetamask={handleMetamask} selectWalletConnect={handleWalletConnect}/>
           </div>
        )}
        <h2 className="header-name">Spread a little magic</h2>
        </div>
        {isSpellCasted && spellName && spellName !== ""? ( <div className="spell-cast">
          The spell you cast is... {spellName}!
        </div>):  <div className="spell-cast">
        I'm Nagma, let's test our magic today.
        <p>{walletMessage}</p>
        </div>
        }
        <div className="leaderboard-info">
          <p>You're quite a lucky one - a 50% chance for you to win a prize.</p>
        </div>
      
        {isFormVisible ? (
          <form className="spell-form" onSubmit={handleSubmit}>
            <div className="spell-form-msg">Oh, you want to cast your own spell? Be my guest! If not, I'll pick one for you.</div>
            <input className="spell-textArea" maxLength="280" type="text" placeholder="Hmmm..." value={spellMsg} onChange={ e => {
                if (e.target.value !== "") {
                  setSpellMsg(e.target.value);
                }
              }}/>
          <button className="spell-submitBtn" type="submit">Cast a spell {isSubmitted ? <CircularProgress size="22px" thickness="4px" isIndeterminate color="#3C2E26" /> : null}</button>
        </form>
        ): null}

        {isPrizeWon ? (
          <div className="winner-msg">Omg. You won some magic money valued at {prizeAmount} ETH!</div>
        ): null}

        {allSpellsCast.map((spellCast, index) => {
          return (
            <div className="spell-posts">
               <div className="posts-left">
               {spellCast.isWinner ? <img src="winner-hat.svg" alt="Winner hat" style={{width: "58px", marginTop: "8px"}}></img> : <img src="user-hat.svg" alt="User hat" style={{width: "58px", marginTop: "8px"}}></img>}
                {spellCast.isWinner ? (<div className="is-winner">won!</div>) : null}
               </div>
              <div className="incantation">{spellCast.message}</div>
              <div className="posts-right">
                <div className="wand-wielder">{truncateMiddle(spellCast.address)}</div>
                <div className="time-ago">{spellCast.timestamp.toString()}</div>
              </div>
            </div>
          )
        })}
      </div>
      <footer className="bottom-footer">
        <section className="contact">
        <a className="font-brand" href="https://www.instagram.com/notnagma/">
            <FontAwesomeIcon size="2x" icon={['fab', 'instagram']} />
          </a>
          <a className="font-brand" href="https://twitter.com/notnagma">
            <FontAwesomeIcon size="2x" icon={['fab', 'twitter']} />
          </a>
          <a className="font-brand" href="https://www.linkedin.com/in/nagmakapoor/">
            <FontAwesomeIcon size="2x" icon={['fab', 'linkedin']} />
          </a>
          <a className="font-brand" href="mailto:nagmakapoor@gmail.com">
            <FontAwesomeIcon size="2x" icon={['fas', 'envelope']} />
          </a>
          <a className="font-brand" href="https://github.com/nagmak/magic-portal-eth">
            <FontAwesomeIcon size="2x" icon={['fab', 'github']} />
          </a>
        </section>
        <section className="copyright-footer">
          <div className="copyright-footer-item">© 2021 Nagma Kapoor</div>
        </section>
      </footer>
    </div>
  );
}

export default App;
