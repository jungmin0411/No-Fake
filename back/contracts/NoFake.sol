// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NoFakePlatform is ERC721, Ownable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 30; // 최대 인원 제한
    uint256 public totalSupply = 0;
    string public unrevealedURI;
    
    // [보안 추가] 데이터 무결성 봉인 및 마감 플래그
    string public PROVENANCE_HASH;
    bool public isMintingPaused = false;

    mapping(uint256 => bool) public isRevealed;
    mapping(uint256 => uint256) public raffleOffsets;
    mapping(uint256 => string) public raffleBaseURIs;
    
    mapping(uint256 => uint256) public tokenToRaffleId;
    mapping(uint256 => uint256) public mintTimestamp;
    
    uint256 public constant EXPIRY_DURATION = 90 days;
    mapping(uint256 => mapping(address => bool)) public hasParticipated;

    /**
     * @dev [수정] OpenZeppelin 4.x 버전 규격에 맞게 Ownable 생성자의 인자를 제거했습니다.
     * (만약 5.x 버전을 쓰신다면 Ownable(msg.sender)로 다시 복구해야 합니다.)
     */
    constructor(
        string memory _unrevealedURI
    ) ERC721("NoFake Raffle Platform", "NFP") Ownable() { 
        unrevealedURI = _unrevealedURI;
    }

    // 관리자 기능: 마감 및 봉인
    function setMintingPaused(bool _state) public onlyOwner { isMintingPaused = _state; }
    function setProvenanceHash(string memory _provenanceHash) public onlyOwner {
        require(bytes(PROVENANCE_HASH).length == 0, "Already set");
        PROVENANCE_HASH = _provenanceHash;
    }

    function mintRaffleTicket(address _to, uint256 _raffleId) public onlyOwner {
        require(!isMintingPaused, "Closed");
        require(totalSupply < MAX_SUPPLY, "Full"); 
        require(!hasParticipated[_raffleId][_to], "Already in");

        totalSupply++;
        tokenToRaffleId[totalSupply] = _raffleId;
        mintTimestamp[totalSupply] = block.timestamp;
        hasParticipated[_raffleId][_to] = true;
        _safeMint(_to, totalSupply);
    }

    /**
     * @dev 현재 참여 인원(totalSupply) 범위 내에서 난수 생성
     */
    function revealRaffle(uint256 _raffleId, string memory _baseURI) external onlyOwner {
        require(!isRevealed[_raffleId], "Already revealed");
        uint256 currentParticipants = totalSupply; 
        require(currentParticipants > 0, "No participants");

        // [정보보호] block.prevrandao를 사용하여 온체인 난수 생성 (보안성 확보)
        raffleOffsets[_raffleId] = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp, _raffleId))) % currentParticipants;

        raffleBaseURIs[_raffleId] = _baseURI;
        isRevealed[_raffleId] = true;
    }

    /**
     * @dev 1.json ~ 30.json 규격에 맞춘 동적 매핑 (+1 연산)
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        // [수정] OpenZeppelin 4.x 버전에서는 _exists(tokenId)를 그대로 사용합니다.
        // (5.x 버전은 _ownerOf(tokenId) != address(0) 로 써야 함)
        require(_exists(tokenId), "Nonexistent token");
        
        uint256 raffleId = tokenToRaffleId[tokenId];

        if (block.timestamp > mintTimestamp[tokenId] + EXPIRY_DURATION) return "ipfs://expired";
        if (!isRevealed[raffleId]) return unrevealedURI;

        // 참여 인원 범위 내에서 순환하도록 수정하고 +1 하여 파일명 일치시킴
        uint256 shiftedId = ((tokenId + raffleOffsets[raffleId]) % totalSupply) + 1;
        
        return string(abi.encodePacked(raffleBaseURIs[raffleId], shiftedId.toString(), ".json"));
    }

    function swapPuzzlesForCoupon(uint256[] memory tokenIds) public {
        require(tokenIds.length == 10, "10 puzzles required");
        for (uint i = 0; i < 10; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not owner");
            _burn(tokenIds[i]); 
        }
        totalSupply++;
        _safeMint(msg.sender, totalSupply);
    }
}