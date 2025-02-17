// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TicketFactory {
    // Define a struct named Item
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

    // Define a mapping to store arrays of Item structs
    mapping(uint256 => Item[]) public items_map;

    // Variable to keep track of the current array ID
    uint public currentArrayId;

        // Function to add a new array of structs to the mapping
    function addItems(
        uint256 _eventId, 
        uint256 _typeAQty, //15
        uint256 _typeAPrice, //10
        uint256 _typeBQty, //15
        uint256 _typeBPrice, //9
        uint256 _typeVIPQty, 
        uint256 _typeVIPPrice,
        bool _resellable
    ) 
        public 
    {
        // Get a reference to the storage array
        Item[] storage storageArray = items_map[currentArrayId];
        
        addItemBatch(storageArray, _eventId, _typeAQty, _typeAPrice, "typeA", _resellable);
        addItemBatch(storageArray, _eventId, _typeBQty, _typeBPrice, "typeB", _resellable);
        addItemBatch(storageArray, _eventId, _typeVIPQty, _typeVIPPrice, "typeVIP", _resellable);

        currentArrayId++;
    }

    function addItemBatch(
        Item[] storage storageArray,
        uint256 _eventId, 
        uint256 _quantity, 
        uint256 _price, 
        string memory _itemType, 
        bool _resellable
    ) 
        internal 
    {
        uint256 currentRow = 1;
        uint256 currentColumn = 1;

        for (uint i = 0; i < _quantity; i++) {
            storageArray.push(Item(_eventId, i, _price, _itemType, address(0), _resellable, false, currentRow, currentColumn));
            currentColumn++;
            if (currentColumn > 10) {
                currentColumn = 1;
                currentRow++;
            }
        }
    }

    function buyTicket(uint256 eventId, uint256 ticketId) public payable {
        // Find the ticket in the array for the given event
        Item[] storage tickets = items_map[eventId];
        bool found = false;
        
        for (uint256 i = 0; i < tickets.length; i++) {
            if (tickets[i].ticketId == ticketId) {
                found = true;
                require(!tickets[i].sold, "Ticket already sold");
                require(msg.value == tickets[i].price, "Incorrect ticket price");

                // Update the ticket owner and mark as sold
                tickets[i].owner = msg.sender;
                tickets[i].sold = true;

                // Emit the event
                break;
            }
        }

        // If the ticket was not found, revert the transaction
        require(found, "Ticket not found");
    }

    function getItem(uint arrayId, uint index) public view 
    returns (uint256 row, uint256 column, string memory _type) {
        require(index < items_map[arrayId].length, "Index out of bounds");
        Item storage item = items_map[arrayId][index];
        return (item.row, item.column, item.ticketType);
    }
    
    function getItemsByEvent(uint256 key) public view returns (Item[] memory) {
        return items_map[key];
    }
}