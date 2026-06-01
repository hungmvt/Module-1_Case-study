// Hàm khởi tạo dữ liệu người dùng và bài đăng từ localStorage hoặc tạo mới nếu chưa có (thành mảng)
let users = JSON.parse(localStorage.getItem('users')) || [];
let items = JSON.parse(localStorage.getItem('items')) || [];
// Biến toàn cục để lưu tên người dùng đã đăng nhập, ban đầu là null (chưa đăng nhập) 
let loggedInUser = null;

const STATUS_LABELS = {
    'DangBan': 'Đang Bán',
    'DaDatHang': 'Đã Đặt Hàng',
    'DaBan': 'Đã Bán'
};

// Hàm định dạng tiền VNĐ (vd: 1000000 -> 1.000.000)
function formatVND(price) {
    return price.toLocaleString('vi-VN');
}

// --- AUTH ---
function register() {
    let user = document.getElementById('username').value;
    let pass = document.getElementById('password').value;
    if(!user || !pass) return alert("Vui lòng điền đủ thông tin!");
    if(users.find(u => u.username === user)) return alert("Tài khoản đã tồn tại!");
    users.push({username: user, password: pass});
    // Hàm JSON.stringify chuyển mảng users thành chuỗi để lưu vào localStorage
    localStorage.setItem('users', JSON.stringify(users));
    alert("Đăng ký thành công!");
}

function login() {
    let user = document.getElementById('username').value;
    let pass = document.getElementById('password').value;
    let validUser = users.find(u => u.username === user && u.password === pass);
    if(validUser) {
        loggedInUser = validUser.username;
        document.getElementById('authSection').classList.add('hidden');
        document.getElementById('appSection').classList.remove('hidden');
        document.getElementById('currentUser').innerText = loggedInUser;
        toggleView('feed'); 
    } else {
        alert("Sai mật khẩu hoặc tên đăng nhập!");
    }
}

function logout() {
    loggedInUser = null;
    document.getElementById('authSection').classList.remove('hidden');
    document.getElementById('appSection').classList.add('hidden');
}

// --- ĐIỀU HƯỚNG GIAO DIỆN ---
function toggleView(viewName) {
    if(viewName === 'feed') {
        document.getElementById('viewFeed').classList.remove('hidden');
        document.getElementById('viewMyAds').classList.add('hidden');
        filterItems(); 
    } else {
        document.getElementById('viewFeed').classList.add('hidden');
        document.getElementById('viewMyAds').classList.remove('hidden');
        renderMyItems(); 
    }
}

// --- CREATE (THÊM BÀI) ---
function postItem() {
    let name = document.getElementById('itemName').value;
    let price = document.getElementById('itemPrice').value;
    if(!name || !price) return alert("Vui lòng điền tên và giá!");

    let newItem = {
        id: Date.now(),
        seller: loggedInUser,
        name: name,
        category: document.getElementById('itemCategory').value,
        price: parseFloat(price),
        condition: document.getElementById('itemCondition').value,
        status: 'DangBan', 
        datePosted: new Date().toLocaleDateString('vi-VN')
    };

    items.push(newItem);
    localStorage.setItem('items', JSON.stringify(items));
    alert("Đăng tin thành công!");
    
    // Xóa trắng form sau khi đăng
    document.getElementById('itemName').value = '';
    document.getElementById('itemPrice').value = '';
    
    filterItems();
}

// --- READ (HIỂN THỊ TRANG CHỦ) ---
function renderFeed(itemsToDisplay) {
    let feed = document.getElementById('itemsFeed');
    feed.innerHTML = ''; 
    // Sắp xếp theo id giảm dần (mới nhất lên đầu)
    itemsToDisplay.sort((a, b) => b.id - a.id);


    // Duyệt qua mảng itemsToDisplay và tạo thẻ div cho mỗi bài đăng, sau đó thêm vào feed  
    itemsToDisplay.forEach(item => {
        let div = document.createElement('div');
        div.className = 'item-card';
        // Tạo badge trạng thái với màu sắc tương ứng, dùng ` để chèn biến vào chuỗi HTML mà không cần + chuỗi 
        let statusBadge = `<span class="status-badge status-${item.status}">${STATUS_LABELS[item.status]}</span>`;

        // Đưa nội dung bài đăng vào div, sử dụng formatVND để hiển thị giá theo định dạng VNĐ, và thêm thông tin người bán + ngày đăng ở cuối
        div.innerHTML = `
            <h4>${item.name} ${statusBadge}</h4>
            <p><b>Giá:</b> ${formatVND(item.price)} VNĐ | <b>Tình trạng:</b> ${item.condition} | <b>Loại:</b> ${item.category}</p>
            <p><small>Người bán: ${item.seller} - Ngày đăng: ${item.datePosted}</small></p>
        `;

        // Thêm thẻ div vào phần feed để hiển thị trên trang
        feed.appendChild(div);
    });
}

// --- FILTER (LỌC BÀI ĐĂNG / TÌM KIẾM) ---
function filterItems() {
    let search = document.getElementById('searchName').value.toLowerCase();
    let cat = document.getElementById('filterCategory').value;
    let maxP = document.getElementById('maxPrice').value;

    // Lọc mảng items bằng filter, giống như chức năng Stream trong Java.
    let filtered = items.filter(item => {
        let matchName = item.name.toLowerCase().includes(search);
        let matchCat = (cat === 'All') || (item.category === cat);
        let matchPrice = (!maxP) || (item.price <= parseFloat(maxP));
        return matchName && matchCat && matchPrice;
    });
    renderFeed(filtered);
}

// --- QUẢN LÝ BÀI CỦA MÌNH ---
function renderMyItems() {
    let feed = document.getElementById('myItemsFeed');
    feed.innerHTML = '';
    
    let myItems = items.filter(i => i.seller === loggedInUser);
    myItems.sort((a, b) => b.id - a.id);

    myItems.forEach(item => {
        let div = document.createElement('div');
        div.className = 'item-card my-item-card';
        
        div.innerHTML = `
            <h4>${item.name}</h4>
            <p><b>Giá:</b> ${formatVND(item.price)} VNĐ</p>
            <p>
                <b>Trạng thái: </b>
                <select onchange="updateStatus(${item.id}, this.value)">
                    <option value="DangBan" ${item.status === 'DangBan' ? 'selected' : ''}>Đang Bán</option>
                    <option value="DaDatHang" ${item.status === 'DaDatHang' ? 'selected' : ''}>Đã Đặt Hàng</option>
                    <option value="DaBan" ${item.status === 'DaBan' ? 'selected' : ''}>Đã Bán</option>
                </select>
            </p>
            <button onclick="openEdit(${item.id})">Sửa thông tin</button>
            <button onclick="deleteItem(${item.id})" style="background-color:#ffcccc; color:red;">Xóa bài</button>
        `;
        feed.appendChild(div);
    });
}

// --- UPDATE (ĐỔI TRẠNG THÁI & SỬA THÔNG TIN) ---
function updateStatus(id, newStatus) {
    let index = items.findIndex(i => i.id === id);
    if(index !== -1) {
        items[index].status = newStatus;
        localStorage.setItem('items', JSON.stringify(items));
        alert("Đã cập nhật trạng thái!");
    }
}

// --- MỞ FORM SỬA THÔNG TIN ---
function openEdit(id) {
    let item = items.find(i => i.id === id);
    document.getElementById('editItemId').value = item.id;
    document.getElementById('editItemName').value = item.name;
    document.getElementById('editItemPrice').value = item.price;
    document.getElementById('editForm').classList.remove('hidden');
}

// --- HỦY SỬA THÔNG TIN ---
function cancelEdit() {
    document.getElementById('editForm').classList.add('hidden');
}


// --- LƯU THÔNG TIN ĐÃ CHỈNH SỬA ---
function saveEdit() {
    let id = parseInt(document.getElementById('editItemId').value);
    let newName = document.getElementById('editItemName').value;
    let newPrice = document.getElementById('editItemPrice').value;

    let index = items.findIndex(i => i.id === id);
    if(index !== -1) {
        items[index].name = newName;
        items[index].price = parseFloat(newPrice);
        localStorage.setItem('items', JSON.stringify(items));
        alert("Đã lưu chỉnh sửa!");
        cancelEdit();
        renderMyItems(); 
    }
}

// --- DELETE (XÓA BÀI) ---
function deleteItem(id) {
    if(confirm("Bạn có chắc chắn muốn xóa bài đăng này vĩnh viễn không?")) {
        items = items.filter(i => i.id !== id);
        localStorage.setItem('items', JSON.stringify(items));
        renderMyItems(); 
    }
}