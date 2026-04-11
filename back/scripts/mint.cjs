const { ethers } = require("ethers");
require("dotenv").config();
const fs = require("fs");
const path = require("path");

async function main() {
    // 1. 터미널 인자값 처리 (없으면 기본값 사용)
    const args = process.argv.slice(2);
    const userAddress = args[0] || "0x8Fe4737A81c8ac3ee7269390B0D27C3BE7B237B0";
    const raffleId = args[1] || 13;

    // 2. 환경 변수 로드 및 유효성 검사
    const rpcUrl = process.env.RPC_URL;
    const privateKey = process.env.PRIVATE_KEY;
    const contractAddress = process.env.CONTRACT_ADDRESS;

    if (!rpcUrl || !privateKey || !contractAddress) {
        console.error("❌ 에러: .env 파일의 설정을 확인해주세요 (RPC_URL, PRIVATE_KEY, CONTRACT_ADDRESS)");
        process.exit(1);
    }

    try {
        // 3. 공급자(Provider) 및 지갑(Wallet) 설정
        const provider = new ethers.JsonRpcProvider(rpcUrl);
        const wallet = new ethers.Wallet(privateKey, provider);

        // 4. ABI 파일 경로 설정 (구조에 맞춰 절대경로 생성)
        const abiPath = path.join(__dirname, "..", "artifacts", "contracts", "NoFake.sol", "NoFakePlatform.json");
        
        if (!fs.existsSync(abiPath)) {
            throw new Error(`ABI 파일을 찾을 수 없습니다: ${abiPath}`);
        }

        const contractData = JSON.parse(fs.readFileSync(abiPath, "utf8"));
        const NoFake = new ethers.Contract(contractAddress, contractData.abi, wallet);

        console.log(`\n──────────────────────────────────────────────────`);
        console.log(`🌐 네트워크: Sepolia (Public Node)`);
        console.log(`📍 컨트랙트: ${contractAddress}`);
        console.log(`👤 대상주소: ${userAddress}`);
        console.log(`🎫 래플번호: ${raffleId}`);
        console.log(`──────────────────────────────────────────────────\n`);

        console.log(`🚀 민팅 트랜잭션을 전송합니다...`);

        // 5. 스마트 컨트랙트 함수 호출 (가스 리밋 명시)
        const tx = await NoFake.mintRaffleTicket(userAddress, raffleId, {
            gasLimit: 300000 
        });

        console.log(`⏳ 블록체인 승인 대기 중... (Hash: ${tx.hash})`);
        
        // 트랜잭션 확정 대기
        const receipt = await tx.wait();

        console.log(`\n✅ 민팅 성공!`);
        console.log(`📦 블록번호: ${receipt.blockNumber}`);
        console.log(`🔗 이더스캔: https://sepolia.etherscan.io/tx/${receipt.hash}`);
        console.log(`\n──────────────────────────────────────────────────`);

    } catch (error) {
        console.error(`\n❌ 민팅 실패!`);
        if (error.reason) console.error(`이유: ${error.reason}`);
        else console.error(`에러메시지: ${error.message}`);
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});