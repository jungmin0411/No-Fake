require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "shanghai",
        },
      },
      {
        version: "0.8.20",
        settings: {
          optimizer: { enabled: true, runs: 200 },
          evmVersion: "shanghai",
        },
      },
    ],
  },
  // 바로 이 부분이 빠져있어서 에러가 났던 겁니다!
  networks: {
    sepolia: {
      url: process.env.RPC_URL || "", // .env의 RPC_URL 사용
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [], // .env의 PRIVATE_KEY 사용
    },
  },
  // (선택) 이더스캔 소스코드 인증을 원한다면 추가
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};