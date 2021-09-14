import './App.css';
import { ethers } from "ethers";
import * as React from 'react';
import abi from "./utils/CastSpellPortal.json";
import timeSince from './utils/appUtils';
import { library } from '@fortawesome/fontawesome-svg-core';
import { fab } from '@fortawesome/free-brands-svg-icons';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

library.add(fab, fas);

function App() {
  const [currAccount, setCurrAccount] = React.useState("");
  const [isSpellCasted, setIsSpellCasted] = React.useState(false);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [spellName, setSpellName] = React.useState("");
  const [allSpellsCast, setAllSpellsCast] = React.useState([]);
  const [isPrizeWon, setIsPrizeWon] = React.useState(false);
  const [spellMsg, setSpellMsg] = React.useState("");
  const [spellCount, setSpellCount] = React.useState(0);
  const [winnerCount, setWinnerCount] = React.useState(0);
  const [prizeAmount, setPrizeAmount] = React.useState(0);
  const contractAddress = "0xB23FF2c04D6503Ee3829f2e45bBeC5c0F3a38562";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = () => {
    const { ethereum } = window;

    if (!ethereum) {
      console.log("Connect your ethereum wallet!");
      return
    } else {
      console.log("Your magical ethereum object has been found", ethereum);
    }

    ethereum.request({ method: 'eth_accounts' })
      .then(accounts => {
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account: ", account);
          setCurrAccount(account);
          getAllSpellsCast();
        } else {
          console.log("No authorized account found!");
        }
      })
  }

  const connectWallet = () => {
    const { ethereum } = window;
    if (!ethereum) {
      alert("Please get an ethereum wallet!");
    }

    ethereum.request({ method: 'eth_requestAccounts' })
      .then(accounts => {
        console.log("Connected to: ", accounts[0]);
        setCurrAccount(accounts[0]);
      })
      .catch(err => console.log(err));
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
  }

  async function getAllSpellsCast() {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const spellPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

    let spellsCast = await spellPortalContract.getAllSpellsCast();
    console.log(spellsCast);
    let spellsCleaned = [];
    spellsCast.forEach(spellCast => {
      let timestamp = spellCast.timestamp.toNumber();
      spellsCleaned.push({
        address: spellCast.spellCaster,
        timestamp: timeSince(new Date(timestamp*1000)),
        message: spellCast.message
      })
    });
 
    setAllSpellsCast(spellsCleaned); // posts for each spell cast
    setSpellCount(spellsCleaned.length); // total number of spells cast so far

    spellPortalContract.on("NewSpellCast", (from, timestamp, message) => {
      console.log("New Spell Cast!", from, timestamp, message);
      setAllSpellsCast(oldArray => [...oldArray, {
        address: from,
        timestamp: timeSince(new Date(timestamp*1000)),
        message: message
      }])
    });

    spellPortalContract.on("PrizeWinner", (from, prizeAmount) => {
      console.log("Someone won a prize!", from, prizeAmount);
      setIsPrizeWon(true);
      setWinnerCount(prevCount => prevCount + 1);
      setPrizeAmount(prizeAmount)
    });
  }

  React.useEffect(() => {
    checkIfWalletIsConnected();
    //eslint-disable-next-line
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsFormVisible(!isFormVisible);
    console.log(spellMsg);
    spell();
  }

  const userMessage = () => {
    setIsFormVisible(true);
  }

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        🧙🏽 Magic Mage Portal ✨
        </div>
        {isSpellCasted && spellName && spellName !== ""? ( <div className="spell-cast">
          The spell you cast is... {spellName}!
        </div>):  <div className="spell-cast">
        I'm Nagma, let's test our magic today.
        <p>Connect your Ethereum wallet and cast a spell!</p>
        </div>
        }
        <div className="leaderboard-info">
          <p>The ancient gods have granted you luck - a 50% chance for you to win a prize.</p>
          <p>Spells casted so far: {spellCount}</p>
          <p>Winners: {winnerCount}</p>
        </div>

        <button className="spellButton" onClick={userMessage}>
        Cast a Spell
        </button>

        {isFormVisible ? (
          <form className="spell-form" onSubmit={handleSubmit}>
          <label>
            Oh, you want to cast your own spell? Be my guest! If not, I'll pick one for you.
            <input className="spell-textArea" type="text" placeholder="Hmmm..." value={spellMsg} onChange={ e => {
                if (e.target.value !== "") {
                  setSpellMsg(e.target.value);
                }
              }}/>
          </label>
          <input className="spell-submitBtn" type="submit" value="Submit"/>
        </form>
        ): null}

        {isPrizeWon ? (
          <div>Omg. You won some magic money valued at {prizeAmount}!</div>
        ): null}

        {currAccount ? null: (
          <button className="spellButton" onClick={connectWallet}>
          Connect Wallet
          </button>
        )}

        {allSpellsCast.map((spellCast, index) => {
          return (
            <div className="spell-posts">
              <div>Incantation: {spellCast.message}</div>
              <div>Wand wielder: {spellCast.address}</div>
              <div>{spellCast.timestamp.toString()}</div>
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
        </section>
        <section className="copyright-footer">
          <div className="copyright-footer-item">© 2021 Nagma Kapoor</div>
        </section>
      </footer>
    </div>
  );
}

export default App;
