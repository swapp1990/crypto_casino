import React, { Component } from "react";

class CardGame extends Component {
  constructor(props) {
    super(props);
    this.state = {
      deck_set: [],
      deck_idx: 0,
      init_cardsInHand: 5,
      served_cards: [],
      player_selected_cards: [],
      num_opponents: 2,
      opponent_cards: {},
      selected_opponent: 0,
      player_success_pairs: [],
      game_won: false,
    };
    this.playersReceivedCards = 0;
  }
  async componentWillMount() {
    // this.initDeck();
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
    console.log("new deck initiated ", this.state.deck_idx);
  }
  chooseRandomCardFromDeck() {
    let deckSet = this.state.deck_set;
    let randomDeckCardIdx = deckSet[Math.floor(Math.random() * deckSet.length)];
    let cardObj = this.getCardObjByIdx(randomDeckCardIdx);
    deckSet = deckSet.filter((i) => i != randomDeckCardIdx);
    this.setState({ deck_set: deckSet }, () => {});
    return cardObj;
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
  giveSingleCardToPlayer(idx, card) {
    if (idx == 0) {
      // this.setState({ served_cards: cards });
    } else {
      let opponent_cards = this.state.opponent_cards;
      let cards = opponent_cards[idx];
      cards.push(card);
      opponent_cards[idx] = cards;
      this.setState({ opponent_cards: opponent_cards });
    }
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
      deck_idx: this.state.deck_idx,
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
  chooseCardFromOppoDeck(chosenCard, oppo_key) {
    let cardsInHand = this.state.opponent_cards[oppo_key];
    let cardsToRemove = [chosenCard];
    cardsInHand = cardsInHand.filter((c) => {
      return cardsToRemove.every((f) => {
        return f.idx != c.idx;
      });
    });
    // console.log(cardsInHand);
    let opponent_cards = this.state.opponent_cards;
    opponent_cards[oppo_key] = cardsInHand;
    this.setState({ opponent_cards: opponent_cards });

    //temp add a new card from deck
    let cardObj = this.chooseRandomCardFromDeck();
    this.giveSingleCardToPlayer(oppo_key, cardObj);
  }
  addChosenCardToPlayerDeck(chosenCard) {
    let cardsInHand = this.state.served_cards;
    cardsInHand.push(chosenCard);
    this.setState({ served_cards: cardsInHand });
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
  selectOppoCard(oppo, card) {
    let cardsInHand = this.state.served_cards;
    if (cardsInHand.length >= this.state.init_cardsInHand) return;
    // console.log(oppo, card);
    this.chooseCardFromOppoDeck(card, oppo);
    this.addChosenCardToPlayerDeck(card);
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
  getServed() {
    if (this.state.deck_set.length < this.state.init_cardsInHand) {
      let deckIdx = this.state.deck_idx + 1;
      this.setState({ deck_idx: deckIdx }, this.initDeck());
    } else {
      this.setState({ game_won: false });
      this.chooseCardsFromDeck(this.state.init_cardsInHand, [], 0);
    }
    console.log(this.state.deck_set);
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
                  {card.deck_idx}: {card.name}
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
          {!this.state.game_won && (
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
          )}
          {this.state.game_won && (
            <button
              className={
                "text-center rounded-lg m-2 hover:shadow-lg cursor-pointer"
              }
              onClick={(event) => {
                this.getServed();
              }}
            >
              <h3 className="bg-red-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Play again
              </h3>
            </button>
          )}
        </div>
        <div>
          <div>
            <span className="text-white font-bold">
              Collected Pairs: {this.state.player_success_pairs.length}
            </span>
          </div>
          <div class="p-2 overflow-y-scroll">
            {this.state.player_success_pairs.map((c, i) => {
              return (
                <div key={i}>
                  <span className="text-white font-bold">
                    {c.card1.name}+{c.card2.name}
                  </span>
                </div>
              );
            })}
          </div>
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
                          "text-center text-white bg-blueGray-700 rounded-lg m-2 hover:shadow-lg cursor-pointer focus:border-blue-300"
                        }
                        onClick={(event) => {
                          this.selectOppoCard(oppo_key, c);
                        }}
                      >
                        <h3
                          className={
                            "text-2x font-semibold leading-normal mb-2 " +
                            this.getCardColor(c)
                          }
                        >
                          {c.deck_idx}: {c.name}
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
