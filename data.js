// Dữ liệu các cửa hàng mẫu
const stores = [
    {
        id: 1,
        name: "Cửa hàng Hà Nội - Tây Hồ",
        lat: 21.0858,
        lng: 105.8581,
        address: "Số 123, Đường Bắc Bộ, Tây Hồ, Hà Nội"
    },
    {
        id: 2,
        name: "Cửa hàng Hà Nội - Hoàn Kiếm",
        lat: 21.0290,
        lng: 105.8554,
        address: "Số 45, Đường Trang Tiền, Hoàn Kiếm, Hà Nội"
    },
    {
        id: 3,
        name: "Cửa hàng Hà Nội - Cầu Giấy",
        lat: 21.0001,
        lng: 105.8181,
        address: "Số 789, Đường Thụy Khuê, Cầu Giấy, Hà Nội"
    },
    {
        id: 4,
        name: "Cửa hàng Hà Nội - Thanh Xuân",
        lat: 20.9935,
        lng: 105.8439,
        address: "Số 234, Đường Khuất Duy Tiến, Thanh Xuân, Hà Nội"
    },
    {
        id: 5,
        name: "Cửa hàng Hà Nội - Long Biên",
        lat: 21.0365,
        lng: 105.8831,
        address: "Số 567, Đường Phạm Văn Đồng, Long Biên, Hà Nội"
    },
    {
        id: 6,
        name: "Cửa hàng Hà Nội - Bắc Từ Liêm",
        lat: 21.0530,
        lng: 105.7878,
        address: "Số 890, Đường Thượng Cát, Bắc Từ Liêm, Hà Nội"
    }
];

// Hàm tính khoảng cách giữa hai tọa độ (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Khoảng cách theo km
}

// Hàm tìm cửa hàng gần nhất
function findNearestStore(lat, lng) {
    let nearest = null;
    let minDistance = Infinity;

    stores.forEach(store => {
        const distance = calculateDistance(lat, lng, store.lat, store.lng);
        if (distance < minDistance) {
            minDistance = distance;
            nearest = { ...store, distance: distance };
        }
    });

    return nearest;
}
