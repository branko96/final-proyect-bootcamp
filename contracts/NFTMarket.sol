pragma solidity ^0.8.9;

import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "hardhat/console.sol";

contract NFTMarket is ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _itemIds;
    Counters.Counter private _itemsSold;

    address payable owner;
    uint256 listingPrice = 0.025 ether;

    constructor(){
         owner = payable(msg.sender);
    }

    struct MarketItem {
        uint itemId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        address payable owner;
        uint256 price;
        bool sold;
    }

    struct Bid {
        uint itemId;
        address buyer;
        uint256 value;
    }

    mapping(uint256 => MarketItem) private idToMarketItem;
    mapping(uint256 => Bid[]) private tokenBids;

    modifier isOwner(uint256 itemId) {
        require(msg.sender == idToMarketItem[itemId].owner, "You are not the owner of this item");
        _;
    }

    modifier itemExists(uint256 itemId) {
        require(idToMarketItem[itemId].seller != address(0), "The item does not exists");
        _;
    }

    event MarketItemCreated (
        uint indexed itemId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address owner,
        uint256 price,
        bool sold
    );

    function getListingPrice() public view returns (uint256) {
        return listingPrice;
    }

    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) public payable nonReentrant {
        require(price > 0, "Price must be at least 1 wei");
        require(msg.value == listingPrice, "You must pay the listing price");

        _itemIds.increment();
        uint256 itemId = _itemIds.current();

        idToMarketItem[itemId] = MarketItem(
            itemId,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(msg.sender),
            price,
            false
        );

        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);

        emit MarketItemCreated(
            itemId,
            nftContract,
            tokenId,
            msg.sender,
            msg.sender,
            price,
            false
        );
    }

    function createBid(
        uint256 itemId
    ) public payable nonReentrant itemExists(itemId) {
        require(msg.sender != idToMarketItem[itemId].owner, "You cannot bid on your own item");
        require(msg.value > 0, "Bid must be at least 1 wei");

        bool hasPreviousBid = false;
        for (uint i = 0; i < tokenBids[itemId].length; i++) {
            if (tokenBids[itemId][i].buyer == msg.sender) {
                tokenBids[itemId][i].value += msg.value;
                hasPreviousBid = true;
                return;
            }
        }

        if (!hasPreviousBid) {
            Bid memory bid = Bid(
                itemId,
                payable(msg.sender),
                msg.value
            );
            tokenBids[itemId].push(bid);
        }
    }

    function createMarketSale(
        address nftContract,
        uint256 itemId,
        address buyer
    ) public payable nonReentrant isOwner(itemId) {
        bool exists = false;
        uint price = 0;
        for (uint i = 0; i < tokenBids[itemId].length; i++) {
            if (tokenBids[itemId][i].buyer == buyer) {
                exists = true;
                price = tokenBids[itemId][i].value;
            }
        }
        require(exists == true, "The bid should exist for the buyer");

        idToMarketItem[itemId].seller.transfer(price);
        IERC721(nftContract).transferFrom(address(this), buyer, itemId);
        idToMarketItem[itemId].owner = payable(buyer);
        idToMarketItem[itemId].sold = true;
        _itemsSold.increment();
        payable(owner).transfer(listingPrice);

        // retrieve the bids to another buyers
        for (uint i = 0; i < tokenBids[itemId].length; i++) {
            Bid memory bid = tokenBids[itemId][i];
            if (bid.buyer != buyer) {
                payable(bid.buyer).transfer(bid.value);
            }
        }
    }

    function fetchMarketItems() public view returns (MarketItem[] memory) {
        uint256 itemCount = _itemIds.current();
        uint256 unsoldItemCount = _itemIds.current() - _itemsSold.current();
        uint256 currentIndex = 0;

        MarketItem[] memory items = new MarketItem[](unsoldItemCount);
        for (uint256 i = 0; i < itemCount; i++) {
            if (!idToMarketItem[i + 1].sold) {
                uint256 currentId = i + 1;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return items;
    }


    function fetchMyNfts() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].owner == msg.sender) {
                uint currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return items;
    }

    function fetchItemsCreated() public view returns (MarketItem[] memory) {
        uint totalItemCount = _itemIds.current();
        uint itemCount = 0;
        uint currentIndex = 0;

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                itemCount += 1;
            }
        }

        MarketItem[] memory items = new MarketItem[](itemCount);

        for (uint i = 0; i < totalItemCount; i++) {
            if (idToMarketItem[i + 1].seller == msg.sender) {
                uint currentId = idToMarketItem[i + 1].itemId;
                MarketItem storage currentItem = idToMarketItem[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }

        return items;
    }

    function fetchBidsOfItem(uint256 itemId) public view itemExists(itemId) returns (Bid[] memory) {
        return tokenBids[itemId];
    }

    function getItemById(uint256 itemId) public view itemExists(itemId) returns (MarketItem memory) {
        return idToMarketItem[itemId];
    }
}
