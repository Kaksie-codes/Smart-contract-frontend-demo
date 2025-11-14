/*
  MINIMAL DAPP JAVASCRIPT - BLOCKCHAIN INTERACTION LAYER
  
  This file handles all blockchain interactions for our DApp using the Viem library.
  
  WHAT IS VIEM?
  - Modern, lightweight TypeScript-first Ethereum library
  - Alternative to Ethers.js with better performance
  - Type-safe interactions with Ethereum blockchain
  - Modular design allows importing only what we need
  
  KEY LEARNING CONCEPTS:
  1. Web3 Provider (MetaMask) - Bridge between browser and blockchain
  2. Wallet Client - For sending transactions (requires user signatures)
  3. Public Client - For reading blockchain data (no signatures needed)
  4. Smart Contract ABI - Interface defining contract functions
  5. Network Management - Ensuring users are on correct blockchain
  6. Error Handling - Managing blockchain interaction failures
  7. UI Updates - Reflecting blockchain state in the interface
*/

// ==================================================================================
// IMPORTS - Modern ES6 module imports from CDN
// ==================================================================================

/*
  Why use ES6 imports instead of script tags?
  - Better dependency management
  - Automatic tree-shaking (only import what we use)
  - Modern JavaScript patterns
  - TypeScript benefits even in vanilla JS
*/

// Core Viem functions for blockchain interaction
import { 
    createClient,           // Generic client creation
    parseEther,            // Convert ETH strings to wei (blockchain format)
    createWalletClient,    // Client for sending transactions
    custom,                // Custom transport for MetaMask provider
    createPublicClient     // Client for reading blockchain data
} from 'https://esm.sh/viem';

// Blockchain network configurations
import { 
    mainnet,    // Ethereum mainnet configuration
    sepolia     // Sepolia testnet configuration (we use this)
} from 'https://esm.sh/viem/chains';

// Our smart contract details (address and interface)
import { contractAddress, contractABI } from './constants.js';

// ==================================================================================
// DOM ELEMENT REFERENCES - Connect JavaScript to HTML elements
// ==================================================================================

/*
  Why store DOM references?
  - Performance: Query DOM once, reuse references
  - Readability: Clear variable names vs repeated queries
  - Maintainability: Easy to update element IDs in one place
  
  These elements will be updated as users interact with the blockchain
*/

// Navigation and connection elements
const connectBtn = document.getElementById("connectBtn");              // Wallet connection button
const statusDiv = document.getElementById("status");                  // Status display area

// Transaction interface elements
const buyBtn = document.getElementById("buyBtn");                      // Main transaction button
const ethAmountInput = document.getElementById("ethAmount");           // ETH amount input field

// Information display elements (real-time blockchain data)
const ethPriceDisplay = document.getElementById("ethPrice");           // Current ETH price from oracle
const walletBalanceDisplay = document.getElementById("walletBalance"); // User's ETH balance
const minDepositUSDDisplay = document.getElementById("minDepositUSD"); // Minimum deposit in USD
const minDepositETHDisplay = document.getElementById("minDepositETH"); // Minimum deposit in ETH

// ==================================================================================
// BLOCKCHAIN CLIENT VARIABLES - Global state for blockchain connections
// ==================================================================================

/*
  Why global variables?
  - Clients need to persist across function calls
  - Expensive to recreate connections repeatedly
  - Shared state between different functions
  
  Best Practice: Initialize as undefined, create when needed
*/

let walletClient;    // For transactions that require user signature (sending ETH, calling contract functions)
let publicClient;    // For reading blockchain data (balances, prices, contract state)

// ==================================================================================
// WALLET CONNECTION FUNCTION - Core Web3 functionality
// ==================================================================================

/*
  This function handles the complete wallet connection flow:
  1. Check if MetaMask is installed
  2. Verify/switch to correct blockchain network
  3. Request user permission to connect
  4. Create blockchain clients
  5. Fetch and display user data
  6. Update UI to reflect connected state
*/
async function Connect() {
    /*
      STEP 1: Check for MetaMask availability
      
      window.ethereum is injected by MetaMask browser extension
      If undefined, user doesn't have MetaMask installed
    */
    if (typeof window.ethereum !== "undefined") {
        try {
            /*
              STEP 2: Network verification and switching
              
              Why check network?
              - Smart contracts exist on specific networks
              - Transactions on wrong network will fail
              - User experience: prevent confusion and failed transactions
              
              Sepolia Testnet:
              - Safe testing environment
              - Free test ETH available
              - Same functionality as mainnet
              - Chain ID: 11155111 (hex: 0xaa36a7)
            */
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const sepoliaChainId = '0xaa36a7'; // Sepolia testnet chain ID in hexadecimal
            
            // If user is on wrong network, request switch to Sepolia
            if (chainId !== sepoliaChainId) {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: sepoliaChainId }],
                });
            }

            /*
              STEP 3: Create Wallet Client
              
              Wallet Client is used for:
              - Sending transactions
              - Signing messages
              - Any operation requiring user approval
              
              Configuration:
              - chain: Specifies Sepolia network
              - transport: Uses MetaMask as the connection method
            */
            walletClient = createWalletClient({
                chain: sepolia,                    // Network configuration
                transport: custom(window.ethereum), // Use MetaMask as provider
            });
            
            /*
              STEP 4: Request wallet addresses
              
              This triggers MetaMask popup asking user permission to connect
              Returns array of addresses (we use the first one)
            */
            const [address] = await walletClient.requestAddresses();
            console.log("Connected address:", address);
            
            /*
              STEP 5: Update UI for successful connection
              
              Visual feedback is crucial for user experience
              Users need to clearly see their connection status
            */
            connectBtn.textContent = "✅ Connected";
            
            // Update wallet address in navbar (if element exists)
            const walletAddressElement = document.getElementById("walletAddress");
            if (walletAddressElement) {
                // Show shortened address format (first 6 + last 4 characters)
                walletAddressElement.textContent = `${address.substring(0, 6)}...${address.slice(-4)}`;
                walletAddressElement.classList.add("connected");
            }
            
            statusDiv.textContent = `Connected: ${address.substring(0, 6)}...${address.slice(-4)}`;
            
            /*
              STEP 6: Create Public Client for reading blockchain data
              
              Public Client is used for:
              - Reading balances
              - Calling view functions on contracts
              - Getting transaction receipts
              - No user signature required
              
              Same configuration as wallet client since we're reading from same network
            */
            publicClient = createPublicClient({
                chain: sepolia,                    // Same network as wallet client
                transport: custom(window.ethereum), // Same provider as wallet client
            });
            
            /*
              STEP 7: Fetch user's ETH balance
              
              Balance is returned in wei (smallest ETH unit)
              1 ETH = 1,000,000,000,000,000,000 wei (10^18)
              
              We convert to ETH for human-readable display
            */
            const balance = await publicClient.getBalance({ address });
            const balanceInEth = Number(balance) / 1e18;  // Convert wei to ETH
            
            console.log("Balance:", balance, "wei");       // Raw balance in wei
            console.log("Balance in ETH:", balanceInEth);   // Human-readable balance
            
            // Update balance display in UI with 4 decimal places
            if (walletBalanceDisplay) {
                walletBalanceDisplay.textContent = `${balanceInEth.toFixed(4)} ETH`;
                walletBalanceDisplay.classList.remove("loading");
            }
            
            /*
              STEP 8: Fetch smart contract data
              
              Now that we have a public client, we can read data from our smart contract:
              1. Minimum funding requirement in USD
              2. Current ETH price from Chainlink oracle
              3. Calculate minimum ETH needed
              4. Update all UI displays with live data
            */
            try {
                /*
                  Read minimum funding requirement from contract
                  
                  This calls the contract's `mimimumDollarAmount` function
                  Returns value in 18-decimal format (like wei)
                  $5 USD is stored as 5 * 10^18 in the contract
                */
                const minimumUSD = await publicClient.readContract({
                    address: contractAddress,           // Our deployed contract address
                    abi: contractABI,                  // Contract interface definition
                    functionName: "mimimumDollarAmount", // Function to call
                });
                
                /*
                  Get real-time ETH price from Chainlink oracle
                  
                  Our contract has a getPrice() function that:
                  1. Calls Chainlink ETH/USD price feed
                  2. Returns current market price
                  3. Price is in 18-decimal format for precision
                  
                  This is LIVE market data, not hardcoded!
                */
                const ethPriceWei = await publicClient.readContract({
                    address: contractAddress,           // Same contract
                    abi: contractABI,                  // Same ABI
                    functionName: "getPrice",          // Chainlink price function
                });
                
                /*
                  Calculate human-readable values and minimum ETH required
                  
                  Mathematical conversions:
                  - minimumUSD: $5 * 10^18 → $5.00
                  - ethPriceWei: Price * 10^18 → Price in USD
                  - minimumEthRequired: $5 ÷ ETH_Price = ETH needed for $5
                */
                const minimumUSDAmount = Number(minimumUSD) / 1e18;        // Convert to dollars
                const ethPriceUSD = Number(ethPriceWei) / 1e18;           // Convert to USD
                const minimumEthRequired = minimumUSDAmount / ethPriceUSD;  // Calculate ETH needed
                
                // Log values for educational purposes
                console.log("Minimum funding requirement:", minimumUSDAmount, "USD");
                console.log("Current ETH price:", ethPriceUSD.toFixed(2), "USD");
                console.log("Exact minimum ETH needed:", minimumEthRequired.toFixed(6), "ETH");
                
                /*
                  Update UI displays with live blockchain data
                  
                  This demonstrates how DApps provide real-time information
                  All data comes directly from blockchain/oracles
                */
                
                // Update ETH price display
                if (ethPriceDisplay) {
                    ethPriceDisplay.textContent = `$${ethPriceUSD.toFixed(2)}`;
                    ethPriceDisplay.classList.remove("loading");
                }
                
                // Update minimum USD display (should always be $5.00)
                if (minDepositUSDDisplay) {
                    minDepositUSDDisplay.textContent = `$${minimumUSDAmount.toFixed(2)}`;
                    minDepositUSDDisplay.classList.remove("loading");
                }
                
                // Update minimum ETH display (changes with ETH price)
                if (minDepositETHDisplay) {
                    minDepositETHDisplay.textContent = `${minimumEthRequired.toFixed(6)} ETH`;
                    minDepositETHDisplay.classList.remove("loading");
                }
                
                /*
                  Update input field with calculated minimum
                  
                  UX Enhancement:
                  - Placeholder shows exact amount needed
                  - Prevents user guessing
                  - Reduces failed transactions
                */
                if (ethAmountInput) {
                    ethAmountInput.placeholder = minimumEthRequired.toFixed(6);
                    ethAmountInput.setAttribute('min', minimumEthRequired.toString());
                }
                
            } catch (error) {
                /*
                  Handle errors in contract data fetching
                  
                  Possible errors:
                  - Contract not deployed
                  - Network issues
                  - ABI mismatch
                  - Function doesn't exist
                */
                console.error("Error fetching smart contract data:", error);
                
                // Provide fallback values to keep UI functional
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
            /*
              Handle wallet connection errors
              
              Common errors:
              - User rejects connection
              - Network switching fails
              - MetaMask locked
              - Invalid network
            */
            console.error("Wallet connection error:", err);
            connectBtn.textContent = "❌ Connection failed";
            statusDiv.textContent = "Connection failed";
            
            // Reset all displays on connection failure
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
        /*
          Handle case where MetaMask is not installed
          
          Educational moment: Inform user about Web3 wallet requirement
        */
        connectBtn.textContent = "No Wallet Detected";
        statusDiv.textContent = "Please install MetaMask to use this DApp";
        
        // Optional: Provide link to MetaMask installation
        console.log("MetaMask not detected. Please install MetaMask browser extension.");
    }
}
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
            /*
              Handle errors in contract data fetching
              
              Possible errors:
              - Contract not deployed
              - Network issues
              - ABI mismatch
              - Function doesn't exist
            */
            console.error("Error fetching smart contract data:", error);
            
            // Provide fallback values to keep UI functional
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
        /*
          Handle wallet connection errors
          
          Common errors:
          - User rejects connection
          - Network switching fails
          - MetaMask locked
          - Invalid network
        */
        console.error("Wallet connection error:", err);
        connectBtn.textContent = "❌ Connection failed";
        statusDiv.textContent = "Connection failed";
        
        // Reset all displays on connection failure
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
        /*
          Handle case where MetaMask is not installed
          
          Educational moment: Inform user about Web3 wallet requirement
        */
        connectBtn.textContent = "No Wallet Detected";
        statusDiv.textContent = "Please install MetaMask to use this DApp";
        
        // Optional: Provide link to MetaMask installation
        console.log("MetaMask not detected. Please install MetaMask browser extension.");
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