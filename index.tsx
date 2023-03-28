import React, { useEffect, useState } from "react";
import { helpers, Script, BI } from "@ckb-lumos/lumos";
import ReactDOM from "react-dom";
import { asyncSleep, CONFIG, ethereum, transfer, capacityOf } from "./lib";

import './index.css';

const app = document.getElementById("root");
ReactDOM.render(<App />, app);

export function App() {
  const [ethAddr, setEthAddr] = useState("");
  const [pwAddr, setPwAddr] = useState("");

  const [transferAddr] = useState(window.location.search.split("?")[1]);
  const [transferAmount] = useState(10000000000);

  const [isSendingTx, setIsSendingTx] = useState(false);
  const [isSended, setIsSended] = useState(false);

  const [content, setContent] = useState(<span>💖 Like</span>);
  const [log, setLog] = useState(<span className="log"></span>);

  useEffect(() => {
    asyncSleep(100).then(() => {
      if (ethereum.selectedAddress) connectToMetaMask();
      ethereum.addListener("accountsChanged", connectToMetaMask);
    });
  }, []);

  async function notEnoughBalance(pwAddr) {
    const balanceBI = await capacityOf(pwAddr);
    const balance = balanceBI.toNumber();
    if(balance <= 6100000000) {
      return true;
    }
    return false;
  }

  function connectToMetaMask() {
    ethereum
      .enable()
      .then(([ethAddr]: string[]) => {
        const pwLock: Script = {
          codeHash: CONFIG.SCRIPTS.PW_LOCK.CODE_HASH,
          hashType: CONFIG.SCRIPTS.PW_LOCK.HASH_TYPE,
          args: ethAddr,
        };

        const pwAddr = helpers.generateAddress(pwLock);

        setEthAddr(ethAddr);
        setPwAddr(pwAddr);

        return pwAddr;
      })
  }

  function jumpFaucet(){
    window.open("https://faucet.nervos.org/", "_blank");
  }

  async function onTransfer() {
    const isNotEnoughBalance = await notEnoughBalance(pwAddr);
    if (isNotEnoughBalance) {
      setLog(<div><span className="log"> &nbsp; Not enough CKB, <a href="#" onClick={jumpFaucet}>Get Free CKB</a> for your Account&nbsp;</span><br/><span className="log">&nbsp;<b>{pwAddr}</b>&nbsp;</span></div>);
      return;
    }

    if (isSendingTx) return;
    setIsSendingTx(true);

    transfer({ amount: transferAmount, from: pwAddr, to: transferAddr })
      .then((e) => { 
        setIsSended(true);
        const txUrl = "https://pudge.explorer.nervos.org/transaction/" + e;
        setContent(<span onClick={() => window.open(txUrl, "_blank")}> 🙏Thanks </span>);
      })
      .catch((e) => alert(e.message || JSON.stringify(e)))
      .finally(() => setIsSendingTx(false));
  }

  if (!ethereum) return (
    <div>
      <button>
        <span>!Metamask</span>
      </button>
    </div>);
  if (!ethAddr) return (
    <div>
      <div>
        <button onClick={connectToMetaMask}>
          <span> ⚡️Connect </span>
        </button>
      </div>
    </div>
    );

  return (
    <div>
      <div>
        <button onClick={onTransfer} disabled={ isSendingTx || isSended }>
          {content}
        </button>
        <br/>
        {log}
      </div>
    </div>
  );
}
