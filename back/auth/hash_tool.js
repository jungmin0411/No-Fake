const crypto = require('crypto');

// 나중에 백엔드 B가 줄 메타데이터 샘플입니다.
const sampleData = [
    { "id": 1, "prize": "iPhone 15", "rarity": "Legendary" },
    { "id": 2, "prize": "Coffee Coupon", "rarity": "Common" }
];

// 데이터 무결성을 보장하기 위해 문자열로 변환 후 SHA-256 해싱
function getProvenanceHash(data) {
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
}

console.log("------------------------------------------");
console.log("생성된 조작 방지 해시(Provenance Hash):");
console.log(getProvenanceHash(sampleData));
console.log("------------------------------------------");
