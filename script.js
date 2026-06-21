const monthSelect = document.getElementById('monthSelect');
const yearInput = document.getElementById('yearInput');
const modal = document.getElementById('modal');
const formTitle = document.getElementById('formTitle');
const dateInput = document.getElementById('dateInput');
const nameInput = document.getElementById('nameInput');
const amountInput = document.getElementById('amountInput');
const noteInput = document.getElementById('noteInput');

let currentType = 'income';
let transactions = JSON.parse(localStorage.getItem('familyMoneyTransactions') || '[]');
let notes = JSON.parse(localStorage.getItem('familyMoneyNotes') || '{}');

function formatYen(num) {
  return Number(num || 0).toLocaleString('ja-JP') + '円';
}

function initMonths() {
  for (let i = 1; i <= 12; i++) {
    const option = document.createElement('option');
    option.value = i;
    option.textContent = `Tháng : ${i}`;
    monthSelect.appendChild(option);
  }
  const now = new Date();
  monthSelect.value = now.getMonth() + 1;
  yearInput.value = now.getFullYear();
}

function selectedKey() {
  return `${yearInput.value}-${String(monthSelect.value).padStart(2, '0')}`;
}

function getFilteredTransactions() {
  const key = selectedKey();
  return transactions.filter(t => t.date && t.date.startsWith(key));
}

function render() {
  const key = selectedKey();
  const list = getFilteredTransactions();
  const incomes = list.filter(t => t.type === 'income');
  const expenses = list.filter(t => t.type === 'expense');
  const totalIncome = incomes.reduce((s, t) => s + Number(t.amount), 0);
  const totalExpense = expenses.reduce((s, t) => s + Number(t.amount), 0);

  document.getElementById('totalIncome').textContent = formatYen(totalIncome);
  document.getElementById('totalExpense').textContent = formatYen(totalExpense);
  document.getElementById('monthBalance').textContent = formatYen(totalIncome - totalExpense);

  for (let w = 1; w <= 4; w++) {
    const weekList = list.filter(t => getWeekOfMonth(t.date) === w);
    const wi = weekList.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0);
    const we = weekList.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0);
    document.getElementById(`week${w}`).textContent = formatYen(wi - we);
  }

  renderList('incomeList', incomes);
  renderList('expenseList', expenses);
  noteInput.value = notes[key] || '';
}

function renderList(elementId, list) {
  const box = document.getElementById(elementId);
  box.innerHTML = '';
  list.sort((a, b) => a.date.localeCompare(b.date)).forEach(t => {
    const row = document.createElement('div');
    row.className = 'transaction-item';
    row.innerHTML = `
      <span>${t.date.slice(5)}</span>
      <span>${escapeHtml(t.name)}</span>
      <span class="amount">${formatYen(t.amount)}</span>
      <button class="delete-btn" onclick="deleteTransaction('${t.id}')">×</button>
    `;
    box.appendChild(row);
  });
}

function getWeekOfMonth(dateStr) {
  const day = Number(dateStr.slice(8, 10));
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

function openForm(type) {
  currentType = type;
  formTitle.textContent = type === 'income' ? 'Nhập khoản thu' : 'Nhập khoản chi';
  const day = new Date().getDate();
  dateInput.value = `${yearInput.value}-${String(monthSelect.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  nameInput.value = '';
  amountInput.value = '';
  modal.classList.remove('hidden');
}

function closeForm() {
  modal.classList.add('hidden');
}

function saveTransaction() {
  const name = nameInput.value.trim();
  const amount = Number(amountInput.value);
  if (!dateInput.value || !name || !amount) {
    alert('Bạn nhập đủ ngày, nội dung và số tiền nhé.');
    return;
  }
  transactions.push({
    id: Date.now().toString(),
    type: currentType,
    date: dateInput.value,
    name,
    amount
  });
  localStorage.setItem('familyMoneyTransactions', JSON.stringify(transactions));
  closeForm();
  render();
}

function deleteTransaction(id) {
  if (!confirm('Xóa dòng này nhé?')) return;
  transactions = transactions.filter(t => t.id !== id);
  localStorage.setItem('familyMoneyTransactions', JSON.stringify(transactions));
  render();
}

function escapeHtml(text) {
  return text.replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

monthSelect.addEventListener('change', render);
yearInput.addEventListener('change', render);
noteInput.addEventListener('input', () => {
  notes[selectedKey()] = noteInput.value;
  localStorage.setItem('familyMoneyNotes', JSON.stringify(notes));
});

initMonths();
render();
