(() => {
  'use strict';

  const NAME_KEY = 'flower.recipient-name.20-10.v1';
  const SEEN_KEY = 'flower.welcome-seen.20-10.v1';
  const dialog = document.getElementById('welcomeDialog');
  const form = document.getElementById('welcomeForm');
  const input = document.getElementById('welcomeName');
  const error = document.getElementById('welcomeError');
  const skip = document.getElementById('skipWelcome');
  const change = document.getElementById('changeName');
  const changeLabel = change.querySelector('.change-label');
  const caption = document.getElementById('greetingCaption');
  const defaultCaption = caption.textContent;
  const clean = value => String(value || '').replace(/\s+/g, ' ').trim().slice(0, input.maxLength);
  let name = '';

  function read(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch { /* Không lưu được thì vẫn dùng tên trong lần xem này. */ }
  }
  function applyName(value) {
    name = value;
    caption.textContent = name ? `Mong hôm nay của ${name} thật dịu dàng.` : defaultCaption;
    changeLabel.textContent = name ? 'Đổi tên' : 'Nhập tên của bạn';
  }
  function announce(value) {
    // card.js nhận sự kiện này để ghi tên vào dòng "Gửi …," của thiệp.
    document.dispatchEvent(new CustomEvent('welcome:name', { detail: { name: value } }));
  }
  function openDialog() {
    input.value = name;
    error.textContent = '';
    dialog.showModal();
    input.focus();
  }

  // Liên kết riêng: index.html?ten=Lan mở thẳng trang với tên Lan, không hỏi lại.
  const fromLink = clean(new URLSearchParams(location.search).get('ten'));
  if (fromLink) {
    write(NAME_KEY, fromLink);
    applyName(fromLink);
    announce(fromLink);
  } else {
    const saved = clean(read(NAME_KEY));
    applyName(saved);
    if (saved) announce(saved);
  }

  change.addEventListener('click', openDialog);
  skip.addEventListener('click', () => dialog.close());
  input.addEventListener('input', () => { error.textContent = ''; });
  dialog.addEventListener('close', () => {
    write(SEEN_KEY, '1');
    change.focus({ preventScroll: true });
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    const value = clean(input.value);
    if (!value) {
      error.textContent = 'Bạn viết tên vào đây nhé.';
      input.focus();
      return;
    }
    write(NAME_KEY, value);
    applyName(value);
    announce(value);
    dialog.close();
    document.dispatchEvent(new Event('welcome:begin'));
  });

  if (!name && read(SEEN_KEY) !== '1') openDialog();
})();