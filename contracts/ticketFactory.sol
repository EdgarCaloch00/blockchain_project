// SPDX-License-Identifier: MIT
pragma solidity ^ 0.8.17;

import "./EventTicketNFT.sol";

contract TicketFactory {
    struct Item {
        uint256 eventId;
        uint256 ticketId;
        uint256 tokenId;      // NFT token ID
        uint256 price;
        string ticketType;
        bool resellable;
        bool sold;
        bool scanned;
        uint256 row;
        uint256 column;
    }

    struct EventTickets {
        Item[] items;
    }

    mapping(uint256 => EventTickets) private ticketsPerEvent;
    mapping(address => uint256[]) private ownedEventIds;
    mapping(address => mapping(uint256 => bool)) private hasEvent;
    mapping(uint256 => uint256) public tokenIdToTicketId; // NFT → ticket
    mapping(uint256 => uint256) public tokenIdToEventId;  // NFT → event
    mapping(uint256 => address) public eventCreators;

    EventTicketNFT public ticketNFT;

    modifier onlyEventCreator(uint256 eventId) {
        require(msg.sender == eventCreators[eventId], "Not event creator");
        _;
    }

    event TicketPurchased(
        address indexed buyer,
        uint256 indexed eventId,
        uint256 indexed ticketId,
        uint256 price,
        uint256 tokenId
    );

    event TicketScanned(
        uint256 indexed eventId,
        uint256 indexed ticketId,
        address indexed scanner
    );

    event TicketTransferred(
        address indexed from,
        address indexed to,
        uint256 indexed eventId,
        uint256 ticketId,
        uint256 tokenId
    );

    constructor(address _ticketNFT) {
        ticketNFT = EventTicketNFT(_ticketNFT);
    }

    // -------------------- Ticket generation --------------------
    function generateEventTickets(
        uint256 eventId,
        uint256 vipQty,
        uint256 vipPrice,
        uint256 vipSeatsPerRow,
        uint256 generalAQty,
        uint256 generalAPrice,
        uint256 generalASeatsPerRow,
        uint256 generalBQty,
        uint256 generalBPrice,
        uint256 generalBSeatsPerRow,
        bool resellable
    ) external {
        require(eventCreators[eventId] == address(0), "Event already created");
        eventCreators[eventId] = msg.sender;

        uint256 vipEndRow = _addTickets(eventId, vipQty, vipPrice, "VIP", resellable, 1, vipSeatsPerRow);
        uint256 generalAStartRow = vipEndRow + 1;
        uint256 generalAEndRow = _addTickets(eventId, generalAQty, generalAPrice, "GeneralA", resellable, generalAStartRow, generalASeatsPerRow);
        uint256 generalBStartRow = generalAEndRow + 1;
        _addTickets(eventId, generalBQty, generalBPrice, "GeneralB", resellable, generalBStartRow, generalBSeatsPerRow);
    }

    function _addTickets(
        uint256 eventId,
        uint256 quantity,
        uint256 price,
        string memory ticketType,
        bool resellable,
        uint256 startingRow,
        uint256 seatsPerRow
    ) internal returns(uint256 lastRowUsed) {
        if (quantity == 0 || seatsPerRow == 0) return startingRow - 1;

        EventTickets storage eventTickets = ticketsPerEvent[eventId];
        uint256 currentRow = startingRow;
        uint256 currentColumn = 1;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 ticketId = eventTickets.items.length;

            eventTickets.items.push(
                Item({
                    eventId: eventId,
                    ticketId: ticketId,
                    tokenId: 0, // NFT not minted yet
                    price: price,
                    ticketType: ticketType,
                    resellable: resellable,
                    sold: false,
                    scanned: false,
                    row: currentRow,
                    column: currentColumn
                })
            );

            currentColumn++;
            if (currentColumn > seatsPerRow) {
                currentColumn = 1;
                currentRow++;
            }
        }

        lastRowUsed = currentColumn > 1 ? currentRow : currentRow - 1;
    }

    function buyTicketAndSetTokenId(
        uint256 eventId,
        uint256 ticketId,
        uint256 tokenId
    ) external payable {
    EventTickets storage eventTickets = ticketsPerEvent[eventId];
        require(ticketId < eventTickets.items.length, "Invalid ticketId");

    Item storage ticket = eventTickets.items[ticketId];
        require(!ticket.sold, "Ticket already sold");
        require(msg.value == ticket.price, "Incorrect payment amount");

        // Step 1: Mark sold
        ticket.sold = true;

        // Step 2: Set tokenId
        require(ticket.tokenId == 0, "TokenId already set");
        ticket.tokenId = tokenId;
        tokenIdToTicketId[tokenId] = ticketId;
        tokenIdToEventId[tokenId] = eventId;

        // Step 3: Track event ownership
        if (!hasEvent[msg.sender][eventId]) {
            ownedEventIds[msg.sender].push(eventId);
            hasEvent[msg.sender][eventId] = true;
        }

    emit TicketPurchased(msg.sender, eventId, ticketId, ticket.price, tokenId);
    }


    // -------------------- Scan --------------------
    function scanTicket(uint256 eventId, uint256 ticketId) external onlyEventCreator(eventId) {
        Item storage ticket = ticketsPerEvent[eventId].items[ticketId];
        require(ticket.sold, "Ticket not sold");
        require(!ticket.scanned, "Ticket already scanned");
        ticket.scanned = true;

        emit TicketScanned(eventId, ticketId, msg.sender);
    }

    // -------------------- Transfer Ticket --------------------
    function transferTicket(uint256 tokenId, address newOwner) external {
        require(newOwner != address(0), "Invalid new owner");
        require(ticketNFT.ownerOf(tokenId) == msg.sender, "Not NFT owner");

        uint256 ticketId = tokenIdToTicketId[tokenId];
        uint256 eventId = tokenIdToEventId[tokenId];
        Item storage ticket = ticketsPerEvent[eventId].items[ticketId];

        require(ticket.resellable, "Ticket not resellable");

        // Transfer NFT
        ticketNFT.safeTransferFrom(msg.sender, newOwner, tokenId);

        // Track event ownership for new owner
        if (!hasEvent[newOwner][eventId]) {
            ownedEventIds[newOwner].push(eventId);
            hasEvent[newOwner][eventId] = true;
        }

        emit TicketTransferred(msg.sender, newOwner, eventId, ticketId, tokenId);
    }

    // -------------------- Getters --------------------
    function getTicketsByEvent(uint256 eventId) external view returns(Item[] memory) {
        EventTickets storage eventTickets = ticketsPerEvent[eventId];
        uint256 total = eventTickets.items.length;

        uint256 unsoldCount = 0;
        for (uint256 i = 0; i < total; i++) {
            if (!eventTickets.items[i].sold) unsoldCount++;
        }

        Item[] memory unsoldTickets = new Item[](unsoldCount);
        uint256 index = 0;
        for (uint256 i = 0; i < total; i++) {
            if (!eventTickets.items[i].sold) {
                unsoldTickets[index] = eventTickets.items[i];
                index++;
            }
        }

        return unsoldTickets;
    }

    function getOwnedEventIds(address user) external view returns(uint256[] memory) {
        return ownedEventIds[user];
    }

    function getTicketById(uint256 eventId, uint256 ticketId) external view returns(Item memory) {
        require(ticketId < ticketsPerEvent[eventId].items.length, "Invalid ticketId");
        return ticketsPerEvent[eventId].items[ticketId];
    }
}
