const express = require('express');
const app = express();
const port = 3000;

const cors = require('cors');
app.use(cors());

app.get('/', (req, res) => {
    res.send('FindIt Server Initiated');
})

app.get('/search', (req, res) => { // '/search' api endpoint
    const searchQuery = req.query.q;
    console.log(`팝업에서 검색 요청 받음: ${searchQuery}`);

    const mockResults = {
        "results": [
            {
                "storeName": ["쿠팡", "coupang"],
                "price": 245000,
                "shippingFeeText": "🛒 무료배송",
                "url": "https://www.coupang.com/" 
            },
            {
                "storeName": ["알리익스프레스", "aliexpress"],
                "price": 255000,
                "shippingFeeText": "🛒 3000원",
                "url": "https://www.aliexpress.com/"
            },
            {
                "storeName": ["11번가", "11st"],
                "price": 265000,
                "shippingFeeText": "🛒 무료배송",
                "url": "https://www.11st.co.kr/"
            }
        ]
    };

    res.json(mockResults);
});

app.listen(port, () => {
    console.log(`https://localhost:${port} 에서 서버 실행 중`);
})