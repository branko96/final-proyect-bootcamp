import { ethers } from "hardhat";
import {expect} from "chai";

describe("NFT", function () {
  describe("Deployment", function () {
    let nftMarketContract: any
    let nftMarketAddress: string
    let nftContract: any
    let nftAddress: string
    let owner: any
    let buyer: any
    let buyer2: any

    beforeEach(async () => {
      [owner, buyer, buyer2] = await ethers.getSigners();

      const NFTMarket = await ethers.getContractFactory("NFTMarket");
      nftMarketContract = await NFTMarket.deploy();
      nftMarketAddress = nftMarketContract.address;
      const NFTContract = await ethers.getContractFactory("NFT");
      nftContract = await NFTContract.deploy(nftMarketAddress);
      nftAddress = nftContract.address;
    })

    describe("Create Token", async function () {
      it("Should create token", async function () {
        const tokenUriMint = "https://gateway.pinata.cloud/ipfs/QmXiZvNhPDabzA2W4nrtqUE2DpT8pGBNEGmzUDn5g5NL8w"
        const transaction = await nftContract.createToken(tokenUriMint)
        const tx = await transaction.wait()
        // @ts-ignore
        let event = tx.events[0]
        // @ts-ignore
        let value = event.args[2]
        const tokenId = value.toNumber()

        const currentTokenId = await nftContract._tokenIds()
        const tokenUri = await nftContract.tokenURI(tokenId)

        expect(currentTokenId).to.equal(tokenId)
        expect(tokenUri).to.equal(tokenUriMint)
      });
    });
  });
});
