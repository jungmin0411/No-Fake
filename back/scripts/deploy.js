import hre from "hardhat"; // require 대신 import 사용

async function main() {
  const NoFake = await hre.ethers.getContractFactory("NoFakePlatform");
  
  // 공개 전 이미지 주소 (정민님의 실제 IPFS 해시로 나중에 바꾸셔도 됩니다)
  const unrevealedURI = "ipfs://QmYourUnrevealedMetadataHash/";

  console.log("NoFake 컨트랙트 배포 중...");
  
  const nofake = await NoFake.deploy(unrevealedURI);
  await nofake.waitForDeployment();

  console.log("배포 성공!");
  console.log("컨트랙트 주소(CA):", await nofake.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});