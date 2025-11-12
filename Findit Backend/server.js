const express = require('express');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

const port = 3000;
const FAKE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

app.use(cors());

app.get('/', (req, res) => {
    res.send('FindIt Server Initiated');
})

app.get('/search', async (req, res) => { // '/search' api endpoint
    const searchQuery = req.query.q;
    if (!searchQuery) return res.json({ results: [] });

    console.log(`팝업에서 검색 요청 받음: ${searchQuery}`);
    console.log('크롤링 시작: ', searchQuery)

    try {
        const gmarketUrl = `https://browse.gmarket.co.kr/search?keyword=${encodeURIComponent(searchQuery)}`;
        // task: 검색 쿼리 최적화 (쓸모없는 부분 삭제, 브랜드 및 모델명 강조 검색)

        const response = await axios.get(gmarketUrl, {
            headers: {
                'User-Agent': FAKE_USER_AGENT,
                'Referer': 'https://www.gmarket.co.kr/'
            }
        });
        const html = response.data;

        const $ = cheerio.load(html);

        const productItems = $('div.box__item-container');
        const crawledResult = [];

        productItems.each((index, element) => {
            const title = $(element).find('span.text__item').text().trim();
            const price = $(element).find('strong.text__value').text().trim();
            const url = $(element).find('a.link__item').attr('href');
            const shippingFeeText = $(element).find('span.text__tag').text().trim();

            crawledResult.push({
                storeName: ['G마켓', 'gmarket'],
                title: title,
                price: price,
                url: url,
                shippingFeeText: shippingFeeText
            });
        });
        // task: 최적의 일치상품 하나만 찾아내는 로직 필요

        res.json({ results: crawledResult });
    } 
    catch (error) {
        console.error('크롤링 중 오류 발생', error.message);
        res.json({ results: [] });
    }

//     const mockResults = {
//     "results": [
//         {
//             "storeName": ["쿠팡", "coupang"],
//             "price": 245000,
//             "shippingFeeText": "🛒 무료배송",
//             "url": "https://www.coupang.com/"
//         },
//         {
//             "storeName": ["알리익스프레스", "aliexpress"],
//             "price": 255000,
//             "shippingFeeText": "🛒 3000원",
//             "url": "https://www.aliexpress.com/"
//         },
//         {
//             "storeName": ["11번가", "11st"],
//             "price": 265000,
//             "shippingFeeText": "🛒 무료배송",
//             "url": "https://www.11st.co.kr/"
//         }
//     ]
// };
// res.json(mockResults);
});

app.listen(port, () => {
    console.log(`https://localhost:${port} 에서 서버 실행 중`);
})