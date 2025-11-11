const serverIP = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {

    // 현재 활성화된 탭 찾기
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {

        // tabs[0] = 활성화된 탭
        const currentTab = tabs[0];

        // http, https프로토콜인지 확인
        if (!currentTab.url || currentTab.url.startsWith('chrome://')) {
            updateTitle('이 페이지에서는 사용할 수 없습니다.');
            setupLinks(null);
            return;
        }

        chrome.scripting.executeScript(
            {
                target: { tabId: currentTab.id }, // 현재 탭 페이지에 content.js 파일 주입
                files: ['/js/content.js']
            },
            () => {
                // 주입 단계에서 에러가 났는지 확인 (예: 권한 문제)
                if (chrome.runtime.lastError) {
                    console.error('찾자! 스크립트 주입 실패:', chrome.runtime.lastError.message);
                    updateTitle('스크립트 실행에 실패했습니다.');
                    setupLinks(null);
                    return;
                }

                // content.js에 GET_PRODUCT_TITLE 메시지를 발송
                chrome.tabs.sendMessage(
                    currentTab.id, // 현재 탭 정보
                    { type: 'GET_PRODUCT_TITLE' },
                    (response) => {
                        console.log(response);
                        if (chrome.runtime.lastError) { //에러가 있었다면
                            console.warn('찾자!: content.js로부터 응답을 받지 못했습니다.', chrome.runtime.lastError.message);
                            updateTitle('페이지에서 상품 정보를 찾을 수 없습니다.');
                            return;
                        }
                        switch (response.title) {
                            case '상품명 찾기 실패':
                                updateTitle('상품명을 찾을 수 없습니다.');
                                break;
                            case '쇼핑몰 페이지가 아닙니다.':
                                updateTitle('쇼핑몰 페이지가 아닙니다.');
                                break;
                            default:
                                updateTitle(response.title);
                                const encodedTitle = encodeURIComponent(response.title);
                                fetch(serverIP + '/search?q=' + encodedTitle) //백엔드 서버에 get 요청
                                    .then(response => response.json())
                                    .then(data => {
                                        const results = data.results;
                                        if (results.length > 0) {
                                            document.querySelector('.result-list').replaceChildren();
                                            renderResults(results);
                                        } else {
                                            document.getElementById('loading-message').innerText('검색 결과가 없습니다.');
                                        }
                                    });
                        }
                    }
                );
            }); //excuteScript 끝
    });
});


/**
 * popup.js 제목을 업데이트하는 함수
 * @param {string} title - 표시할 상품명
 */
function updateTitle(title) {
    const titleElement = document.getElementById('product-title');
    if (titleElement) {
        titleElement.innerText = title;
    }
}

/**
 * popup.html에 
 * @param {Array} resultArray - 서버에서 받은 results 요소 작성
 */
function renderResults(resultsArray) {
    resultsArray.forEach(i => {
        let resultList = document.getElementsByClassName('result-list')[0];
        let productCard = document.createElement('li');
        productCard.className = 'result-item';
        productCard.id = i.storeName[1];
        productCard.innerHTML = `
        <div>
            <p class="store-name primary-text">${i.storeName[0]}</p>
            <p class="shipping-fee sub-text">${i.shippingFeeText}</p>
        </div>
        <div class="flex-right">
            <span class="price">${i.price}원</span>
            <span class="link-box"><div class="link"></div></span>
        </div>
            `;
        resultList.appendChild(productCard);
    });
}