import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// [정보보호 추가] 접속 로그 미들웨어 (누가 접속했는지 모니터링)
app.use((req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`[Security Log] 🕵️ 접속 시도 - IP: ${ip} | Method: ${req.method} | URL: ${req.url}`);
    next();
});

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

app.post('/api/mint', async (req, res) => {
    const { userAddress, raffleId } = req.body;

    if (!userAddress || !raffleId) {
        return res.status(400).json({ success: false, error: "지갑 주소 또는 래플 ID가 누락되었습니다." });
    }

    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const adminWallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
        const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, contractData.abi, adminWallet);

        console.log(`[Server] 🚀 ${userAddress}님을 위해 래플 ${raffleId}번 민팅 시작...`);
        
        const tx = await contract.mintRaffleTicket(userAddress, raffleId, {
            gasLimit: 300000 
        });

        console.log(`[Server] ⏳ 트랜잭션 전송 완료. 블록 확정 대기 중...`);
        console.log(`[Server] 🔗 Hash: ${tx.hash}`);

        const receipt = await tx.wait();

        console.log(`[Server] ✅ 민팅 성공! 블록 번호: ${receipt.blockNumber}`);

        res.json({ 
            success: true, 
            hash: receipt.hash,
            blockNumber: receipt.blockNumber 
        });

    } catch (error) {
        console.error("❌ Minting Error Detail:", error);
        let errorMessage = "이미 참여했거나 네트워크 오류입니다.";
        
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
// [수정] '0.0.0.0'을 추가하여 같은 와이파이 내 다른 사람의 접속을 허용합니다.
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🛡️  NoFake Minting Server (Gasless) is running!`);
    console.log(`🔗 Local URL: http://localhost:${PORT}`);
    
    // [정보보호 팁] 현재 컴퓨터의 사설 IP를 알려주는 가이드 출력
    console.log(`📡 Network URL: http://0.0.0.0:${PORT} (와이파이 접속 허용)`);
    console.log(`📂 ABI Path: ${abiPath}\n`);
});