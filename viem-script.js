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
        // Check if we're on Sepolia network
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        const sepoliaChainId = '0xaa36a7'; // Sepolia chain ID in hex
        
        if (chainId !== sepoliaChainId) {
            // Request to switch to Sepolia
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: sepoliaChainId }],
            });
        }

        // Create a Viem wallet client
        walletClient = createWalletClient({
          chain: sepolia,
          transport: custom(window.ethereum),
        });
        
        const [address] = await walletClient.requestAddresses();
        console.log("Connected address:", address);
        
        // Update UI elements
        connectBtn.textContent = "✅ Connected";
        
        const walletAddressElement = document.getElementById("walletAddress");
        if (walletAddressElement) {
            walletAddressElement.textContent = `${address.substring(0, 6)}...${address.slice(-4)}`;
            walletAddressElement.classList.add("connected");
        }
        
        statusDiv.textContent = `Connected: ${address.substring(0, 6)}...${address.slice(-4)}`;
        
        // Check balance
        publicClient = createPublicClient({
            chain: sepolia,
            transport: custom(window.ethereum),
        });
        
        const balance = await publicClient.getBalance({ address });
        console.log("Balance:", balance, "wei");
        console.log("Balance in ETH:", Number(balance) / 1e18);
        
        // Check minimum funding requirement
        try {
            const minimumUSD = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: "mimimumDollarAmount",
            });
            
            // Since getPrice() is internal, we can't call it directly.
            // We'll estimate based on current market prices or use a conservative estimate.
            // $5 USD typically requires around 0.002-0.003 ETH (depending on ETH price)
            
            const minimumUSDAmount = Number(minimumUSD) / 1e18; // Convert to actual USD amount
            console.log("Minimum funding requirement:", minimumUSDAmount, "USD");
            
            // Conservative estimate: assume ETH is around $2500 (adjust as needed)
            // This ensures we suggest a reasonable amount
            const estimatedEthPrice = 2500; // USD per ETH
            const estimatedMinimumEth = minimumUSDAmount / estimatedEthPrice;
            
            console.log("Estimated minimum ETH needed (assuming $2500/ETH):", estimatedMinimumEth.toFixed(6));
            
            // Update the input placeholder with estimated minimum requirement
            if (ethAmountInput) {
                ethAmountInput.placeholder = estimatedMinimumEth.toFixed(6);
                ethAmountInput.setAttribute('min', estimatedMinimumEth.toString());
            }
        } catch (error) {
            console.error("Error fetching minimum amount:", error);
            // Fallback placeholder if we can't fetch the exact amount
            if (ethAmountInput) {
                ethAmountInput.placeholder = "0.002";
            }
        }
        
      } catch (err) {
        console.error("Connection error:", err);
        connectBtn.textContent = "❌ Connection failed";
        statusDiv.textContent = "Connection failed";
      }
    } else {
      connectBtn.textContent = "No Wallet Detected";
      statusDiv.textContent = "No wallet detected";
    }
}

async function BuyCoffee() {
    const ethAmount = ethAmountInput.value;
    if (!ethAmount || ethAmount <= 0) {
        alert("Please enter a valid ETH amount");
        return;
    }
    
    console.log(`Buying coffee for ${ethAmount} ETH`);
    
    if(typeof window.ethereum !== "undefined"){
        try {
            // First check if we're on Sepolia network
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const sepoliaChainId = '0xaa36a7'; // Sepolia chain ID in hex
            
            if (chainId !== sepoliaChainId) {
                // Request to switch to Sepolia
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: sepoliaChainId }],
                });
            }

            walletClient = createWalletClient({
                chain: sepolia,
                transport: custom(window.ethereum),
            });

            const [connectedAccount] = await walletClient.requestAddresses();

            publicClient = createPublicClient({
                chain: sepolia,
                transport: custom(window.ethereum),
            });

            // Check balance first
            const balance = await publicClient.getBalance({ address: connectedAccount });
            console.log("Account balance:", balance, "wei");
            
            // Check minimum funding requirement ($5 USD worth of ETH)
            const minimumUSD = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: "mimimumDollarAmount",
            });
            
            const minimumUSDAmount = Number(minimumUSD) / 1e18; // $5 USD
            const userEthAmount = Number(ethAmount);
            
            console.log("Minimum required:", minimumUSDAmount, "USD");
            console.log("User sending:", userEthAmount, "ETH");
            
            // We can't pre-validate the USD equivalent since getPrice() is internal,
            // so we'll let the contract do the validation.
            // If it fails, the error message will be clear.
            
            console.log("Attempting transaction - contract will validate USD equivalent...");
            
            // Simulate the contract call first
            const { request } = await publicClient.simulateContract({
                address: contractAddress,
                account: connectedAccount,
                abi: contractABI,
                functionName: "fund",
                value: parseEther(ethAmount),
            });

            // Execute the actual transaction
            const hash = await walletClient.writeContract(request);
            console.log("Transaction hash:", hash);
            
            // Wait for transaction confirmation
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log("Transaction confirmed:", receipt);
            
            statusDiv.textContent = `Coffee bought! Tx: ${hash.substring(0, 10)}...`;

        } catch (error) {
            console.error("Transaction failed:", error);
            statusDiv.textContent = `Transaction failed: ${error.message}`;
        }
    } else {
        alert("Please install MetaMask!");
    }
}


connectBtn.addEventListener("click", Connect);
buyBtn.addEventListener("click", BuyCoffee);