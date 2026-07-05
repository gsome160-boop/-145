const surahSelect = document.getElementById('surah-select');
const reciterSelect = document.getElementById('reciter-select');
const mainAudio = document.getElementById('main-audio');
const quranContainer = document.getElementById('quran-container');
const searchInput = document.getElementById('search-input'); // تعريف خانة البحث

let allSurahs = []; // لحفظ السور والبحث فيها

// 1. جلب قائمة السور وتعبئتها في القائمة المنسدلة (نفس القديم بضبط)
fetch('https://api.alquran.cloud/v1/surah')
    .then(response => response.json())
    .then(data => {
        allSurahs = data.data; // حفظ السور للبحث
        allSurahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.number}. سورة ${surah.name}`;
            surahSelect.appendChild(option);
        });
    })
    .catch(error => console.error('خطأ في جلب السور:', error));

// 2. دالة تشغيل الصوت وجلب نصوص الآيات (نفس القديم والسرير المضمون تماماً)
function updateAudio() {
    const surahNumber = surahSelect.value;
    const reciterUrl = reciterSelect.value;

    if (!surahNumber) {
        mainAudio.src = '';
        quranContainer.innerHTML = '';
        return;
    }

    // تحويل رقم السورة إلى تنسيق ثلاثي الخانات (مثال: السورة رقم 2 تصبح 002)
    const formattedSurah = String(surahNumber).padStart(3, '0');
    
    // تركيب رابط الصوت المباشر من سيرفر mp3quran الثابت عندك
    const audioUrl = `${reciterUrl}${formattedSurah}.mp3`;
    
    mainAudio.src = audioUrl;
    mainAudio.play().catch(err => console.log("بانتظار تشغيل المستخدم يدوياً"));

    // جلب نص السورة المختار وعرضه بالحركات والترقيم
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

// 3. ميزة البحث المضافة حديثاً (بدون لمس أو تغيير وظائف تشغيل الصوت)
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    if (!query) return;

    // إذا كان المدخل رقماً، يتم جلب السورة التابعة لرقم الصفحة فوراً وبدقة
    if (!isNaN(query)) {
        const pageNumber = parseInt(query);
        if (pageNumber >= 1 && pageNumber <= 604) {
            fetch(`https://api.alquran.cloud/v1/page/${pageNumber}/ar.alafasy`)
                .then(response => response.json())
                .then(data => {
                    if (data.data && data.data.ayahs.length > 0) {
                        const targetSurahNum = data.data.ayahs[0].surah.number;
                        if (surahSelect.value != targetSurahNum) {
                            surahSelect.value = targetSurahNum;
                            updateAudio();
                        }
                    }
                })
                .catch(err => console.error('خطأ في جلب الصفحة:', err));
        }
        return;
    }

    // إذا كان المدخل نصاً، يتم البحث عن اسم السورة
    const cleanQuery = query.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه');
    const foundSurah = allSurahs.find(surah => {
        const cleanSurahName = surah.name.replace(/[أإآا]/g, 'ا').replace(/ة/g, 'ه');
        return cleanSurahName.includes(cleanQuery) || String(surah.number) === query;
    });

    if (foundSurah) {
        if (surahSelect.value != foundSurah.number) {
            surahSelect.value = foundSurah.number;
            updateAudio();
        }
    }
});

surahSelect.addEventListener('change', updateAudio);
reciterSelect.addEventListener('change', updateAudio);
