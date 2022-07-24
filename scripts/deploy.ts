import hre, { ethers } from "hardhat";
import fs from "fs";

async function main() {
  /*const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const ONE_YEAR_IN_SECS = 365 * 24 * 60 * 60;
  const unlockTime = currentTimestampInSeconds + ONE_YEAR_IN_SECS;

  const lockedAmount = ethers.utils.parseEther("1");

  const Lock = await ethers.getContractFactory("Lock");
  const lock = await Lock.deploy(unlockTime, { value: lockedAmount });

  await lock.deployed();

  console.log("Lock with 1 ETH deployed to:", lock.address);*/
  const NFTMarket = await ethers.getContractFactory("NFTMarket");
  const nftMarket = await NFTMarket.deploy();

  await nftMarket.deployed();

  console.log("NFTMarket deployed to:", nftMarket.address);

  const NFT = await ethers.getContractFactory("NFT");
  const nft = await NFT.deploy(nftMarket.address);

  await nft.deployed();

  console.log("NFT deployed to:", nft.address);

  saveFrontendFiles(nft.address, nftMarket.address);
}

function saveFrontendFiles(nftAddress: string, nftMarketAddress: string) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../frontend/";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
      contractsDir + "/contract-address.json",
      JSON.stringify({ nftAddress, nftMarketAddress }, undefined, 2)
  );

  const NFTArtifact = hre.artifacts.readArtifactSync("NFT");
  const NFTMarketArtifact = hre.artifacts.readArtifactSync("NFTMarket");

  fs.writeFileSync(
      contractsDir + "/artifacts/NFT.json",
      JSON.stringify(NFTArtifact, null, 2)
  );
  fs.writeFileSync(
      contractsDir + "/artifacts/NFTMarket.json",
      JSON.stringify(NFTMarketArtifact, null, 2)
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
