const hre = require("hardhat");
require("dotenv").config();

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("❌ 에러: .env에 CONTRACT_ADDRESS가 없습니다.");
    return;
  }

  const nofake = await hre.ethers.getContractAt("NoFakePlatform", contractAddress);
  const raffleId = 1;
  const tokenId = 1; // 확인하고 싶은 토큰 번호

  try {
    const revealed = await nofake.isRevealed(raffleId);
    const offset = await nofake.raffleOffsets(raffleId);
    const uri = await nofake.tokenURI(tokenId);
    const total = await nofake.totalSupply();

    console.log(`\n[결과 확인]`);
    console.log(`- 현재 참여 인원: ${total}명`);
    console.log(`- 리빌 완료 여부: ${revealed}`);
    console.log(`- 생성된 행운의 난수(Offset): ${offset}`);
    console.log(`- 내 NFT(ID: ${tokenId})의 최종 주소: ${uri}`);
  } catch (error) {
    console.error("❌ 조회 실패:", error.message);
  }
}

main().catch(console.error);