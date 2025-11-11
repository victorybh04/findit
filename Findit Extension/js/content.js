console.log('content.js 콘솔')
//popup.js 요청 확인단
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_PRODUCT_TITLE") { // 1. popup.js로부터 상품명체크 요청 확인
        const title = getProductTitle(); // 2. 현재 페이지 상품명 받기
        console.log('title');
        sendResponse({ title: title }); // 3. popup.js로 응답 전송
    }
    return true; // 비동기 응답을 위한 true 반환
});





// 함수 선언
function getProductTitle() { // 현재 페이지에서 상품명 (title)을 반환하는 함수
    const hostname = window.location.hostname; // 현재 페이지 주소
    let title = '';

    try {
        if (hostname.includes('coupang.com')) {
            title = document.querySelector('.product-title').innerText;
        } else if (hostname.includes('aliexpress.com')) {
            title = document.querySelector('.title--wrap--UUHae_g').innerText;
        } else {
            //title = document.querySelector('h1').innerText;
            title = '쇼핑몰 페이지가 아닙니다.'
        }
    } catch (e) {
        console.warn('핫딜 파인더 : 상품명을 찾을 수 없습니다.', e);
        title = '상품명 찾기 실패';
    }

    return title.trim();
}