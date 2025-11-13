// import { CreateWalletClient } from 'https://esm.sh/viem';
import { createClient, createWalletClient, custom } from 'https://esm.sh/viem';
import { mainnet } from 'https://esm.sh/viem/chains';

const connectBtn = document.getElementById("connectBtn");
const statusDiv = document.getElementById("status");

async function Connect() {
    if (typeof window.ethereum !== "undefined") {
      try {
        // Request wallet connection
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Create a Viem wallet client
        const walletClient = createWalletClient({
          account: accounts[0],
          chain: mainnet,
          transport: custom(window.ethereum),
        });

        console.log("Wallet client:", walletClient);
        connectBtn.textContent = "✅ Connected";
        const address = walletClient.account.address;
        statusDiv.textContent = `Connected: ${address.substring(0, 6)}...${address.slice(-4)}`;
      } catch (err) {
        console.error(err);
        connectBtn.textContent = "❌ Connection failed";
      }
    } else {
      connectBtn.textContent = "No Wallet Detected";
    }
  }


connectBtn.addEventListener("click", Connect);