import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import 'dotenv/config';

// [수정] Web3Auth 열쇠가 아니라 '카카오 열쇠'를 바라보게 합니다.
const client = jwksClient({
  jwksUri: 'https://kauth.kakao.com/.well-known/jwks.json' 
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) return callback(err);
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

const verifyUserToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "토큰 없음" });

    const token = authHeader.split(' ')[1];

    jwt.verify(token, getKey, {
        algorithms: ['RS256'],
        // [중요] 카카오 토큰의 aud는 '카카오 REST API 키'입니다.
        audience: process.env.KAKAO_REST_API_KEY 
    }, (err, decoded) => {
        if (err) {
            console.error("검증 에러:", err.message);
            return res.status(401).json({ error: "인증 실패" });
        }

        // 카카오 토큰에서는 'sub'가 사용자의 고유 번호입니다.
        req.user = {
            walletAddress: decoded.sub, 
            email: decoded.email
        };

        console.log("✅ 카카오 사용자 확인 완료:", req.user.walletAddress);
        next();
    });
};

export default verifyUserToken;
