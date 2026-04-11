const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

async function main() {
    // 1. 팀장님이 알려주신 메타데이터 폴더 경로 설정 (상대 경로 반영)
    const metadataDir = path.join(__dirname, '../api/metadata/post-reveal'); 
    const totalFiles = 30;
    let combinedHashes = "";

    console.log("🛡️ NoFake 시스템 무결성 검증을 위한 Provenance Hash 생성을 시작합니다...");
    console.log(`📂 대상 폴더: ${path.resolve(metadataDir)}`);

    try {
        for (let i = 1; i <= totalFiles; i++) {
            const filePath = path.join(metadataDir, `${i}.json`);
            
            // 파일 존재 여부 확인 (보안 및 오류 방지)
            if (!fs.existsSync(filePath)) {
                throw new Error(`파일을 찾을 수 없습니다: ${i}.json`);
            }

            const fileBuffer = fs.readFileSync(filePath);
            
            // 각 파일의 SHA-256 해시 생성 (무결성 검성용)
            const hash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            combinedHashes += hash;
            
            console.log(`[File ${i}] Hash: ${hash.substring(0, 10)}...`);
        }

        // 2. 모든 개별 해시를 합친 최종 해시(Provenance Hash) 생성
        const finalProvenanceHash = crypto.createHash('sha256').update(combinedHashes).digest('hex');

        console.log("\n==================================================");
        console.log("✅ 최종 PROVENANCE HASH가 생성되었습니다!");
        console.log(`값: ${finalProvenanceHash}`);
        console.log("==================================================\n");
        console.log("💡 이 값을 컨트랙트의 setProvenanceHash 함수에 기록하여 봉인하세요.");

    } catch (error) {
        console.error("❌ 오류 발생:");
        console.error(error.message);
    }
}

main();