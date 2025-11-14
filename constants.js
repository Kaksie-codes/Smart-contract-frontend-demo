/*
  SMART CONTRACT CONSTANTS - Contract Address and ABI Configuration
  
  This file contains the essential information needed to interact with our deployed smart contract.
  
  KEY CONCEPTS:
  1. Contract Address - The unique location of our contract on the Sepolia blockchain
  2. ABI (Application Binary Interface) - The "dictionary" that tells our app how to talk to the contract
  3. Function Signatures - Define what functions exist and how to call them
  4. Data Types - Specify input/output types for type-safe interactions
  
  WHY SEPARATE THIS FILE?
  - Configuration Management: Easy to update contract details
  - Code Organization: Keep constants separate from logic
  - Maintainability: Single source of truth for contract info
  - Security: Clear visibility of what contract we're interacting with
*/

// ==================================================================================
// CONTRACT DEPLOYMENT ADDRESS - Where our contract lives on Sepolia testnet
// ==================================================================================

/*
  Contract Address Explanation:
  
  This is the unique address where our smart contract is deployed on the Sepolia testnet.
  
  Address: 0x6248d029178E659639F30e43Ae98b2499EFbDC9C
  
  How to verify this contract:
  1. Go to sepolia.etherscan.io
  2. Search for this address
  3. You can see the contract code, transactions, and ABI
  
  Important: This address is specific to Sepolia testnet!
  If you deploy to mainnet or another testnet, you'll get a different address.
*/
export const contractAddress = "0x6248d029178E659639F30e43Ae98b2499EFbDC9C";

// ==================================================================================
// CONTRACT ABI - Application Binary Interface Definition
// ==================================================================================

/*
  ABI Explanation:
  
  The ABI is like a "menu" that tells our JavaScript code:
  - What functions exist in the contract
  - What parameters each function expects
  - What data types to use
  - Whether functions are payable (can receive ETH)
  - Whether functions are view-only (don't change blockchain state)
  
  This ABI was generated when the contract was compiled.
  It's the bridge between our JavaScript and the Solidity smart contract.
  
  Key Function Types in our ABI:
  - fund(): Payable function to send ETH to contract
  - withdraw(): Only owner can withdraw funds
  - getPrice(): View function to get ETH price from Chainlink
  - addressToAmountFunded(): View function to check how much someone funded
*/
export const contractABI = [
	/*
	  FUND FUNCTION - Main function for sending ETH to the contract
	  
	  Purpose: Allows users to send ETH to the contract (buy coffee)
	  Type: Payable - can receive ETH
	  Inputs: None (ETH amount is sent as value)
	  Outputs: None (but changes contract state)
	  
	  JavaScript Usage:
	  await contract.fund({ value: parseEther("0.01") })
	*/
	{
		"inputs": [],                    // No input parameters needed
		"name": "fund",                  // Function name to call
		"outputs": [],                   // No return values
		"stateMutability": "payable",    // Can receive ETH
		"type": "function"               // This is a function (vs event, etc.)
	},
	
	/*
	  CONSTRUCTOR - Automatically called when contract is deployed
	  
	  Purpose: Sets up initial contract state (owner, price feed address)
	  Type: Non-payable - doesn't receive ETH during deployment
	  Note: Constructor only runs once when contract is deployed
	*/
	{
		"inputs": [],                    // No constructor parameters
		"stateMutability": "nonpayable", // Doesn't accept ETH
		"type": "constructor"            // Special constructor type
	},
	
	/*
	  FALLBACK FUNCTION - Called when contract receives ETH without function call
	  
	  Purpose: Allows direct ETH transfers to contract address
	  Type: Payable - can receive ETH
	  Note: Automatically triggers when someone sends ETH directly
	*/
	{
		"stateMutability": "payable",    // Can receive ETH
		"type": "fallback"               // Special fallback type
	},
	
	/*
	  WITHDRAW FUNCTION - Allows contract owner to withdraw all funds
	  
	  Purpose: Owner-only function to withdraw contract balance
	  Type: Non-payable - doesn't receive ETH (but sends it out)
	  Access Control: Only contract owner can call this
	  
	  JavaScript Usage:
	  await contract.withdraw() // Only works if you're the owner
	*/
	{
		"inputs": [],                    // No input parameters
		"name": "withdraw",              // Function name
		"outputs": [],                   // No return values
		"stateMutability": "nonpayable", // Doesn't accept ETH
		"type": "function"               // Regular function
	},
	
	/*
	  RECEIVE FUNCTION - Modern way to handle direct ETH transfers
	  
	  Purpose: Handles direct ETH transfers to contract (newer than fallback)
	  Type: Payable - can receive ETH
	  Note: Called when ETH is sent without any data
	*/
	{
		"stateMutability": "payable",    // Can receive ETH
		"type": "receive"                // Special receive type
	},
	
	/*
	  ADDRESS TO AMOUNT FUNDED - View function to check funding amounts
	  
	  Purpose: Look up how much ETH a specific address has funded
	  Type: View - read-only, doesn't change state, no gas cost
	  Input: Ethereum address to check
	  Output: Amount of wei (smallest ETH unit) that address has funded
	  
	  JavaScript Usage:
	  const amount = await contract.addressToAmountFunded("0x742d35Cc6D40b99cbb9c68A5E5b13C5e9E90a4B6")
	*/
	{
		"inputs": [
			{
				"internalType": "address",     // Ethereum address type
				"name": "funder",              // Parameter name
				"type": "address"              // Solidity address type
			}
		],
		"name": "addressToAmountFunded",   // Function name
		"outputs": [
			{
				"internalType": "uint256",     // Unsigned 256-bit integer
				"name": "amountFunded",        // Return value name
				"type": "uint256"              // Solidity uint256 type (holds wei amounts)
			}
		],
		"stateMutability": "view",         // Read-only function
		"type": "function"                 // Regular function type
	},
	
	/*
	  FUNDERS ARRAY - View function to get funder addresses by index
	  
	  Purpose: Get the address of a funder by their position in the funders array
	  Type: View - read-only function
	  Input: Index number (position in array)
	  Output: Ethereum address at that position
	  
	  JavaScript Usage:
	  const firstFunder = await contract.funders(0)  // Get first funder
	  const secondFunder = await contract.funders(1) // Get second funder
	*/
	{
		"inputs": [
			{
				"internalType": "uint256",     // Array index type
				"name": "",                    // Unnamed parameter (just index)
				"type": "uint256"              // Solidity uint256 for array index
			}
		],
		"name": "funders",                 // Function/array name
		"outputs": [
			{
				"internalType": "address",     // Ethereum address type
				"name": "",                    // Unnamed return value
				"type": "address"              // Solidity address type
			}
		],
		"stateMutability": "view",         // Read-only function
		"type": "function"                 // Regular function type
	},
	
	/*
	  GET PRICE - Chainlink Oracle price feed function
	  
	  Purpose: Get real-time ETH/USD price from Chainlink oracle
	  Type: View - read-only, calls external Chainlink contract
	  Input: None
	  Output: Current ETH price in USD with 18 decimal places
	  
	  Example: If ETH = $2,000 USD, returns 2000000000000000000000 (2000 * 10^18)
	  
	  JavaScript Usage:
	  const priceWei = await contract.getPrice()
	  const priceUSD = Number(priceWei) / 1e18  // Convert to readable USD
	*/
	{
		"inputs": [],                      // No input parameters needed
		"name": "getPrice",                // Function name
		"outputs": [
			{
				"internalType": "uint256",     // Large integer type
				"name": "",                    // Unnamed return value
				"type": "uint256"              // 18-decimal precision price
			}
		],
		"stateMutability": "view",         // Read-only function
		"type": "function"                 // Regular function type
	},
	
	/*
	  MINIMUM DOLLAR AMOUNT - Get minimum funding requirement
	  
	  Purpose: Returns the minimum USD amount required for funding ($5)
	  Type: View - read-only function
	  Input: None
	  Output: Minimum amount in 18-decimal format (5 * 10^18 = $5)
	  
	  JavaScript Usage:
	  const minWei = await contract.mimimumDollarAmount()
	  const minUSD = Number(minWei) / 1e18  // Should be 5.0
	*/
	{
		"inputs": [],                      // No input parameters
		"name": "mimimumDollarAmount",     // Function name (note: typo in contract)
		"outputs": [
			{
				"internalType": "uint256",     // Large integer type
				"name": "",                    // Unnamed return value
				"type": "uint256"              // 18-decimal USD amount
			}
		],
		"stateMutability": "view",         // Read-only function
		"type": "function"                 // Regular function type
	},
	
	/*
	  OWNER - Get contract owner address
	  
	  Purpose: Returns the address of the contract owner (who deployed it)
	  Type: View - read-only function
	  Input: None
	  Output: Ethereum address of the owner
	  
	  JavaScript Usage:
	  const ownerAddr = await contract.owner()
	  const isOwner = ownerAddr.toLowerCase() === userAddress.toLowerCase()
	*/
	{
		"inputs": [],                      // No input parameters
		"name": "owner",                   // Function name
		"outputs": [
			{
				"internalType": "address",     // Ethereum address type
				"name": "",                    // Unnamed return value
				"type": "address"              // Solidity address type
			}
		],
		"stateMutability": "view",         // Read-only function
		"type": "function"                 // Regular function type
	}
];

/*
  ABI SUMMARY - Quick reference for students:
  
  PAYABLE FUNCTIONS (can receive ETH):
  - fund(): Send ETH to contract
  - fallback(): Handles direct ETH transfers
  - receive(): Modern way to handle ETH transfers
  
  OWNER-ONLY FUNCTIONS:
  - withdraw(): Only owner can withdraw contract balance
  
  VIEW FUNCTIONS (read-only, no gas cost):
  - getPrice(): Get real-time ETH price from Chainlink
  - mimimumDollarAmount(): Get minimum funding requirement ($5)
  - owner(): Get contract owner address
  - addressToAmountFunded(address): Check how much an address funded
  - funders(index): Get funder address by array position
  
  DEPLOYMENT INFO:
  - Network: Sepolia Testnet
  - Address: 0x6248d029178E659639F30e43Ae98b2499EFbDC9C
  - Verification: Check on sepolia.etherscan.io
  
  NEXT STEPS FOR STUDENTS:
  1. Deploy your own version of this contract
  2. Update the contractAddress with your deployment
  3. Experiment with adding new functions to the contract
  4. Try deploying to different networks (testnet -> mainnet)
  5. Add events to the contract and listen for them in the frontend
*/