import React, { Component } from "react";
import * as card_utils from "../utils/card_utils";
import Store from "../stores/store";
const store = Store.store;
const emitter = Store.emitter;

const Styles = {
  mainBtn: {
    height: "40px",
    width: "200px",
    color: "#FFCA0E",
    border: "1px solid #000000",
    borderRadius: "10px 10px 10px 10px",
    fontSize: "15px",
  },
  playerCardBtn: {
    height: "80px",
    width: "100px",
    backgroundColor: "white",
    // border: "1px solid #000000",
    // borderRadius: "10px 10px 10px 10px",
  },
  oppoCardBtn: {
    height: "50px",
    width: "50px",
    backgroundColor: "white",
    border: "1px solid #000000",
    borderRadius: "10px 10px 10px 10px",
  },
};

class CardGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deck_set: [],
      deck_idx: 0,
      init_cardsInHand: 5,
      served_cards: [],
      opponents_cards: [],
      player_selected_cards: [],
      player_success_pairs: [],
      game_won: false,
      contract: null,
    };
  }
  getCompressed(addr) {
    const len = addr.length;
    return addr.substring(0, 6) + "..." + addr.substring(len - 5, len);
  }
  async componentWillMount() {
    // let cards = [this.getCardObjByIdx(23), this.getCardObjByIdx(34)];
    // this.setState({ served_cards: cards });
    // let oppo_cards = [
    //   {
    //     address: "0x099E...C2Fd4",
    //     cards: [
    //       {
    //         cardValue: "6",
    //         deck_idx: "0",
    //         idx: "32",
    //         name: "6♠",
    //         suitTypeIdx: 2,
    //       },
    //       {
    //         cardValue: "6",
    //         deck_idx: "0",
    //         idx: "32",
    //         name: "6♠",
    //         suitTypeIdx: 2,
    //       },
    //       {
    //         cardValue: "6",
    //         deck_idx: "0",
    //         idx: "32",
    //         name: "6♠",
    //         suitTypeIdx: 2,
    //       },
    //       {
    //         cardValue: "6",
    //         deck_idx: "0",
    //         idx: "32",
    //         name: "6♠",
    //         suitTypeIdx: 2,
    //       },
    //       {
    //         cardValue: "6",
    //         deck_idx: "0",
    //         idx: "32",
    //         name: "6♠",
    //         suitTypeIdx: 2,
    //       },
    //     ],
    //   },
    //   {
    //     address: "0x099E4E5Bb2b01a80A49D237317b2d868658C2Fd4",
    //     cards: [
    //       {
    //         cardValue: "6",
    //         deck_idx: "0",
    //         idx: "32",
    //         name: "6♠",
    //         suitTypeIdx: 2,
    //       },
    //     ],
    //   },
    // ];
    // this.setState({ opponents_cards: oppo_cards });

    emitter.on("StoreUpdated", async () => {
      this.setState({ contract: store.getStore().dapp_contract }, async () => {
        console.log("updated contract ", this.state.contract);
        if (this.state.contract) {
          this.displayHand();
        }
      });
    });
  }

  async displayHand() {
    let nftId = await this.state.contract.methods.nftId().call();
    console.log("nftId ", nftId);
    let served_cards = [];
    let inHandTokens = await this.state.contract.methods
      .getInHandTokens(store.getStore().account)
      .call();
    console.log("inHandTokens ", inHandTokens);

    for (var i = 0; i < inHandTokens.length; i++) {
      const nft = await this.state.contract.methods
        .getTokenDetails(inHandTokens[i])
        .call();
      let card = card_utils.getCardObjByIdx(nft.cardIdx);
      card.deck_idx = nft.deckIdx;
      served_cards.push(card);
    }

    // for (var i = 0; i < nftId; i++) {
    //   const nft = await this.state.contract.methods.getTokenDetails(i).call();
    //   console.log(nft);
    //   const owner = await this.state.contract.methods.getOwnerOf(i).call();
    //   console.log(owner);
    // }

    this.setState({ served_cards: served_cards });

    //show opponents hands
    let players = await this.state.contract.methods.getPlayers().call();
    console.log("players ", players);
    let opponents = players.filter((p) => p != store.getStore().account);
    console.log("opponents ", opponents);
    let opponents_cards = [];
    for (let i = 0; i < opponents.length; i++) {
      let opponentCardTokens = await this.state.contract.methods
        .getInHandTokens(opponents[i])
        .call();
      //   console.log("opponentCardTokens ", opponentCardTokens);
      let opponentObj = {
        address: this.getCompressed(opponents[i]),
        cards: [],
      };
      for (var j = 0; j < opponentCardTokens.length; j++) {
        const nft = await this.state.contract.methods
          .getTokenDetails(opponentCardTokens[j])
          .call();
        let card = card_utils.getCardObjByIdx(nft.cardIdx);
        card.deck_idx = nft.deckIdx;
        opponentObj.cards.push(card);
      }
      console.log(opponentObj);
      opponents_cards.push(opponentObj);
    }

    // console.log("opponents_cards ", opponents_cards);
    this.setState({ opponents_cards: opponents_cards });
  }

  async initDeck() {
    var deckSet = [];
    for (var i = 1; i <= 52; i++) {
      deckSet.push(i);
    }
    let deckIdxsTaken = await this.state.contract.methods.getDeckTaken().call();
    deckIdxsTaken = deckIdxsTaken.map((i) => Number(i));
    console.log("deckIdxsTaken ", deckIdxsTaken);
    deckSet = deckSet.filter((i) => !deckIdxsTaken.includes(i));
    console.log("deckSet len ", deckSet.length);
    this.setState({ deck_set: deckSet });
    return deckSet;
  }
  chooseCardsFromDeck(count, deckSet) {
    // choose random cards idxs
    let randomIdxs = card_utils.pickMultipleRandomly(deckSet, count);
    let pickedCards = [];
    randomIdxs.forEach((idx) => {
      let cardObj = card_utils.getCardObjByIdx(idx);
      cardObj.deck_idx = this.state.deck_idx;
      pickedCards.push(cardObj);
    });
    return pickedCards;
  }
  async getNewHand() {
    let deckSet = await this.initDeck();
    let chosenCards = this.chooseCardsFromDeck(
      this.state.init_cardsInHand,
      deckSet
    );
    console.log(chosenCards);
    let nftList = [];
    chosenCards.forEach((c, i) => {
      nftList.push([c.deck_idx, c.idx, c.suitTypeIdx, true]);
    });
    console.log("nftList ", nftList);
    if (this.state.contract) {
      let result = await this.state.contract.methods
        .mintNewHand(nftList)
        .send({
          from: store.getStore().account,
          value: 0,
          gasPrice: 1000000000,
          gasLimit: 210000,
        })
        .on("transactionHash", (hash) => {
          console.log("transactionHash ", hash);
          if (this.state.contract.events.HandMinted) {
            this.state.contract.events.HandMinted({}, async (error, event) => {
              console.log("HandMinted ", event);
              this.displayHand();
            });
          }
        })
        .on("error", (error) => {
          window.alert("Error ", error);
        });
    } else {
      console.log("no contract found");
    }
  }

  //Render events/methods
  getCardColor(card) {
    if (card.suitTypeIdx < 2) {
      return "text-red-500";
    } else {
      return "text-black";
    }
  }
  focusCardClass(card) {
    if (this.state.player_selected_cards.find((c) => c.name == card.name)) {
      return "border-2 border-red-500";
    } else {
      return "";
    }
  }

  //player card events
  selectPlayerCard(card) {
    let cards = this.state.player_selected_cards;
    if (!cards.find((c) => c.idx == card.idx)) {
      if (cards.length >= 2) {
        cards.pop();
      }
      cards.push(card);
    } else {
      cards = cards.filter((c) => c.idx != card.idx);
    }
    this.setState({ player_selected_cards: cards });
  }
  pairCards() {
    let cards = this.state.player_selected_cards;
    if (cards.length != 2) return;
    let card1 = cards[0];
    let card2 = cards[1];
    //Same suit: remove
    if (card1.suitTypeIdx == card2.suitTypeIdx) {
      this.removeCardsFromPlayerDeck([card1, card2]);
      this.state.player_success_pairs.push({
        card1: card1,
        card2: card2,
      });
      //   console.log(this.state.player_success_pairs);
    }
  }
  removeCardsFromPlayerDeck(cardsToRemove) {
    let cardsInHand = this.state.served_cards;
    if (cardsInHand.length < 2) return;
    cardsInHand = cardsInHand.filter((c) => {
      return cardsToRemove.every((f) => {
        return f.idx != c.idx;
      });
    });
    console.log("cardsInHand ", cardsInHand);
    this.setState({ player_selected_cards: [] });
    this.setState({ served_cards: cardsInHand });
    if (cardsInHand.length == 0) {
      console.log("game won!");
      this.setState({ game_won: true });
    }
  }

  render() {
    let player_cards = (
      <div
        className="flex flex-row w-full justify-center bg-red-300"
        style={{
          height: "20%",
        }}
      >
        {this.state.served_cards.map((card, key) => {
          return (
            <div className="m-2" key={key}>
              <button
                className={
                  "text-center rounded-lg m-2 hover:shadow-lg cursor-pointer " +
                  this.focusCardClass(card)
                }
                style={Styles.playerCardBtn}
                onClick={(event) => {
                  this.selectPlayerCard(card);
                }}
              >
                <h3
                  className={
                    "text-4xl font-semibold leading-normal mb-2 " +
                    this.getCardColor(card)
                  }
                >
                  {card.deck_idx}: {card.name}
                </h3>
              </button>
            </div>
          );
        })}
      </div>
    );
    let player_menu = (
      <div className="bg-red-300 m-2 flex flex-col w-full justify-center items-center">
        <div className="flex flex-row w-full justify-center bg-yellow-200">
          <h3 className="text-2x font-semibold leading-normal text-white mb-2">
            Selected Cards:
            {this.state.player_selected_cards.map((card, key) => {
              return <span className="p-2">{card.name}</span>;
            })}
          </h3>
        </div>
        <div className="flex flex-row">
          {this.state.served_cards.length == 0 && (
            <div>
              <button
                className="font-semibold uppercase m-2 bg-red-500"
                style={Styles.mainBtn}
                onClick={() => this.getNewHand()}
              >
                Get Hand
              </button>
            </div>
          )}
          {!this.state.game_won && (
            <button
              className={
                "text-center rounded-lg uppercase m-2 font-semibold hover:shadow-lg cursor-pointer bg-green-500"
              }
              style={Styles.mainBtn}
              onClick={(event) => {
                this.pairCards();
              }}
            >
              Pair
            </button>
          )}
        </div>
      </div>
    );

    return (
      <>
        <div className="flex flex-row home" style={{ height: "90vh" }}>
          <aside
            className="sidebar"
            style={{
              backgroundColor: "rgba(196, 196, 196,0.2)",
              width: "18%",
            }}
          >
            <div className="sidebar-header flex py-4 px-2">
              <span
                className="self-start"
                style={{
                  color: "#000000",
                  fontWeight: 600,
                  fontSize: "50px",
                  fontStyle: "normal",
                  lineHeight: "73px",
                }}
              >
                Filter
              </span>
            </div>
          </aside>
          <main className="main flex flex-col flex-grow">
            <header className="header bg-white shadow py-4 px-4">
              Options
            </header>
            <div className="main-content">
              <div
                className="w-full p-2"
                style={{
                  height: "85vh",
                }}
              >
                <div
                  className="relative w-full p-1 flex flex-col bg-gray-100"
                  style={{
                    height: "30%",
                  }}
                >
                  <div style={{ width: "100%", height: "10%" }}>
                    Opponent Menu
                  </div>
                  <div
                    className="m-2 flex flex-row justify-center items-top"
                    style={{ width: "100%", height: "90%" }}
                  >
                    {this.state.opponents_cards.map((cardObj, key) => {
                      return (
                        <div
                          className="m-2 bg-pink-200 flex flex-col justify-center"
                          key={key}
                          style={{
                            width: "300px",
                            height: "100%",
                          }}
                        >
                          <h1>Address: {cardObj.address}</h1>
                          <div
                            className="flex flex-row w-full justify-center bg-red-300"
                            style={{
                              height: "40%",
                            }}
                          >
                            {cardObj.cards.map((card, key) => {
                              return (
                                <div className="m-1" key={key}>
                                  <button
                                    className={
                                      "text-center rounded-lg m-1 hover:shadow-lg cursor-pointer"
                                    }
                                    style={Styles.oppoCardBtn}
                                  >
                                    <h5
                                      className={
                                        "text-xl font-semibold leading-normal mb-2 "
                                      }
                                    >
                                      {card.deck_idx}: {card.name}
                                    </h5>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div
                  className="relative w-full p-1 flex flex-col justify-start bg-gray-200"
                  style={{
                    height: "70%",
                  }}
                >
                  {player_cards}
                  {player_menu}
                </div>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }
}

export default CardGame;
