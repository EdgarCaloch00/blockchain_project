const path = require("path");

/**
 * Use this file to configure your truffle project. It's seeded with some
 * common settings for different networks and features like migrations,
 * compilation, and testing.
 */

module.exports = {
  // ✅ Store compiled contract artifacts (ABIs) in the desired directory
  contracts_build_directory: path.join(__dirname, "ticketblock/src/contractsABI"),

  networks: {
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (Ganache default)
      network_id: 1337,       // Match any network id
    }
  },

  // Set default mocha options here
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.17",      // Fetch exact version from solc-bin
      // settings: {
      //   optimizer: {
      //     enabled: false,
      //     runs: 200
      //   },
      //   evmVersion: "byzantium"
      // }
    }
  },

  // Truffle DB config (optional and disabled by default)
  // db: {
  //   enabled: false,
  //   host: "127.0.0.1",
  //   adapter: {
  //     name: "indexeddb",
  //     settings: {
  //       directory: ".db"
  //     }
  //   }
  // }
};
