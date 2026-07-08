const surahSelect = document.getElementById('surahSelect');
const reciterSelect = document.getElementById('reciterSelect');
const audioPlayer = document.getElementById('audioPlayer');
const playPauseBtn = document.getElementById('playPauseBtn');
const searchInput = document.getElementById('searchInput');
const display = document.getElementById('surahTextDisplay');
const suggestionsList = document.getElementById('suggestions');

// مصفوفة السور للاستخدام المحلي عند الفلترة وسرعة العرض
const surahList = ["الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير", "الإنفطار", "المطففين", "الإنشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"];

// ضبط تنسيق قائمة الاقتراحات للبحث الذكي تلقائياً
if (suggestionsList) {
    suggestionsList.style.position = 'absolute';
    suggestionsList.style.backgroundColor = '#ffffff';
    suggestionsList.style.border = '2px solid #1a5235';
    suggestionsList.style.borderRadius = '4px';
    suggestionsList.style.maxHeight = '200px';
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

// جلب بيانات السور الأساسية من الـ API لنظام الاقتراحات
fetch('https://api.alquran.cloud/v1/surah')
    .then(response => response.json())
    .then(data => {
        allSurahs = data.data;
    })
    .catch(error => console.error('خطأ في جلب السور:', error));

function updateSelect(list) {
    surahSelect.innerHTML = '';
    list.forEach((name) => {
        let opt = document.createElement("option");
        let realIndex = surahList.indexOf(name) + 1;
        opt.value = realIndex.toString().padStart(3, '0');
        opt.text = name;
        surahSelect.add(opt);
    });
}

updateSelect(surahList);

// الدالة الأساسية لجلب وعرض نص الآيات الكاملة بالرسم العثماني داخل الصندوق
function fetchAndDisplaySurahText(surahIndex) {
    const surahNumber = parseInt(surahIndex);
    if (!surahNumber) return;

    display.innerText = "جاري تحميل نص السورة والآيات...";

    fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/quran-uthmani`)
        .then(response => response.json())
        .then(data => {
            display.innerHTML = '';
            
            // وضع البسملة في البداية منفصلة ما عدا الفاتحة والتوبة
            if (surahNumber !== 1 && surahNumber !== 9) {
                const bismillahDiv = document.createElement('div');
                bismillahDiv.style.textAlign = 'center';
                bismillahDiv.style.fontWeight = 'bold';
                bismillahDiv.style.marginBottom = '10px';
                bismillahDiv.textContent = 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ';
                display.appendChild(bismillahDiv);
            }

            data.data.ayahs.forEach(ayah => {
                let text = ayah.text;
                // إزالة البسملة الملتصقة بنص الآية الأولى لجمال التنسيق
                if (surahNumber !== 1 && surahNumber !== 9 && ayah.numberInSurah === 1) {
                    text = text.replace('بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', '');
                }
                const ayahSpan = document.createElement('span');
                ayahSpan.textContent = text + ` ﴿${ayah.numberInSurah}﴾ `;
                display.appendChild(ayahSpan);
            });
        })
        .catch(() => { display.innerText = 'حدث خطأ أثناء تحميل نص السورة.'; });
}

function setAudioSource() {
    audioPlayer.pause();
    audioPlayer.src = reciterSelect.value + surahSelect.value + ".mp3";
    // جلب نص الآيات للسورة المحددة وعرضها فوراً
    fetchAndDisplaySurahText(surahSelect.value);
}

surahSelect.addEventListener('change', () => {
    setAudioSource();
    playPauseBtn.innerText = "بدء";
});

reciterSelect.addEventListener('change', () => {
    setAudioSource();
    playPauseBtn.innerText = "بدء";
});

function togglePlay() {
    if (!audioPlayer.src || audioPlayer.src === window.location.href) {
        setAudioSource();
    }
    
    if (audioPlayer.paused) {
        audioPlayer.play()
            .then(() => {
                playPauseBtn.innerText = "توقف";
            })
            .catch(err => {
                console.error("Playback error:", err);
            });
    } else {
        audioPlayer.pause();
        playPauseBtn.innerText = "بدء";
    }
}

// كود عداد التسبيح
function increment() { 
    let c = document.getElementById('count'); 
    c.innerText = parseInt(c.innerText) + 1; 
}
function resetCounter() { 
    document.getElementById('count').innerText = 0; 
}

// دالة لتنظيف النص وتبسيط عمليات البحث بدون تشكيل وحركات
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

// محرك البحث الذكي المطور (يدعم السور والصفحات)
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim();
    suggestionsList.innerHTML = '';
    
    if (!query) {
        suggestionsList.style.display = 'none';
        updateSelect(surahList);
        return;
    }

    // إذا كان البحث برقم الصفحة
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
                            const targetNum = data.data.ayahs[0].surah.number;
                            surahSelect.value = targetNum.toString().padStart(3, '0');
                            setAudioSource();
                            searchInput.value = `صفحة ${pageNumber}`;
                            suggestionsList.style.display = 'none';
                        }
                    });
            });
            suggestionsList.appendChild(li);
        }
        return;
    }

    const filtered = surahList.filter(s => cleanArabicText(s).includes(cleanArabicText(query)));
    updateSelect(filtered);

    const cleanQuery = cleanArabicText(query);
    const matches = allSurahs.filter(surah => cleanArabicText(surah.name).includes(cleanQuery));

    if (matches.length > 0) {
        suggestionsList.style.display = 'block';
        matches.forEach(surah => {
            const li = document.createElement('li');
            li.textContent = ` 🕌 سورة ${surah.name} (رقم ${surah.number})`;
            styleListItem(li);
            li.addEventListener('click', () => {
                surahSelect.value = surah.number.toString().padStart(3, '0');
                setAudioSource();
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
    li.style.padding = '10px';
    li.style.cursor = 'pointer';
    li.style.borderBottom = '1px solid #eeeeee';
    li.style.backgroundColor = '#ffffff';
    li.style.color = '#222222';
    li.style.textAlign = 'right';
    li.addEventListener('mouseenter', () => { li.style.backgroundColor = '#e0f7fa'; });
    li.addEventListener('mouseleave', () => { li.style.backgroundColor = '#ffffff'; });
}

document.addEventListener('click', (e) => { if (e.target !== searchInput) suggestionsList.style.display = 'none'; });

// اختفاء شاشة الترحيب بعد 3 ثوانٍ
setTimeout(() => {
    const overlay = document.getElementById('intro-overlay');
    if(overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => { overlay.style.display = 'none'; }, 1000);
    }
}, 3000);
