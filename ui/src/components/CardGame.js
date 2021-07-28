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
      contract: null,
    };
  }
  async componentWillMount() {
    // let cards = [this.getCardObjByIdx(23), this.getCardObjByIdx(34)];
    // this.setState({ served_cards: cards });
    this.initDeck();
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
  }

  initDeck() {
    var deck_set = [];
    for (var i = 1; i <= 52; i++) {
      deck_set.push(i);
    }
    this.setState({ deck_set: deck_set });
  }
  chooseCardsFromDeck(count) {
    let deckSet = this.state.deck_set;
    // choose random cards idxs
    let randomIdxs = card_utils.pickMultipleRandomly(deckSet, count);
    let pickedCards = [];
    randomIdxs.forEach((idx) => {
      let cardObj = card_utils.getCardObjByIdx(idx);
      cardObj.deck_idx = this.state.deck_idx;
      pickedCards.push(cardObj);
    });
    deckSet = deckSet.filter((i) => !randomIdxs.includes(i));
    console.log("deckSet len ", deckSet.length);
    this.setState({ deck_set: deckSet });
    return pickedCards;
  }
  async getNewHand() {
    // let auctionObj = await contract.methods.getAuctionInfo(id).call();
    let chosenCards = this.chooseCardsFromDeck(this.state.init_cardsInHand);
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

  render() {
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
                  className="relative w-full p-1 flex justify-center bg-gray-100"
                  style={{
                    height: "30%",
                  }}
                >
                  Opponent Menu
                </div>
                <div
                  className="relative w-full p-1 flex flex-col justify-start bg-gray-200"
                  style={{
                    height: "70%",
                  }}
                >
                  <div
                    className="flex flex-row w-full justify-center bg-red-300"
                    style={{
                      height: "40%",
                    }}
                  >
                    {this.state.served_cards.map((card, key) => {
                      return (
                        <div className="m-2" key={key}>
                          <button
                            className={
                              "text-center rounded-lg m-2 hover:shadow-lg cursor-pointer"
                            }
                            style={Styles.playerCardBtn}
                          >
                            <h3
                              className={
                                "text-4xl font-semibold leading-normal mb-2 "
                              }
                            >
                              {card.deck_idx}: {card.name}
                            </h3>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <button
                      className="font-semibold uppercase bg-red-500"
                      style={Styles.mainBtn}
                      onClick={() => this.getNewHand()}
                    >
                      Get Hand
                    </button>
                  </div>
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
