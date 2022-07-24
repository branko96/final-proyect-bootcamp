pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract NFT is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter public _tokenIds;
    address contractAddress;

    event TokenCreated(address indexed owner, uint256 indexed tokenId);

    constructor (address marketplaceAddress) ERC721("Metaverse Tokens", "MTT"){
        contractAddress = marketplaceAddress;
    }

    function createToken (string memory tokenURI) public returns (uint256) {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId);
        _setTokenURI(newItemId, tokenURI);
        setApprovalForAll(contractAddress, true);
        emit TokenCreated(msg.sender, newItemId);
        return newItemId;
    }
}
