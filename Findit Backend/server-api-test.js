const express = require('express');
const app = express();
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT;

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID;
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET;

app.use(cors());

app.get('/', (req, res) => {
    res.send('FindIt Server Initiated');
})

app.get('/search', async (req, res) => { // '/search' api endpoint
    const searchQuery = req.query.q;
    const encodedSearchQuery = encodeURIComponent(searchQuery);
    if (!searchQuery) return res.json({ results: [] });

    console.log(`팝업에서 검색 요청 받음: ${searchQuery}`);
    console.log('검색 시작: ', searchQuery)

    const cleanedQuery = cleanProductTitle(searchQuery);
    console.log('Cleaned: ', cleanedQuery);

    try {
        const gmarketUrl = `https://browse.gmarket.co.kr/search?keyword=${encodedSearchQuery}`;
        const coupangUrl = `https://www.coupang.com/np/search?&q=${encodedSearchQuery}`;
        const naverApiUrl = `https://openapi.naver.com/v1/search/shop.json`;
        // TODO: 검색 쿼리 최적화 (쓸모없는 부분 삭제, 브랜드 및 모델명 강조 검색)

        const naverResponse = await axios.get(naverApiUrl, {
            params: {
                query: cleanedQuery,     // params 문법에서는 자동으로 query 인코딩
                display: 10,
                exclude: 'used:rental'  // 중고 및 렌탈상품 제외
            },
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: 5000
        });
        const productResult = findBestMatchProduct(searchQuery, naverResponse.data.items);
        console.log(`검색 결과: ${productResult.length}개 (필터링 됨)`);
        
        res.json({ results: productResult });
    }
    catch (error) {
        console.error('서버와 통신 중 오류 발생', error.message);
        res.json({ results: [] });
    }
});

app.listen(port, () => {
    console.log(`https://localhost:${port} 에서 서버 실행 중`);
})






// functions

/**
 * 상품명 제목 정제
 * @param {string} title 상품명
 * @returns {string} 정제된 상품명
 */
function cleanProductTitle(title) {
    let cleaned = title;
    const unwantedPatterns = [
        '공식판매점', '자급제', '당일발송', '무료배송', '카드할인', '최저가',
        '혜택', '선물', '정품', '보장', '쿠팡', '로켓', '배송', '특가', '한정수량', '사은품', '증정', '이벤트'
    ];

    cleaned = cleaned.replace(/\[.*?\]/g, ''); // 대괄호 제거
    cleaned = cleaned.replace(/\(.*?\)/g, ''); // 소괄호 제거

    unwantedPatterns.forEach(pattern => {
        cleaned = cleaned.replaceAll(pattern, '');  // 불필요한 단어 제거
    });
    return cleaned.replace(/\s+/g, ' ').trim(); // 다중 공백 제거 및 앞뒤 공백 제거
}

/**
 * 최적의 일치 상품 찾기
 * @param {string} originalTitle 원본 검색어 (SearchQuery)
 * @param {Array} products API로 받아온 상품 리스트
 * @returns {Array} 최적의 일치 상품 리스트 (Sorted by match score)
 */
function findBestMatchProduct(originalTitle, products) {
    if (!products || products.length === 0) return [];

    const keywords = cleanProductTitle(originalTitle).split(' ').filter(w => w.length >= 2); // 키워드 추출
    const filteredResults = [];

    products.forEach(item => {
        const itemTitle = item.title.replace(/<[^>]*>?/g, '');
        
        // 점수 매기기 로직
        let matchCount = 0;
        let isValid = true;

        // 원본의 핵심 키워드가 상품명에도 있는지 검사
        keywords.forEach(keyword => {
            if (itemTitle.includes(keyword)) {
                matchCount++;
            }
        });

        // 너무 저렴하거나 비싼 상품은 제외
        // const priceRatio = product.lprice / product.hprice;
        // if (priceRatio < 0.3 || priceRatio > 3.0) {
        //     isValid = false;
        // }

        if (isValid) {
            filteredResults.push({ 
                storeName: [item.mallName, 'naverstore'],
                title: itemTitle,
                price: parseInt(item.lprice),
                url: item.link,
                shippingFeeText: '🛒 링크에서 직접 확인',
                matchScore: matchCount 
            });
        }
    });
    return filteredResults.sort((a, b) => b.matchScore - a.matchScore);
}