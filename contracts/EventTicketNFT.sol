// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract EventTicketNFT is ERC721URIStorage {
    uint256 public nextTokenId = 1;

    constructor(string memory name, string memory symbol) ERC721(name, symbol) {}

    function mintTicket(address to, string memory tokenURI) external {
        uint256 tokenId = nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        nextTokenId++;
    }
}
