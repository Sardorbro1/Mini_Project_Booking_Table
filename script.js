const restaurants = [
    {id:1,name:"Italian Delight",cuisine:"Italian",location:"New York",rating:4.5,desc:"Authentic Italian cuisine",tables:{2:10,4:8,6:5,VIP:2}},
    {id:2,name:"Sushi Heaven",cuisine:"Japanese",location:"Tokyo",rating:4.8,desc:"Premium sushi experience",tables:{2:15,4:10,6:6,VIP:3}},
    {id:3,name:"Taco Fiesta",cuisine:"Mexican",location:"London",rating:4.3,desc:"Spicy Mexican street food",tables:{2:12,4:9,6:4,VIP:1}},
    {id:4,name:"Le Petit Paris",cuisine:"French",location:"Paris",rating:4.7,desc:"Fine French dining",tables:{2:10,4:6,6:4,VIP:4}},
];

let currentUser = null;
let selectedRestaurant = null;
let isRegister = false;

// localStorage yuklash
if (localStorage.getItem('restaurants')) {
    const saved = JSON.parse(localStorage.getItem('restaurants'));
    restaurants.forEach((r, i) => Object.assign(r.tables, saved[i]?.tables || r.tables));
}

const users = JSON.parse(localStorage.getItem('users')) || [
    {username:'user',password:'pass',role:'user',name:'John Doe',email:'user@example.com',favorites:[]},
    {username:'admin',password:'admin',role:'admin',name:'Admin User',email:'admin@example.com',favorites:[]}
];

function loadUser() {
    const data = localStorage.getItem('currentUser');
    if (data) {
        currentUser = JSON.parse(data);
        document.getElementById('loginLink').style.display = 'none';
        document.getElementById('logoutLink').style.display = 'block';
        document.getElementById('profileLink').style.display = 'block';
        document.getElementById('profile').style.display = 'block';
        if (currentUser.role === 'admin') {
            document.getElementById('adminLink').style.display = 'block';
            document.getElementById('admin').style.display = 'block';
            loadAnalytics(); loadAllBookings();
        }
        updateProfileHeader();
        loadFavorites(); loadBookingHistory();
    }
}

function updateProfileHeader() {
    document.getElementById('profileName').textContent = currentUser.name || currentUser.username;
    document.getElementById('profileEmail').textContent = currentUser.email;
}

function displayRestaurants() {
    const grid = document.getElementById('restaurantGrid');
    grid.innerHTML = restaurants.map(r => {
        const isFav = currentUser?.favorites.includes(r.id);
        return `<div class="card">
            <h3>${r.name} <i class="fas fa-heart favorite ${isFav?'active':''}" data-id="${r.id}"></i></h3>
            <p>${r.desc}</p>
            <p>${r.cuisine} • ${r.location} • ${r.rating} stars</p>
            <button class="btn" onclick="openBooking(${r.id})">Book Table</button>
        </div>`;
    }).join('');
}

function filterRestaurants() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const loc = document.getElementById('locationFilter').value;
    const cuisine = document.getElementById('cuisineFilter').value;
    const rating = document.getElementById('ratingFilter').value || 0;

    const filtered = restaurants.filter(r => 
        (!search || r.name.toLowerCase().includes(search) || r.cuisine.toLowerCase().includes(search)) &&
        (!loc || r.location === loc) &&
        (!cuisine || r.cuisine === cuisine) &&
        r.rating >= rating
    );
    const grid = document.getElementById('restaurantGrid');
    grid.innerHTML = filtered.map(r => {
        const isFav = currentUser?.favorites.includes(r.id);
        return `<div class="card">
            <h3>${r.name} <i class="fas fa-heart favorite ${isFav?'active':''}" data-id="${r.id}"></i></h3>
            <p>${r.desc}</p>
            <p>${r.cuisine} • ${r.location} • ${r.rating} stars</p>
            <button class="btn" onclick="openBooking(${r.id})">Book Table</button>
        </div>`;
    }).join('');
}

// Events
['searchInput','locationFilter','cuisineFilter','ratingFilter'].forEach(id => 
    document.getElementById(id).addEventListener('input', filterRestaurants)
);

document.getElementById('loginLink').addEventListener('click', e => {
    e.preventDefault();
    document.getElementById('authModal').style.display = 'flex';
});

document.getElementById('logoutLink').addEventListener('click', e => {
    e.preventDefault();
    localStorage.removeItem('currentUser');
    location.reload();
});

function openBooking(id) {
    if (!currentUser) { alert("Please login first!"); document.getElementById('authModal').style.display = 'flex'; return; }
    selectedRestaurant = restaurants.find(r => r.id === id);
    document.getElementById('restaurantName').textContent = selectedRestaurant.name;
    updateAvailability();
    document.getElementById('bookingModal').style.display = 'flex';
}

function updateAvailability() {
    const info = document.getElementById('availabilityInfo');
    info.innerHTML = '<strong>Available Tables:</strong><br>';
    for (const [type, count] of Object.entries(selectedRestaurant.tables)) {
        const color = count > 0 ? '#10b981' : '#ef4444';
        info.innerHTML += `<span style="color:${color};">${type} seats: ${count} available</span><br>`;
    }
}

// Modal yopish
document.querySelectorAll('.close').forEach(btn => btn.onclick = () => btn.closest('.modal').style.display = 'none');
window.onclick = e => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; };

// Booking
document.getElementById('bookingForm').onsubmit = e => {
    e.preventDefault();
    const seats = document.getElementById('seats').value;
    if (selectedRestaurant.tables[seats] <= 0) return alert("No available tables!");

    const booking = {
        id: Date.now(),
        restaurantId: selectedRestaurant.id,
        restaurant: selectedRestaurant.name,
        date: document.getElementById('date').value,
        time: document.getElementById('time').value,
        seats, name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        phone: document.getElementById('phone').value,
        user: currentUser.username
    };

    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    bookings.push(booking);
    localStorage.setItem('bookings', JSON.stringify(bookings));

    selectedRestaurant.tables[seats]--;
    localStorage.setItem('restaurants', JSON.stringify(restaurants));

    alert("Booking confirmed!");
    document.getElementById('bookingModal').style.display = 'none';
    loadBookingHistory();
    if (currentUser.role === 'admin') loadAnalytics();
};

// Auth
document.getElementById('loginTab').onclick = () => {
    isRegister = false; document.getElementById('loginTab').classList.add('tab-active');
    document.getElementById('registerTab').classList.remove('tab-active');
    document.getElementById('authTitle').textContent = 'Welcome Back';
    document.getElementById('authBtn').innerHTML = 'Login Now';
    document.getElementById('emailField').style.display = 'none';
};

document.getElementById('registerTab').onclick = () => {
    isRegister = true; document.getElementById('registerTab').classList.add('tab-active');
    document.getElementById('loginTab').classList.remove('tab-active');
    document.getElementById('authTitle').textContent = 'Create Account';
    document.getElementById('authBtn').innerHTML = 'Register Now';
    document.getElementById('emailField').style.display = 'block';
};

document.getElementById('authForm').onsubmit = e => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (isRegister) {
        if (users.find(u => u.username === username)) return alert("Username exists!");
        const newUser = {username, password, role:'user', name:username, email:document.getElementById('emailAuth').value, favorites:[]};
        users.push(newUser); localStorage.setItem('users', JSON.stringify(users));
        currentUser = newUser;
    } else {
        const user = users.find(u => u.username === username && u.password === password);
        if (!user) return alert("Wrong credentials!");
        currentUser = user;
    }
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    document.getElementById('authModal').style.display = 'none';
    loadUser();
};

// Favorites
document.addEventListener('click', e => {
    if (e.target.classList.contains('favorite')) {
        if (!currentUser) return alert("Login required!");
        const id = parseInt(e.target.dataset.id);
        const index = currentUser.favorites.indexOf(id);
        if (index === -1) currentUser.favorites.push(id);
        else currentUser.favorites.splice(index, 1);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        const idx = users.findIndex(u => u.username === currentUser.username);
        if (idx !== -1) { users[idx] = currentUser; localStorage.setItem('users', JSON.stringify(users)); }
        displayRestaurants(); loadFavorites();
    }
});

function loadFavorites() {
    const container = document.getElementById('favoritesList');
    if (!currentUser || currentUser.favorites.length === 0) {
        container.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:var(--g);">No favorites yet</p>';
        return;
    }
    const favs = restaurants.filter(r => currentUser.favorites.includes(r.id));
    container.innerHTML = favs.map(r => `
        <div class="card">
            <h3>${r.name} <i class="fas fa-heart favorite active" data-id="${r.id}"></i></h3>
            <p>${r.desc}</p>
            <button class="btn" onclick="openBooking(${r.id})">Book Now</button>
        </div>
    `).join('');
}

function loadBookingHistory() {
    const container = document.getElementById('bookingHistory');
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const userBookings = bookings.filter(b => b.user === currentUser.username);
    container.innerHTML = userBookings.length ? userBookings.map(b => `
        <div class="card">
            <h3>${b.restaurant}</h3>
            <p>${b.date} | ${b.time} | ${b.seats} seats</p>
            <button class="btn" style="background:#ef4444;" onclick="cancelBooking(${b.id})">Cancel</button>
        </div>
    `).join('') : '<p style="grid-column:1/-1;text-align:center;color:var(--g);">No bookings yet</p>';
}

window.cancelBooking = id => {
    if (!confirm("Cancel this booking?")) return;
    let bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const booking = bookings.find(b => b.id === id);
    if (booking) {
        const rest = restaurants.find(r => r.id === booking.restaurantId);
        if (rest) rest.tables[booking.seats]++;
        localStorage.setItem('restaurants', JSON.stringify(restaurants));
    }
    bookings = bookings.filter(b => b.id !== id);
    localStorage.setItem('bookings', JSON.stringify(bookings));
    loadBookingHistory();
    if (currentUser.role === 'admin') loadAllBookings();
};

function loadAllBookings() {
    const container = document.getElementById('allBookings');
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    container.innerHTML = bookings.length ? bookings.map(b => `
        <div class="card"><h3>${b.restaurant}</h3><p>${b.user} | ${b.date} ${b.time} | ${b.seats} seats</p><p>${b.name} • ${b.email}</p></div>
    `).join('') : '<p style="grid-column:1/-1;text-align:center;">No bookings</p>';
}

function loadAnalytics() {
    const bookings = JSON.parse(localStorage.getItem('bookings') || '[]');
    const total = bookings.length;
    const revenue = bookings.reduce((s,b) => s + (parseInt(b.seats)||4)*25, 0);
    document.getElementById('analytics').innerHTML = `
        <div class="analytics-card"><h3>${total}</h3><p>Total Bookings</p></div>
        <div class="analytics-card"><h3>$${revenue}</h3><p>Est. Revenue</p></div>
        <div class="analytics-card"><h3>${bookings.filter(b=>b.seats==='VIP').length}</h3><p>VIP Bookings</p></div>
        <div class="analytics-card"><h3>${new Set(bookings.map(b=>b.user)).size}</h3><p>Unique Users</p></div>
    `;
}

// Edit Profile
document.getElementById('editProfileBtn').onclick = () => {
    document.getElementById('editName').value = currentUser.name || '';
    document.getElementById('editEmail').value = currentUser.email;
    document.getElementById('editPhone').value = currentUser.phone || '';
    document.getElementById('editProfileModal').style.display = 'flex';
};

document.getElementById('editProfileForm').onsubmit = e => {
    e.preventDefault();
    currentUser.name = document.getElementById('editName').value.trim();
    currentUser.email = document.getElementById('editEmail').value.trim();
    currentUser.phone = document.getElementById('editPhone').value.trim();
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    const idx = users.findIndex(u => u.username === currentUser.username);
    if (idx !== -1) { users[idx] = currentUser; localStorage.setItem('users', JSON.stringify(users)); }
    updateProfileHeader();
    document.getElementById('editProfileModal').style.display = 'none';
    alert("Profile updated!");
};

// Date & Time picker
flatpickr("#date", { minDate: "today", dateFormat: "Y-m-d" });
flatpickr("#time", { enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true });

// Init
displayRestaurants();
loadUser();