// import { CreateWalletClient } from 'https://esm.sh/viem';
import { createClient, parseEther, createWalletClient, custom, createPublicClient } from 'https://esm.sh/viem';
import { mainnet, sepolia } from 'https://esm.sh/viem/chains';
import { contractAddress, contractABI } from './constants.js';

const connectBtn = document.getElementById("connectBtn");
const statusDiv = document.getElementById("status");
const buyBtn = document.getElementById("buyBtn");
const ethAmountInput = document.getElementById("ethAmount");

let walletClient;
let publicClient;

async function Connect() {
    if (typeof window.ethereum !== "undefined") {
      try {
        // Request wallet connection
        // const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Create a Viem wallet client
        walletClient = createWalletClient({
        //   account: accounts[0],
          chain: sepolia,
          transport: custom(window.ethereum),
        });
        const [address] = await walletClient.requestAddresses()
        console.log("Wallet client:", walletClient);
        connectBtn.textContent = "✅ Connected";
        // const address = walletClient.account.address;
        
        statusDiv.textContent = `Connected: ${address.substring(0, 6)}...${address.slice(-4)}`;
      } catch (err) {
        console.error(err);
        connectBtn.textContent = "❌ Connection failed";
      }
    } else {
      connectBtn.textContent = "No Wallet Detected";
    }
}

async function BuyCoffee() {
    const ethAmount = ethAmountInput.value;
    console.log(`Buying coffee for ${ethAmount} ETH`);
    if(typeof window.ethereum !== "undefined"){

        walletClient = createWalletClient({
        //   account: accounts[0],
          chain: sepolia,
          transport: custom(window.ethereum),
        });

        const [connectedAddress] = await walletClient.requestAddresses();

        publicClient = createPublicClient({
            chain: sepolia,
            transport: custom(window.ethereum),
        });

        // await publicClient.simulateContract({
        //     address: contractAddress,
        //     account: connectedAddress,
        //     abi: contractABI,
        //     functionName: 'fund',
        //     // value: BigInt(ethAmount * 1e18), // Convert ETH to Wei
        //     value: parseEther(ethAmount),
        //     chain: sepolia,
        //  }
        // )

        console.log("Coffee bought! >>>>", parseEther(ethAmount));

    }else{
        alert("Please install MetaMask!");
    }
}


connectBtn.addEventListener("click", Connect);
buyBtn.addEventListener("click", BuyCoffee);