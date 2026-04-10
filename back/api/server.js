import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';
import crypto from 'crypto';

// 1. 환경 설정 및 경로 정의
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3002;
// .env 파일에서 컨트랙트 주소 가져오기
const CONTRACT_ADDRESS_FROM_ENV = process.env.CONTRACT_ADDRESS;

// 2. 데이터베이스 설정 (SQLite)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, 'database.sqlite'),
    logging: false
});

// 래플 모델 정의 (기획 요구사항 반영)
const Raffle = sequelize.define('Raffle', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },       // 래플 명
    category: { type: DataTypes.STRING },                      // 카테고리
    imageUrl: { type: DataTypes.STRING },                      // 상품 이미지
    startAt: { type: DataTypes.DATE },                         // 시작 시간
    endAt: { type: DataTypes.DATE },                           // 종료 시간
    firstPrizeCount: { type: DataTypes.INTEGER },              // 1등 수
    secondPrizeCount: { type: DataTypes.INTEGER },             // 2등 수
    status: { 
        type: DataTypes.ENUM('READY', 'MINTING', 'CLOSED', 'REVEALED'),
        defaultValue: 'READY' 
    },
    contractAddress: { type: DataTypes.STRING },               // .env에서 자동 주입됨
    provenanceHash: { type: DataTypes.STRING }                  // 서버에서 자동 계산됨
});

// 3. 블록체인(Ethers.js) 설정
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const abiPath = path.join(__dirname, 'abi.json');
const rawAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
const contractABI = Array.isArray(rawAbi) ? rawAbi : rawAbi.abi;

const contract = new ethers.Contract(CONTRACT_ADDRESS_FROM_ENV, contractABI, provider);

// --- [API] 래플 관리 로직 ---

// 1. 사용자용 래플 목록 조회
app.get('/api/raffles', async (req, res) => {
    try {
        const raffles = await Raffle.findAll({ order: [['createdAt', 'DESC']] });
        res.json(raffles);
    } catch (error) {
        console.error("목록 조회 에러:", error);
        res.status(500).json({ error: "래플 목록을 불러오지 못했습니다." });
    }
});

// 2. 관리자용 래플 생성 (Provenance Hash 및 컨트랙트 주소 자동 처리)
app.post('/api/admin/raffles', async (req, res) => {
    try {
        const metadataDir = path.join(__dirname, 'metadata', 'post-reveal');
        
        // --- [핵심] Provenance Hash 계산 ---
        const files = fs.readdirSync(metadataDir).filter(f => f.endsWith('.json')).sort();
        if (files.length === 0) {
            return res.status(400).json({ error: "post-reveal 폴더에 메타데이터 파일이 없습니다." });
        }

        let combinedHashes = "";
        files.forEach(file => {
            const fileData = fs.readFileSync(path.join(metadataDir, file));
            const fileHash = crypto.createHash('sha256').update(fileData).digest('hex');
            combinedHashes += fileHash;
        });
        const finalProvenanceHash = crypto.createHash('sha256').update(combinedHashes).digest('hex');

        // --- [핵심] DB 데이터 생성 ---
        const newRaffle = await Raffle.create({
            ...req.body, // title, category, imageUrl, startAt, endAt, firstPrizeCount, secondPrizeCount
            contractAddress: CONTRACT_ADDRESS_FROM_ENV, // .env에서 가져온 주소 자동 주입
            provenanceHash: finalProvenanceHash       // 서버에서 계산된 해시 자동 주입
        });

        res.status(201).json({ message: "래플 생성 및 데이터 봉인 완료", data: newRaffle });
    } catch (error) {
        console.error("생성 에러:", error);
        res.status(400).json({ error: "래플 생성 실패", details: error.message });
    }
});

// --- [API] NFT 메타데이터 로직 ---

app.get('/api/metadata/:tokenId', async (req, res) => {
    const tokenId = req.params.tokenId;
    try {
        const raffleId = await contract.tokenToRaffleId(tokenId);
        const isRevealed = await contract.isRevealed(raffleId);

        if (!isRevealed) {
            return res.json({
                name: "Nike X No-Fake Mystery Box",
                description: "리빌 버튼을 누르면 당첨 결과가 공개됩니다!",
                image: "https://nofake.s3.ap-northeast-2.amazonaws.com/hidden.png",
                attributes: [{ "trait_type": "Status", "value": "Unrevealed" }]
            });
        }

        const filePath = path.join(__dirname, 'metadata', 'post-reveal', `${tokenId}.json`);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: "파일 없음" });
        }

        let metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        metadata.contract_address = CONTRACT_ADDRESS_FROM_ENV;
        metadata.external_url = `http://15.164.104.0:${PORT}/api/metadata/${tokenId}`;

        return res.json(metadata);
    } catch (error) {
        res.status(500).json({ error: "서버 에러", details: error.message });
    }
});

// 서버 실행 및 DB 싱크
sequelize.sync().then(() => {
    console.log(`✅ DB Synced (Contract: ${CONTRACT_ADDRESS_FROM_ENV})`);
    app.listen(PORT, () => {
        console.log(`🚀 NOFAKE Server running on http://localhost:${PORT}`);
    });
});