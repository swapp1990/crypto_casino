import React, { Component } from "react";

class CardGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deck_set: [],
      init_cardsInHand: 5,
      served_cards: [],
      player_selected_cards: [],
      num_opponents: 2,
      opponent_cards: {},
      selected_opponent: 0,
    };
    this.playersReceivedCards = 0;
  }
  async componentWillMount() {
    this.initDeck();
  }
  initDeck() {
    var deck_set = [];
    for (var i = 1; i <= 52; i++) {
      deck_set.push(i);
    }
    this.setState({ deck_set: deck_set }, this.drawCards);
  }
  drawCards() {
    let num_cards = this.state.init_cardsInHand;
    this.chooseCardsFromDeck(num_cards, [], 0);
  }
  chooseCardsFromDeck(count, cards, playerIdx) {
    let deckSet = this.state.deck_set;
    let randomDeckCardIdx = deckSet[Math.floor(Math.random() * deckSet.length)];
    let cardObj = this.getCardObjByIdx(randomDeckCardIdx);
    cards.push(cardObj);
    // console.log("c ", cards);
    deckSet = deckSet.filter((i) => i != randomDeckCardIdx);
    this.setState({ deck_set: deckSet }, () => {
      count--;
      if (count > 0) {
        this.chooseCardsFromDeck(count, cards, playerIdx);
      } else {
        this.giveCardsToPlayer(playerIdx, cards);
      }
    });
    return cards;
  }
  giveCardsToPlayer(idx, cards) {
    console.log("player ", idx, cards);
    if (idx == 0) {
      this.setState({ served_cards: cards });
    } else {
      let opponent_cards = this.state.opponent_cards;
      opponent_cards[idx] = cards;
      this.setState({ opponent_cards: opponent_cards });
    }
    if (this.playersReceivedCards < this.state.num_opponents) {
      this.playersReceivedCards++;
      let num_cards = this.state.init_cardsInHand;
      this.chooseCardsFromDeck(num_cards, [], this.playersReceivedCards);
    }
  }
  getSuiteSymbolFromIdx(idx) {
    let suiteSymbol = null;
    switch (idx) {
      case 0:
        suiteSymbol = "♥";
        break;
      case 1:
        suiteSymbol = "♦";
        break;
      case 2:
        suiteSymbol = "♠";
        break;
      case 3:
        suiteSymbol = "♣";
        break;
      default:
        suiteSymbol = "";
        break;
    }
    return suiteSymbol;
  }
  getCardObjByIdx(idx) {
    const suitTypeIdx = Math.floor((idx - 1) / 13);
    const suiteSym = this.getSuiteSymbolFromIdx(suitTypeIdx);
    let cardNumber = idx - suitTypeIdx * 13;
    cardNumber = cardNumber.toString();
    if (cardNumber == 13) {
      cardNumber = "K";
    } else if (cardNumber == 12) {
      cardNumber = "Q";
    } else if (cardNumber == 11) {
      cardNumber = "J";
    }
    let cardName = cardNumber + suiteSym;
    let card = {
      name: cardName,
      idx: idx,
      suitTypeIdx: suitTypeIdx,
      cardValue: cardNumber,
    };
    return card;
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
  }

  render() {
    let player_cards = (
      <div className="flex flex-row w-full justify-center">
        {this.state.served_cards.map((card, key) => {
          return (
            <div className="m-2" key={key}>
              <button
                className={
                  "text-center bg-blueGray-700 rounded-lg m-2 hover:shadow-lg cursor-pointer focus:border-blue-300 " +
                  this.focusCardClass(card)
                }
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
                  {card.name}
                </h3>
              </button>
            </div>
          );
        })}
      </div>
    );
    let player_menu = (
      <div>
        <div className="flex flex-row w-full justify-center bg-blueGray-700">
          <h3 className="text-2x font-semibold leading-normal text-white mb-2">
            Selected Cards:
            {this.state.player_selected_cards.map((card, key) => {
              return <span className="p-2">{card.name}</span>;
            })}
          </h3>
        </div>
        <div>
          <button
            className={
              "text-center rounded-lg m-2 hover:shadow-lg cursor-pointer"
            }
            onClick={(event) => {
              this.pairCards();
            }}
          >
            <h3 className="bg-red-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
              Pair
            </h3>
          </button>
        </div>
      </div>
    );
    let opponent_cards = <h1>No Opponents</h1>;
    // console.log(this.state.opponent_cards);
    let opponent_keys = Object.keys(this.state.opponent_cards);
    if (opponent_keys.length > 1) {
      opponent_cards = (
        <div className="flex flex-row w-full justify-center">
          {Array.apply(null, {
            length: opponent_keys.length,
          }).map((opponent, key) => {
            let oppo_key = opponent_keys[key];
            // console.log("key ", oppo_key);
            let cards = this.state.opponent_cards[oppo_key];

            return (
              <div className="flex flex-col w-full justify-center">
                <div className="flex flex-row w-full justify-center">
                  <h3
                    className={
                      "text-3x font-semibold leading-normal mb-2 text-white"
                    }
                  >
                    Choose Player {key + 1}
                  </h3>
                </div>
                <div className="flex flex-row w-full justify-center">
                  {cards.map((c, key) => {
                    return (
                      <button
                        key={key}
                        className={
                          "text-center text-white bg-blueGray-700 rounded-lg m-2 hover:shadow-lg cursor-pointer  "
                        }
                      >
                        <h3
                          className={
                            "text-2x font-semibold leading-normal mb-2 " +
                            this.getCardColor(c)
                          }
                        >
                          {c.name}
                        </h3>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <>
        <div className="relative pt-16 pb-32 flex content-center items-center justify-center min-h-screen-75">
          <div
            className="absolute top-0 w-full h-full bg-center bg-cover"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=1267&q=80')",
            }}
          >
            <span
              id="blackOverlay"
              className="w-full h-full absolute opacity-75 bg-black"
            ></span>
          </div>
          <div className="container relative mx-auto">
            <div className="items-center flex flex-wrap">
              <div className="w-full lg:w-6/12 px-4 ml-auto mr-auto text-center">
                {opponent_cards}
                {player_cards}
                {player_menu}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default CardGame;
