// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./TicketFactory.sol";

contract Events {
    // Define a struct to hold event details
    struct Event {
        uint256 eventId;
        string title;
        string description;
        string category;
        string place;
        uint256 date; // Using a Unix timestamp for date
        uint256 ticketsSold;
        bool isActive;
    }

    // Store events in a mapping by ID
    mapping(uint256 => Event) public events;

    // Store all event IDs for iteration
    uint256[] public eventIds;

    // Counter for total events created
    uint256 public totalEvents;

    // Event to notify when a new event is created
    event EventCreated(uint256 eventId, string title, string place);

    TicketFactory public ticketFactory;

    // Initialize the TicketFactory address when deploying Events
    constructor(address _ticketFactoryAddress) {
        ticketFactory = TicketFactory(_ticketFactoryAddress);
    }

    // Function to create a new event
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

    // Function to display all events
    function displayEvents() external view returns (Event[] memory) {
        Event[] memory allEvents = new Event[](totalEvents);
        for (uint256 i = 0; i < totalEvents; i++) {
            allEvents[i] = events[eventIds[i]];
        }
        return allEvents;
    }

    // Function to get event details by ID
    function getEvent(uint256 _eventId) external view returns (Event memory) {
        require(_eventId < totalEvents, "Event does not exist");
        return events[_eventId];
    }

    function getEventsCount() public view returns (uint256) {
        return totalEvents;
    }
}
