// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

contract TicketFactory {
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

    // Mapping from eventId to tickets
    mapping(uint256 => EventTickets) private ticketsPerEvent;

    // ✅ Mapping to track events owned by each address
    mapping(address => uint256[]) private ownedEventIds;
    mapping(address => mapping(uint256 => bool)) private hasEvent; // for duplicate prevention

    // Generate tickets for an event with three categories
    function generateEventTickets(
        uint256 eventId,
        uint256 typeAQty,
        uint256 typeAPrice,
        uint256 typeBQty,
        uint256 typeBPrice,
        uint256 typeVIPQty,
        uint256 typeVIPPrice,
        bool resellable
    ) external {
        _addTickets(eventId, typeAQty, typeAPrice, "typeA", resellable);
        _addTickets(eventId, typeBQty, typeBPrice, "typeB", resellable);
        _addTickets(eventId, typeVIPQty, typeVIPPrice, "typeVIP", resellable);
    }

    // Internal function to create a batch of tickets
    function _addTickets(
        uint256 eventId,
        uint256 quantity,
        uint256 price,
        string memory ticketType,
        bool resellable
    ) internal {
        EventTickets storage eventTickets = ticketsPerEvent[eventId];

        uint256 currentRow = 1;
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
            if (currentColumn > 10) {
                currentColumn = 1;
                currentRow++;
            }
        }
    }

    // ✅ Buy ticket and track ownership
    function buyTicket(uint256 eventId, uint256 ticketId) external payable {
        EventTickets storage eventTickets = ticketsPerEvent[eventId];
        require(ticketId < eventTickets.items.length, "Invalid ticketId");

        Item storage ticket = eventTickets.items[ticketId];

        require(!ticket.sold, "Ticket already sold");
        require(msg.value == ticket.price, "Incorrect payment amount");

        ticket.owner = msg.sender;
        ticket.sold = true;

        // Track event ownership only once per user
        if (!hasEvent[msg.sender][eventId]) {
            ownedEventIds[msg.sender].push(eventId);
            hasEvent[msg.sender][eventId] = true;
        }

        // Funds could be forwarded to event organizer here if needed
        // payable(organizer).transfer(msg.value);
    }

    // View function to get unsold tickets for an event
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

    // ✅ Public view to get all event IDs a user has purchased tickets for
    function getOwnedEventIds(address user) external view returns (uint256[] memory) {
        return ownedEventIds[user];
    }
}
