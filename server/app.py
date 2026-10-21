"""
Demo Shop API - server REST đơn giản dùng làm đối tượng kiểm thử hiệu năng với JMeter.
Chỉ dùng thư viện chuẩn của Python (không cần cài thêm gì).

Chạy:  python3 server/app.py [port]      (mặc định port 8080)

Endpoints:
  GET  /api/health              -> kiểm tra server
  POST /api/login               -> {"username","password"} -> {"token"}
  GET  /api/products            -> danh sách sản phẩm (hỗ trợ ?page=&size=)
  GET  /api/products/{id}       -> chi tiết 1 sản phẩm
  POST /api/orders              -> tạo đơn hàng (cần header Authorization: Bearer <token>)
"""
import json
import random
import secrets
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

USERS = {f"sv{i:04d}": "123456" for i in range(1, 1001)}  # 1000 tài khoản sinh viên
PRODUCTS = [
    {"id": i, "name": f"Sản phẩm {i}", "price": 10000 * i, "stock": 1000}
    for i in range(1, 51)
]
TOKENS = {}
ORDERS = []
LOCK = threading.Lock()

# Giả lập connection pool của database: chỉ tối đa DB_POOL_SIZE truy vấn chạy đồng thời,
# các request còn lại phải xếp hàng chờ -> đây là "nút cổ chai" khi tải tăng cao.
DB_POOL_SIZE = 20
DB_POOL = threading.BoundedSemaphore(DB_POOL_SIZE)


def simulate_work(min_ms, max_ms):
    """Giả lập thời gian truy vấn DB (phải mượn 1 kết nối từ pool)."""
    with DB_POOL:
        time.sleep(random.uniform(min_ms, max_ms) / 1000)


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"  # hỗ trợ keep-alive

    def log_message(self, *args):  # tắt log từng request cho đỡ chậm
        pass

    def send_json(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def read_json(self):
        length = int(self.headers.get("Content-Length", 0))
        if not length:
            return {}
        try:
            return json.loads(self.rfile.read(length))
        except json.JSONDecodeError:
            return None

    def do_GET(self):
        path, _, query = self.path.partition("?")
        params = dict(p.split("=", 1) for p in query.split("&") if "=" in p)

        if path == "/api/health":
            return self.send_json(200, {"status": "UP"})

        if path == "/api/products":
            simulate_work(10, 40)
            page = int(params.get("page", 1))
            size = int(params.get("size", 10))
            start = (page - 1) * size
            return self.send_json(200, {
                "page": page, "size": size, "total": len(PRODUCTS),
                "items": PRODUCTS[start:start + size],
            })

        if path.startswith("/api/products/"):
            simulate_work(5, 25)
            try:
                pid = int(path.rsplit("/", 1)[1])
            except ValueError:
                return self.send_json(400, {"error": "id không hợp lệ"})
            product = next((p for p in PRODUCTS if p["id"] == pid), None)
            if product is None:
                return self.send_json(404, {"error": "Không tìm thấy sản phẩm"})
            return self.send_json(200, product)

        self.send_json(404, {"error": "Not found"})

    def do_POST(self):
        data = self.read_json()
        if data is None:
            return self.send_json(400, {"error": "JSON không hợp lệ"})

        if self.path == "/api/login":
            simulate_work(20, 60)
            username, password = data.get("username"), data.get("password")
            if USERS.get(username) != password:
                return self.send_json(401, {"error": "Sai tài khoản hoặc mật khẩu"})
            token = secrets.token_hex(16)
            with LOCK:
                TOKENS[token] = username
            return self.send_json(200, {"token": token, "username": username})

        if self.path == "/api/orders":
            auth = self.headers.get("Authorization", "")
            token = auth.removeprefix("Bearer ").strip()
            with LOCK:
                username = TOKENS.get(token)
            if username is None:
                return self.send_json(401, {"error": "Chưa đăng nhập"})
            simulate_work(30, 80)
            pid, qty = data.get("productId"), data.get("quantity", 1)
            if not any(p["id"] == pid for p in PRODUCTS):
                return self.send_json(400, {"error": "Sản phẩm không tồn tại"})
            with LOCK:
                order = {"id": len(ORDERS) + 1, "user": username,
                         "productId": pid, "quantity": qty}
                ORDERS.append(order)
            return self.send_json(201, order)

        self.send_json(404, {"error": "Not found"})


class Server(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 256


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f"Demo Shop API đang chạy tại http://localhost:{port}")
    Server(("0.0.0.0", port), Handler).serve_forever()
