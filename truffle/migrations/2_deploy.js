var CardGame = artifacts.require("CardGame");

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(CardGame);
};
