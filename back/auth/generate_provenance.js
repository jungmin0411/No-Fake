const crypto = require('crypto');
const fs = require('fs');

/**
 * 1. 백엔드 B가 생성한 JSON 파일들을 읽어옵니다.
 * 2. 모든 데이터를 하나의 문자열로 결합합니다. (필드 순서 고정 필수)
 * 3. SHA-256 해시를 생성하여 반환합니다.
 */
function generateProvenance() {
    const metadataDir = './metadata'; // 백엔드 B가 JSON을 저장할 폴더
    const files = fs.readdirSync(metadataDir).sort(); // 파일 순서 보장
    
    let combinedString = "";
    
    files.forEach(file => {
        if (file.endsWith('.json') && file !== 'hidden.json') {
            const data = JSON.parse(fs.readFileSync(`${metadataDir}/${file}`, 'utf-8'));
            // JSON 키를 알파벳 순으로 정렬하여 문자열화 (무결성 핵심)
            combinedString += JSON.stringify(data, Object.keys(data).sort());
        }
    });

    const hash = crypto.createHash('sha256').update(combinedString).digest('hex');
    console.log("==========================================");
    console.log("박제용 Provenance Hash:", hash);
    console.log("==========================================");
    return hash;
}

generateProvenance();
