// 1_initial_migration.js
const Events = artifacts.require("Events");
const TicketFactory = artifacts.require("TicketFactory");

module.exports = async function(deployer) {
  await deployer.deploy(TicketFactory);
  const ticketFactoryInstance = await TicketFactory.deployed();
  const ticketFactoryAddress = ticketFactoryInstance.address;
  
  await deployer.deploy(Events, ticketFactoryAddress);
};
