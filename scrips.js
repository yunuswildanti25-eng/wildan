
const menuItems = [
  {
    id: 1,
    name: "Special Artisan Brew",
    price: 28000,
    desc: "Seduhan biji kopi pilihan dengan aroma khas."
  },
  {
    id: 2,
    name: "Senja Milk Coffee",
    price: 22000,
    desc: "Kopi susu gula aren signature Kopi Senja."
  },
  {
    id: 3,
    name: "Americano Fresh",
    price: 18000,
    desc: "Espresso murni dengan ekstraksi optimal."
  }
];

/**
 * Application State
 */
let cart = [];
let activeMenuItem = null;
let currentQty = 1;
let kdsOrders = [];
let timerInterval = null;

/**
 * DOM Initialization
 */
document.addEventListener("DOMContentLoaded", () => {
  renderMenu();
  setupEventListeners();
});

/**
 * Render Menu Katalog
 */
function renderMenu() {
  const grid = document.getElementById("menu-grid");
  grid.innerHTML = menuItems.map(item => `
    <div class="menu-card">
      <div>
        <h4>${item.name}</h4>
        <p>${item.desc}</p>
        <div class="price">Rp ${item.price.toLocaleString("id-ID")}</div>
      </div>
      <button class="btn btn-primary btn-block" onclick="openCustomModal(${item.id})">Pesan</button>
    </div>
  `).join("");
}

/**
 * Modal Kustomisasi
 */
function openCustomModal(itemId) {
  activeMenuItem = menuItems.find(m => m.id === itemId);
  currentQty = 1;
  
  document.getElementById("modal-menu-title").innerText = activeMenuItem.name;
  document.getElementById("modal-menu-price").innerText = `Rp ${activeMenuItem.price.toLocaleString("id-ID")}`;
  document.getElementById("qty-val").innerText = currentQty;
  document.getElementById("custom-modal").classList.remove("hidden");
}

/**
 * Setup Event Listeners
 */
function setupEventListeners() {
  // Tombol Tutup Modal Kustomisasi
  document.getElementById("close-modal").onclick = () => {
    document.getElementById("custom-modal").classList.add("hidden");
  };

  // Tombol Tambah Kuantitas
  document.getElementById("qty-plus").onclick = () => {
    currentQty++;
    document.getElementById("qty-val").innerText = currentQty;
  };

  // Tombol Kurang Kuantitas
  document.getElementById("qty-minus").onclick = () => {
    if (currentQty > 1) {
      currentQty--;
      document.getElementById("qty-val").innerText = currentQty;
    }
  };

  // Submit Form Kustomisasi Minuman
  document.getElementById("custom-form").onsubmit = (e) => {
    e.preventDefault();
    
    const temp = document.querySelector('input[name="temp"]:checked').value;
    const milkSelect = document.getElementById("milk-select");
    const milkName = milkSelect.value;
    const milkExtra = parseInt(milkSelect.selectedOptions[0].dataset.extra || 0);
    const sugarName = document.getElementById("sugar-select").value;
    const shotSelect = document.getElementById("shot-select");
    const shotName = shotSelect.value;
    const shotExtra = parseInt(shotSelect.selectedOptions[0].dataset.extra || 0);
    const notes = document.getElementById("custom-notes").value;

    const itemUnitPrice = activeMenuItem.price + milkExtra + shotExtra;
    
    cart.push({
      id: Date.now(),
      name: activeMenuItem.name,
      temp,
      milkName,
      sugarName,
      shotName,
      notes,
      qty: currentQty,
      totalPrice: itemUnitPrice * currentQty
    });

    document.getElementById("custom-modal").classList.add("hidden");
    updateCartUI();
  };

  // Tombol Pembayaran
  document.getElementById("pay-btn").onclick = startQRISPayment;
  document.getElementById("sim-complete-btn").onclick = completePaymentSimulation;
}

/**
 * Update UI Keranjang & Billing
 */
function updateCartUI() {
  const container = document.getElementById("cart-items");

  if (cart.length === 0) {
    container.innerHTML = `<p class="text-muted">Keranjang belanja Anda masih kosong.</p>`;
    document.getElementById("pay-btn").disabled = true;
  } else {
    container.innerHTML = cart.map(item => `
      <div class="cart-item-row">
        <div>
          <strong>${item.name} (${item.temp})</strong> x${item.qty}
          <div style="font-size: 0.8rem; color: var(--text-muted);">
            ${item.milkName}, Sugar: ${item.sugarName}, Shot: ${item.shotName} 
            ${item.notes ? '| ' + item.notes : ''}
          </div>
        </div>
        <div>Rp ${item.totalPrice.toLocaleString("id-ID")}</div>
      </div>
    `).join("");
    document.getElementById("pay-btn").disabled = false;
  }

  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const taxPB1 = Math.round(subtotal * 0.10); // Pajak Restoran 10%
  const total = subtotal + taxPB1;

  document.getElementById("subtotal-val").innerText = `Rp ${subtotal.toLocaleString("id-ID")}`;
  document.getElementById("tax-val").innerText = `Rp ${taxPB1.toLocaleString("id-ID")}`;
  document.getElementById("total-val").innerText = `Rp ${total.toLocaleString("id-ID")}`;
}

/**
 * Mulai Simulasi QRIS
 */
function startQRISPayment() {
  const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
  const total = subtotal + Math.round(subtotal * 0.10);
  const orderNum = "#ORD-" + Math.floor(1000 + Math.random() * 9000);

  document.getElementById("qris-ord-num").innerText = orderNum;
  document.getElementById("qris-total-amount").innerText = `Rp ${total.toLocaleString("id-ID")}`;
  document.getElementById("qris-modal").classList.remove("hidden");

  let timeLeft = 120;
  document.getElementById("timer-val").innerText = `${timeLeft}s`;

  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    document.getElementById("timer-val").innerText = `${timeLeft}s`;
    
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      alert("Waktu pembayaran QRIS berakhir.");
      document.getElementById("qris-modal").classList.add("hidden");
    }
  }, 1000);
}

/**
 * Selesaikan Simulasi Pembayaran
 */
function completePaymentSimulation() {
  clearInterval(timerInterval);
  const orderNum = document.getElementById("qris-ord-num").innerText;

  kdsOrders.push({
    ordNum: orderNum,
    table: "Meja 04",
    items: [...cart],
    time: new Date().toLocaleTimeString("id-ID")
  });

  cart = [];
  updateCartUI();
  document.getElementById("qris-modal").classList.add("hidden");
  renderKDS();
  
  alert("Pembayaran Berhasil! Pesanan Anda telah diteruskan ke Barista.");
}

/**
 * Render KDS (Kitchen Display System)
 */
function renderKDS() {
  const container = document.getElementById("kds-queue");
  document.getElementById("kds-count").innerText = kdsOrders.length;

  if (kdsOrders.length === 0) {
    container.innerHTML = `<p class="text-muted">Belum ada antrean pesanan.</p>`;
  } else {
    container.innerHTML = kdsOrders.map((ord, idx) => `
      <div class="kds-card">
        <div style="display: flex; justify-content: space-between; font-weight: bold;">
          <span>${ord.ordNum} - ${ord.table}</span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">Jam: ${ord.time}</span>
        </div>
        <ul style="margin: 0.5rem 0 0.8rem 1.2rem; font-size: 0.85rem;">
          ${ord.items.map(i => `<li>${i.name} (${i.temp}) x${i.qty} -${i.milkName}</li>`).join("")}
        </ul>
        <button class="btn btn-success" style="font-size: 0.75rem; padding: 0.3rem 0.6rem;" onclick="finishOrder(${idx})">Selesai</button>
      </div>
    `).join("");
  }
}

/**
 * Selesaikan Pesanan di KDS
 */
function finishOrder(idx) {
  kdsOrders.splice(idx, 1);
  renderKDS();
}