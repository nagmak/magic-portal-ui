import './App.css';

function App() {
  const castSpell = () => {

  }

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
        🧙 Welcome fellow Mages!
        </div>

        <div className="spell-cast">
        I am Nagma, let's test our magic today. Connect your Ethereum wallet and cast a spell!
        </div>

        <button className="spellButton" onClick={castSpell}>
        ✨Cast a Spell✨
        </button>
      </div>
    </div>
  );
}

export default App;
