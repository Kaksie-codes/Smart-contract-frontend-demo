// import { CreateWalletClient } from 'https://esm.sh/viem';
import { createClient, parseEther, createWalletClient, custom, createPublicClient } from 'https://esm.sh/viem';
import { mainnet, sepolia } from 'https://esm.sh/viem/chains';
import { contractAddress, contractABI } from './constants.js';

const connectBtn = document.getElementById("connectBtn");
const statusDiv = document.getElementById("status");
const buyBtn = document.getElementById("buyBtn");
const ethAmountInput = document.getElementById("ethAmount");
const ethPriceDisplay = document.getElementById("ethPrice");
const walletBalanceDisplay = document.getElementById("walletBalance");
const minDepositUSDDisplay = document.getElementById("minDepositUSD");
const minDepositETHDisplay = document.getElementById("minDepositETH");

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
        const balanceInEth = Number(balance) / 1e18;
        
        console.log("Balance:", balance, "wei");
        console.log("Balance in ETH:", balanceInEth);
        
        // Update balance display in UI
        if (walletBalanceDisplay) {
            walletBalanceDisplay.textContent = `${balanceInEth.toFixed(4)} ETH`;
            walletBalanceDisplay.classList.remove("loading");
        }
        
        // Check minimum funding requirement
        try {
            const minimumUSD = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: "mimimumDollarAmount",
            });
            
            // Get the real-time ETH price from your contract!
            const ethPriceWei = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: "getPrice",
            });
            
            const minimumUSDAmount = Number(minimumUSD) / 1e18; // $5 USD
            const ethPriceUSD = Number(ethPriceWei) / 1e18; // Current ETH price in USD
            const minimumEthRequired = minimumUSDAmount / ethPriceUSD; // Exact ETH needed for $5
            
            console.log("Minimum funding requirement:", minimumUSDAmount, "USD");
            console.log("Current ETH price:", ethPriceUSD.toFixed(2), "USD");
            console.log("Exact minimum ETH needed:", minimumEthRequired.toFixed(6), "ETH");
            
            // Update all UI displays
            if (ethPriceDisplay) {
                ethPriceDisplay.textContent = `$${ethPriceUSD.toFixed(2)}`;
                ethPriceDisplay.classList.remove("loading");
            }
            
            if (minDepositUSDDisplay) {
                minDepositUSDDisplay.textContent = `$${minimumUSDAmount.toFixed(2)}`;
                minDepositUSDDisplay.classList.remove("loading");
            }
            
            if (minDepositETHDisplay) {
                minDepositETHDisplay.textContent = `${minimumEthRequired.toFixed(6)} ETH`;
                minDepositETHDisplay.classList.remove("loading");
            }
            
            // Update the input placeholder with the exact minimum requirement
            if (ethAmountInput) {
                ethAmountInput.placeholder = minimumEthRequired.toFixed(6);
                ethAmountInput.setAttribute('min', minimumEthRequired.toString());
            }
        } catch (error) {
            console.error("Error fetching minimum amount:", error);
            // Fallback placeholder if we can't fetch the exact amount
            if (ethAmountInput) {
                ethAmountInput.placeholder = "0.002";
            }
            if (ethPriceDisplay) {
                ethPriceDisplay.textContent = "Unable to fetch price";
                ethPriceDisplay.classList.add("loading");
            }
            if (minDepositETHDisplay) {
                minDepositETHDisplay.textContent = "Unable to calculate";
                minDepositETHDisplay.classList.add("loading");
            }
        }
        
      } catch (err) {
        console.error("Connection error:", err);
        connectBtn.textContent = "❌ Connection failed";
        statusDiv.textContent = "Connection failed";
        
        // Reset displays on connection failure
        if (ethPriceDisplay) {
            ethPriceDisplay.textContent = "Connection failed";
            ethPriceDisplay.classList.add("loading");
        }
        if (walletBalanceDisplay) {
            walletBalanceDisplay.textContent = "Connect Wallet";
            walletBalanceDisplay.classList.add("loading");
        }
        if (minDepositETHDisplay) {
            minDepositETHDisplay.textContent = "Connect Wallet";
            minDepositETHDisplay.classList.add("loading");
        }
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
            
            // Get real-time ETH price for validation
            const ethPriceWei = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: "getPrice",
            });
            
            const minimumUSDAmount = Number(minimumUSD) / 1e18; // $5 USD
            const ethPriceUSD = Number(ethPriceWei) / 1e18; // Current ETH price
            const userEthAmount = Number(ethAmount);
            const userUSDAmount = userEthAmount * ethPriceUSD; // User's ETH in USD
            const minimumEthRequired = minimumUSDAmount / ethPriceUSD; // Exact ETH needed for $5
            
            console.log("Minimum required:", minimumUSDAmount, "USD");
            console.log("Current ETH price:", ethPriceUSD.toFixed(2), "USD");
            console.log("User sending:", userEthAmount, "ETH");
            console.log("User's USD equivalent:", userUSDAmount.toFixed(2), "USD");
            console.log("Minimum ETH needed:", minimumEthRequired.toFixed(6), "ETH");
            
            // Pre-validate before transaction
            if (userUSDAmount < minimumUSDAmount) {
                alert(`Insufficient amount! You need at least $${minimumUSDAmount} USD worth of ETH.\n\nYou're sending: $${userUSDAmount.toFixed(2)} USD\nMinimum required: ${minimumEthRequired.toFixed(6)} ETH`);
                return;
            }
            
            console.log("✅ Amount validation passed - proceeding with transaction...");
            
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