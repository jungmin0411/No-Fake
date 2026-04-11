const hre = require("hardhat");
require("dotenv").config();

async function main() {
  // 1. .env에서 배포된 컨트랙트 주소 가져오기
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("❌ 에러: .env 파일에 CONTRACT_ADDRESS가 설정되지 않았습니다.");
    return;
  }

  const nofake = await hre.ethers.getContractAt("NoFakePlatform", contractAddress);

  const raffleId = 1; // 리빌할 래플 ID
  // 실제 JSON 메타데이터가 저장된 IPFS 폴더 주소
  const baseURI = "ipfs://QmYourActualMetadataFolderHash/"; 

  try {
    // [보안 체크] 현재 참여 인원 확인
    const totalParticipants = await nofake.totalSupply();
    console.log(`[리빌 준비] 현재 참여 인원: ${totalParticipants}명`);

    if (totalParticipants == 0) {
      console.log("❌ 에러: 참여자가 없어 리빌을 진행할 수 없습니다.");
      return;
    }

    console.log(`[리빌 시작] 래플 ID: ${raffleId}의 결과를 공개합니다...`);

    // 2. 관리자 권한으로 revealRaffle 호출 (가스비 발생)
    const tx = await nofake.revealRaffle(raffleId, baseURI);
    console.log("⏳ 블록체인에 기록 중... (txHash: " + tx.hash + ")");
    
    // 트랜잭션 확정 대기
    await tx.wait();

    // 3. 결과 확인
    const isRevealed = await nofake.isRevealed(raffleId);
    const offset = await nofake.raffleOffsets(raffleId);
    
    console.log(`✅ 리빌 완료!`);
    console.log(`- 리빌 상태: ${isRevealed}`);
    console.log(`- 생성된 행운의 난수(Offset): ${offset}`);
    console.log(`- 적용 범위: 1 ~ ${totalParticipants}.json`);

  } catch (error) {
    console.error("❌ 리빌 실패:");
    if (error.message.includes("Already revealed")) {
      console.log("👉 결과: 이미 리빌이 완료된 래플입니다. 결과를 조작할 수 없습니다.");
    } else {
      console.log("👉 상세 에러:", error.reason || error.message);
    }
  }
}

main().catch(console.error);