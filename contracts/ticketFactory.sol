// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TicketFactory {
    struct Item {
        uint256 eventId;
        uint256 ticketId;
        uint256 price;
        string ticketType;
        address owner;
        bool resellable;
        bool sold;
        uint256 row;
        uint256 column;
    }

    struct EventTickets {
        Item[] items;
    }

    // Mapping from eventId to the collection of tickets for that event
    mapping(uint256 => EventTickets) private ticketsPerEvent;

    // Generate tickets for an event with three categories: typeA, typeB, typeVIP
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

    // Internal helper to add a batch of tickets for a specific event and ticket type
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

    // View function to get all tickets for an event
    function getTicketsByEvent(uint256 eventId) external view returns (Item[] memory) {
        return ticketsPerEvent[eventId].items;
    }
}
