const EventTicketNFT = artifacts.require("EventTicketNFT");
const Events = artifacts.require("Events");
const TicketFactory = artifacts.require("TicketFactory");

module.exports = async function(deployer) {
  // 1️⃣ Deploy the NFT contract
  await deployer.deploy(EventTicketNFT, "EventTicket", "ETK");
  const eventTicketNFTInstance = await EventTicketNFT.deployed();

  // 2️⃣ Deploy TicketFactory with NFT address
  await deployer.deploy(TicketFactory, eventTicketNFTInstance.address);
  const ticketFactoryInstance = await TicketFactory.deployed();

  // 3️⃣ Deploy Events contract with TicketFactory address
  await deployer.deploy(Events, ticketFactoryInstance.address);
  const eventsInstance = await Events.deployed();

  // Optional: if TicketFactory needs to know Events address, set it here
  // await ticketFactoryInstance.setEventsAddress(eventsInstance.address);
};
