import express from "express";
import { ethers } from "ethers";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { Sequelize, DataTypes, Op } from "sequelize";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3002);
const RPC_URL = process.env.RPC_URL || "";
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
const OWNER_PRIVATE_KEY = process.env.OWNER_PRIVATE_KEY || process.env.PRIVATE_KEY || "";
const DB_STORAGE_PATH = process.env.DB_STORAGE_PATH || path.join(__dirname, "database.sqlite");

fs.mkdirSync(path.dirname(DB_STORAGE_PATH), { recursive: true });

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: DB_STORAGE_PATH,
  logging: false,
});

const Raffle = sequelize.define("Raffle", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING },
  description: { type: DataTypes.TEXT },
  imageUrl: { type: DataTypes.STRING },
  startAt: { type: DataTypes.DATE },
  endAt: { type: DataTypes.DATE },
  firstPrizeCount: { type: DataTypes.INTEGER },
  secondPrizeCount: { type: DataTypes.INTEGER },
  status: {
    type: DataTypes.ENUM("READY", "MINTING", "CLOSED", "REVEALED"),
    defaultValue: "MINTING",
  },
  contractAddress: { type: DataTypes.STRING },
  provenanceHash: { type: DataTypes.STRING },
});

const RaffleSession = sequelize.define(
  "RaffleSession",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    raffleId: { type: DataTypes.INTEGER, allowNull: false },
    sessionId: { type: DataTypes.STRING, allowNull: false },
    startedAt: { type: DataTypes.DATE, allowNull: false },
    completedAt: { type: DataTypes.DATE, allowNull: true },
    durationSeconds: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM("STARTED", "COMPLETED"),
      allowNull: false,
      defaultValue: "STARTED",
    },
  },
  {
    indexes: [{ unique: true, fields: ["raffleId", "sessionId"] }],
  }
);

const RaffleParticipant = sequelize.define(
  "RaffleParticipant",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    raffleId: { type: DataTypes.INTEGER, allowNull: false },
    walletAddress: { type: DataTypes.STRING, allowNull: false },
    joinedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    result: {
      type: DataTypes.ENUM("pending", "first", "second", "lose"),
      allowNull: false,
      defaultValue: "pending",
    },
    revealedAt: { type: DataTypes.DATE, allowNull: true },
  },
  {
    indexes: [{ unique: true, fields: ["raffleId", "walletAddress"] }],
  }
);

const normalizeRafflePayload = (body = {}) => ({
  title: String(body.title ?? body.name ?? "").trim(),
  category: String(body.category ?? "").trim() || null,
  description: String(body.description ?? "").trim() || null,
  imageUrl: String(body.imageUrl ?? "").trim() || null,
  startAt: body.startAt || null,
  endAt: body.endAt || null,
  firstPrizeCount: Number(body.firstPrizeCount ?? body.firstPrize ?? 0) || 0,
  secondPrizeCount: Number(body.secondPrizeCount ?? body.secondPrize ?? 0) || 0,
  status: body.status || "MINTING",
});

const abiPath = path.join(__dirname, "abi.json");
const rawAbi = JSON.parse(fs.readFileSync(abiPath, "utf8"));
const contractABI = Array.isArray(rawAbi) ? rawAbi : rawAbi.abi;

const provider = RPC_URL ? new ethers.JsonRpcProvider(RPC_URL) : null;
const readContract =
  provider && CONTRACT_ADDRESS ? new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider) : null;
const signer =
  provider && OWNER_PRIVATE_KEY ? new ethers.Wallet(OWNER_PRIVATE_KEY, provider) : null;
const writeContract =
  signer && CONTRACT_ADDRESS ? new ethers.Contract(CONTRACT_ADDRESS, contractABI, signer) : null;

const buildProvenanceHash = () => {
  const metadataDir = path.join(__dirname, "metadata", "post-reveal");

  if (!fs.existsSync(metadataDir)) {
    throw new Error("post-reveal metadata directory not found.");
  }

  const files = fs
    .readdirSync(metadataDir)
    .filter((file) => file.endsWith(".json"))
    .sort();

  if (files.length === 0) {
    throw new Error("No post-reveal metadata files found.");
  }

  const combinedHashes = files
    .map((file) => {
      const fileData = fs.readFileSync(path.join(metadataDir, file));
      return crypto.createHash("sha256").update(fileData).digest("hex");
    })
    .join("");

  return crypto.createHash("sha256").update(combinedHashes).digest("hex");
};

const ensureReadContract = () => {
  if (!readContract) {
    throw new Error("Blockchain read contract is not configured. Check RPC_URL and CONTRACT_ADDRESS.");
  }

  return readContract;
};

const ensureWriteContract = () => {
  if (!writeContract) {
    throw new Error("Blockchain write wallet is not configured. Set OWNER_PRIVATE_KEY in back/api/.env.");
  }

  return writeContract;
};

const normalizeWalletAddress = (value = "") => {
  const rawAddress = String(value || "").trim();
  if (!rawAddress || !ethers.isAddress(rawAddress)) {
    return "";
  }

  return ethers.getAddress(rawAddress);
};

const getContractParticipantStats = async () => {
  const contract = ensureReadContract();
  const totalSupply = Number(await contract.totalSupply());
  const byRaffleId = {};

  if (totalSupply === 0) {
    return { totalParticipants: 0, byRaffleId };
  }

  const raffleIds = await Promise.all(
    Array.from({ length: totalSupply }, (_, index) => contract.tokenToRaffleId(index + 1))
  );

  raffleIds.forEach((raffleIdValue) => {
    const raffleId = Number(raffleIdValue);
    byRaffleId[raffleId] = (byRaffleId[raffleId] || 0) + 1;
  });

  return {
    totalParticipants: totalSupply,
    byRaffleId,
  };
};

const buildAnalyticsByRaffleId = (sessions = []) => {
  const analyticsMap = {};

  sessions.forEach((session) => {
    const plain = session.toJSON ? session.toJSON() : session;
    const raffleId = Number(plain.raffleId);

    if (!analyticsMap[raffleId]) {
      analyticsMap[raffleId] = {
        startedCount: 0,
        completedCount: 0,
        totalDurationSeconds: 0,
      };
    }

    analyticsMap[raffleId].startedCount += 1;

    if (plain.status === "COMPLETED" || plain.completedAt) {
      analyticsMap[raffleId].completedCount += 1;
      analyticsMap[raffleId].totalDurationSeconds += Math.max(Number(plain.durationSeconds || 0), 0);
    }
  });

  return Object.fromEntries(
    Object.entries(analyticsMap).map(([raffleId, metrics]) => {
      const startedCount = metrics.startedCount;
      const completedCount = metrics.completedCount;
      const dropoutCount = Math.max(startedCount - completedCount, 0);
      const conversionRate = startedCount ? (completedCount / startedCount) * 100 : 0;
      const dropoutRate = startedCount ? (dropoutCount / startedCount) * 100 : 0;
      const avgEntryMinutes = completedCount ? metrics.totalDurationSeconds / completedCount / 60 : 0;

      return [
        raffleId,
        {
          views: startedCount,
          completions: completedCount,
          dropouts: dropoutCount,
          conversionRate,
          dropoutRate,
          avgEntryMinutes,
        },
      ];
    })
  );
};

const getRaffleAnalyticsByIds = async (raffleIds = []) => {
  if (raffleIds.length === 0) {
    return {};
  }

  const sessions = await RaffleSession.findAll({
    where: {
      raffleId: {
        [Op.in]: raffleIds,
      },
    },
  });

  return buildAnalyticsByRaffleId(sessions);
};

const serializeRaffle = (raffle, participantStats = {}, analyticsByRaffleId = {}) => {
  const plain = raffle.toJSON ? raffle.toJSON() : raffle;
  const analytics = analyticsByRaffleId[plain.id] || {};

  return {
    ...plain,
    participants: participantStats[plain.id] || 0,
    views: Number(analytics.views || 0),
    completions: Number(analytics.completions || 0),
    dropouts: Number(analytics.dropouts || 0),
    conversionRate: Number(analytics.conversionRate || 0),
    dropoutRate: Number(analytics.dropoutRate || 0),
    avgEntryMinutes: Number(analytics.avgEntryMinutes || 0),
  };
};

const serializeRaffleForUser = (
  raffle,
  participantStats = {},
  analyticsByRaffleId = {},
  participantByRaffleId = {}
) => {
  const serialized = serializeRaffle(raffle, participantStats, analyticsByRaffleId);
  const participant = participantByRaffleId[Number(serialized.id)] || null;

  return {
    ...serialized,
    maxParticipants: 30,
    hasParticipated: Boolean(participant),
    userResult: participant?.result && participant.result !== "pending" ? participant.result : null,
    userJoinedAt: participant?.joinedAt || null,
  };
};

const getParticipantMapByRaffleId = async (raffleIds = [], walletAddress = "") => {
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  if (!raffleIds.length || !normalizedWallet) {
    return {};
  }

  const participants = await RaffleParticipant.findAll({
    where: {
      raffleId: {
        [Op.in]: raffleIds,
      },
      walletAddress: normalizedWallet,
    },
  });

  return Object.fromEntries(
    participants.map((participant) => {
      const plain = participant.toJSON ? participant.toJSON() : participant;
      return [Number(plain.raffleId), plain];
    })
  );
};

const buildRevealAssignments = (participants = [], raffle) => {
  const raffleId = Number(raffle?.id || 0);
  const firstPrizeCount = Math.max(Number(raffle?.firstPrizeCount || 0), 0);
  const secondPrizeCount = Math.max(Number(raffle?.secondPrizeCount || 0), 0);
  const seedBase = `${raffleId}:${raffle?.provenanceHash || ""}:${participants.length}`;

  const rankedParticipants = [...participants].sort((left, right) => {
    const leftSeed = crypto
      .createHash("sha256")
      .update(`${seedBase}:${left.walletAddress}:${left.joinedAt}:${left.id}`)
      .digest("hex");
    const rightSeed = crypto
      .createHash("sha256")
      .update(`${seedBase}:${right.walletAddress}:${right.joinedAt}:${right.id}`)
      .digest("hex");

    return leftSeed.localeCompare(rightSeed);
  });

  const effectiveFirstPrizeCount = Math.min(firstPrizeCount, rankedParticipants.length);
  const effectiveSecondPrizeCount = Math.min(
    secondPrizeCount,
    Math.max(rankedParticipants.length - effectiveFirstPrizeCount, 0)
  );

  return rankedParticipants.map((participant, index) => {
    let result = "lose";

    if (index < effectiveFirstPrizeCount) {
      result = "first";
    } else if (index < effectiveFirstPrizeCount + effectiveSecondPrizeCount) {
      result = "second";
    }

    return {
      id: participant.id,
      result,
    };
  });
};

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "NOFAKE API server is running.",
    endpoints: [
      "/health",
      "/api/raffles",
      "/api/mint",
      "/api/admin/raffles",
      "/api/admin/contract-stats",
      "/api/metadata/:tokenId",
    ],
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    port: PORT,
    contractConfigured: Boolean(readContract),
    writeWalletConfigured: Boolean(writeContract),
  });
});

app.get("/api/admin/contract-stats", async (req, res) => {
  try {
    const stats = await getContractParticipantStats();
    const contractAddress = CONTRACT_ADDRESS || "";
    const networkName = process.env.NETWORK_NAME || "Ethereum Sepolia";
    const etherscanBaseUrl = process.env.ETHERSCAN_BASE_URL || "https://sepolia.etherscan.io/address";

    res.json({
      success: true,
      totalParticipants: stats.totalParticipants,
      contractAddress,
      networkName,
      etherscanUrl: contractAddress ? `${etherscanBaseUrl}/${contractAddress}` : etherscanBaseUrl,
    });
  } catch (error) {
    console.error("Failed to load contract stats:", error);
    res.status(500).json({ success: false, error: error.message || "Failed to load contract stats." });
  }
});

app.get("/api/raffles", async (req, res) => {
  try {
    const raffles = await Raffle.findAll({ order: [["createdAt", "DESC"]] });
    const stats = await getContractParticipantStats().catch(() => ({ totalParticipants: 0, byRaffleId: {} }));
    const analyticsByRaffleId = await getRaffleAnalyticsByIds(raffles.map((raffle) => Number(raffle.id)));
    const participantByRaffleId = await getParticipantMapByRaffleId(
      raffles.map((raffle) => Number(raffle.id)),
      req.query.walletAddress
    );

    res.json(
      raffles.map((raffle) =>
        serializeRaffleForUser(raffle, stats.byRaffleId, analyticsByRaffleId, participantByRaffleId)
      )
    );
  } catch (error) {
    console.error("Failed to fetch raffles:", error);
    res.status(500).json({ error: "Failed to load raffles." });
  }
});

app.get("/api/admin/raffles", async (req, res) => {
  try {
    const raffles = await Raffle.findAll({ order: [["createdAt", "DESC"]] });
    const stats = await getContractParticipantStats().catch(() => ({ totalParticipants: 0, byRaffleId: {} }));
    const analyticsByRaffleId = await getRaffleAnalyticsByIds(raffles.map((raffle) => Number(raffle.id)));
    res.json({
      success: true,
      data: raffles.map((raffle) => serializeRaffle(raffle, stats.byRaffleId, analyticsByRaffleId)),
    });
  } catch (error) {
    console.error("Failed to load admin raffles:", error);
    res.status(500).json({ success: false, error: "Failed to load raffles." });
  }
});

app.get("/api/admin/raffles/:id", async (req, res) => {
  try {
    const raffle = await Raffle.findByPk(req.params.id);

    if (!raffle) {
      return res.status(404).json({ success: false, error: "Raffle not found." });
    }

    const stats = await getContractParticipantStats().catch(() => ({ totalParticipants: 0, byRaffleId: {} }));
    const analyticsByRaffleId = await getRaffleAnalyticsByIds([Number(req.params.id)]);
    res.json({ success: true, data: serializeRaffle(raffle, stats.byRaffleId, analyticsByRaffleId) });
  } catch (error) {
    console.error("Failed to load raffle detail:", error);
    res.status(500).json({ success: false, error: "Failed to load raffle detail." });
  }
});

app.post("/api/analytics/raffles/:id/session/start", async (req, res) => {
  try {
    const raffleId = Number(req.params.id);
    const sessionId = String(req.body?.sessionId || "").trim();
    const startedAt = req.body?.startedAt ? new Date(req.body.startedAt) : new Date();

    if (!raffleId || !sessionId) {
      return res.status(400).json({ success: false, error: "raffleId and sessionId are required." });
    }

    const raffle = await Raffle.findByPk(raffleId);
    if (!raffle) {
      return res.status(404).json({ success: false, error: "Raffle not found." });
    }

    await RaffleSession.upsert({
      raffleId,
      sessionId,
      startedAt,
      status: "STARTED",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to start raffle session:", error);
    res.status(400).json({ success: false, error: "Failed to start raffle session." });
  }
});

app.post("/api/analytics/raffles/:id/session/complete", async (req, res) => {
  try {
    const raffleId = Number(req.params.id);
    const sessionId = String(req.body?.sessionId || "").trim();
    const startedAt = req.body?.startedAt ? new Date(req.body.startedAt) : new Date();
    const completedAt = req.body?.completedAt ? new Date(req.body.completedAt) : new Date();
    const durationSeconds = Math.max(Number(req.body?.durationSeconds || 0), 0);

    if (!raffleId || !sessionId) {
      return res.status(400).json({ success: false, error: "raffleId and sessionId are required." });
    }

    const raffle = await Raffle.findByPk(raffleId);
    if (!raffle) {
      return res.status(404).json({ success: false, error: "Raffle not found." });
    }

    await RaffleSession.upsert({
      raffleId,
      sessionId,
      startedAt,
      completedAt,
      durationSeconds,
      status: "COMPLETED",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Failed to complete raffle session:", error);
    res.status(400).json({ success: false, error: "Failed to complete raffle session." });
  }
});

app.post("/api/admin/raffles", async (req, res) => {
  try {
    const payload = normalizeRafflePayload(req.body);

    if (!payload.title) {
      return res.status(400).json({ success: false, error: "title is required." });
    }

    if (!payload.startAt || !payload.endAt) {
      return res.status(400).json({ success: false, error: "startAt and endAt are required." });
    }

    if (new Date(payload.startAt) >= new Date(payload.endAt)) {
      return res.status(400).json({ success: false, error: "endAt must be later than startAt." });
    }

    const newRaffle = await Raffle.create({
      ...payload,
      contractAddress: CONTRACT_ADDRESS,
      provenanceHash: buildProvenanceHash(),
    });

    res.status(201).json({
      success: true,
      message: "Raffle created successfully.",
      data: serializeRaffle(newRaffle, {}),
    });
  } catch (error) {
    console.error("Failed to create raffle:", error);
    res.status(400).json({ success: false, error: "Failed to create raffle.", details: error.message });
  }
});

app.patch("/api/admin/raffles/:id/config", async (req, res) => {
  try {
    const raffle = await Raffle.findByPk(req.params.id);

    if (!raffle) {
      return res.status(404).json({ success: false, error: "Raffle not found." });
    }

    const startAt = req.body.startAt || raffle.startAt;
    const endAt = req.body.endAt || raffle.endAt;
    const firstPrizeCount =
      Number(req.body.firstPrizeCount ?? req.body.firstPrize ?? raffle.firstPrizeCount ?? 0) || 0;
    const secondPrizeCount =
      Number(req.body.secondPrizeCount ?? req.body.secondPrize ?? raffle.secondPrizeCount ?? 0) || 0;

    if (!startAt || !endAt) {
      return res.status(400).json({ success: false, error: "startAt and endAt are required." });
    }

    if (new Date(startAt) >= new Date(endAt)) {
      return res.status(400).json({ success: false, error: "endAt must be later than startAt." });
    }

    await raffle.update({
      startAt,
      endAt,
      firstPrizeCount,
      secondPrizeCount,
      status: "MINTING",
    });

    res.json({ success: true, message: "Raffle configuration updated.", data: raffle });
  } catch (error) {
    console.error("Failed to update raffle config:", error);
    res.status(400).json({ success: false, error: "Failed to update raffle config.", details: error.message });
  }
});

app.post("/api/admin/raffles/:id/close", async (req, res) => {
  try {
    const raffle = await Raffle.findByPk(req.params.id);

    if (!raffle) {
      return res.status(404).json({ success: false, error: "Raffle not found." });
    }

    await raffle.update({ status: "CLOSED" });
    res.json({ success: true, message: "Raffle closed.", data: raffle });
  } catch (error) {
    console.error("Failed to close raffle:", error);
    res.status(400).json({ success: false, error: "Failed to close raffle.", details: error.message });
  }
});

app.post("/api/admin/raffles/:id/reveal", async (req, res) => {
  try {
    const raffle = await Raffle.findByPk(req.params.id);

    if (!raffle) {
      return res.status(404).json({ success: false, error: "Raffle not found." });
    }

    const participants = await RaffleParticipant.findAll({
      where: { raffleId: Number(req.params.id) },
      order: [["joinedAt", "ASC"], ["id", "ASC"]],
    });

    if (!participants.length) {
      return res.status(400).json({ success: false, error: "No participants to reveal." });
    }

    const revealAssignments = buildRevealAssignments(participants, raffle);
    const revealedAt = new Date();

    await Promise.all(
      revealAssignments.map((assignment) =>
        RaffleParticipant.update(
          {
            result: assignment.result,
            revealedAt,
          },
          { where: { id: assignment.id } }
        )
      )
    );

    await raffle.update({ status: "REVEALED" });
    res.json({
      success: true,
      message: "Raffle result revealed.",
      data: raffle,
      summary: {
        participants: participants.length,
        firstWinners: revealAssignments.filter((assignment) => assignment.result === "first").length,
        secondWinners: revealAssignments.filter((assignment) => assignment.result === "second").length,
        loseCount: revealAssignments.filter((assignment) => assignment.result === "lose").length,
      },
    });
  } catch (error) {
    console.error("Failed to reveal raffle:", error);
    res.status(400).json({ success: false, error: "Failed to reveal raffle.", details: error.message });
  }
});

app.delete("/api/admin/raffles/:id", async (req, res) => {
  try {
    const raffle = await Raffle.findByPk(req.params.id);

    if (!raffle) {
      return res.status(404).json({ success: false, error: "Raffle not found." });
    }

    await raffle.destroy();
    res.json({ success: true, message: "Raffle deleted." });
  } catch (error) {
    console.error("Failed to delete raffle:", error);
    res.status(400).json({ success: false, error: "Failed to delete raffle.", details: error.message });
  }
});

app.post("/api/mint", async (req, res) => {
  try {
    const { userAddress, raffleId } = req.body || {};

    if (!userAddress || !ethers.isAddress(userAddress)) {
      return res.status(400).json({ success: false, error: "Valid userAddress is required." });
    }

    const raffle = await Raffle.findByPk(raffleId);

    if (!raffle) {
      return res.status(404).json({ success: false, error: "Raffle not found." });
    }

    if (raffle.status !== "MINTING") {
      return res.status(400).json({ success: false, error: "This raffle is not open for minting." });
    }

    if (raffle.startAt && new Date() < new Date(raffle.startAt)) {
      return res.status(400).json({ success: false, error: "This raffle has not started yet." });
    }

    if (raffle.endAt && new Date() > new Date(raffle.endAt)) {
      return res.status(400).json({ success: false, error: "This raffle is already closed." });
    }

    const contract = ensureWriteContract();
    const tx = await contract.mintRaffleTicket(userAddress, raffle.id);
    const receipt = await tx.wait();

    await RaffleParticipant.upsert({
      raffleId: raffle.id,
      walletAddress: normalizeWalletAddress(userAddress),
      joinedAt: new Date(),
      result: "pending",
      revealedAt: null,
    });

    const stats = await getContractParticipantStats();
    const participantCount = stats.byRaffleId[raffle.id] || 0;

    res.json({
      success: true,
      txHash: receipt?.hash || tx.hash,
      raffleId: raffle.id,
      participants: participantCount,
      totalParticipants: stats.totalParticipants,
    });
  } catch (error) {
    console.error("Mint request failed:", error);
    res.status(400).json({
      success: false,
      error: error.shortMessage || error.message || "Mint failed.",
    });
  }
});

app.get("/api/metadata/:tokenId", async (req, res) => {
  try {
    const contract = ensureReadContract();
    const tokenId = req.params.tokenId;
    const raffleId = await contract.tokenToRaffleId(tokenId);
    const isRevealed = await contract.isRevealed(raffleId);

    if (!isRevealed) {
      return res.json({
        name: "Nike X No-Fake Mystery Box",
        description: "Reveal will make the final raffle result visible.",
        image: "https://nofake.s3.ap-northeast-2.amazonaws.com/hidden.png",
        attributes: [{ trait_type: "Status", value: "Unrevealed" }],
      });
    }

    const filePath = path.join(__dirname, "metadata", "post-reveal", `${tokenId}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Metadata file not found." });
    }

    const metadata = JSON.parse(fs.readFileSync(filePath, "utf8"));
    metadata.contract_address = CONTRACT_ADDRESS;
    metadata.external_url = `http://15.164.104.0:${PORT}/api/metadata/${tokenId}`;

    return res.json(metadata);
  } catch (error) {
    return res.status(500).json({ error: "Server error", details: error.message });
  }
});

const ensureSchema = async () => {
  await sequelize.sync();

  const queryInterface = sequelize.getQueryInterface();
  const raffleTable = await queryInterface.describeTable("Raffles");

  if (!raffleTable.description) {
    await queryInterface.addColumn("Raffles", "description", {
      type: DataTypes.TEXT,
      allowNull: true,
    });
  }

  await RaffleSession.sync();
};

ensureSchema().then(() => {
  console.log(`DB synced (Contract: ${CONTRACT_ADDRESS || "not configured"})`);
  app.listen(PORT, () => {
    console.log(`NOFAKE Server running on http://localhost:${PORT}`);
  });
});
