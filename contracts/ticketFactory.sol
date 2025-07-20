// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract TicketFactory {
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    struct Item {
        uint256 eventId;
        uint256 ticketId;
        uint256 price;
        string ticketType;
        address owner;
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

    mapping(address => bool) public authorizedVerifiers;
    mapping(uint256 => mapping(address => bool)) public eventVerifiers;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }

    modifier onlyVerifier(uint256 eventId) {
        require(
            authorizedVerifiers[msg.sender] || eventVerifiers[eventId][msg.sender],
            "Not an authorized verifier"
        );
        _;
    }

    function authorizeVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = true;
    }

    function revokeVerifier(address verifier) external onlyOwner {
        authorizedVerifiers[verifier] = false;
    }

    function authorizeEventVerifier(uint256 eventId, address verifier) external onlyOwner {
        eventVerifiers[eventId][verifier] = true;
    }

    function revokeEventVerifier(uint256 eventId, address verifier) external onlyOwner {
        eventVerifiers[eventId][verifier] = false;
    }

    /// 🔷 Generates tickets for all sections with correct row/column layout
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
    ) external onlyOwner {
        uint256 vipEndRow = _addTickets(eventId, vipQty, vipPrice, "VIP", resellable, 1, vipSeatsPerRow);

        uint256 generalAStartRow = vipEndRow + 1;
        uint256 generalAEndRow = _addTickets(eventId, generalAQty, generalAPrice, "GeneralA", resellable, generalAStartRow, generalASeatsPerRow);

        uint256 generalBStartRow = generalAEndRow + 1;
        _addTickets(eventId, generalBQty, generalBPrice, "GeneralB", resellable, generalBStartRow, generalBSeatsPerRow);
    }

    /// 🔷 Adds tickets for a section with dynamic row/column assignment
    function _addTickets(
        uint256 eventId,
        uint256 quantity,
        uint256 price,
        string memory ticketType,
        bool resellable,
        uint256 startingRow,
        uint256 seatsPerRow
    ) internal returns (uint256 lastRowUsed) {
        if (quantity == 0 || seatsPerRow == 0) return startingRow - 1;

        EventTickets storage eventTickets = ticketsPerEvent[eventId];

        uint256 currentRow = startingRow;
        uint256 currentColumn = 1;

        for (uint256 i = 0; i < quantity; i++) {
            uint256 ticketId = eventTickets.items.length;

            eventTickets.items.push(Item({
                eventId: eventId,
                ticketId: ticketId,
                price: price,
                ticketType: ticketType,
                owner: address(0),
                resellable: resellable,
                sold: false,
                scanned: false,
                row: currentRow,
                column: currentColumn
            }));

            currentColumn++;
            if (currentColumn > seatsPerRow) {
                currentColumn = 1;
                currentRow++;
            }
        }

        lastRowUsed = currentColumn > 1 ? currentRow : currentRow - 1;
    }

    function buyTicket(uint256 eventId, uint256 ticketId) external payable {
        EventTickets storage eventTickets = ticketsPerEvent[eventId];
        require(ticketId < eventTickets.items.length, "Invalid ticketId");

        Item storage ticket = eventTickets.items[ticketId];
        require(!ticket.sold, "Ticket already sold");
        require(msg.value == ticket.price, "Incorrect payment amount");

        ticket.owner = msg.sender;
        ticket.sold = true;

        if (!hasEvent[msg.sender][eventId]) {
            ownedEventIds[msg.sender].push(eventId);
            hasEvent[msg.sender][eventId] = true;
        }
    }

    function getTicketsByEvent(uint256 eventId) external view returns (Item[] memory) {
        EventTickets storage eventTickets = ticketsPerEvent[eventId];
        uint256 total = eventTickets.items.length;

        uint256 unsoldCount = 0;
        for (uint256 i = 0; i < total; i++) {
            if (!eventTickets.items[i].sold) {
                unsoldCount++;
            }
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

    function getOwnedEventIds(address user) external view returns (uint256[] memory) {
        return ownedEventIds[user];
    }

    function scanTicket(uint256 eventId, uint256 ticketId) external onlyVerifier(eventId) {
        Item storage ticket = ticketsPerEvent[eventId].items[ticketId];
        require(ticket.sold, "Ticket not sold");
        require(!ticket.scanned, "Ticket already scanned");
        ticket.scanned = true;
    }
}
