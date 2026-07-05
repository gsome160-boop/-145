const surahSelect = document.getElementById('surah-select');
const reciterSelect = document.getElementById('reciter-select');
const mainAudio = document.getElementById('main-audio');
const quranContainer = document.getElementById('quran-container');

// 1. جلب قائمة السور وتعبئتها في القائمة المنسدلة
fetch('https://api.alquran.cloud/v1/surah')
    .then(response => response.json())
    .then(data => {
        const surahs = data.data;
        surahs.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.number;
            option.textContent = `${surah.number}. سورة ${surah.name}`;
            surahSelect.appendChild(option);
        });
    })
    .catch(error => console.error('خطأ في جلب السور:', error));

// 2. دالة تشغيل الصوت وجلب نصوص الآيات
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
    
    // تركيب رابط الصوت المباشر من سيرفر mp3quran
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

// 3. تحديث الصوت والنصوص تلقائياً عند تغيير السورة أو القارئ
surahSelect.addEventListener('change', updateAudio);
reciterSelect.addEventListener('change', updateAudio);