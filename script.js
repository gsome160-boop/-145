const surahSelect = document.getElementById('surah-select');
const reciterSelect = document.getElementById('reciter-select');
const mainAudio = document.getElementById('main-audio');
const quranContainer = document.getElementById('quran-container');
const searchInput = document.getElementById('search-input');
const suggestionsList = document.getElementById('suggestions');

// تنسيق قائمة الاقتراحات لضمان ظهورها بشكل صحيح
if (suggestionsList) {
    suggestionsList.style.position = 'absolute';
    suggestionsList.style.backgroundColor = '#ffffff';
    suggestionsList.style.border = '2px solid #1a5235';
    suggestionsList.style.borderRadius = '4px';
    suggestionsList.style.maxHeight = '280px';
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

// دالة شاملة وقوية جداً لتنظيف النص من التشكيل والهمزات لتسهيل المطابقة العادية
function cleanArabicText(text) {
    if (!text) return "";
    return text
        .replace(/[\u064B-\u065F\u0670]/g, "") // إزالة الحركات بالكامل
        .replace(/[أإآا]/g, "ا")             // توحيد الألف
        .replace(/ة/g, "ه")                 // توحيد التاء المربوطة والهاء
        .replace(/ى/g, "ي")                 // توحيد الياء والألف المقصورة
        .replace(/سوره\s+/g, "")            // إزالة كلمة سورة إذا كتبت في البحث
        .replace(/سوره/g, "");
}

// 3. ميزة الاقتراحات والبحث الذكي (صفحة - سورة - آية نصية)
let debounceTimer;
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    suggestionsList.innerHTML = '';
    clearTimeout(debounceTimer);
    
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

    // ب) البحث عن اسم السورة
    const cleanQuery = cleanArabicText(query);
    const surahMatches = allSurahs.filter(surah => {
        const cleanSurahName = cleanArabicText(surah.name);
        return cleanSurahName.includes(cleanQuery);
    });

    if (surahMatches.length > 0) {
        suggestionsList.style.display = 'block';
        surahMatches.forEach(surah => {
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
    }

    // ج) البحث داخل الآيات (يعمل عندما يكتب المستخدم 3 حروف فأكثر لتجنب البطء)
    if (query.length >= 3) {
        debounceTimer = setTimeout(() => {
            fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/ar.clean`)
                .then(response => response.json())
                .then(data => {
                    if (data.data && data.data.results.length > 0) {
                        suggestionsList.style.display = 'block';
                        // عرض أول 5 آيات متطابقة كحد أقصى لمنع ازدحام القائمة
                        const limitedResults = data.data.results.slice(0, 5);
                        limitedResults.forEach(result => {
                            const li = document.createElement('li');
                            li.textContent = `✨ آية: "${result.text.substring(0, 40)}..." - سورة ${result.surah.name}`;
                            styleListItem(li);
                            
                            li.addEventListener('click', () => {
                                surahSelect.value = result.surah.number;
                                updateAudio();
                                searchInput.value = `سورة ${result.surah.name}`;
                                suggestionsList.style.display = 'none';
                            });
                            suggestionsList.appendChild(li);
                        });
                    }
                })
                .catch(err => console.log("خطأ أو لا توجد نتائج للآية"));
        }, 400); // تأخير بسيط لحماية الأداء أثناء الكتابة المتتالية
    }
});

// تنسيق عناصر القائمة
function styleListItem(li) {
    li.style.padding = '12px';
    li.style.cursor = 'pointer';
    li.style.borderBottom = '1px solid #eeeeee';
    li.style.backgroundColor = '#ffffff';
    li.style.color = '#222222';
    li.style.textAlign = 'right';
    li.style.fontSize = '15px';
    li.style.fontWeight = 'bold';
    
    li.addEventListener('mouseenter', () => {
        li.style.backgroundColor = '#d4edda';
        li.style.color = '#1a5235';
    });
    li.addEventListener('mouseleave', () => {
        li.style.backgroundColor = '#ffffff';
        li.style.color = '#222222';
    });
}

// إغلاق قائمة الاقتراحات عند الضغط خارجها
document.addEventListener('click', (e) => {
    if (e.target !== searchInput) {
        suggestionsList.style.display = 'none';
    }
});

surahSelect.addEventListener('change', updateAudio);
reciterSelect.addEventListener('change', updateAudio);
