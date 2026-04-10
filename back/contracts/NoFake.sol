// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract NoFakePlatform is ERC721, Ownable {
contract NoFakePlatform is ERC721, Ownable {
    using Strings for uint256;

    uint256 public Supply total= 0;

    // 유효기간 설정 (블록체인 타임스탬프 기준)
    uint256 public immutable PRE_PURCHASE_EXPIRY;
    uint256 public immutable PUZZLE_EXPIRY;

    string public unrevealedURI;
    string public baseURI;

    bool public revealed = false;
    uint256 public revealOffset;

    // 상품 ID별(Raffle ID) 사용자 참여 여부 기록
    mapping(uint256 => mapping(address => bool)) public hasParticipated;
    uint256 public revealOffset;

    // 상품 ID별(Raffle ID) 사용자 참여 여부 기록
    mapping(uint256 => mapping(address => bool)) public hasParticipated;

    constructor(
        string memory _unrevealedURI,
        uint256 _preExpiryDays,
        uint256 _puzzleMonth
    ) ERC721("NoFake Raffle Platform", "NFP") Ownable(msg.sender) {
        string memory _unrevealedURI,
        uint256 _preExpiryDays,
        uint256 _puzzleMonth
    ) ERC721("NoFake Raffle Platform", "NFP") Ownable(msg.sender) {
        unrevealedURI = _unrevealedURI;
        // 현재 시간 기준 유효기간 계산 (1일 = 86400초)
        PRE_PURCHASE_EXPIRY = block.timestamp + (_preExpiryDays * 86400);
        PUZZLE_EXPIRY = block.timestamp + (_puzzleMonth * 30 * 86400);
        // 현재 시간 기준 유효기간 계산 (1일 = 86400초)
        PRE_PURCHASE_EXPIRY = block.timestamp + (_preExpiryDays * 86400);
        PUZZLE_EXPIRY = block.timestamp + (_puzzleMonth * 30 * 86400);
    }

    // [함수: 민팅] 특정 상품(raffleId)에 대해 서버가 사용자에게 NFT를 발행함
    function mintRaffleTicket(address _to, uint256 _raffleId) public onlyOwner {
        require(totalSupply < 5000, "Global limit reached"); // 플랫폼 전체 한도
        require(!hasParticipated[_raffleId][_to], "Already entered this raffle");

    // [함수: 민팅] 특정 상품(raffleId)에 대해 서버가 사용자에게 NFT를 발행함
    function mintRaffleTicket(address _to, uint256 _raffleId) public onlyOwner {
        require(totalSupply < 5000, "Global limit reached"); // 플랫폼 전체 한도
        require(!hasParticipated[_raffleId][_to], "Already entered this raffle");

        totalSupply++;
        hasParticipated[_raffleId][_to] = true;
        _safeMint(_to, totalSupply);
        hasParticipated[_raffleId][_to] = true;
        _safeMint(_to, totalSupply);
    }

    // [함수: 퍼즐 합성 및 소각] 퍼즐 NFT 10개를 소각하고 새로운 쿠폰 NFT 1개를 발행함
    function swapPuzzleForCoupon(uint256[] memory tokenIds) public {
        require(block.timestamp < PUZZLE_EXPIRY, "Puzzle event expired");
        require(tokenIds.length == 10, "Need exactly 10 pieces");

        for (uint i = 0; i < 10; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not the owner");
            _burn(tokenIds[i]); // 선택한 퍼즐 10개 소각
        }

        totalSupply++;
        _safeMint(msg.sender, totalSupply); // 보상 NFT 발행
    // [함수: 퍼즐 합성 및 소각] 퍼즐 NFT 10개를 소각하고 새로운 쿠폰 NFT 1개를 발행함
    function swapPuzzleForCoupon(uint256[] memory tokenIds) public {
        require(block.timestamp < PUZZLE_EXPIRY, "Puzzle event expired");
        require(tokenIds.length == 10, "Need exactly 10 pieces");

        for (uint i = 0; i < 10; i++) {
            require(ownerOf(tokenIds[i]) == msg.sender, "Not the owner");
            _burn(tokenIds[i]); // 선택한 퍼즐 10개 소각
        }

        totalSupply++;
        _safeMint(msg.sender, totalSupply); // 보상 NFT 발행
    }

    // [함수: 공개] 추첨 결과 확인을 위해 메타데이터 경로를 업데이트함
    // [함수: 공개] 추첨 결과 확인을 위해 메타데이터 경로를 업데이트함
    function reveal(string memory _baseURI) public onlyOwner {
        require(!revealed, "Already revealed");
        // 온체인 난수(prevrandao)를 활용한 리빌 오프셋 생성
        revealOffset = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp))) % totalSupply;
        require(!revealed, "Already revealed");
        // 온체인 난수(prevrandao)를 활용한 리빌 오프셋 생성
        revealOffset = uint256(keccak256(abi.encodePacked(block.prevrandao, block.timestamp))) % totalSupply;
        baseURI = _baseURI;
        revealed = true;
    }

    // [함수: 선구매권 소각] 실제 제품 구매 시 관리자가 NFT를 소각함
    function usePrePurchaseTicket(uint256 _tokenId) public onlyOwner {
        require(block.timestamp < PRE_PURCHASE_EXPIRY, "Ticket expired");
        _burn(_tokenId);
    }

    // [함수: 조회] 개별 NFT의 메타데이터(JSON) 주소를 반환함
    // [함수: 선구매권 소각] 실제 제품 구매 시 관리자가 NFT를 소각함
    function usePrePurchaseTicket(uint256 _tokenId) public onlyOwner {
        require(block.timestamp < PRE_PURCHASE_EXPIRY, "Ticket expired");
        _burn(_tokenId);
    }

    // [함수: 조회] 개별 NFT의 메타데이터(JSON) 주소를 반환함
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        if (!revealed) return unrevealedURI;

        uint256 shiftedId = (tokenId + revealOffset) % totalSupply;
        if (shiftedId == 0) shiftedId = totalSupply;
        if (!revealed) return unrevealedURI;

        uint256 shiftedId = (tokenId + revealOffset) % totalSupply;
        if (shiftedId == 0) shiftedId = totalSupply;

        return string(abi.encodePacked(baseURI, shiftedId.toString(), ".json"));
        return string(abi.encodePacked(baseURI, shiftedId.toString(), ".json"));
    }
}
