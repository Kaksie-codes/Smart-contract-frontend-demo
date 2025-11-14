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
const contractBalanceDisplay = document.getElementById("contractBalance"); // Contract's total ETH balance

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
            
            // Save connection state for persistence
            isConnected = true;
            connectedAddress = address;
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('walletAddress', address);
            
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
                  
                  This calls the contract's mimimumDollarAmount function
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
                
                /*
                  Fetch contract balance
                  
                  Show total funds collected in the contract
                  Useful information for users and owner
                */
                await getContractBalance();
                
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
            
            // Clear connection state on failure
            isConnected = false;
            connectedAddress = null;
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletAddress');
            
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

// ==================================================================================
// CONTRACT BALANCE FUNCTION - Get total funds in the contract
// ==================================================================================

/*
  Get Contract Balance Function:
  - Fetches the total ETH balance stored in the smart contract
  - Shows how much has been collected from all users
  - Useful for contract owner to see available funds
  - Updates the UI with real-time balance information
*/
async function getContractBalance() {
  console.log('getting balance');
    /*
      Check if we have a public client available
      
      We need a client to read blockchain data
      If no client exists, user probably isn't connected
    */
    if (!publicClient) {
        console.log('No public client available for balance check');
        if (contractBalanceDisplay) {
            contractBalanceDisplay.textContent = 'Connect Wallet';
            contractBalanceDisplay.classList.add('loading');
        }
        return;
    }
    
    try {
        /*
          Fetch contract balance using getBalance
          
          This gets the total ETH stored at the contract address
          Same function used for wallet balances, but with contract address
          Balance is returned in wei (smallest ETH unit)
        */
        console.log('Fetching contract balance...');
        
        const contractBalanceWei = await publicClient.getBalance({ 
            address: contractAddress 
        });
        
        /*
          Convert wei to ETH for human-readable display
          
          1 ETH = 1,000,000,000,000,000,000 wei (10^18)
          Division converts wei to ETH with decimal precision
        */
        const contractBalanceEth = Number(contractBalanceWei) / 1e18;
        
        console.log('Contract balance:', contractBalanceWei, 'wei');
        console.log('Contract balance in ETH:', contractBalanceEth);
        
        /*
          Update UI display with formatted balance
          
          Shows balance with appropriate decimal places
          Removes loading state when data is available
        */
        if (contractBalanceDisplay) {
            // Format balance with 6 decimal places for precision
            contractBalanceDisplay.textContent = `${contractBalanceEth.toFixed(6)} ETH`;
            contractBalanceDisplay.classList.remove('loading');
            
            /*
              Add visual indicator based on balance amount
              
              Different styling based on how much ETH is in contract:
              - Empty: Gray text
              - Small amount: Yellow text  
              - Significant amount: Green text
            */
            contractBalanceDisplay.classList.remove('empty', 'low', 'funded');
            
            if (contractBalanceEth === 0) {
                contractBalanceDisplay.classList.add('empty');
            } else if (contractBalanceEth < 0.01) {
                contractBalanceDisplay.classList.add('low');
            } else {
                contractBalanceDisplay.classList.add('funded');
            }
        }
        
        /*
          Return balance for use by other functions
          
          Other parts of the app might need the balance value
          Return both wei and ETH formats
        */
        return {
            wei: contractBalanceWei,
            eth: contractBalanceEth
        };
        
    } catch (error) {
        /*
          Handle errors in balance fetching
          
          Possible errors:
          - Network connectivity issues
          - Contract doesn't exist at address
          - RPC provider problems
          - Invalid contract address
        */
        console.error('Error fetching contract balance:', error);
        
        if (contractBalanceDisplay) {
            contractBalanceDisplay.textContent = 'Error loading balance';
            contractBalanceDisplay.classList.add('loading');
        }
        
        return null;
    }
}

/*
  Check if user is contract owner
  
  This function determines if the connected wallet
  is the contract owner (who deployed it)
*/
async function checkIfOwner() {
    if (!publicClient || !connectedAddress) {
        return false;
    }
    
    try {
        /*
          Get contract owner address
          
          Calls the owner() view function on the contract
          Returns the address of whoever deployed the contract
        */
        const ownerAddress = await publicClient.readContract({
            address: contractAddress,
            abi: contractABI,
            functionName: "owner",
        });
        
        /*
          Compare addresses (case-insensitive)
          
          Ethereum addresses can be in different cases
          Convert both to lowercase for accurate comparison
        */
        const isOwner = ownerAddress.toLowerCase() === connectedAddress.toLowerCase();
        
        console.log('Contract owner:', ownerAddress);
        console.log('Connected address:', connectedAddress);
        console.log('Is owner:', isOwner);
        
        return isOwner;
        
    } catch (error) {
        console.error('Error checking owner status:', error);
        return false;
    }
}

// ==================================================================================
// WITHDRAW FUNCTION - Owner-only fund extraction
// ==================================================================================

/*
  Withdraw Function:
  - Allows contract owner to withdraw all funds
  - Security: Only owner can call this function
  - Transfers entire contract balance to owner's wallet
  - Updates UI after successful withdrawal
*/
async function withdrawFunds() {
    /*
      Verify user is connected
      
      Can't withdraw without wallet connection
    */
    if (!walletClient || !connectedAddress) {
        alert('Please connect your wallet first');
        return;
    }
    
    try {
        /*
          Check if user is contract owner
          
          Only owner should be able to withdraw
          Prevents unauthorized fund access
        */
        const isOwner = await checkIfOwner();
        
        if (!isOwner) {
            alert('Only the contract owner can withdraw funds');
            return;
        }
        
        /*
          Get current contract balance
          
          Show user how much they're withdrawing
          Don't attempt withdrawal if balance is zero
        */
        const balanceInfo = await getContractBalance();
        
        if (!balanceInfo || balanceInfo.eth === 0) {
            alert('No funds available to withdraw');
            return;
        }
        
        /*
          Confirm withdrawal with user
          
          Show exact amount being withdrawn
          Give user chance to cancel
        */
        const confirmWithdraw = confirm(
            `Withdraw ${balanceInfo.eth.toFixed(6)} ETH from the contract?\n\n` +
            `This will transfer all funds to your wallet: ${connectedAddress.substring(0, 6)}...${connectedAddress.slice(-4)}`
        );
        
        if (!confirmWithdraw) {
            console.log('Withdrawal cancelled by user');
            return;
        }
        
        console.log('Initiating withdrawal...');
        
        /*
          Simulate withdrawal transaction
          
          Test the transaction before sending
          Catches errors before spending gas
        */
        const { request } = await publicClient.simulateContract({
            address: contractAddress,
            account: connectedAddress,
            abi: contractABI,
            functionName: "withdraw",
        });
        
        /*
          Execute withdrawal transaction
          
          Calls the contract's withdraw function
          User will see MetaMask popup to confirm
        */
        statusDiv.textContent = 'Withdrawal pending...';
        
        const hash = await walletClient.writeContract(request);
        console.log('Withdrawal transaction hash:', hash);
        
        /*
          Wait for transaction confirmation
          
          Blockchain transactions take time to process
          Wait for network confirmation before updating UI
        */
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        console.log('Withdrawal confirmed:', receipt);
        
        /*
          Update UI after successful withdrawal
          
          Refresh all relevant displays:
          - Contract balance (should be 0)
          - User's wallet balance (should increase)
          - Status message
        */
        statusDiv.textContent = `Withdrawal successful! Tx: ${hash.substring(0, 10)}...`;
        
        // Refresh contract balance (should now be 0)
        await getContractBalance();
        
        // Refresh user's wallet balance
        if (publicClient && connectedAddress) {
            const balance = await publicClient.getBalance({ address: connectedAddress });
            const balanceInEth = Number(balance) / 1e18;
            
            if (walletBalanceDisplay) {
                walletBalanceDisplay.textContent = `${balanceInEth.toFixed(4)} ETH`;
            }
        }
        
        console.log('✅ Withdrawal completed successfully');
        
    } catch (error) {
        /*
          Handle withdrawal errors
          
          Common errors:
          - User rejects transaction
          - Insufficient gas
          - Contract security restrictions
          - Network congestion
        */
        console.error('Withdrawal failed:', error);
        
        // Parse error for user-friendly message
        let errorMessage = 'Withdrawal failed';
        
        if (error.message.includes('user rejected')) {
            errorMessage = 'Withdrawal cancelled by user';
        } else if (error.message.includes('insufficient funds')) {
            errorMessage = 'Insufficient gas for withdrawal';
        } else if (error.message.includes('Ownable: caller is not the owner')) {
            errorMessage = 'Only contract owner can withdraw funds';
        }
        
        statusDiv.textContent = errorMessage;
        alert(errorMessage);
    }
}

// ==================================================================================
// BUY COFFEE FUNCTION - Smart Contract Transaction (Updated)
// ==================================================================================

/*
  This function demonstrates how to send transactions to smart contracts:
  1. Validate user input
  2. Check minimum requirements
  3. Prepare transaction
  4. Send transaction to blockchain
  5. Wait for confirmation
  6. Update UI with results
*/
async function BuyCoffee() {
    /*
      STEP 1: Input validation
      
      Always validate user input before sending to blockchain
      Invalid transactions waste gas and confuse users
    */
    const ethAmount = ethAmountInput.value;
    if (!ethAmount || ethAmount <= 0) {
        alert("Please enter a valid ETH amount");
        return;
    }
    
    console.log(`Buying coffee for ${ethAmount} ETH`);
    
    /*
      STEP 2: Check MetaMask availability
      
      User might have disconnected or locked wallet
    */
    if(typeof window.ethereum !== "undefined"){
        try {
            /*
              STEP 3: Network verification (same as Connect function)
              
              Ensure user hasn't switched networks since connecting
            */
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            const sepoliaChainId = '0xaa36a7';
            
            if (chainId !== sepoliaChainId) {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: sepoliaChainId }],
                });
            }

            /*
              STEP 4: Recreate clients (ensure fresh connection)
              
              Good practice: Don't assume clients are still valid
            */
            walletClient = createWalletClient({
                chain: sepolia,
                transport: custom(window.ethereum),
            });

            const [connectedAccount] = await walletClient.requestAddresses();

            publicClient = createPublicClient({
                chain: sepolia,
                transport: custom(window.ethereum),
            });

            /*
              STEP 5: Pre-transaction validation
              
              Check if user has enough balance and meets minimum requirements
              This prevents failed transactions and saves user gas fees
            */
            const balance = await publicClient.getBalance({ address: connectedAccount });
            console.log("Account balance:", balance, "wei");
            
            /*
              Get real-time minimum requirements from contract
              
              We check this again because ETH price might have changed
              since the user connected their wallet
            */
            const minimumUSD = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: "mimimumDollarAmount",
            });
            
            const ethPriceWei = await publicClient.readContract({
                address: contractAddress,
                abi: contractABI,
                functionName: "getPrice",
            });
            
            /*
              Calculate if user's ETH amount meets USD minimum
              
              This is the same validation the smart contract will do,
              but we do it client-side first to provide better UX
            */
            const minimumUSDAmount = Number(minimumUSD) / 1e18;
            const ethPriceUSD = Number(ethPriceWei) / 1e18;
            const userEthAmount = Number(ethAmount);
            const userUSDAmount = userEthAmount * ethPriceUSD;
            const minimumEthRequired = minimumUSDAmount / ethPriceUSD;
            
            console.log("Minimum required: $", minimumUSDAmount, "USD");
            console.log("Current ETH price: $", ethPriceUSD.toFixed(2), "USD");
            console.log("User sending:", userEthAmount, "ETH");
            console.log("User's USD equivalent: $", userUSDAmount.toFixed(2), "USD");
            console.log("Minimum ETH needed:", minimumEthRequired.toFixed(6), "ETH");
            
            /*
              Client-side validation to prevent failed transactions
              
              If this fails, the smart contract would reject the transaction
              and user would lose gas fees for nothing
            */
            if (userUSDAmount < minimumUSDAmount) {
                alert(`Insufficient amount! You need at least $${minimumUSDAmount} USD worth of ETH.\n\nYou're sending: $${userUSDAmount.toFixed(2)} USD\nMinimum required: ${minimumEthRequired.toFixed(6)} ETH`);
                return;
            }
            
            console.log("✅ Amount validation passed - proceeding with transaction...");
            
            /*
              STEP 6: Simulate transaction before sending
              
              simulateContract does a "dry run" of the transaction:
              - Checks if transaction would succeed
              - Estimates gas costs
              - Returns transaction request object
              - No actual blockchain state changes
              
              This is a best practice to catch errors before spending gas
            */
            const { request } = await publicClient.simulateContract({
                address: contractAddress,        // Our smart contract address
                account: connectedAccount,       // User's wallet address
                abi: contractABI,               // Contract interface
                functionName: "fund",           // Function to call on contract
                value: parseEther(ethAmount),   // ETH amount to send (converted to wei)
            });

            /*
              STEP 7: Execute the actual transaction
              
              writeContract sends the transaction to the blockchain:
              - User sees MetaMask popup to confirm
              - User pays gas fees
              - Transaction is broadcast to network
              - Returns transaction hash
            */
            const hash = await walletClient.writeContract(request);
            console.log("Transaction hash:", hash);
            
            /*
              STEP 8: Wait for transaction confirmation
              
              Blockchain transactions aren't instant:
              - Takes time for miners to include in block
              - Need to wait for network confirmation
              - Receipt contains final transaction details
            */
            statusDiv.textContent = "Transaction pending...";
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log("Transaction confirmed:", receipt);
            
            /*
              STEP 9: Success feedback to user
              
              Show transaction success with verifiable hash
              Users can check transaction on blockchain explorer
            */
            statusDiv.textContent = `Coffee bought! Tx: ${hash.substring(0, 10)}...`;
            
            /*
              Refresh displays after successful transaction
              
              Update contract balance to show new funds
              Update user's wallet balance to show spent ETH
            */
            
            // Refresh contract balance (should increase)
            await getContractBalance();
            
            // Refresh user's wallet balance (should decrease)
            const newBalance = await publicClient.getBalance({ address: connectedAccount });
            const newBalanceInEth = Number(newBalance) / 1e18;
            
            if (walletBalanceDisplay) {
                walletBalanceDisplay.textContent = `${newBalanceInEth.toFixed(4)} ETH`;
            }
            
            // Optional: Clear input field for next transaction
            ethAmountInput.value = '';

        } catch (error) {
            /*
              Handle transaction errors
              
              Common errors:
              - User rejects transaction
              - Insufficient gas fees
              - Contract requirements not met
              - Network congestion
            */
            console.error("Transaction failed:", error);
            statusDiv.textContent = `Transaction failed: ${error.message}`;
            
            // Parse error message for user-friendly feedback
            if (error.message.includes("user rejected")) {
                statusDiv.textContent = "Transaction cancelled by user";
            } else if (error.message.includes("insufficient funds")) {
                statusDiv.textContent = "Insufficient funds for transaction";
            } else if (error.message.includes("didn't send enough ETH")) {
                statusDiv.textContent = "Amount too low - need at least $5 USD worth of ETH";
            }
        }
    } else {
        /*
          Handle case where MetaMask becomes unavailable
          
          This can happen if user disables extension or changes browsers
        */
        alert("Please install MetaMask to use this DApp!");
        statusDiv.textContent = "MetaMask required for transactions";
    }
}

// ==================================================================================
// EVENT LISTENERS - Connect UI to functions
// ==================================================================================

/*
  Event listeners connect HTML buttons to JavaScript functions
  
  Modern approach using addEventListener:
  - Separates HTML from JavaScript
  - Allows multiple listeners per element
  - Better error handling
  - More maintainable code
*/


// ==================================================================================
// EVENT LISTENERS - Connect UI to functions
// ==================================================================================


// Connect wallet when user clicks connect button
connectBtn.addEventListener("click", Connect);

// Execute transaction when user clicks buy coffee button
buyBtn.addEventListener("click", BuyCoffee);

// Add event listener for balance refresh button (if it exists)
const balanceBtn = document.getElementById("balanceBtn");
if (balanceBtn) {
    balanceBtn.addEventListener("click", getContractBalance);
}

// Add event listener for withdraw button (if it exists)
const withdrawBtn = document.getElementById("withdrawBtn");
if (withdrawBtn) {
    withdrawBtn.addEventListener("click", withdrawFunds);
}

// Refresh contract balance every 30 seconds (optional)
setInterval(async () => {
    if (publicClient && isConnected) {
        await getContractBalance();
    }
}, 30000);

/*
  Handle MetaMask account and network changes
*/
if (typeof window.ethereum !== "undefined") {
    // Handle account changes
    window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Accounts changed:', accounts);
        
        if (accounts.length === 0) {
            // User disconnected
            isConnected = false;
            connectedAddress = null;
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('walletAddress');
            
            // Reset UI
            connectBtn.textContent = "Connect Wallet";
            statusDiv.textContent = "Wallet disconnected";
            
            const walletAddressElement = document.getElementById("walletAddress");
            if (walletAddressElement) {
                walletAddressElement.textContent = "Not Connected";
                walletAddressElement.classList.remove("connected");
            }
            
            // Reset displays
            if (walletBalanceDisplay) {
                walletBalanceDisplay.textContent = "Connect Wallet";
                walletBalanceDisplay.classList.add("loading");
            }
            
            if (contractBalanceDisplay) {
                contractBalanceDisplay.textContent = "Connect Wallet";
                contractBalanceDisplay.classList.add("loading");
            }
            
        } else if (accounts[0] !== connectedAddress) {
            // Account switched
            localStorage.setItem('walletAddress', accounts[0]);
            autoReconnect();
        }
    });
    
    // Handle network changes
    window.ethereum.on('chainChanged', (chainId) => {
        console.log('Network changed to:', chainId);
        
        if (chainId === '0xaa36a7' && isConnected) {
            setTimeout(() => {
                if (isConnected) {
                    autoReconnect();
                }
            }, 1000);
        }
    });
}

/*
  ADDITIONAL FEATURES FOR STUDENTS TO IMPLEMENT:
  
  1. ✅ CONTRACT BALANCE FEATURES (IMPLEMENTED):
     - ✅ getContractBalance(): Shows total ETH in contract
     - ✅ withdrawFunds(): Owner-only fund extraction
     - ✅ checkIfOwner(): Verify owner permissions
     - ✅ Auto-refresh balance after transactions
  
  2. ENHANCED BALANCE FEATURES:
     - Show individual user contribution amounts
     - Display funding history and transaction list
     - Add balance change notifications
     - Show USD equivalent of contract balance
  
  3. REAL-TIME UPDATES:
     - Auto-refresh balance when other users interact
     - Listen for blockchain events from the contract
     - WebSocket connections for live updates
     - Notification system for new transactions
  
  4. ADVANCED OWNER FEATURES:
     - Partial withdrawal functionality
     - Multi-signature wallet integration
     - Automatic withdrawal scheduling
     - Emergency pause/unpause functions
  
  5. USER EXPERIENCE IMPROVEMENTS:
     - Transaction history display
     - Gas fee estimation and optimization
     - Batch transaction capabilities
     - Mobile-responsive balance cards
  
  6. SECURITY ENHANCEMENTS:
     - Rate limiting for transactions
     - Maximum transaction amount limits
     - Multi-factor authentication for withdrawals
     - Audit trail for all contract interactions
*/