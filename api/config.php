<?php
// =====================================================
// SafeTClaim - Database Configuration
// Edit these values to match your MySQL settings
// =====================================================

define('DB_HOST',     'localhost');      // Usually localhost
define('DB_NAME',     'safetclaim');     // Your database name
define('DB_USER',     'root');           // Your MySQL username
define('DB_PASS',     '');               // Your MySQL password
define('DB_CHARSET',  'utf8mb4');

// CORS headers - allow your frontend domain to call this API
// Change '*' to your exact domain in production for better security
// e.g. 'https://mysite.com'
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Create and return a PDO database connection
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
            $pdo = new PDO($dsn, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
            exit();
        }
    }
    return $pdo;
}

// Helper: send JSON response
function respond($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data);
    exit();
}
