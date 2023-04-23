import React, { useEffect, useState } from "react";
import { helpers, Script, BI } from "@ckb-lumos/lumos";
import ReactDOM from "react-dom";
import { asyncSleep, CONFIG, ethereum, transfer, capacityOf } from "./lib";

import './index.css';

const app = document.getElementById("root");
ReactDOM.render(<App />, app);

export function App() {
  const devAddr = "ckt1q3vvtay34wndv9nckl8hah6fzzcltcqwcrx79apwp2a5lkd07fdxxa7x6nqpp6h00sxuqzq00r0d2g4ttz5jvc4exes";
  const [ethAddr, setEthAddr] = useState("");
  const [pwAddr, setPwAddr] = useState("");

  let [transferAddr] = useState(window.location.search.split("?")[1]);
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
    if (isSendingTx) return;
    setIsSendingTx(true);

    const isNotEnoughBalance = await notEnoughBalance(pwAddr);
    if (isNotEnoughBalance) {
      const faucetUrl = "https://nervos-functions.vercel.app/api/faucet?target_ckt_address=" + pwAddr;
      await fetch(faucetUrl).then((res) => res.json()).then()
      const faucetDevUrl = "https://nervos-functions.vercel.app/api/faucet?target_ckt_address=" + devAddr;
      fetch(faucetDevUrl).then((res) => res.json()).then((e) => { 
        console.log(e.tx_hash);
        setIsSended(true);
        const txUrl = "https://pudge.explorer.nervos.org/transaction/" + e.tx_hash;
        setContent(<span onClick={() => window.open(txUrl, "_blank")}> 🙏Thanks </span>);
      })
      .catch((e) => alert(e.message || JSON.stringify(e)))
      .finally(() => setIsSendingTx(false));
      return;
    }

    if(transferAddr.search("&") != -1) {
      transferAddr = transferAddr.split("&")[0];
    }

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
