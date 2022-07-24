import { ethers } from "hardhat";
import {expect} from "chai";

describe("NFTMarket", function () {
  describe("Deployment", function () {
    let nftMarketContract: any
    let nftMarketAddress: string
    let owner: any
    let buyer: any
    let buyer2: any

    beforeEach(async () => {
      [owner, buyer, buyer2] = await ethers.getSigners();

      const NFTMarket = await ethers.getContractFactory("NFTMarket");
      nftMarketContract = await NFTMarket.deploy();
      nftMarketAddress = nftMarketContract.address;
    })

    describe("Create Market Item", async function () {
      let tokenId: number
      let nftContract: any

      beforeEach(async () => {
        const NFTContract = await ethers.getContractFactory("NFT");
        nftContract = await NFTContract.deploy(nftMarketAddress);
        const transaction = await nftContract.createToken("https://gateway.pinata.cloud/ipfs/QmXiZvNhPDabzA2W4nrtqUE2DpT8pGBNEGmzUDn5g5NL8w")
        const tx = await transaction.wait()
        // @ts-ignore
        let event = tx.events[0]
        // @ts-ignore
        let value = event.args[2]
        tokenId = value.toNumber()
      })

      it("Should create market item", async function () {
        let listingPrice = await nftMarketContract.getListingPrice()
        listingPrice = listingPrice.toString()
        const price = 5
        const transactionCreateMarketItem = await nftMarketContract.createMarketItem(nftContract.address, tokenId, price, { value: listingPrice })
        await transactionCreateMarketItem.wait()
        const items = await nftMarketContract.fetchMarketItems()

        expect(items[0].price).to.equal("5")
        expect(items[0].tokenId).to.equal("1")
        expect(items[0].seller).to.equal(owner.address)
      });

      it("Should NOT create market item with 0 price", async function () {
        let listingPrice = await nftMarketContract.getListingPrice()
        listingPrice = listingPrice.toString()
        const price = 0;

        const transactionCreateMarketItem = nftMarketContract.createMarketItem(nftContract.address, tokenId, price, { value: listingPrice })
        await expect(transactionCreateMarketItem).to.be.revertedWith("Price must be at least 1 wei")
      });

      it("Should NOT create market item with 0 listingPrice", async function () {
        const listingPrice = 0
        const price = 5;

        const transactionCreateMarketItem = nftMarketContract.createMarketItem(nftContract.address, tokenId, price, { value: listingPrice })
        await expect(transactionCreateMarketItem).to.be.revertedWith("You must pay the listing price")
      });
    })

    describe("Sale Market Item accepting a bid", async function () {
      let tokenId: number
      let nftContract: any

      beforeEach(async () => {
        const NFTContract = await ethers.getContractFactory("NFT");
        nftContract = await NFTContract.deploy(nftMarketAddress);
        const transaction = await nftContract.createToken("https://gateway.pinata.cloud/ipfs/QmXiZvNhPDabzA2W4nrtqUE2DpT8pGBNEGmzUDn5g5NL8w")
        const tx = await transaction.wait()
        // @ts-ignore
        let event = tx.events[0]
        // @ts-ignore
        let value = event.args[2]
        tokenId = value.toNumber()

        let listingPrice = await nftMarketContract.getListingPrice()
        listingPrice = listingPrice.toString()

        const transactionCreateItem = await nftMarketContract.createMarketItem(nftContract.address, tokenId, 7, { value: listingPrice })
        await transactionCreateItem.wait()
      })

      describe("Bid", async function () {
        beforeEach(async () => {
            const value = 5;

            const transactionCreateBid = await nftMarketContract.connect(buyer).createBid(tokenId, { value: value })
            await transactionCreateBid.wait()
        })
        it("Should create bid", async function () {
          const bidsOfItem = await nftMarketContract.fetchBidsOfItem(tokenId)
          expect(bidsOfItem.length).to.equal(1)
        });

        it("Shouldn't create bid if caller isn't owner", async function () {
          const value = 5;

          const transactionCreateBid = nftMarketContract.createBid(tokenId, { value: value })
          await expect(transactionCreateBid).to.be.revertedWith("You cannot bid on your own item")
        });

        it("Shouldn't create bid if item doesnt exists", async function () {
          const fakeItemId = 115;
          const value = 5;

          const transactionCreateBid = nftMarketContract.createBid(fakeItemId, { value: value })
          await expect(transactionCreateBid).to.be.revertedWith("The item does not exists")
        });

        it("Shouldn't create bid if value is 0", async function () {
          const value = 0;

          const transactionCreateBid = nftMarketContract.connect(buyer).createBid(tokenId, { value: value })
          await expect(transactionCreateBid).to.be.revertedWith("Bid must be at least 1 wei")
        });

        it("Should merge bids of same buyer", async function () {
          const value = 10;
          // Bid of buyer again
          const transactionCreateBidBuyerAgain = await nftMarketContract.connect(buyer).createBid(tokenId, { value: value })
          await transactionCreateBidBuyerAgain.wait()

          const bidsOfItem = await nftMarketContract.fetchBidsOfItem(tokenId)

          expect(bidsOfItem.length).to.equal(1)
          expect(bidsOfItem[0].value).to.equal("15")
        });

        describe("Fetch Bids of Market Item", async function () {
          beforeEach(async () => {
            const value = 10;

            // Bid of buyer 2
            const transactionCreateBidBuyerAgain = await nftMarketContract.connect(buyer2).createBid(tokenId, {value: value})
            await transactionCreateBidBuyerAgain.wait()
          })

          it("Should not fetch bids of item if it not exists", async function () {
            const notExistingId = 100
            const bidsOfItem = nftMarketContract.connect(buyer).fetchBidsOfItem(notExistingId)
            await expect(bidsOfItem).to.be.revertedWith("The item does not exists")
          });

          it("Should fetch bids of item", async function () {
            const bidsOfItem = await nftMarketContract.fetchBidsOfItem(tokenId)
            expect(bidsOfItem).to.have.lengthOf(2);
          });
        });
      });

      it("Should create a sale", async function () {
        const value = 5;

        const nftsSellerBefore = await nftMarketContract.fetchMyNfts()
        const nftsBuyerBefore = await nftMarketContract.connect(buyer).fetchMyNfts()

        const transactionCreateBid = await nftMarketContract.connect(buyer).createBid(tokenId, { value: value })
        await transactionCreateBid.wait()

        const transactionCreateSale = await nftMarketContract.createMarketSale(nftContract.address, tokenId, buyer.address)
        await transactionCreateSale.wait()

        const nftsBuyerAfter = await nftMarketContract.connect(buyer).fetchMyNfts()
        const nftsSellerAfter = await nftMarketContract.fetchMyNfts()

        expect(nftsSellerBefore).to.have.lengthOf(1);
        expect(nftsSellerAfter).to.have.lengthOf(0);

        expect(nftsBuyerBefore).to.have.lengthOf(0);
        expect(nftsBuyerAfter).to.have.lengthOf(1);
      });

      it("Should not create a sale if not owner", async function () {
        const value = 5;

        const transactionCreateBid = await nftMarketContract.connect(buyer).createBid(tokenId, { value: value })
        await transactionCreateBid.wait()

        const transactionCreateSale = nftMarketContract.connect(buyer).createMarketSale(nftContract.address, tokenId, buyer.address)
        await expect(transactionCreateSale).to.be.revertedWith("You are not the owner of this item");
      });

      it("Should not create a sale if bid not exist", async function () {
        const value = 5;

        const transactionCreateBid = await nftMarketContract.connect(buyer).createBid(tokenId, { value: value })
        await transactionCreateBid.wait()

        const transactionCreateSale = nftMarketContract.createMarketSale(nftContract.address, tokenId, buyer2.address)
        await expect(transactionCreateSale).to.be.revertedWith("The bid should exist for the buyer");
      });

      it("Should retrieve amount for bids that not execute the sale", async function () {
        const value = 10;

        // Bid of buyer
        const transactionCreateBid = await nftMarketContract.connect(buyer).createBid(tokenId, { value: value })
        await transactionCreateBid.wait()

        // Bid of buyer2
        const transactionCreateBidBuyer2 = await nftMarketContract.connect(buyer2).createBid(tokenId, { value: value })
        await transactionCreateBidBuyer2.wait()

        const balanceBuyerBefore = await ethers.provider.getBalance(buyer.address)

        // Seller accept offer of buyer2
        const transactionCreateSale = await nftMarketContract.createMarketSale(
            nftContract.address,
            tokenId,
            buyer2.address
        )
        await transactionCreateSale.wait()

        const balanceBuyerAfter = await ethers.provider.getBalance(buyer.address)
        expect(balanceBuyerAfter).to.equal(balanceBuyerBefore.add(ethers.BigNumber.from(value)))
      });
    });

    describe("Fetch Market Items", async function () {
      let tokenId: number
      let nftContract: any

      beforeEach(async () => {
        const NFTContract = await ethers.getContractFactory("NFT");
        nftContract = await NFTContract.deploy(nftMarketAddress);
        const transaction = await nftContract.createToken("https://gateway.pinata.cloud/ipfs/QmXiZvNhPDabzA2W4nrtqUE2DpT8pGBNEGmzUDn5g5NL8w")
        const tx = await transaction.wait()
        // @ts-ignore
        let event = tx.events[0]
        // @ts-ignore
        let value = event.args[2]
        tokenId = value.toNumber()

        let listingPrice = await nftMarketContract.getListingPrice()
        listingPrice = listingPrice.toString()
        const price = 5
        const transactionCreateMarketItem = await nftMarketContract.createMarketItem(nftContract.address, tokenId, price, { value: listingPrice })
        await transactionCreateMarketItem.wait()
      })

        it("Should fetch listingPrice", async function () {
          const listingPrice = await nftMarketContract.getListingPrice()
          expect(listingPrice.toString()).to.equal(ethers.BigNumber.from(ethers.utils.parseEther("0.025")))
        })

        it("Should fetch market items", async function () {
            const marketItems = await nftMarketContract.fetchMarketItems()
            expect(marketItems).to.have.lengthOf(1);
        });

        it("Should fetch my NFTs", async function () {
          const myNfts = await nftMarketContract.fetchMyNfts()
          expect(myNfts).to.have.lengthOf(1);
        });

        it("Should fetch items created", async function () {
          const itemsCreated = await nftMarketContract.fetchItemsCreated()
          expect(itemsCreated).to.have.lengthOf(1);
        });

      it("Should fetch bids of item", async function () {
        const value = 5;

        const transactionCreateBid = await nftMarketContract.connect(buyer).createBid(tokenId, { value: value })
        await transactionCreateBid.wait()

        const itemBids = await nftMarketContract.fetchBidsOfItem(1)
        expect(itemBids).to.have.lengthOf(1);
      });

      it("Shouldn't fetch bids of item if it not exists", async function () {
        const itemBids = nftMarketContract.fetchBidsOfItem(2)
        await expect(itemBids).to.be.revertedWith("The item does not exists")
      });

      it("Should fetch item by id", async function () {
        const item = await nftMarketContract.getItemById(1)
        expect(item.seller).to.eq(owner.address);
      });

      it("Should fetch item by id if it not exists", async function () {
        const itemBids = nftMarketContract.getItemById(2)
        await expect(itemBids).to.be.revertedWith("The item does not exists")
      });
    });
  });
});
