pragma solidity >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CardGame is ERC721, Ownable {
	constructor() ERC721("CasinoNFT", "MOO") public {
	}

	struct Card {
		uint deckIdx;
		uint cardIdx;
		uint suitTypeIdx;
		bool isHandCard;
	}

	uint public nftId = 0;
	uint public currentDeckIdx = 0;
	uint[] public currentDeckTaken;
	address[] public players;

	mapping(uint256 => Card) private _cardStack;
	mapping(address => uint[]) private _inHandTokens;

	event HandMinted(address player);

	function getTokenDetails(uint256 tokenId) public view returns (Card memory) {
		return _cardStack[tokenId];
	}

	function getDeckTaken() public view returns (uint[] memory) {
		return currentDeckTaken;
	}
	
	function getPlayers() public view returns(address [] memory) {
		return players;
	}

	function getOwnerOf(uint256 tokenId) public view returns (address){
		return ownerOf(tokenId);
	}

	function getInHandTokens(address myAddr) public view returns(uint [] memory) {
		return _inHandTokens[myAddr];
	}

	function mintNewHand(Card[] memory card_hand) public {
		for (uint i = 0; i < card_hand.length; i++) {
			// uint deckIdx = card_hand[i].deckIdx;
			_cardStack[nftId] = Card(card_hand[i].deckIdx, card_hand[i].cardIdx, card_hand[i].suitTypeIdx, true);
			currentDeckTaken.push(card_hand[i].cardIdx);
			_inHandTokens[msg.sender].push(nftId);
			_safeMint(msg.sender, nftId);
			nftId++;
		}
		players.push(msg.sender);
		emit HandMinted(msg.sender);
	}
}