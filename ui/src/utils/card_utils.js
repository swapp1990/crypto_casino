function getSuiteSymbolFromIdx(idx) {
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
export function getCardObjByIdx(idx) {
  const suitTypeIdx = Math.floor((idx - 1) / 13);
  const suiteSym = getSuiteSymbolFromIdx(suitTypeIdx);
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
    deck_idx: null,
    name: cardName,
    idx: idx,
    suitTypeIdx: suitTypeIdx,
    cardValue: cardNumber,
  };
  return card;
}

export function pickMultipleRandomly(arr, n) {
  var result = new Array(n),
    len = arr.length,
    taken = new Array(len);
  if (n > len)
    throw new RangeError(
      "pickMultipleRandomly: more elements taken than available"
    );
  while (n--) {
    var x = Math.floor(Math.random() * len);
    result[n] = arr[x in taken ? taken[x] : x];
    taken[x] = --len in taken ? taken[len] : len;
  }
  return result;
}
