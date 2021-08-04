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
      card_pairs_won: [],
      opponents_cards: [],
      player_selected_cards: [],
      player_success_pairs: [],
      game_won: false,
      total_games_won: 0,
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
          this.listenContractEvents();
          this.displayHand();
        }
      });
    });
  }

  listenContractEvents() {
    //listen to events
    if (this.state.contract.events.GameWonEvent) {
      this.state.contract.events.GameWonEvent({}, async (error, event) => {
        console.log("GameWonEvent ", event);
        this.updateHand();
      });
    }
  }

  async displayHand() {
    this.setState({ player_selected_cards: [] });
    let totalNfts = await this.state.contract.methods.nftId().call();
    console.log("totalNfts ", totalNfts);
    let total_games_won = await this.state.contract.methods
      .getGamesWon(store.getStore().account)
      .call();
    this.setState({ total_games_won: total_games_won });
    let served_cards = [];
    console.log("account ", store.getStore().account);
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
      card.nftId = nft.nftId;
      served_cards.push(card);
    }

    let pairedTokens = await this.state.contract.methods
      .getPairedTokens(store.getStore().account)
      .call();
    console.log("pairedTokens ", pairedTokens);

    let card_pairs_won = [];
    for (var i = 0; i < pairedTokens.length; i += 2) {
      console.log("card1 ", pairedTokens[i]);
      console.log("card2 ", pairedTokens[i + 1]);
      let cardPair = [];
      const nft1 = await this.state.contract.methods
        .getTokenDetails(pairedTokens[i])
        .call();
      let card1 = card_utils.getCardObjByIdx(nft1.cardIdx);
      card1.deck_idx = nft1.deckIdx;
      card1.nftId = nft1.nftId;
      cardPair.push(card1);

      const nft2 = await this.state.contract.methods
        .getTokenDetails(pairedTokens[i + 1])
        .call();
      let card2 = card_utils.getCardObjByIdx(nft2.cardIdx);
      card2.deck_idx = nft2.deckIdx;
      card2.nftId = nft2.nftId;
      cardPair.push(card2);

      card_pairs_won.push(cardPair);
    }
    this.setState({ card_pairs_won: card_pairs_won });

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
        card.nftId = nft.nftId;
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
      nftList.push([0, c.deck_idx, c.idx, c.suitTypeIdx, true]);
    });
    console.log("nftList ", nftList);
    if (this.state.contract) {
      let result = await this.state.contract.methods
        .mintNewHand(nftList)
        .send({
          from: store.getStore().account,
          value: 0,
          gasPrice: 1000000000,
          gasLimit: 2100000,
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
  chooseCardFromOppoDeck(chosenCard, oppo_key) {
    let cardsInHand = this.state.opponent_cards[oppo_key];
    let cardsToRemove = [chosenCard];
    cardsInHand = cardsInHand.filter((c) => {
      return cardsToRemove.every((f) => {
        return f.idx != c.idx;
      });
    });
    // console.log(cardsInHand);
    // let opponent_cards = this.state.opponent_cards;
    // opponent_cards[oppo_key] = cardsInHand;
    // this.setState({ opponent_cards: opponent_cards });

    // //temp add a new card from deck
    // let cardObj = this.chooseRandomCardFromDeck();
    // this.giveSingleCardToPlayer(oppo_key, cardObj);
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
  selectOppoCard(oppo_addr, card) {
    let cardsInHand = this.state.served_cards;
    if (cardsInHand.length >= this.state.init_cardsInHand) return;
    console.log(oppo_addr, card.nftId);
    this.transferCard(card.nftId);
  }

  async pairCards() {
    let cardsInHand = this.state.served_cards;
    let cardsSelected = this.state.player_selected_cards;
    if (cardsSelected.length != 2) return;
    let card1 = cardsSelected[0];
    let card2 = cardsSelected[1];

    //Same suit: remove
    if (card1.suitTypeIdx == card2.suitTypeIdx) {
      let idxPair = [];
      cardsInHand.forEach((c, i) => {
        if (cardsSelected.includes(c)) {
          idxPair.push(c.nftId);
        }
      });
      console.log("idxPair ", idxPair);
      this.updateHand(idxPair);
    }
  }
  async updateHand(idxPair) {
    await this.state.contract.methods
      .updateHand(idxPair)
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
  }
  async transferCard(nftId) {
    await this.state.contract.methods
      .transferCard(nftId)
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
      <div className="bg-red-200 m-2 flex flex-col w-full justify-center items-center">
        <div className="flex flex-row w-full justify-center bg-yellow-400">
          <h3 className="text-2x font-semibold leading-normal text-white mb-2">
            Total games won: {this.state.total_games_won}
          </h3>
        </div>
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
        <div
          className="flex flex-col m-2 bg-gray-400 items-center"
          style={{
            width: "100%",
          }}
        >
          {this.state.card_pairs_won.map((cardPair, key) => {
            return (
              <div className="p-2">
                <span>
                  ({cardPair[0].name}, {cardPair[1].name})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
    let opponent_cards = (
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
                width: "320px",
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
                        onClick={(event) => {
                          this.selectOppoCard(cardObj.address, card);
                        }}
                      >
                        <h5
                          className={
                            "text-md font-semibold leading-normal mb-2 " +
                            this.getCardColor(card)
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
                  {opponent_cards}
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
