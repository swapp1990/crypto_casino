//[[0, 10, 0, true], [0, 20, 1, true]]

var CardGame = artifacts.require("CardGame");

contract("CardGame", function (accounts) {
  let gameContract;
  let card_hand, player2_card_hand;

  const owner = accounts[0];
  const alice = accounts[1];
  const bob = accounts[2];

  beforeEach(async function () {
    gameContract = await CardGame.deployed();
    card_hand = [
      [0, 0, 10, 0, true],
      [0, 0, 20, 1, true],
      [0, 0, 32, 1, true],
      [0, 0, 5, 2, true],
      [0, 0, 51, 0, true],
    ];
    updated_card_hand = [
      [0, 0, 10, 0, false],
      [1, 0, 20, 1, true],
      [2, 0, 32, 1, true],
      [3, 0, 5, 2, false],
      [4, 0, 51, 0, true],
    ];
    player2_card_hand = [
      [0, 0, 11, 0, true],
      [0, 0, 12, 1, true],
    ];
  });
  it("should deploy contract", async () => {
    console.log("gameContract " + gameContract.address);
    assert(gameContract.address !== "");
  });
  it("should create card hand nfts", async () => {
    let result = await gameContract.mintNewHand(card_hand, { from: alice });
    const nftId = await gameContract.nftId();
    assert(Number(nftId) === card_hand.length);
    const secondNft = await gameContract.getTokenDetails(1);
    // console.log("secondNft ", secondNft);
    assert(Number(secondNft.cardIdx) === 20, "cardIdx should be 20");
    assert(Number(secondNft.nftId) === 1, "nftId should be 1");
    const ownerAddr = await gameContract.getOwnerOf(secondNft.nftId);
    assert(ownerAddr === alice, "owner of card should be alice");

    const tokens = await gameContract.getInHandTokens(alice);
    assert(
      tokens.length == card_hand.length,
      "_inHandTokens alice should be 5"
    );
    const deckIdxTaken = await gameContract.getDeckTaken();
    assert(
      deckIdxTaken.length === card_hand.length,
      "currentDeckTaken len should be 5"
    );
  });
  //   it("should update inhand cards", async () => {
  //     const result = await gameContract.updateHand(updated_card_hand, {
  //       from: alice,
  //     });
  //     const tokens = await gameContract.getInHandTokens(alice);
  //     // tokens.forEach((t) => {
  //     //   console.log(Number(t));
  //     // });
  //     assert(
  //       tokens.length == updated_card_hand.length - 2,
  //       "_inHandTokens alice should be 3"
  //     );
  //   });
  it("should update inhand cards on pair idxs", async () => {
    const result = await gameContract.updateHand([0, 3], { from: alice });
    const handTokens = await gameContract.getInHandTokens(alice);
    // handTokens.forEach((t) => {
    //   console.log("hand ", Number(t));
    // });
    assert(handTokens.length == 3, "_inHandTokens alice should be 3");
    const pairedTokens = await gameContract.getPairedTokens(alice);
    assert(pairedTokens.length == 2, "_pairedTokens alice should be 2");
  });
  it("should create 2nd account hand", async () => {
    let result = await gameContract.mintNewHand(player2_card_hand, {
      from: bob,
    });
    const player2_card_nft = await gameContract.getTokenDetails(5);
    assert(Number(player2_card_nft.cardIdx) === 11, "cardIdx should be 11");
    assert(Number(player2_card_nft.nftId) === 5, "nftId should be 5");
    const ownerAddr = await gameContract.getOwnerOf(player2_card_nft.nftId);
    assert(ownerAddr === bob, "owner of card should be bob");

    const tokens = await gameContract.getInHandTokens(bob);
    assert(
      tokens.length == player2_card_hand.length,
      "_inHandTokens bob should be 2"
    );

    const deckIdxTaken = await gameContract.getDeckTaken();
    // console.log(deckIdxTaken.length);
    assert(deckIdxTaken.length === 7, "currentDeckTaken len should be 7");
  });
  it("should transfer card from alice to bob", async () => {
    toTransforTokenId = 2;
    let result = await gameContract.transferCard(toTransforTokenId, {
      from: bob,
    });
    const ownerAddr = await gameContract.getOwnerOf(toTransforTokenId);
    assert(ownerAddr === bob, "owner of card should be bob");
    const tokens = await gameContract.getInHandTokens(bob);
    assert(tokens.length == 3, "_inHandTokens bob should be 3");
    const tokens2 = await gameContract.getInHandTokens(alice);
    // tokens2.forEach((t) => {
    //   console.log(Number(t));
    // });
    assert(tokens2.length == 2, "_inHandTokens alice should be 2");
  });
  it("should win game for alice", async () => {
    const result = await gameContract.updateHand([1, 4], { from: alice });
    const handTokens = await gameContract.getInHandTokens(alice);
    // handTokens.forEach((t) => {
    //   console.log("hand ", Number(t));
    // });
    assert(handTokens.length == 0, "_inHandTokens alice should be 0");
    const pairedTokens = await gameContract.getPairedTokens(alice);
    // console.log("pairedTokens ", pairedTokens.length);
    assert(pairedTokens.length == 4, "_pairedTokens alice should be 4");
    const gamesWon = await gameContract.getGamesWon(alice);
    assert(gamesWon == 1, "gamesWon alice should be 1");
  });
});
