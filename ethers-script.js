// Simple JS placeholders (Web3 logic can be added later)
const connectBtn = document.getElementById("connectBtn");
const buyBtn = document.getElementById("buyBtn");
const balanceBtn = document.getElementById("balanceBtn");
const withdrawBtn = document.getElementById("withdrawBtn");
const statusDiv = document.getElementById("status");

let provider, signer, contract;

connectBtn.addEventListener("click", async () => {
  if (window.ethereum) {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      const address = await signer.getAddress();
      statusDiv.textContent = `Connected: ${address.substring(0, 6)}...${address.slice(-4)}`;
    } catch (err) {
      console.error(err);
      statusDiv.textContent = "Connection failed";
    }
  } else {
    alert("Please install MetaMask!");
  }
});

buyBtn.addEventListener("click", () => {
  statusDiv.textContent = "Buying coffee ☕ (Demo only)";
});

balanceBtn.addEventListener("click", () => {
  statusDiv.textContent = "Fetching balance... (Demo)";
});

withdrawBtn.addEventListener("click", () => {
  statusDiv.textContent = "Withdrawing funds... (Demo)";
});




[
	{
		"inputs": [],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"stateMutability": "payable",
		"type": "fallback"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "funder",
				"type": "address"
			}
		],
		"name": "addressToAmountFunded",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "amountFunded",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "fund",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "funders",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "getPrice",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "mimimumDollarAmount",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "withdraw",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"stateMutability": "payable",
		"type": "receive"
	}
]