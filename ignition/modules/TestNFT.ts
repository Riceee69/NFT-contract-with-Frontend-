import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const TestNFTModule = buildModule("TestNFTModule", (m) => {
  const testNFT = m.contract("TestNFT");

  return { testNFT };
});

export default TestNFTModule;
