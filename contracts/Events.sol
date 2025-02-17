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

    TicketFactory public ticketFactory;

    // Store events in an array
    Event[] public events;

    // Event to notify when a new event is created
    event EventCreated(uint256 eventId, string title, string place);

    // Constructor to initialize the TicketFactory address
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
    ) 
        external 
    {
        uint256 eventId = events.length;

        events.push(Event({
            eventId: eventId,
            title: _title,
            description: _description,
            category: _category,
            place: _place,
            date: _eventDate,
            ticketsSold: 0,
            isActive: true
        }));

        emit EventCreated(eventId, _title, _place);
    }

    function generateEventTickets(
        uint256 _typeAQty, 
        uint256 _typeAPrice,
        uint256 _typeBQty, 
        uint256 _typeBPrice,
        uint256 _typeVIPQty, 
        uint256 _typeVIPPrice,
        bool _resellable
    )
        external
    {
        require(events.length > 0, "No events created yet");

        uint256 eventId = events.length - 1;

        // Call addItems function of the TicketFactory contract
        ticketFactory.addItems(
        eventId, 
        _typeAQty, 
        _typeAPrice, 
        _typeBQty, 
        _typeBPrice, 
        _typeVIPQty, 
        _typeVIPPrice,
        _resellable);
    }

    // Function to display all events
    function displayEvents() external view returns (Event[] memory) {
        return events;
    }
    // Function to get event details by ID
    function getEvent(uint256 _eventId) external view returns (Event memory) {
        require(_eventId < events.length, "Event does not exist");
        return events[_eventId];
    }

    function getEventsCount() public view returns (uint256) {
        return events.length;
    }
}
