// --- MENU DATABASE ---
const menuItems = [
    {
        id: 'm1',
        name: 'Espresso Single Origin',
        category: 'espresso',
        price: 8.00,
        image: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=400&q=80',
        description: 'Pekat & kaya rasa manis semula jadi biji kopi Arabica.'
    },
    {
        id: 'm2',
        name: 'Iced Caramel Macchiato',
        category: 'cold',
        price: 14.50,
        image: 'https://images.unsplash.com/photo-1485808191679-5f86510681a2?auto=format&fit=crop&w=400&q=80',
        description: 'Espresso layered bersama susu segar & limpahan sirap karamel.'
    },
    {
        id: 'm3',
        name: 'Spanish Latte (Hot/Cold)',
        category: 'espresso',
        price: 13.00,
        image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=400&q=80',
        description: 'Kombinasi manis krim susu pekat & espresso asli.'
    },
    {
        id: 'm4',
        name: 'Cold Brew Signature',
        category: 'cold',
        price: 12.00,
        image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80',
        description: 'Kopi yang direndam sejuk 16 jam untuk kelincihan rasa halus.'
    },
    {
        id: 'm5',
        name: 'Matcha Uji Green Tea',
        category: 'non-coffee',
        price: 13.50,
        image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&w=400&q=80',
        description: 'Serbuk Matcha asli dari Kyoto bersama susu berkrim.'
    },
    {
        id: 'm6',
        name: 'Coklat Artisan Hazelnut',
        category: 'non-coffee',
        price: 12.50,
        image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=400&q=80',
        description: 'Coklat gelap mewah dengan sentuhan keharuman hazelnut.'
    },
    {
        id: 'm7',
        name: 'Croissant Mentega (Butter)',
        category: 'pastry',
        price: 7.50,
        image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=400&q=80',
        description: 'Pastri garing di luar, berlapik mentega lembut di dalam.'
    },
    {
        id: 'm8',
        name: 'Almond Chocolate Donut',
        category: 'pastry',
        price: 6.00,
        image: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=400&q=80',
        description: 'Donat bersalut coklat dengan hirisan badam rangup.'
    }
];

// --- GLOBAL STATE ---
let cart = [];
let activeMenuItem = null;
let selectedSizeAdd = 0;
let selectedSizeName = 'Small';
let selectedSugarName = '50% (Normal)';
let orderType = 'dine-in';

// Custom Coffee Builder State
let builderState = {
    base: { name: 'Single Espresso', price: 7.00, color: '#3D2314' },
    milk: { name: 'Susu Segar', price: 2.00, color: '#FDF8F5' },
    syrup: { name: 'Tiada Sirap', price: 0.00, color: 'transparent' },
    topping: { name: 'Tiada Topping', price: 0.00, text: '' }
};

// --- INITIALIZATION ---
window.addEventListener('DOMContentLoaded', () => {
    renderMenu('all');
    updateCartUI();
    updateBuilderVisual();
});

// Mobile Menu Toggle
function toggleMobileMenu() {
    const menu = document.getElementById('mobile-menu');
    menu.classList.toggle('hidden');
}

// Render Menu Cards
function renderMenu(category) {
    const grid = document.getElementById('menu-grid');
    grid.innerHTML = '';

    const filtered = category === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category === category);

    filtered.forEach(item => {
        const card = document.createElement('div');
        card.className = "glass-card rounded-2xl p-4 border border-caramel/15 shadow-sm hover:shadow-md transition-all flex flex-col justify-between";
        card.innerHTML = `
            <div>
                <div class="relative overflow-hidden rounded-xl h-40 mb-3">
                    <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-300">
                </div>
                <h3 class="font-serif font-bold text-base text-espresso">${item.name}</h3>
                <p class="text-xs text-espresso/70 mt-1 line-clamp-2">${item.description}</p>
            </div>
            <div class="flex items-center justify-between mt-4 pt-3 border-t border-caramel/10">
                <span class="font-bold text-caramel text-sm">RM ${item.price.toFixed(2)}</span>
                <button onclick="openCustomizerModal('${item.id}')" class="bg-espresso text-foam px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-caramel transition-colors flex items-center gap-1">
                    <i class="fa-solid fa-sliders"></i> Kustom
                </button>
            </div>
        `;
        grid.appendChild(card);
    });
}

// Menu Filter Buttons
function filterMenu(category) {
    document.querySelectorAll('.menu-filter-btn').forEach(btn => {
        btn.classList.remove('bg-espresso', 'text-foam');
        btn.classList.add('bg-white', 'text-espresso');
    });
    event.target.classList.remove('bg-white', 'text-espresso');
    event.target.classList.add('bg-espresso', 'text-foam');
    renderMenu(category);
}

// --- CUSTOMIZER MODAL LOGIC ---
function openCustomizerModal(itemId) {
    activeMenuItem = menuItems.find(i => i.id === itemId);
    if (!activeMenuItem) return;

    document.getElementById('modal-img').src = activeMenuItem.image;
    document.getElementById('modal-title').innerText = activeMenuItem.name;
    document.getElementById('modal-base-price').innerText = `Asas: RM ${activeMenuItem.price.toFixed(2)}`;
    
    // Reset modal defaults
    selectedSizeAdd = 0;
    selectedSizeName = 'Small';
    selectedSugarName = '50% (Normal)';
    document.getElementById('modal-milk-select').selectedIndex = 0;
    document.getElementById('top-boba').checked = false;
    document.getElementById('top-shot').checked = false;

    updateModalPrice();
    document.getElementById('customizer-modal').classList.remove('hidden');
}

function closeCustomizerModal() {
    document.getElementById('customizer-modal').classList.add('hidden');
}

function selectModalOption(type, value, priceAdd) {
    if(type === 'size') {
        selectedSizeAdd = priceAdd;
        selectedSizeName = value;
        document.querySelectorAll('.modal-size-btn').forEach(b => {
            b.classList.remove('bg-caramel/10', 'border-caramel');
            b.classList.add('border-caramel/20');
        });
        event.target.classList.add('bg-caramel/10', 'border-caramel');
    } else if(type === 'sugar') {
        selectedSugarName = value;
        document.querySelectorAll('.modal-sugar-btn').forEach(b => {
            b.classList.remove('bg-caramel/10', 'border-caramel');
            b.classList.add('border-caramel/20');
        });
        event.target.classList.add('bg-caramel/10', 'border-caramel');
    }
    updateModalPrice();
}

function updateModalPrice() {
    if(!activeMenuItem) return;
    let total = activeMenuItem.price + selectedSizeAdd;

    const milkVal = document.getElementById('modal-milk-select').value.split('|')[1];
    total += parseFloat(milkVal || 0);

    if(document.getElementById('top-boba').checked) total += 2.00;
    if(document.getElementById('top-shot').checked) total += 2.50;

    document.getElementById('modal-calculated-price').innerText = `RM ${total.toFixed(2)}`;
}

function confirmAddToCartFromModal() {
    const milkName = document.getElementById('modal-milk-select').value.split('|')[0];
    const toppings = [];
    if(document.getElementById('top-boba').checked) toppings.push('Boba');
    if(document.getElementById('top-shot').checked) toppings.push('Extra Shot');

    let total = activeMenuItem.price + selectedSizeAdd + parseFloat(document.getElementById('modal-milk-select').value.split('|')[1]);
    if(document.getElementById('top-boba').checked) total += 2.00;
    if(document.getElementById('top-shot').checked) total += 2.50;

    const cartItem = {
        id: Date.now(),
        name: activeMenuItem.name,
        details: `Saiz: ${selectedSizeName}, Gula: ${selectedSugarName}, ${milkName}${toppings.length ? ', ' + toppings.join('+') : ''}`,
        price: total,
        qty: 1
    };

    cart.push(cartItem);
    updateCartUI();
    closeCustomizerModal();
    showToast(`${activeMenuItem.name} ditambah!`);
}

// --- CUSTOM COFFEE BUILDER LOGIC ---
function selectBuilderOption(category, optionKey, price, name, styleVal) {
    if(category === 'base') {
        builderState.base = { name, price, color: styleVal };
    } else if(category === 'milk') {
        builderState.milk = { name, price, color: styleVal };
    } else if(category === 'syrup') {
        builderState.syrup = { name, price, color: styleVal };
    } else if(category === 'topping') {
        builderState.topping = { name, price, text: name };
    }

    // Update UI buttons inside step
    const parent = document.getElementById(`builder-${category}`);
    parent.querySelectorAll('.builder-opt').forEach(b => {
        b.classList.remove('bg-goldAccent/10', 'border-goldAccent');
        b.classList.add('bg-white/5', 'border-white/10');
    });
    event.currentTarget.classList.add('bg-goldAccent/10', 'border-goldAccent');

    updateBuilderVisual();
}

function updateBuilderVisual() {
    // Fill layers
    const baseLayer = document.getElementById('cup-layer-base');
    const milkLayer = document.getElementById('cup-layer-milk');
    const syrupLayer = document.getElementById('cup-layer-syrup');
    const toppingLayer = document.getElementById('cup-layer-topping');

    baseLayer.style.backgroundColor = builderState.base.color;
    milkLayer.style.backgroundColor = builderState.milk.color;

    if(builderState.syrup.color !== 'transparent') {
        syrupLayer.style.height = '15%';
        syrupLayer.style.backgroundColor = builderState.syrup.color;
    } else {
        syrupLayer.style.height = '0%';
    }

    if(builderState.topping.name !== 'Tiada Topping') {
        toppingLayer.style.height = '12%';
        toppingLayer.innerText = builderState.topping.name;
    } else {
        toppingLayer.style.height = '0%';
        toppingLayer.innerText = '';
    }

    // Price & Title calculation
    const totalPrice = builderState.base.price + builderState.milk.price + builderState.syrup.price + builderState.topping.price;
    document.getElementById('builder-total-price').innerText = `RM ${totalPrice.toFixed(2)}`;
    document.getElementById('builder-custom-desc').innerText = `${builderState.base.name} + ${builderState.milk.name} + ${builderState.syrup.name}`;
}

function addCustomCoffeeToCart() {
    const totalPrice = builderState.base.price + builderState.milk.price + builderState.syrup.price + builderState.topping.price;
    const customItem = {
        id: Date.now(),
        name: `✨ Custom: ${builderState.base.name}`,
        details: `${builderState.milk.name}, ${builderState.syrup.name}, ${builderState.topping.name}`,
        price: totalPrice,
        qty: 1
    };
    cart.push(customItem);
    updateCartUI();
    showToast("Kopi kustom berjaya ditambah!");
}

// --- CART & BILL SIMULATOR LOGIC ---
function toggleCartDrawer() {
    const drawer = document.getElementById('cart-drawer');
    drawer.classList.toggle('translate-x-full');
}

function setOrderType(type) {
    orderType = type;
    const btnDine = document.getElementById('btn-dinein');
    const btnTake = document.getElementById('btn-takeaway');
    const tableBox = document.getElementById('table-select-box');

    if(type === 'dine-in') {
        btnDine.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-caramel text-white shadow-sm";
        btnTake.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-white text-espresso border border-caramel/20";
        tableBox.classList.remove('hidden');
    } else {
        btnTake.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-caramel text-white shadow-sm";
        btnDine.className = "flex-1 py-2 rounded-xl text-xs font-bold bg-white text-espresso border border-caramel/20";
        tableBox.classList.add('hidden');
    }
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const list = document.getElementById('cart-items-list');

    const totalItemsCount = cart.reduce((acc, item) => acc + item.qty, 0);
    badge.innerText = totalItemsCount;

    if(cart.length === 0) {
        list.innerHTML = `
            <div class="text-center py-12 text-espresso/50 text-xs">
                <i class="fa-solid fa-basket-shopping text-3xl mb-2 text-caramel/30 block"></i>
                Troli anda masih kosong. Pilih minuman di menu!
            </div>
        `;
    } else {
        list.innerHTML = '';
        cart.forEach((item, index) => {
            const row = document.createElement('div');
            row.className = "bg-white p-3 rounded-2xl border border-caramel/15 flex items-center justify-between shadow-sm text-xs";
            row.innerHTML = `
                <div class="flex-1 pr-2">
                    <h4 class="font-bold text-espresso">${item.name}</h4>
                    <p class="text-[10px] text-espresso/60">${item.details}</p>
                    <span class="font-semibold text-caramel">RM ${(item.price * item.qty).toFixed(2)}</span>
                </div>
                <div class="flex items-center gap-2">
                    <button onclick="changeQty(${index}, -1)" class="w-6 h-6 rounded-full bg-foam border border-caramel/30 text-espresso font-bold flex items-center justify-center">-</button>
                    <span class="font-bold">${item.qty}</span>
                    <button onclick="changeQty(${index}, 1)" class="w-6 h-6 rounded-full bg-foam border border-caramel/30 text-espresso font-bold flex items-center justify-center">+</button>
                </div>
            `;
            list.appendChild(row);
        });
    }

    // Realtime calculations
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const tax = subtotal * 0.06;
    const total = subtotal + tax;

    document.getElementById('bill-subtotal').innerText = `RM ${subtotal.toFixed(2)}`;
    document.getElementById('bill-tax').innerText = `RM ${tax.toFixed(2)}`;
    document.getElementById('bill-total').innerText = `RM ${total.toFixed(2)}`;
}

function changeQty(index, delta) {
    cart[index].qty += delta;
    if(cart[index].qty <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
}

function processCheckout() {
    if(cart.length === 0) {
        alert("Sila tambah minuman ke dalam troli terlebih dahulu!");
        return;
    }
    const tableNo = orderType === 'dine-in' ? document.getElementById('cart-table-no').value : 'Bungkus (Takeaway)';
    alert(`Terima kasih! Pesanan anda (${orderType.toUpperCase()} - ${tableNo}) telah berjaya dihantar ke bar barista kami.`);
    cart = [];
    updateCartUI();
    toggleCartDrawer();
}

// --- QUIZ LOGIC ---
let quizAnswers = {};

function answerQuiz(step, val) {
    if(step === 1) quizAnswers.flavor = val;
    if(step === 2) quizAnswers.temp = val;
    if(step === 3) quizAnswers.milk = val;

    document.getElementById(`quiz-q${step}`).classList.add('hidden');

    if(step < 3) {
        document.getElementById(`quiz-q${step + 1}`).classList.remove('hidden');
    } else {
        showQuizResult();
    }
}

function showQuizResult() {
    const resCard = document.getElementById('quiz-recommended-card');
    let recommended = menuItems[1]; // default

    if(quizAnswers.temp === 'hot' && quizAnswers.flavor === 'strong') {
        recommended = menuItems[0]; // Espresso
    } else if(quizAnswers.milk === 'milk' && quizAnswers.temp === 'cold') {
        recommended = menuItems[1]; // Caramel Macchiato
    } else if(quizAnswers.milk === 'black') {
        recommended = menuItems[3]; // Cold Brew
    } else {
        recommended = menuItems[2]; // Spanish Latte
    }

    resCard.innerHTML = `
        <img src="${recommended.image}" class="w-full h-32 object-cover rounded-xl mb-3">
        <h4 class="font-serif font-bold text-base text-espresso">${recommended.name}</h4>
        <p class="text-xs text-espresso/70 my-1">${recommended.description}</p>
        <div class="font-bold text-caramel text-sm mt-2">RM ${recommended.price.toFixed(2)}</div>
        <button onclick="openCustomizerModal('${recommended.id}')" class="mt-3 w-full bg-espresso text-foam py-2 rounded-full font-bold text-xs hover:bg-caramel transition-colors">Pesan Sekarang</button>
    `;

    document.getElementById('quiz-result').classList.remove('hidden');
}

function resetQuiz() {
    quizAnswers = {};
    document.getElementById('quiz-result').classList.add('hidden');
    document.getElementById('quiz-q1').classList.remove('hidden');
}

// --- REVIEWS & RESERVATION FORMS ---
function handleReviewSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('review-name').value;
    const comment = document.getElementById('review-comment').value;

    const container = document.getElementById('reviews-container');
    const newCard = document.createElement('div');
    newCard.className = "glass-card p-6 rounded-2xl border border-caramel/10 shadow-sm animate-fade-in";
    newCard.innerHTML = `
        <div class="flex items-center gap-1 text-goldAccent text-xs mb-3">
            <i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i><i class="fa-solid fa-star"></i>
        </div>
        <p class="text-xs sm:text-sm text-espresso/80 italic mb-4">"${comment}"</p>
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 rounded-full bg-caramel text-white font-bold flex items-center justify-center text-xs">${name.substring(0, 2).toUpperCase()}</div>
            <div>
                <h4 class="font-bold text-xs text-espresso">${name}</h4>
                <span class="text-[10px] text-espresso/50">Baru Sahaja</span>
            </div>
        </div>
    `;
    container.prepend(newCard);
    e.target.reset();
    showToast("Terima kasih atas ulasan anda!");
}

function handleReservationSubmit(e) {
    e.preventDefault();
    showToast("Tempahan meja anda telah diterima!");
    e.target.reset();
}

// --- TOAST NOTIFICATION ---
function showToast(msg) {
    const toast = document.getElementById('toast-msg');
    document.getElementById('toast-text').innerText = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 3000);
}