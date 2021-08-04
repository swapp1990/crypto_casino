//truffle migrate --reset --network harmony_testnet
pragma solidity >=0.4.22 <0.8.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CardGame is ERC721, Ownable {
	constructor() ERC721("CasinoNFT", "MOO") public {
	}

	struct Card {
		uint nftId;
		uint deckIdx;
		uint cardIdx;
		uint suitTypeIdx;
		bool isHandCard;
	}

	uint public nftId = 0;
	uint public currentDeckIdx = 0;
	uint[] public currentDeckTaken;

	address[] public players;
	mapping (address => bool) public players_mapping;

	mapping(uint256 => Card) private _cardStack;
	mapping(address => uint[]) private _inHandTokens;
	mapping(address => uint[]) private _pairedTokens;

	struct WonGame {
		uint[] gameDecks;
		uint count;
		bool isExist;
	}
	mapping(address => WonGame) private _gamesWon;

	event HandMinted(address player);
	event GameWonEvent(address player);

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

	function getInHandTokens2() public view returns(uint [] memory) {
		return _inHandTokens[msg.sender];
	}

	function getPairedTokens(address myAddr) public view returns(uint [] memory) {
		return _pairedTokens[myAddr];
	}

	function getGamesWon(address myAddr) public view returns(uint) {
		return _gamesWon[myAddr].count;
	}

	function mintNewHand(Card[] memory card_hand) public {
		for (uint i = 0; i < card_hand.length; i++) {
			// uint deckIdx = card_hand[i].deckIdx;
			_cardStack[nftId] = Card(nftId, card_hand[i].deckIdx, card_hand[i].cardIdx, card_hand[i].suitTypeIdx, true);
			currentDeckTaken.push(card_hand[i].cardIdx);
			_inHandTokens[msg.sender].push(nftId);
			_safeMint(msg.sender, nftId);
			nftId++;
		}

		players.push(msg.sender);
		emit HandMinted(msg.sender);
	}

	function transferCard(uint _tokenId) public {
		address orig_owner = ownerOf(_tokenId);
		_transfer(orig_owner, msg.sender, _tokenId);
		_inHandTokens[msg.sender].push(_tokenId);

		// uint[] memory tokensOrig = new uint[](_inHandTokens[orig_owner].length - 1);

		uint[] memory result = new uint[](_inHandTokens[orig_owner].length-1);
		uint count=0;
		for (uint i = 0; i <_inHandTokens[orig_owner].length; i++) {
			if(_inHandTokens[orig_owner][i] != _tokenId) {
				result[count] = _inHandTokens[orig_owner][i];
				count++;
			}
		}
		_inHandTokens[orig_owner] = result;
		emit HandMinted(msg.sender);
	}

	// function remove(uint index, uint[] memory array)  returns(uint[] memory) {
    //     if (index >= array.length) return;

    //     for (uint i = index; i<array.length-1; i++){
    //         array[i] = array[i+1];
    //     }
    //     array.length--;
    //     return array;
    // }

	function updateHand_old(Card[] memory card_hand) public {
		delete _inHandTokens[msg.sender];
		for (uint i = 0; i < card_hand.length; i++) {
			Card memory cardObj = _cardStack[card_hand[i].nftId];
			cardObj.isHandCard = card_hand[i].isHandCard;
			if(cardObj.isHandCard == true) {
				_inHandTokens[msg.sender].push(cardObj.nftId);
			}
		}
		emit HandMinted(msg.sender);
	}

	function updateHand(uint[] memory idx_pair) public {
		uint[] memory handTokens = _inHandTokens[msg.sender];
		delete _inHandTokens[msg.sender];
		uint pair1 = idx_pair[0];
		uint pair2 = idx_pair[1];
		for (uint i = 0; i < handTokens.length; i++) {
			if(handTokens[i]!=pair1 && handTokens[i]!=pair2) {
				_inHandTokens[msg.sender].push(handTokens[i]);
			}
		}
		_pairedTokens[msg.sender].push(pair1);
		_pairedTokens[msg.sender].push(pair2);
		emit HandMinted(msg.sender);

		if(_inHandTokens[msg.sender].length == 0) {
			WonGame memory obj = _gamesWon[msg.sender];
			if(!obj.isExist) {
				uint[] memory gameDecks = new uint[](1);
				gameDecks[0] = currentDeckIdx;
				obj = WonGame(gameDecks, 1, true);
			} else {
				uint[] memory gameDecks = new uint[](obj.gameDecks.length+1);
				gameDecks[obj.gameDecks.length] = currentDeckIdx;
				obj.gameDecks = gameDecks;
				obj.count = obj.count+1;
			}
			_gamesWon[msg.sender] = obj;
			emit GameWonEvent(msg.sender);
		}
	}
}