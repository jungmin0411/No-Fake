import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import axios from 'axios';
import { Contract, JsonRpcProvider } from 'ethers';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

// 1. 환경 설정 로드
dotenv.config();
dotenv.config({ path: '../.env', override: false });

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// 2. Web3Auth/Kakao 검증 클라이언트 설정
const client = jwksClient({
  jwksUri: process.env.JWKS_URI 
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey() || key?.rsaPublicKey;
    callback(null, signingKey);
  });
}

// 🛡️ [보안 미들웨어] 토큰 검사 및 지갑 주소 추출
const verifyTokenMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: '인증 토큰이 없습니다.' });

    const token = authHeader.split(' ')[1];
    
    jwt.verify(token, getKey, { 
        algorithms: ['RS256'],
        audience: process.env.TOKEN_AUDIENCE 
    }, (err, decoded) => {
        if (err) {
            console.error("❌ 토큰 검증 실패:", err.message);
            return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
        }
        
        // ⭐️ 대시보드 설정에 맞게 Sub(대문자) 또는 sub(소문자) 모두 대응
        req.user = {
            walletAddress: decoded.wallets?.[0]?.address || decoded.Sub || decoded.sub,
            email: decoded.email
        };
        
        console.log("✅ 인증 성공 (지갑주소):", req.user.walletAddress);
        next();
    });
};

// 3. AWS S3 설정
const s3Client = new S3Client({ region: 'ap-northeast-2' });
const BUCKET_NAME = process.env.BUCKET_NAME;
let isRevealed = process.env.IS_REVEALED === 'true';
const participants = [];
const noFakeContractAbi = ['function totalSupply() view returns (uint256)'];

const readContractTotalParticipants = async () => {
    const rpcUrl =
        process.env.RPC_URL ||
        process.env.WEB3_RPC_URL ||
        process.env.PUBLIC_RPC_URL;
    const contractAddress =
        process.env.NOFAKE_CONTRACT_ADDRESS ||
        process.env.CONTRACT_ADDRESS;

    if (!rpcUrl) {
        throw new Error('RPC_URL is not configured');
    }

    if (!contractAddress) {
        throw new Error('NOFAKE_CONTRACT_ADDRESS is not configured');
    }

    const provider = new JsonRpcProvider(rpcUrl);
    const contract = new Contract(contractAddress, noFakeContractAbi, provider);
    const totalSupply = await contract.totalSupply();

    return Number(totalSupply);
};

const upsertParticipant = (participant) => {
    const existingIndex = participants.findIndex((item) => item.walletAddress === participant.walletAddress);

    if (existingIndex >= 0) {
        participants[existingIndex] = {
            ...participants[existingIndex],
            ...participant,
        };
        return participants[existingIndex];
    }

    const nextParticipant = {
        id: participants.length + 1,
        ...participant,
    };

    participants.unshift(nextParticipant);
    return nextParticipant;
};

// ==========================================
// 🔥 카카오 토큰 교환 대행 (중복 요청 방어 로직 추가)
// ==========================================
app.post('/api/auth/kakao', async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "인가 코드가 없습니다." });

  try {
    const response = await axios.post("https://kauth.kakao.com/oauth/token", new URLSearchParams({
      grant_type: "authorization_code",
      client_id: "d9c3641e6babf0f0d91c93a7ec557c40", 
      client_secret: "npka1Tmsj6pJwM0WsDwdXgDSi788n3MI", 
      redirect_uri: "http://localhost:3000/auth/kakao/callback",
      code,
    }), {
      headers: { "Content-Type": "application/x-www-form-urlencoded" }
    });

    console.log("✅ 카카오 서버로부터 토큰 발급 성공!");
    res.json(response.data); 
  } catch (error) {
    const errorData = error.response?.data;
    
    // ⭐️ [중요] 리액트 중복 호출(KOE320) 시 500 에러 대신 200번으로 부드럽게 처리
    if (errorData?.error_code === 'KOE320') {
      console.log("ℹ️ 중복된 인가 코드 요청입니다. (이미 처리됨)");
      return res.status(200).json({ message: "이미 처리된 코드입니다." });
    }

    console.error("❌ 카카오 토큰 교환 실패:", errorData || error.message);
    res.status(500).json({ error: "카카오 통신 중 오류 발생" });
  }
});

// ==========================================
// [API] 로그인 및 사용자 확인
// ==========================================
app.post('/api/login', verifyTokenMiddleware, (req, res) => {
    const participant = upsertParticipant({
        name: req.body.name || req.user.email || `참여자 ${req.user.walletAddress?.slice(-4) || ''}`,
        email: req.body.email || req.user.email || '',
        walletAddress: req.user.walletAddress,
        joinedAt: req.body.joinedAt || new Date().toISOString(),
        loginProvider: req.body.loginProvider || 'kakao-web3auth'
    });

    res.json({ success: true, user: req.user, participant });
});

app.get('/api/participants', (req, res) => {
    res.json({
        success: true,
        participants
    });
});

app.get('/api/admin/contract-stats', async (req, res) => {
    try {
        const totalParticipants = await readContractTotalParticipants();
        const contractAddress =
            process.env.NOFAKE_CONTRACT_ADDRESS ||
            process.env.CONTRACT_ADDRESS ||
            '';
        const networkName = process.env.NETWORK_NAME || 'Ethereum Mainnet';
        const etherscanBaseUrl = process.env.ETHERSCAN_BASE_URL || 'https://etherscan.io/address';

        res.json({
            success: true,
            totalParticipants,
            contractAddress,
            networkName,
            etherscanUrl: contractAddress ? `${etherscanBaseUrl}/${contractAddress}` : '',
            source: 'NoFake.sol:totalSupply'
        });
    } catch (error) {
        console.error('Contract stats error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            totalParticipants: 0
        });
    }
});

// ==========================================
// [API] 참여자용: 메타데이터 가져오기
// ==========================================
app.get('/api/metadata/:id', verifyTokenMiddleware, async (req, res) => {
    const { id } = req.params;
    const s3Key = isRevealed 
        ? `metadata/post-reveal/${id}.json` 
        : `metadata/pre-reveal/unrevealed.json`;

    try {
        const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: s3Key });
        const response = await s3Client.send(command);
        res.setHeader('Content-Type', response.ContentType);
        response.Body.pipe(res);
    } catch (error) {
        console.error("S3 Error:", error);
        res.status(404).json({ error: '데이터를 찾을 수 없습니다.' });
    }
});

// ==========================================
// [API] 민팅 요청
// ==========================================
app.post('/api/mint', verifyTokenMiddleware, (req, res) => {
    res.json({ success: true, message: "민팅 보안 검증 통과", user: req.user });
});

app.listen(port, () => {
    console.log(`==========================================`);
    console.log(`🚀 No-Fake 통합 보안 서버 가동 중 (Port: ${port})`);
    console.log(`🔐 카카오 인증 대행 및 S3 미들웨어 활성화 완료`);
    console.log(`==========================================`);
});
