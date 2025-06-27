const EventTicketNFT = artifacts.require("EventTicketNFT");
const Events = artifacts.require("Events");
const TicketFactory = artifacts.require("TicketFactory");

module.exports = async function(deployer) {
  await deployer.deploy(EventTicketNFT, "EventTicket", "ETK");
  const eventTicketNFTInstance = await EventTicketNFT.deployed();

  await deployer.deploy(TicketFactory);
  const ticketFactoryInstance = await TicketFactory.deployed();

  await deployer.deploy(Events, ticketFactoryInstance.address);
  
  // If Events or TicketFactory need EventTicketNFT address, you can pass it here
  // e.g., await ticketFactoryInstance.setNFTAddress(eventTicketNFTInstance.address);
};
