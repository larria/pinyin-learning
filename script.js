import { PINYIN_DATA } from './data.js';

class PinyinApp {
    constructor() {
        this.currentCategory = null;
        this.currentIndex = 0;
        this.currentList = [];

        // Views
        this.homeView = document.getElementById('home-view');
        this.gridView = document.getElementById('grid-view');
        this.detailView = document.getElementById('detail-view');

        // Elements
        this.pinyinGrid = document.getElementById('pinyin-grid');
        this.categoryTitle = document.getElementById('category-title');

        // Detail Elements
        this.detailChar = document.getElementById('detail-char');
        this.detailEmoji = document.getElementById('detail-emoji');
        this.detailWord = document.getElementById('detail-word');

        // Speech
        this.synth = window.speechSynthesis;
    }

    showCategory(category) {
        this.currentCategory = category;
        this.currentList = PINYIN_DATA[category];

        // Set Title
        const titles = {
            'initials': '声母 (Initials)',
            'finals': '韵母 (Finals)',
            'overall': '整体认读 (Syllables)'
        };
        this.categoryTitle.textContent = titles[category];

        // Render Grid
        this.renderGrid();

        // Switch View
        this.switchView(this.gridView);

        // Encouragement
        this.showEncouragement();
    }

    renderGrid() {
        this.pinyinGrid.innerHTML = '';
        this.currentList.forEach((item, index) => {
            const el = document.createElement('div');
            el.className = 'grid-item';
            el.textContent = item.char;
            el.onclick = () => this.showDetail(index);
            // Staggered animation
            el.style.animation = `fadeInUp 0.5s ease backwards ${index * 0.05}s`;
            this.pinyinGrid.appendChild(el);
        });
    }

    showDetail(index) {
        this.currentIndex = index;
        this.updateDetailCard();
        this.switchView(this.detailView);

        // Auto play audio after transition
        setTimeout(() => this.playAudio(), 500);
    }

    updateDetailCard() {
        const item = this.currentList[this.currentIndex];
        this.detailChar.textContent = item.char;
        this.detailEmoji.textContent = item.emoji;
        this.detailWord.innerHTML = this.getHighlightedWord(item.word, item.char);

        // Animation reset
        const card = document.getElementById('flashcard');
        card.style.animation = 'none';
        card.offsetHeight; /* trigger reflow */
        card.style.animation = 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    }

    getHighlightedWord(word, target) {
        // Map vowels to their toned versions
        const toneMap = {
            'a': '[aāáǎà]',
            'o': '[oōóǒò]',
            'e': '[eēéěè]',
            'i': '[iīíǐì]',
            'u': '[uūúǔù]',
            'ü': '[üǖǘǚǜv]',
            'v': '[üǖǘǚǜv]'
        };

        // Construct regex pattern
        let pattern = '';
        for (let char of target) {
            if (toneMap[char]) {
                pattern += toneMap[char];
            } else {
                pattern += char;
            }
        }

        // Create regex with global and case insensitive flags
        const regex = new RegExp(`(${pattern})`, 'gi');

        // Replace in the word
        return word.replace(regex, '<span class="highlight">$1</span>');
    }

    playAudio() {
        const item = this.currentList[this.currentIndex];

        if (this.synth.speaking) {
            this.synth.cancel();
        }

        // Use the pronunciation character if available, otherwise fallback to char (which might be wrong)
        const textToSpeak = item.pronounce || item.char;
        const utterChar = new SpeechSynthesisUtterance(textToSpeak);

        // Find a Chinese voice
        const voices = this.synth.getVoices();
        const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));

        if (zhVoice) {
            utterChar.voice = zhVoice;
        }

        utterChar.lang = 'zh-CN';
        utterChar.rate = 0.1;

        this.synth.speak(utterChar);

        // Visual feedback
        const card = document.getElementById('flashcard');
        card.style.transform = 'scale(1.05)';
        setTimeout(() => card.style.transform = 'scale(1)', 200);
    }

    nextCard() {
        if (this.currentIndex < this.currentList.length - 1) {
            this.currentIndex++;
        } else {
            this.currentIndex = 0;
        }
        this.updateDetailCard();
        this.playAudio();

        // Random encouragement
        if (Math.random() > 0.7) {
            this.showEncouragement();
        }
    }

    prevCard() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
        } else {
            this.currentIndex = this.currentList.length - 1;
        }
        this.updateDetailCard();
        this.playAudio();
    }

    goHome() {
        this.switchView(this.homeView);
    }

    goBackToGrid() {
        this.switchView(this.gridView);
    }

    switchView(targetView) {
        // Hide all
        [this.homeView, this.gridView, this.detailView].forEach(v => {
            v.classList.add('hidden');
            v.classList.remove('active');
        });

        // Show target
        targetView.classList.remove('hidden');
        targetView.classList.add('active');
    }

    showEncouragement() {
        const dadMsgs = ["咪猪头真棒！", "大猪头爸爸为你骄傲！", "继续加油！", "太厉害了！"];
        const momMsgs = ["宝贝太聪明了！", "蜂蜜小黄鱼妈妈给你比心 ❤️", "读得真好听！", "哇，全对！"];

        const isDad = Math.random() > 0.5;
        const msg = isDad ? dadMsgs[Math.floor(Math.random() * dadMsgs.length)] : momMsgs[Math.floor(Math.random() * momMsgs.length)];
        const elId = isDad ? 'dad-msg' : 'mom-msg';
        const el = document.getElementById(elId);

        el.textContent = msg;
        el.classList.remove('hidden');

        // Parent bounce
        const parentEl = el.parentElement;
        parentEl.style.transform = 'translateY(-20px)';
        setTimeout(() => parentEl.style.transform = 'translateY(0)', 300);

        setTimeout(() => {
            el.classList.add('hidden');
        }, 3000);
    }
}

// Global instance
window.app = new PinyinApp();

// Add key animations
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes popIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
}
`;
document.head.appendChild(styleSheet);
