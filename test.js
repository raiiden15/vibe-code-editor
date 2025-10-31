// test-env.js
console.log("--- Environment Check ---");
if (process.env.DATABASE_URL) {
  console.log(
    "DATABASE_URL is loaded! The value starts with:",
    process.env.DATABASE_URL.substring(0, 20) + "...",
  );
} else {
  console.log("DATABASE_URL is NOT loaded.");
}
console.log("-------------------------");
