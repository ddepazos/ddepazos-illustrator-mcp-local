import fs from "node:fs";
import path from "node:path";
import solc from "solc";

const root = path.resolve(".");
const contractPath = path.join(root, "contracts", "PazosNFT.sol");
const source = fs.readFileSync(contractPath, "utf8");

function findImports(importPath) {
  const full = path.join(root, "node_modules", importPath);
  if (fs.existsSync(full)) {
    return { contents: fs.readFileSync(full, "utf8") };
  }
  return { error: "Import not found: " + importPath };
}

const input = {
  language: "Solidity",
  sources: {
    "PazosNFT.sol": { content: source }
  },
  settings: {
    optimizer: { enabled: true, runs: 200 },
    outputSelection: {
      "*": {
        "*": ["abi", "evm.bytecode.object"]
      }
    }
  }
};

const output = JSON.parse(solc.compile(JSON.stringify(input), { import: findImports }));
const errors = (output.errors || []).filter(e => e.severity === "error");

if (errors.length) {
  for (const e of output.errors || []) console.error(e.formattedMessage);
  process.exit(1);
}

const artifact = output.contracts["PazosNFT.sol"]["PazosNFT"];
fs.mkdirSync(path.join(root, "build"), { recursive: true });
fs.writeFileSync(
  path.join(root, "build", "PazosNFT.json"),
  JSON.stringify({ abi: artifact.abi, bytecode: artifact.evm.bytecode.object }, null, 2)
);

console.log("PazosNFT compiled successfully.");
