const STORAGE_KEYS = {
  transactions: 'expense_app_transactions_v3',
  expenseNote: 'expense_app_expense_note_v3',
  mainNote: 'expense_app_main_note_v3',
  activeTab: 'expense_app_active_tab_v3'
};

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEYS.transactions) || '[]');
let modalType = 'income';

const $ = (id) => document.getElementById(id);

function yen(amount) {
  return `${Number(amount || 0).toLocaleString('ja-JP')}円`;
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEYS.transactions, JSON.stringify(transactions));
}

function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}


function shortDate(dateText) {
  const d = new Date(dateText || Date.now());
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

function linkifyText(text) {
  const safe = escapeHtml(text);
  const urlRegex = /(https?:\/\/[^\s<]+)/g;
  return safe.replace(urlRegex, '<a class="note-link" href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
}

function setMainNoteText(text) {
  $('mainNote').innerHTML = linkifyText(text || '');
}

function getMainNoteText() {
  return $('mainNote').innerText.replace(/\n$/, '');
}

function currentMonth() {
  return Number($('monthInput').value);
}

function currentYear() {
  return Number($('yearInput').value);
}

function sameMonth(item) {
  const d = new Date(item.date || Date.now());
  return d.getFullYear() === currentYear() && d.getMonth() + 1 === currentMonth();
}

function weekNumber(dateText) {
  const d = new Date(dateText || Date.now());
  const day = d.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

function renderMoney() {
  const monthItems = transactions.filter(sameMonth);
  const incomes = monthItems.filter(item => item.type === 'income');
  const expenses = monthItems.filter(item => item.type === 'expense');

  renderList($('incomeList'), incomes);
  renderList($('expenseList'), expenses);

  const totalIncome = incomes.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

  $('totalIncome').textContent = yen(totalIncome);
  $('totalExpense').textContent = yen(totalExpense);
  $('balance').textContent = yen(totalIncome - totalExpense);

  for (let i = 1; i <= 4; i++) {
    const weekItems = monthItems.filter(item => weekNumber(item.date) === i);
    const weekIncome = weekItems.filter(item => item.type === 'income').reduce((sum, item) => sum + item.amount, 0);
    const weekExpense = weekItems.filter(item => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0);
    $(`week${i}`).textContent = yen(weekIncome - weekExpense);
  }
}

function renderList(container, list) {
  container.innerHTML = '';

  if (list.length === 0) {
    container.innerHTML = '<div class="empty">Chưa có dữ liệu</div>';
    return;
  }

  list.forEach(item => {
    const div = document.createElement('div');
    div.className = 'item';
    div.innerHTML = `
      <span class="item-date">${shortDate(item.date)}</span>
      <span class="item-title">${escapeHtml(item.title)}</span>
      <span class="item-money">${yen(item.amount)}</span>
      <button class="delete-btn" data-id="${item.id}">X</button>
    `;
    container.appendChild(div);
  });
}

function todayTextForInput() {
  const day = String(new Date().getDate()).padStart(2, '0');
  return `${currentYear()}/${String(currentMonth()).padStart(2, '0')}/${day}`;
}

function todayTextForData() {
  const day = String(new Date().getDate()).padStart(2, '0');
  return `${currentYear()}-${String(currentMonth()).padStart(2, '0')}-${day}`;
}

function addTransaction(type) {
  modalType = type;
  $('modalTitle').textContent = type === 'income' ? 'Nhập khoản thu' : 'Nhập khoản chi';
  $('modalDate').value = todayTextForInput();
  $('modalTitleInput').value = '';
  $('modalAmountInput').value = '';
  $('entryModal').classList.add('show');
  $('entryModal').setAttribute('aria-hidden', 'false');
  setTimeout(() => $('modalTitleInput').focus(), 50);
}

function closeModal() {
  $('entryModal').classList.remove('show');
  $('entryModal').setAttribute('aria-hidden', 'true');
}

function saveModalTransaction() {
  const title = $('modalTitleInput').value.trim();
  const amount = Number($('modalAmountInput').value);

  if (!title || !amount || amount <= 0) {
    alert('Bạn nhập đủ nội dung và số tiền lớn hơn 0 nhé.');
    return;
  }

  transactions.unshift({
    id: Date.now().toString(),
    type: modalType,
    title,
    amount,
    date: todayTextForData()
  });

  saveTransactions();
  renderMoney();
  closeModal();
}

function deleteTransaction(id) {
  transactions = transactions.filter(item => item.id !== id);
  saveTransactions();
  renderMoney();
}

function initMonthYear() {
  const now = new Date();
  for (let i = 1; i <= 12; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = i;
    $('monthInput').appendChild(option);
  }
  $('monthInput').value = now.getMonth() + 1;
  $('yearInput').value = now.getFullYear();

  $('monthInput').addEventListener('change', renderMoney);
  $('yearInput').addEventListener('input', renderMoney);
}

function openTab(tabId) {
  document.querySelector('.app').classList.toggle('note-mode', tabId === 'noteTab');
  document.querySelector('.app').classList.toggle('expense-mode', tabId === 'expenseTab');
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.tab-panel').forEach(panel => {
    panel.classList.toggle('active', panel.id === tabId);
  });
  localStorage.setItem(STORAGE_KEYS.activeTab, tabId);
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => openTab(btn.dataset.tab));
  });
  openTab(localStorage.getItem(STORAGE_KEYS.activeTab) || 'expenseTab');
}

function initNotes() {
  $('expenseNote').value = localStorage.getItem(STORAGE_KEYS.expenseNote) || '';
  setMainNoteText(localStorage.getItem(STORAGE_KEYS.mainNote) || '');

  $('expenseNote').addEventListener('input', () => {
    localStorage.setItem(STORAGE_KEYS.expenseNote, $('expenseNote').value);
  });

  $('mainNote').addEventListener('input', () => {
    localStorage.setItem(STORAGE_KEYS.mainNote, getMainNoteText());
  });

  $('mainNote').addEventListener('blur', () => {
    const text = getMainNoteText();
    localStorage.setItem(STORAGE_KEYS.mainNote, text);
    setMainNoteText(text);
  });


  $('mainNote').addEventListener('click', (event) => {
    const link = event.target.closest('a');
    if (!link) return;
    event.preventDefault();
    window.open(link.href, '_blank', 'noopener,noreferrer');
  });
}

$('addIncomeBtn').addEventListener('click', () => addTransaction('income'));
$('addExpenseBtn').addEventListener('click', () => addTransaction('expense'));
$('cancelModalBtn').addEventListener('click', closeModal);
$('saveModalBtn').addEventListener('click', saveModalTransaction);
$('entryModal').addEventListener('click', (event) => {
  if (event.target.id === 'entryModal') closeModal();
});
$('modalAmountInput').addEventListener('keydown', (event) => {
  if (event.key === 'Enter') saveModalTransaction();
});

document.addEventListener('click', (event) => {
  const btn = event.target.closest('.delete-btn');
  if (!btn) return;
  deleteTransaction(btn.dataset.id);
});

initMonthYear();
initTabs();
initNotes();
renderMoney();
