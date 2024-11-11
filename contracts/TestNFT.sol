// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

//TASK: Make it such that an user can mint a max amount of NFTs

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract TestNFT is ERC721, ERC721Enumerable, ERC721URIStorage {
    uint256 private _nextTokenId;
    uint256 public maxSupply = 4;

    // Array to store predefined URIs
    string[4] private tokenURIs = [
        "ipfs://QmWbDCdTv5Pvimr9avwvzXGbreBYzNEkGFqPbGXM9vn7yr",
        "ipfs://QmWpuT1BVJJeszDJLna7AQkjqRKs8u34qg6xwNmNCNuNxo",
        "ipfs:///QmcTRQ8iyE7XQoBhQAtFHwifLgBRTG7kWcFzZ6jGiKZAsg",
        "ipfs:///QmbiiLWZgbVxJngWUedptifvxnVGcM5GMGQxLn6RRUrvHW"
    ];

    constructor() ERC721("TestNFT", "TNFT") {}

    function safeMint() public {
        require(_nextTokenId < maxSupply, "Max supply reached");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURIs[tokenId]);
    }

    // The following functions are overrides required by Solidity.

    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
