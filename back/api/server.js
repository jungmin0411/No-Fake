import express from 'express';
import { ethers } from 'ethers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { Sequelize, DataTypes } from 'sequelize';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const CONTRACT_ADDRESS_FROM_ENV = process.env.CONTRACT_ADDRESS;

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false
});

const Raffle = sequelize.define('Raffle', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING },
  imageUrl: { type: DataTypes.STRING },
  startAt: { type: DataTypes.DATE },
  endAt: { type: DataTypes.DATE },
  firstPrizeCount: { type: DataTypes.INTEGER },
  secondPrizeCount: { type: DataTypes.INTEGER },
  status: {
    type: DataTypes.ENUM('READY', 'MINTING', 'CLOSED', 'REVEALED'),
    defaultValue: 'READY'
  },
  contractAddress: { type: DataTypes.STRING },
  provenanceHash: { type: DataTypes.STRING }
});

const normalizeRafflePayload = (body = {}) => ({
  title: String(body.title ?? body.name ?? '').trim(),
  category: String(body.category ?? '').trim() || null,
  imageUrl: String(body.imageUrl ?? '').trim() || null,
  startAt: body.startAt || null,
  endAt: body.endAt || null,
  firstPrizeCount: Number(body.firstPrizeCount ?? body.firstPrize ?? 0) || 0,
  secondPrizeCount: Number(body.secondPrizeCount ?? body.secondPrize ?? 0) || 0,
  status: body.status || 'READY'
});

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const abiPath = path.join(__dirname, 'abi.json');
const rawAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
const contractABI = Array.isArray(rawAbi) ? rawAbi : rawAbi.abi;
const contract = new ethers.Contract(CONTRACT_ADDRESS_FROM_ENV, contractABI, provider);

const buildProvenanceHash = () => {
  const metadataDir = path.join(__dirname, 'metadata', 'post-reveal');
  const files = fs.readdirSync(metadataDir).filter((file) => file.endsWith('.json')).sort();

  if (files.length === 0) {
    throw new Error('post-reveal 메타데이터 파일이 없습니다.');
  }

  const combinedHashes = files
    .map((file) => {
      const fileData = fs.readFileSync(path.join(metadataDir, file));
      return crypto.createHash('sha256').update(fileData).digest('hex');
    })
    .join('');

  return crypto.createHash('sha256').update(combinedHashes).digest('hex');
};

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'NOFAKE API server is running.',
    endpoints: [
      '/api/raffles',
      '/api/admin/raffles',
      '/api/metadata/:tokenId'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    port: PORT
  });
});

app.get('/api/raffles', async (req, res) => {
  try {
    const raffles = await Raffle.findAll({ order: [['createdAt', 'DESC']] });
    res.json(raffles);
  } catch (error) {
    console.error('래플 목록 조회 에러:', error);
    res.status(500).json({ error: '래플 목록을 불러오지 못했습니다.' });
  }
});

app.get('/api/admin/raffles', async (req, res) => {
  try {
    const raffles = await Raffle.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: raffles });
  } catch (error) {
    console.error('관리자 래플 목록 조회 에러:', error);
    res.status(500).json({ success: false, error: '래플 목록을 불러오지 못했습니다.' });
  }
});

app.get('/api/admin/raffles/:id', async (req, res) => {
  try {
    const raffle = await Raffle.findByPk(req.params.id);

    if (!raffle) {
      return res.status(404).json({ success: false, error: '래플을 찾을 수 없습니다.' });
    }

    res.json({ success: true, data: raffle });
  } catch (error) {
    console.error('관리자 래플 상세 조회 에러:', error);
    res.status(500).json({ success: false, error: '래플 상세 정보를 불러오지 못했습니다.' });
  }
});

app.post('/api/admin/raffles', async (req, res) => {
  try {
    const payload = normalizeRafflePayload(req.body);

    if (!payload.title) {
      return res.status(400).json({ error: 'title은 필수입니다.' });
    }

    if (!payload.startAt || !payload.endAt) {
      return res.status(400).json({ error: 'startAt, endAt은 필수입니다.' });
    }

    if (new Date(payload.startAt) >= new Date(payload.endAt)) {
      return res.status(400).json({ error: '종료 시간은 시작 시간보다 뒤여야 합니다.' });
    }

    const newRaffle = await Raffle.create({
      ...payload,
      contractAddress: CONTRACT_ADDRESS_FROM_ENV,
      provenanceHash: buildProvenanceHash()
    });

    res.status(201).json({
      success: true,
      message: '래플 생성 및 데이터 봉인 완료',
      data: newRaffle
    });
  } catch (error) {
    console.error('래플 생성 에러:', error);
    res.status(400).json({ success: false, error: '래플 생성 실패', details: error.message });
  }
});

app.patch('/api/admin/raffles/:id/config', async (req, res) => {
  try {
    const raffle = await Raffle.findByPk(req.params.id);

    if (!raffle) {
      return res.status(404).json({ success: false, error: '래플을 찾을 수 없습니다.' });
    }

    const startAt = req.body.startAt || raffle.startAt;
    const endAt = req.body.endAt || raffle.endAt;
    const firstPrizeCount = Number(req.body.firstPrizeCount ?? req.body.firstPrize ?? raffle.firstPrizeCount ?? 0) || 0;
    const secondPrizeCount = Number(req.body.secondPrizeCount ?? req.body.secondPrize ?? raffle.secondPrizeCount ?? 0) || 0;

    if (!startAt || !endAt) {
      return res.status(400).json({ success: false, error: 'startAt, endAt은 필수입니다.' });
    }

    if (new Date(startAt) >= new Date(endAt)) {
      return res.status(400).json({ success: false, error: '종료 시간은 시작 시간보다 뒤여야 합니다.' });
    }

    await raffle.update({
      startAt,
      endAt,
      firstPrizeCount,
      secondPrizeCount,
      status: 'MINTING'
    });

    res.json({ success: true, message: '래플 설정이 저장되었고 진행중으로 변경되었습니다.', data: raffle });
  } catch (error) {
    console.error('래플 설정 저장 에러:', error);
    res.status(400).json({ success: false, error: '래플 설정 저장 실패', details: error.message });
  }
});

app.post('/api/admin/raffles/:id/close', async (req, res) => {
  try {
    const raffle = await Raffle.findByPk(req.params.id);

    if (!raffle) {
      return res.status(404).json({ success: false, error: '래플을 찾을 수 없습니다.' });
    }

    await raffle.update({ status: 'CLOSED' });
    res.json({ success: true, message: '래플이 종료되었습니다.', data: raffle });
  } catch (error) {
    console.error('래플 종료 에러:', error);
    res.status(400).json({ success: false, error: '래플 종료 실패', details: error.message });
  }
});

app.post('/api/admin/raffles/:id/reveal', async (req, res) => {
  try {
    const raffle = await Raffle.findByPk(req.params.id);

    if (!raffle) {
      return res.status(404).json({ success: false, error: '래플을 찾을 수 없습니다.' });
    }

    await raffle.update({ status: 'REVEALED' });
    res.json({ success: true, message: '래플 결과가 공개되었습니다.', data: raffle });
  } catch (error) {
    console.error('래플 결과 공개 에러:', error);
    res.status(400).json({ success: false, error: '래플 결과 공개 실패', details: error.message });
  }
});

app.delete('/api/admin/raffles/:id', async (req, res) => {
  try {
    const raffle = await Raffle.findByPk(req.params.id);

    if (!raffle) {
      return res.status(404).json({ success: false, error: '래플을 찾을 수 없습니다.' });
    }

    await raffle.destroy();
    res.json({ success: true, message: '래플이 삭제되었습니다.' });
  } catch (error) {
    console.error('래플 삭제 에러:', error);
    res.status(400).json({ success: false, error: '래플 삭제 실패', details: error.message });
  }
});

app.get('/api/metadata/:tokenId', async (req, res) => {
  const tokenId = req.params.tokenId;

  try {
    const raffleId = await contract.tokenToRaffleId(tokenId);
    const isRevealed = await contract.isRevealed(raffleId);

    if (!isRevealed) {
      return res.json({
        name: 'Nike X No-Fake Mystery Box',
        description: '리빌 버튼을 누르면 당첨 결과가 공개됩니다.',
        image: 'https://nofake.s3.ap-northeast-2.amazonaws.com/hidden.png',
        attributes: [{ trait_type: 'Status', value: 'Unrevealed' }]
      });
    }

    const filePath = path.join(__dirname, 'metadata', 'post-reveal', `${tokenId}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '파일이 없습니다.' });
    }

    const metadata = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    metadata.contract_address = CONTRACT_ADDRESS_FROM_ENV;
    metadata.external_url = `http://15.164.104.0:${PORT}/api/metadata/${tokenId}`;

    return res.json(metadata);
  } catch (error) {
    return res.status(500).json({ error: '서버 에러', details: error.message });
  }
});

sequelize.sync().then(() => {
  console.log(`DB Synced (Contract: ${CONTRACT_ADDRESS_FROM_ENV})`);
  app.listen(PORT, () => {
    console.log(`NOFAKE Server running on http://localhost:${PORT}`);
  });
});
