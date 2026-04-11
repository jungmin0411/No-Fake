import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// [정보보호] ESM 환경에서는 __dirname을 직접 만들어야 합니다.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 환경 변수 로드 (위치: back/.env)
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// 2. ABI 로드
const abiPath = path.join(__dirname, 'artifacts', 'contracts', 'NoFake.sol', 'NoFakePlatform.json');
let contractData;

try {
    contractData = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
} catch (err) {
    console.error("❌ ABI 파일을 찾을 수 없습니다. 경로를 확인하세요:", abiPath);
    try {
        const fallbackPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'NoFake.sol', 'NoFakePlatform.json');
        contractData = JSON.parse(fs.readFileSync(fallbackPath, 'utf8'));
        console.log("✅ 상위 경로에서 ABI를 찾았습니다.");
    } catch {
        process.exit(1);
    }
}

/**
 * 민팅 API 엔드포인트
 * 프론트엔드에서 지갑 주소와 래플 ID를 받아 관리자가 가스비를 대납하여 민팅합니다.
 */
app.post('/api/mint', async (req, res) => {
    const { userAddress, raffleId } = req.body;

    // 데이터 유효성 검사 (Validation)
    if (!userAddress || !raffleId) {
        return res.status(400).json({ success: false, error: "지갑 주소 또는 래플 ID가 누락되었습니다." });
    }

    try {
        // 1. 공급자(RPC) 및 관리자 지갑 설정
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const adminWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        
        // 2. 컨트랙트 인스턴스 생성
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractData.abi, adminWallet);

        console.log(`[Server] 🚀 ${userAddress}님을 위해 래플 ${raffleId}번 민팅 시작...`);
        
        // 3. 민팅 트랜잭션 전송 (가스비 대납)
        // [정보보호] 시연 환경의 안정성을 위해 가스 리밋을 명시적으로 설정
        const tx = await contract.mintRaffleTicket(userAddress, raffleId, {
            gasLimit: 300000 
        });

        console.log(`[Server] ⏳ 트랜잭션 전송 완료. 블록 확정 대기 중...`);
        console.log(`[Server] 🔗 Hash: ${tx.hash}`);

        // 4. 트랜잭션이 블록에 포함될 때까지 대기 (Wait for receipt)
        const receipt = await tx.wait();

        console.log(`[Server] ✅ 민팅 성공! 블록 번호: ${receipt.blockNumber}`);

        // 5. 프론트엔드에 트랜잭션 해시를 반환 (사용자 검증용)
        res.json({ 
            success: true, 
            hash: receipt.hash, // 이 값이 프론트엔드에서 이더스캔 링크로 쓰입니다.
            blockNumber: receipt.blockNumber 
        });

    } catch (error) {
        console.error("❌ Minting Error Detail:", error);
        
        let errorMessage = "이미 참여했거나 네트워크 오류입니다.";
        
        // 스마트 컨트랙트의 Require 문 에러 메시지 추출
        if (error.reason) {
            errorMessage = error.reason;
        } else if (error.message.includes("already in")) {
            errorMessage = "이미 이 래플에 참여한 지갑입니다.";
        } else if (error.message.includes("closed")) {
            errorMessage = "민팅이 마감되었습니다.";
        } else if (error.message.includes("insufficient funds")) {
            errorMessage = "관리자 지갑의 가스비(ETH)가 부족합니다.";
        }

        res.status(500).json({ success: false, error: errorMessage });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`\n🛡️  NoFake Minting Server (Gasless) is running!`);
    console.log(`🔗 API URL: http://localhost:${PORT}/api/mint`);
    console.log(`📂 ABI Path: ${abiPath}\n`);
});