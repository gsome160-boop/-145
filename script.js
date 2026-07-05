const surahSelect = document.getElementById('surah-select');
const reciterSelect = document.getElementById('reciter-select');
const mainAudio = document.getElementById('main-audio');
const quranContainer = document.getElementById('quran-container');
const searchInput = document.getElementById('search-input');
const suggestionsList = document.getElementById('suggestions');

// إضافة تنسيق قوي وفوري للقائمة عبر الجافاسكريبت لضمان ظهورها فوق كل شيء
if (suggestionsList) {
    suggestionsList.style.position = 'absolute';
    suggestionsList.style.backgroundColor = '#ffffff';
    suggestionsList.style.border = '2px solid #222222';
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

// 1. جلب قائمة السور وتعبئتها في القائمة المنسدلة
fetch('https://api.alquran.cloud/v1/surah')
    .then(response => response.json())
    .then(data => {
        allSurahs = data.data;
        allSurahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.number}. سورة ${surah.name}`;
            surahSelect.appendChild(option);
        });
    })
    .catch(error => console.error('خطأ في جلب السور:', error));

// 2. دالة تشغيل الصوت وجلب نصوص الآيات وتفعيل التشغيل الفوري
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
            const ayahs = data.data.ayahs;
            ayahs.forEach(ayah => {
                const ayahSpan = document.createElement('span');
                ayahSpan.textContent = ayah.text + ` ﴿${ayah.numberInSurah}﴾ `;
                quranContainer.appendChild(ayahSpan);
            });
        })
        .catch(error => console.error('خطأ في جلب نص السورة:', error));
}

// 3. ميزة الاقتراحات والبحث الذكي مع التشغيل التلقائي فور الضغط
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    suggestionsList.innerHTML = '';
    
    if (!query) {
        suggestionsList.style.display = 'none';
        return;
    }

    // أ) إذا كان البحث برقم (صفحة)
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
                            const targetSurahNum = data.data.ayahs[0].surah.number;
                            surahSelect.value = targetSurahNum;
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

    // ب) إذا كان البحث بنص (اسم السورة)
    const cleanQuery = query.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه');
    const matches = allSurahs.filter(surah => {
        const cleanSurahName = surah.name.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه');
        return cleanSurahName.includes(cleanQuery);
    });

    if (matches.length > 0) {
        suggestionsList.style.display = 'block';
        matches.forEach(surah => {
            const li = document.createElement('li');
            li.textContent = `🕌 سورة ${surah.name} (رقم ${surah.number})`;
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

// دالة لتنسيق عناصر القائمة الفردية لتسهيل الضغط عليها وتلوينها بالكامل
function styleListItem(li) {
    li.style.padding = '12px';
    li.style.cursor = 'pointer';
    li.style.borderBottom = '1px solid #eeeeee';
    li.style.backgroundColor = '#ffffff';
    li.style.color = '#333333';
    li.style.textAlign = 'right';
    li.style.fontSize = '16px';
    li.style.fontWeight = 'bold';
    
    li.addEventListener('mouseenter', () => {
        li.style.backgroundColor = '#e1f5fe';
    });
    li.addEventListener('mouseleave', () => {
        li.style.backgroundColor = '#ffffff';
    });
}

// إغلاق قائمة الاقتراحات عند الضغط في أي مكان خارجها
document.addEventListener('click', (e) => {
    if (e.target !== searchInput) {
        suggestionsList.style.display = 'none';
    }
});

surahSelect.addEventListener('change', updateAudio);
reciterSelect.addEventListener('change', updateAudio);
