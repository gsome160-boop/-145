const surahSelect = document.getElementById('surah-select');
const surahReadSelect = document.getElementById('surah-read-select');
const reciterSelect = document.getElementById('reciter-select');
const mainAudio = document.getElementById('main-audio');
const quranContainer = document.getElementById('quran-container');
const quranReadContainer = document.getElementById('quran-read-container');
const searchInput = document.getElementById('search-input');
const suggestionsList = document.getElementById('suggestions');

// تنسيق القائمة لضمان ظهورها بشكل صحيح
if (suggestionsList) {
    suggestionsList.style.position = 'absolute';
    suggestionsList.style.backgroundColor = '#ffffff';
    suggestionsList.style.border = '2px solid #1a5235';
    suggestionsList.style.borderRadius = '4px';
    suggestionsList.style.maxHeight = '250px';
    suggestionsList.style.overflowY = 'auto';
    suggestionsList.style.zIndex = '99999';
    suggestionsList.style.width = '100%';
    suggestionsList.style.padding = '0';
    suggestionsList.style.margin = '5px 0 0 0';
    suggestionsList.style.listStyle = 'none';
    suggestionsList.style.boxShadow = '0px 4px 10px rgba(0,0,0,0.2)';
    suggestionsList.style.display = 'none';
}

let allSurahs = []; 

// دالة التنقل بين القوائم الرئيسية (Tabs)
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// 1. جلب قائمة السور وتعبئتها في قوائم الاستماع والقراءة
fetch('https://api.alquran.cloud/v1/surah')
    .then(response => response.json())
    .then(data => {
        allSurahs = data.data;
        allSurahs.forEach(surah => {
            // إضافة لقائمة الاستماع
            const option1 = document.createElement('option');
            option1.value = surah.number;
            option1.textContent = `${surah.number}. سورة ${surah.name}`;
            surahSelect.appendChild(option1);

            // إضافة لقائمة القراءة
            const option2 = document.createElement('option');
            option2.value = surah.number;
            option2.textContent = `سورة ${surah.name}`;
            surahReadSelect.appendChild(option2);
        });
    })
    .catch(error => console.error('خطأ في جلب السور:', error));

// 2. دالة تحديث وتشغيل الصوت (قائمة الاستماع)
function updateAudio() {
    const surahNumber = surahSelect.value;
    const reciterUrl = reciterSelect.value;

    if (!surahNumber) {
        mainAudio.src = '';
        quranContainer.innerHTML = '';
        return;
    }

    const formattedSurah = String(surahNumber).padStart(3, '0');
    const audioUrl = `${reciterUrl}${formattedSurah}.mp3`;
    
    mainAudio.src = audioUrl;
    mainAudio.load();
    mainAudio.play().catch(err => console.log("بانتظار تشغيل المستخدم يدوياً"));

    fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/ar.alafasy`)
        .then(response => response.json())
        .then(data => {
            quranContainer.innerHTML = '';
            data.data.ayahs.forEach(ayah => {
                const ayahSpan = document.createElement('span');
                ayahSpan.textContent = ayah.text + ` ﴿${ayah.numberInSurah}﴾ `;
                quranContainer.appendChild(ayahSpan);
            });
        });
}

// 3. دالة جلب وعرض نص السورة الكامل للقراءة (قائمة القراءة)
surahReadSelect.addEventListener('change', () => {
    const surahNumber = surahReadSelect.value;
    if (!surahNumber) {
        quranReadContainer.innerHTML = 'الرجاء اختيار سورة لبدء القراءة...';
        return;
    }
    quranReadContainer.innerHTML = 'جاري تحميل السورة...';
    
    fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`)
        .then(response => response.json())
        .then(data => {
            quranReadContainer.innerHTML = '';
            
            // إضافة البسملة في بداية السورة إذا لم تكن الفاتحة أو التوبة
            if (surahNumber != 1 && surahNumber != 9) {
                const bismillahDiv = document.createElement('div');
                bismillahDiv.style.textAlign = 'center';
                bismillahDiv.style.marginBottom = '20px';
                bismillahDiv.style.fontWeight = 'bold';
                bismillahDiv.textContent = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
                quranReadContainer.appendChild(bismillahDiv);
            }

            data.data.ayahs.forEach(ayah => {
                let text = ayah.text;
                // إزالة البسملة الملتصقة بأول آية من الـ API لتنسيق أفضل
                if (surahNumber != 1 && surahNumber != 9 && ayah.numberInSurah == 1) {
                    text = text.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', '');
                }
                const ayahSpan = document.createElement('span');
                ayahSpan.textContent = text + ` ﴿${ayah.numberInSurah}﴾ `;
                quranReadContainer.appendChild(ayahSpan);
            });
        })
        .catch(() => { quranReadContainer.innerHTML = 'حدث خطأ أثناء تحميل السورة.'; });
});

// 4. نظام التسبيح (عداد الأذكار)
let count = 0;
function changeZikr() {
    document.getElementById('zikr-text').textContent = document.getElementById('zikr-select').value;
}
function incrementCounter() {
    count++;
    document.getElementById('counter-val').textContent = count;
}
function resetCounter() {
    count = 0;
    document.getElementById('counter-val').textContent = count;
}

// 5. دالة تنظيف النص من الحركات والتشكيل للبحث العادي
function cleanArabicText(text) {
    if (!text) return "";
    return text
        .replace(/[\u064B-\u065F\u0670]/g, "") 
        .replace(/[أإآا]/g, "ا")             
        .replace(/ة/g, "ه")                 
        .replace(/ى/g, "y")                 
        .replace(/سوره\s+/g, "")            
        .replace(/سوره/g, "");
}

// 6. ميزة الاقتراحات والبحث الذكي المبسط بدون حركات
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    suggestionsList.innerHTML = '';
    
    if (!query) {
        suggestionsList.style.display = 'none';
        return;
    }

    if (!isNaN(query)) {
        const pageNumber = parseInt(query);
        if (pageNumber >= 1 && pageNumber <= 604) {
            suggestionsList.style.display = 'block';
            const li = document.createElement('li');
            li.textContent = `📖 الانتقال إلى الصفحة رقم ${pageNumber}`;
            styleListItem(li);
            li.addEventListener('click', () => {
                fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/ar.alafasy`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.data && data.data.ayahs.length > 0) {
                            surahSelect.value = data.data.ayahs[0].surah.number;
                            updateAudio(); 
                            searchInput.value = `صفحة ${pageNumber}`;
                            suggestionsList.style.display = 'none';
                        }
                    });
            });
            suggestionsList.appendChild(li);
        }
        return;
    }

    const cleanQuery = cleanArabicText(query);
    const matches = allSurahs.filter(surah => cleanArabicText(surah.name).includes(cleanQuery));

    if (matches.length > 0) {
        suggestionsList.style.display = 'block';
        matches.forEach(surah => {
            const li = document.createElement('li');
            li.textContent = ` 🕌 سورة ${surah.name} (رقم ${surah.number})`;
            styleListItem(li);
            li.addEventListener('click', () => {
                surahSelect.value = surah.number;
                updateAudio(); 
                searchInput.value = `سورة ${surah.name}`;
                suggestionsList.style.display = 'none';
            });
            suggestionsList.appendChild(li);
        });
    } else {
        suggestionsList.style.display = 'none';
    }
});

function styleListItem(li) {
    li.style.padding = '12px';
    li.style.cursor = 'pointer';
    li.style.borderBottom = '1px solid #eeeeee';
    li.style.backgroundColor = '#ffffff';
    li.style.color = '#222222';
    li.style.textAlign = 'right';
    li.style.fontSize = '16px';
    li.style.fontWeight = 'bold';
    li.addEventListener('mouseenter', () => { li.style.backgroundColor = '#d4edda'; li.style.color = '#1a5235'; });
    li.addEventListener('mouseleave', () => { li.style.backgroundColor = '#ffffff'; li.style.color = '#222222'; });
}

document.addEventListener('click', (e) => { if (e.target !== searchInput) suggestionsList.style.display = 'none'; });
surahSelect.addEventListener('change', updateAudio);
reciterSelect.addEventListener('change', updateAudio);
