// Khởi tạo bản đồ
let map = null;
let markers = [];
let routeControl = null;
let selectedPoints = [];
let currentMode = null;

// Hàm khởi tạo bản đồ
function initMap() {
    if (map) return;

    // Tọa độ trung tâm Hà Nội
    const hanoi = [21.0285, 105.8542];
    
    map = L.map('map').setView(hanoi, 12);

    // Thêm tile layer OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
}

// Hàm xóa tất cả marker
function clearMarkers() {
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    selectedPoints = [];
    if (routeControl) {
        map.removeControl(routeControl);
        routeControl = null;
    }
    updateDistanceInfo("Bản đồ đã được xóa");
}

// Hàm thêm marker
function addMarker(lat, lng, title, icon = 'blue') {
    if (!map) initMap();

    const iconColor = {
        'blue': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        'red': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        'green': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        'yellow': 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png'
    };

    const markerIcon = L.icon({
        iconUrl: iconColor[icon] || iconColor['blue'],
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    const marker = L.marker([lat, lng], { icon: markerIcon })
        .bindPopup(title)
        .addTo(map);

    markers.push(marker);
    return marker;
}

// Hàm hiển thị thông tin khoảng cách
function updateDistanceInfo(html) {
    document.getElementById('distanceInfo').innerHTML = html;
}

// ========== TÍNH NĂNG 1: Hiển thị cửa hàng ==========
document.getElementById('showStoresBtn').addEventListener('click', function() {
    if (!map) initMap();
    
    clearMarkers();
    
    stores.forEach(store => {
        const popupContent = `
            <strong>${store.name}</strong><br>
            📍 Lat: ${store.lat.toFixed(4)}, Lng: ${store.lng.toFixed(4)}<br>
            📮 ${store.address}
        `;
        addMarker(store.lat, store.lng, popupContent, 'blue');
    });

    // Tạo bounds để zoom vào tất cả marker
    const bounds = L.latLngBounds(markers.map(m => m.getLatLng()));
    map.fitBounds(bounds, { padding: [50, 50] });

    updateDistanceInfo(`<strong>✅ Đã hiển thị ${stores.length} cửa hàng</strong><br>Click vào marker để xem thông tin`);
});

// ========== TÍNH NĂNG 2: Tìm cửa hàng gần nhất ==========
document.getElementById('findNearestBtn').addEventListener('click', function() {
    if (!map) initMap();

    currentMode = 'nearest';
    updateDistanceInfo("📍 Click trên bản đồ để chọn điểm, sau đó tìm cửa hàng gần nhất");
    
    map.once('click', function(e) {
        const { lat, lng } = e.latlng;
        
        clearMarkers();
        
        // Thêm marker điểm đã chọn
        addMarker(lat, lng, "Điểm của bạn", 'red');

        // Tìm cửa hàng gần nhất
        const nearest = findNearestStore(lat, lng);
        
        // Thêm marker cửa hàng gần nhất
        const popupContent = `
            <strong>${nearest.name}</strong><br>
            📍 Lat: ${nearest.lat.toFixed(4)}, Lng: ${nearest.lng.toFixed(4)}<br>
            📮 ${nearest.address}<br>
            <strong style="color:green;">📏 Khoảng cách: ${nearest.distance.toFixed(2)} km</strong>
        `;
        addMarker(nearest.lat, nearest.lng, popupContent, 'green');

        // Cập nhật info
        updateDistanceInfo(`
            <strong>✅ Cửa hàng gần nhất:</strong><br>
            <strong>${nearest.name}</strong><br>
            📏 Khoảng cách: <strong style="color:green;">${nearest.distance.toFixed(2)} km</strong><br>
            📍 Tọa độ: ${nearest.lat.toFixed(4)}, ${nearest.lng.toFixed(4)}<br>
            📮 Địa chỉ: ${nearest.address}
        `);

        // Vẽ đường thẳng nối hai điểm
        L.polyline([[lat, lng], [nearest.lat, nearest.lng]], {
            color: 'red',
            weight: 2,
            opacity: 0.5,
            dashArray: '5, 5'
        }).addTo(map);

        // Zoom vào
        const bounds = L.latLngBounds([[lat, lng], [nearest.lat, nearest.lng]]);
        map.fitBounds(bounds, { padding: [50, 50] });
    });
});

// ========== TÍNH NĂNG 3: Đường đi ngắn nhất (2 điểm) ==========
document.getElementById('findShortestBtn').addEventListener('click', function() {
    if (!map) initMap();

    currentMode = 'twoPoints';
    selectedPoints = [];
    
    clearMarkers();
    updateDistanceInfo("🔴 Click điểm thứ 1 trên bản đồ");
    
    const handleMapClick = function(e) {
        const { lat, lng } = e.latlng;
        
        selectedPoints.push([lat, lng]);
        addMarker(lat, lng, `Điểm ${selectedPoints.length}`, selectedPoints.length === 1 ? 'red' : 'green');

        if (selectedPoints.length === 1) {
            updateDistanceInfo("🟢 Click điểm thứ 2 trên bản đồ");
        } else if (selectedPoints.length === 2) {
            map.off('click', handleMapClick);
            
            // Vẽ route tối ưu
            if (routeControl) {
                map.removeControl(routeControl);
            }

            routeControl = L.Routing.control({
                waypoints: [
                    L.latLng(selectedPoints[0][0], selectedPoints[0][1]),
                    L.latLng(selectedPoints[1][0], selectedPoints[1][1])
                ],
                routeWhileDragging: false,
                lineOptions: {
                    styles: [{ color: '#667eea', opacity: 1, weight: 5 }]
                }
            }).addTo(map);

            // Lấy thông tin route
            routeControl.on('routesfound', function(e) {
                const route = e.routes[0];
                const distance = (route.summary.totalDistance / 1000).toFixed(2);
                const time = Math.round(route.summary.totalTime / 60);

                updateDistanceInfo(`
                    <strong>✅ Đường đi tối ưu:</strong><br>
                    📏 Khoảng cách: <strong style="color:#667eea;">${distance} km</strong><br>
                    ⏱️ Thời gian: <strong style="color:#667eea;">${time} phút</strong><br>
                    🔢 Số bước: ${route.instructions.length}
                `);
            });

            const bounds = L.latLngBounds(selectedPoints);
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    };

    map.on('click', handleMapClick);
});

// ========== TÍNH NĂNG 4: Route với nhiều điểm ==========
document.getElementById('multiPointBtn').addEventListener('click', function() {
    if (!map) initMap();

    currentMode = 'multiPoint';
    selectedPoints = [];
    
    clearMarkers();
    updateDistanceInfo("🔴 Click để thêm điểm (tối thiểu 2 điểm). Double-click để kết thúc");
    
    let clickCount = 0;
    
    const handleMapClick = function(e) {
        const { lat, lng } = e.latlng;
        
        selectedPoints.push([lat, lng]);
        clickCount++;
        addMarker(lat, lng, `Điểm ${clickCount}`, clickCount === 1 ? 'red' : 'yellow');

        updateDistanceInfo(`🟡 Đã chọn ${clickCount} điểm. Double-click để tính route`);
    };

    map.on('click', handleMapClick);

    // Double-click để tính route
    map.on('dblclick', function() {
        map.off('click', handleMapClick);

        if (selectedPoints.length < 2) {
            updateDistanceInfo("❌ Vui lòng chọn ít nhất 2 điểm");
            return;
        }

        // Vẽ route
        if (routeControl) {
            map.removeControl(routeControl);
        }

        const waypoints = selectedPoints.map(p => L.latLng(p[0], p[1]));

        routeControl = L.Routing.control({
            waypoints: waypoints,
            routeWhileDragging: false,
            lineOptions: {
                styles: [{ color: '#f97316', opacity: 1, weight: 5 }]
            }
        }).addTo(map);

        routeControl.on('routesfound', function(e) {
            const route = e.routes[0];
            const distance = (route.summary.totalDistance / 1000).toFixed(2);
            const time = Math.round(route.summary.totalTime / 60);

            updateDistanceInfo(`
                <strong>✅ Route ${selectedPoints.length} điểm:</strong><br>
                📏 Tổng khoảng cách: <strong style="color:#f97316;">${distance} km</strong><br>
                ⏱️ Tổng thời gian: <strong style="color:#f97316;">${time} phút</strong><br>
                📍 Số điểm: ${selectedPoints.length}
            `);
        });

        const bounds = L.latLngBounds(selectedPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
    });
});

// ========== TÍNH NĂNG 5 & 6: Nhập tọa độ ==========
document.getElementById('addCoordinateBtn').addEventListener('click', function() {
    if (!map) initMap();

    const lat = parseFloat(document.getElementById('latInput').value);
    const lng = parseFloat(document.getElementById('lngInput').value);

    if (isNaN(lat) || isNaN(lng)) {
        alert('Vui lòng nhập tọa độ hợp lệ');
        return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        alert('Tọa độ không hợp lệ!\nVĩ độ: -90 đến 90\nKinh độ: -180 đến 180');
        return;
    }

    // Thêm marker
    addMarker(lat, lng, `Điểm tự nhập: (${lat}, ${lng})`, 'green');

    // Tìm cửa hàng gần nhất cho điểm vừa nhập
    const nearest = findNearestStore(lat, lng);

    updateDistanceInfo(`
        <strong>✅ Điểm đã thêm:</strong><br>
        📍 Tọa độ: ${lat.toFixed(4)}, ${lng.toFixed(4)}<br>
        <strong>Cửa hàng gần nhất:</strong><br>
        ${nearest.name}<br>
        📏 Khoảng cách: <strong style="color:green;">${nearest.distance.toFixed(2)} km</strong>
    `);

    // Zoom vào
    map.setView([lat, lng], 14);

    // Xóa input
    document.getElementById('latInput').value = '';
    document.getElementById('lngInput').value = '';
});

// ========== CLEAR MAP ==========
document.getElementById('clearMapBtn').addEventListener('click', function() {
    clearMarkers();
    selectedPoints = [];
    currentMode = null;
    updateDistanceInfo("🗑️ Bản đồ đã được xóa");
});

// Khởi tạo bản đồ khi trang load
window.addEventListener('load', function() {
    initMap();
    updateDistanceInfo("👋 Chào mừng! Bắt đầu bằng cách click 'Hiển thị cửa hàng'");
});
