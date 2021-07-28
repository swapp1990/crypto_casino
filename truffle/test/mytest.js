//[[0, 10, 0, true], [0, 20, 1, true]]

var CardGame = artifacts.require("CardGame");

contract("CardGame", function (accounts) {
  let gameContract;
  let card_hand;
  beforeEach(async function () {
    gameContract = await CardGame.deployed();
    card_hand = [
      [0, 10, 0, true],
      [0, 20, 1, true],
    ];
  });
  it("should deploy contract", async () => {
    console.log("gameContract " + gameContract.address);
    assert(gameContract.address !== "");
  });
  it("should create card hand nfts", async () => {
    const result = await gameContract.mintNewHand(card_hand);
    const nftId = await gameContract.nftId();
    assert(Number(nftId) === card_hand.length);
    const firstNft = await gameContract.getTokenDetails(0);
    assert(Number(firstNft.cardIdx) === 10);
    const tokens = await gameContract.getInHandTokens();
    console.log(Number(tokens[0]));
  });
});
