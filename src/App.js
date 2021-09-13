import './App.css';
import { ethers } from "ethers";
import * as React from 'react';
import abi from "./utils/CastSpellPortal.json";

function App() {
  const [currAccount, setCurrAccount] = React.useState("");
  const [isSpellCasted, setIsSpellCasted] = React.useState(false);
  const [isFormVisible, setIsFormVisible] = React.useState(false);
  const [spellName, setSpellName] = React.useState("");
  const [allSpellsCast, setAllSpellsCast] = React.useState([]);
  const [spellMsg, setSpellMsg] = React.useState("");
  const contractAddress = "0x2605dbFf4F9ebA870009B356D34fd836eEd88697";
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

    let spellsCleaned = [];
    spellsCast.forEach(spellCast => {
      let timestamp = spellCast.timestamp.toNumber();
      spellsCleaned.push({
        address: spellCast.spellCaster,
        timestamp: new Date(timestamp*1000),
        message: spellCast.message
      })
    });
 
    setAllSpellsCast(spellsCleaned);
    spellPortalContract.on("NewSpellCast", (from, timestamp, message) => {
      console.log("New Spell Cast!", from, timestamp, message);
      setAllSpellsCast(oldArray => [...oldArray, {
        address: from,
        timestamp: new Date(timestamp*1000),
        message: message
      }])
    });
  }

  React.useEffect(() => {
    checkIfWalletIsConnected();
  });

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
        🧙 Welcome fellow Mages!
        </div>

        {isSpellCasted && spellName && spellName !== ""? ( <div className="spell-cast">
          The spell you cast is... {spellName}!
        </div>):  <div className="spell-cast">
        I am Nagma, let's test our magic today. Connect your Ethereum wallet and cast a spell!
        </div>
        }

        <button className="spellButton" onClick={userMessage}>
        ✨Cast a Spell✨
        </button>

        {isFormVisible ? (
          <form onSubmit={handleSubmit} style={{marginTop: "16px", padding: "8px"}}>
          <label style={{ color: "gray"}}>
            Oh, do you have something to say? The spell is about to be cast!
            <input type="text" placeholder="Hmmm..." value={spellMsg} onChange={ e => setSpellMsg(e.target.value)} style={{marginTop: "16px", padding: "8px", border: 0, borderRadius: "5px", minWidth: "300px"}}/>
          </label>
          <input type="submit" value="Submit" style={{marginTop: "16px", marginLeft: "8px", padding: "8px", border: 0, borderRadius: "5px", cursor: "pointer"}}/>
        </form>
        ): null}

        {currAccount ? null: (
          <button className="spellButton" onClick={connectWallet}>
          Connect Wallet
          </button>
        )}

        {allSpellsCast.map((spellCast, index) => {
          return (
            <div style={{backgroundColor: "OldLace", marginTop: "16px", padding: "8px"}}>
              <div>Address: {spellCast.address}</div>
              <div>Time: {spellCast.timestamp.toString()}</div>
              <div>Message: {spellCast.message}</div>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default App;
