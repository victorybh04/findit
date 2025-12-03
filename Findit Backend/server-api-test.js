const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');
require('dotenv').config();

const port = process.env.PORT;
const FAKE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

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

    try {
        const gmarketUrl = `https://browse.gmarket.co.kr/search?keyword=${encodedSearchQuery}`;
        const coupangUrl = `https://www.coupang.com/np/search?&q=${encodedSearchQuery}`;
        const naverApiUrl = `https://openapi.naver.com/v1/search/shop.json`;
        // TODO: 검색 쿼리 최적화 (쓸모없는 부분 삭제, 브랜드 및 모델명 강조 검색)

        const naverResponse = await axios.get(naverApiUrl, {
            params: {
                query: searchQuery,     // params 문법에서는 자동으로 query 인코딩
                display: 1,             // 일단 최상단 1개 상품만 가져옴
                exclude: 'used:rental'  // 중고 및 렌탈상품 제외
            },
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: 5000
        });
        const productResult = [];
        
        if (naverResponse.data.items && naverResponse.data.items.length > 0){
            const naverResData = naverResponse.data.items[0];
            
            productResult.push({
                storeName: ['네이버스토어', 'naverstore'],
                title: naverResData.title.replace(/<[^>]*>?/g, ''),
                price: parseInt(naverResData.lprice),
                url: naverResData.link,
                shippingFeeText: '🛒 링크에서 직접 확인'   // 네이버 API는 배송비 정보 X
            });
        }
        
        console.log(productResult);
        // TODO: 최적의 일치상품 하나만 찾아내는 로직 필요
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