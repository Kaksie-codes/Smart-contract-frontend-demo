/*
  SYNCHRONOUS vs ASYNCHRONOUS JAVASCRIPT
  Simple Examples for Learning
  
  Author: Educational Demo
  Purpose: Understanding JavaScript execution patterns
*/

// ==================================================================================
// SYNCHRONOUS JAVASCRIPT - Code runs line by line, waiting for each to finish
// ==================================================================================

// console.log("=== SYNCHRONOUS EXAMPLES ===");

/*
  EXAMPLE 1: Basic Synchronous Code
  - Each line runs in order
  - Next line waits for previous line to complete
  - Everything happens immediately
*/
// console.log("1. First task");
// console.log("2. Second task");
// console.log("3. Third task");
// console.log("Result: All tasks run in exact order, one after another");

/*
  EXAMPLE 2: Synchronous Function
  - Function runs completely before moving to next line
  - No waiting involved
*/
function addNumbers(a, b) {
    return a + b;
}

// console.log("Before calling function");
// let result = addNumbers(5, 3);
// console.log("Function result:", result);
// console.log("After function call");

// ==================================================================================
// ASYNCHRONOUS JAVASCRIPT - Code can run out of order, some tasks take time
// ==================================================================================

// console.log("\n=== ASYNCHRONOUS EXAMPLES ===");

/*
  EXAMPLE 1: setTimeout (Asynchronous)
  - setTimeout doesn't block the next line
  - Code continues running while timer counts down
  - Callback runs LATER when timer finishes
*/
// console.log("1. Starting timer...");

// setTimeout(() => {
//     console.log("3. Timer finished! (This runs AFTER 2 seconds)");
// }, 2000);

// console.log("2. This runs IMMEDIATELY, doesn't wait for timer");

/*
  EXAMPLE 2: Multiple Timers (Shows async nature)
  - All timers start at the same time
  - They finish in order based on their delay time
  - Other code keeps running
*/
// console.log("\nStarting multiple timers:");

// setTimeout(() => {
//     console.log("⏰ 1 second timer done");
// }, 1000);

// setTimeout(() => {
//     console.log("⏰ 3 second timer done");
// }, 3000);

// setTimeout(() => {
//     console.log("⏰ 0.5 second timer done");
// }, 500);

// console.log("All timers started! They'll finish when ready.");

// ==================================================================================
// PROMISES - Modern way to handle asynchronous code
// ==================================================================================

/*
  EXAMPLE 3: Promise Example
  - Promises represent future values
  - .then() runs when promise completes successfully
  - .catch() runs if something goes wrong
*/
// console.log("\n=== PROMISE EXAMPLES ===");

function waitAndReturn(message, seconds) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(message);
        }, seconds * 1000);
    });
}

// console.log("Starting promise...");

// waitAndReturn("Promise completed!", 1.5)
//     .then((result) => {
//         console.log("✅", result);
//     });

// console.log("This runs immediately, doesn't wait for promise");

// ==================================================================================
// ASYNC/AWAIT - Even cleaner way to write asynchronous code
// ==================================================================================

/*
  EXAMPLE 4: Async/Await
  - Makes asynchronous code look synchronous
  - 'await' pauses the function until promise resolves
  - Only works inside 'async' functions
*/
async function demonstrateAsyncAwait() {
    console.log("\n=== ASYNC/AWAIT EXAMPLES ===");
    
    console.log("Starting async function...");
    
    // This LOOKS synchronous but is actually asynchronous
    let message1 = await waitAndReturn("First message", 1);
    console.log("Got:", message1);
    
    let message2 = await waitAndReturn("Second message", 2);
    console.log("Got:", message2);
    
    console.log("Async function completed!");
}

// Call the async function
demonstrateAsyncAwait();
console.log("This runs while async function is working");

// ==================================================================================
// REAL-WORLD BLOCKCHAIN EXAMPLE
// ==================================================================================

/*
  EXAMPLE 5: Why Async Matters for Blockchain
  - Blockchain operations take time (network requests)
  - User interface must stay responsive
  - We can't freeze the browser waiting for blockchain
*/
// console.log("\n=== BLOCKCHAIN ASYNC EXAMPLE ===");

// Simulating a blockchain transaction (fake function)
function simulateBlockchainTransaction(amount) {
    console.log(`💸 Sending ${amount} ETH to blockchain...`);
    
    // Simulate network delay (2-5 seconds is normal)
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(`✅ Transaction successful! Sent ${amount} ETH`);
        }, 2000);
    });
}

// Using async/await for clean blockchain code
async function sendEthTransaction() {
    console.log("🔄 User clicked 'Send ETH' button");
    console.log("🔄 UI stays responsive during transaction...");
    
    try {
        // This waits for blockchain, but doesn't freeze the browser
        let result = await simulateBlockchainTransaction(0.1);
        console.log(result);
        console.log("🎉 UI can now show success message");
    } catch (error) {
        console.log("❌ Transaction failed:", error);
    }
}

// sendEthTransaction();
// console.log("🖱️  User can still click other buttons while transaction processes");

// ==================================================================================
// KEY TAKEAWAYS
// ==================================================================================

/*
  SYNCHRONOUS JAVASCRIPT:
  ✅ Simple and predictable
  ✅ Runs line by line in order
  ❌ Can freeze the browser if tasks take time
  ❌ Bad for network requests or file operations
  
  ASYNCHRONOUS JAVASCRIPT:
  ✅ Keeps browser responsive
  ✅ Perfect for network requests (blockchain calls)
  ✅ Allows multiple operations at once
  ❌ More complex to understand initially
  ❌ Code doesn't always run in written order
  
  WHEN TO USE EACH:
  
  Use SYNCHRONOUS for:
  - Simple calculations
  - Immediate operations
  - Setting variables
  - Basic logic
  
  Use ASYNCHRONOUS for:
  - Blockchain transactions
  - API calls
  - File operations
  - Timers and delays
  - Anything that takes time
*/

// console.log("\n🎓 Study the console output to see the execution order!");
// console.log("📝 Notice how async code doesn't block other code from running.");
