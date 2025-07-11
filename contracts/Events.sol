// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./TicketFactory.sol";

contract Events {
    // Define a struct to hold event details
    struct Event {
        uint256 eventId;
        string title;
        string description;
        string category;
        string place;
        uint256 date; // Unix timestamp
        uint256 ticketsSold;
        bool isActive;
    }

    // Mapping from eventId to event details
    mapping(uint256 => Event) public events;

    // List of event IDs
    uint256[] public eventIds;

    // Counter for total events created
    uint256 public totalEvents;

    // TicketFactory reference
    TicketFactory public ticketFactory;

    // Event emitted when a new event is created
    event EventCreated(uint256 eventId, string title, string place);

    // Constructor to initialize TicketFactory address
    constructor(address _ticketFactoryAddress) {
        ticketFactory = TicketFactory(_ticketFactoryAddress);
    }

    // Create a new event
    function createEvent(
        string memory _title,
        string memory _description,
        string memory _category,
        string memory _place,
        uint256 _eventDate
    ) external {
        uint256 eventId = totalEvents;

        events[eventId] = Event({
            eventId: eventId,
            title: _title,
            description: _description,
            category: _category,
            place: _place,
            date: _eventDate,
            ticketsSold: 0,
            isActive: true
        });

        eventIds.push(eventId);
        totalEvents++;

        emit EventCreated(eventId, _title, _place);
    }

    // Return all created events
    function displayEvents() external view returns (Event[] memory) {
        Event[] memory allEvents = new Event[](totalEvents);
        for (uint256 i = 0; i < totalEvents; i++) {
            allEvents[i] = events[eventIds[i]];
        }
        return allEvents;
    }

    // Get a single event by ID
    function getEvent(uint256 _eventId) external view returns (Event memory) {
        require(_eventId < totalEvents, "Event does not exist");
        return events[_eventId];
    }

    // Get total number of events
    function getEventsCount() public view returns (uint256) {
        return totalEvents;
    }

    // ✅ Get events where msg.sender owns at least one ticket
    function getMyEvents() external view returns (Event[] memory) {
        uint256[] memory owned = ticketFactory.getOwnedEventIds(msg.sender);
        Event[] memory result = new Event[](owned.length);

        for (uint256 i = 0; i < owned.length; i++) {
            result[i] = events[owned[i]];
        }

        return result;
    }
}
