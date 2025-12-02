const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const port = 3000;
const FAKE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36';

const NAVER_CLIENT_ID = 'RvwXB1LO1GIEynFybmUO';
const NAVER_CLIENT_SECRET = '6bnhmXlL8s';

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
        const naverApiUrl = `https://openapi.naver.com/v1/search/shop.json?query=${encodedSearchQuery}&display=1&exclude=used:rental`;   // 일단 최상단 1개만 가져옴, 중고와 렌탈상품 제외
        // TODO: 검색 쿼리 최적화 (쓸모없는 부분 삭제, 브랜드 및 모델명 강조 검색)

        const naverResponse = await axios.get(naverApiUrl, {
            headers: {
                'X-Naver-Client-Id': NAVER_CLIENT_ID,
                'X-Naver-Client-Secret': NAVER_CLIENT_SECRET
            },
            timeout: 5000
        });
        const naverResData = naverResponse.data.items[0];
        
        const productResult = [];
        
        productResult.push({
            storeName: ['네이버스토어', 'naverstore'],
            title: naverResData.title,
            price: parseInt(naverResData.lprice),
            url: naverResData.link,
            shippingFeeText: '🛒 링크에서 직접 확인'   // 네이버 API는 배송비 정보 X
        });
        
        console.log(naverResData);
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