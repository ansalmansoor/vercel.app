<?php
// =====================================================
// SafeTClaim - Users API Endpoint
// URL: /api/users.php
//
// GET    /api/users.php            → get all users
// POST   /api/users.php            → create/update user (body: JSON)
// DELETE /api/users.php?username=x → delete a user
// =====================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// GET - Return all users
if ($method === 'GET') {
    $stmt = $db->query('SELECT username, password, role, created_at FROM safet_users ORDER BY created_at ASC');
    respond($stmt->fetchAll());
}

// POST - Create or update a user (upsert)
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    if (empty($body['username']) || empty($body['password']) || empty($body['role'])) {
        respond(['error' => 'Missing required fields: username, password, role'], 400);
    }

    $username = strtolower(trim($body['username']));
    $password = $body['password'];
    $role     = $body['role'];

    // Validate role
    if (!in_array($role, ['super', 'staff'])) {
        respond(['error' => 'Invalid role. Must be "super" or "staff"'], 400);
    }

    // Upsert: insert or update password/role if username exists
    $stmt = $db->prepare('
        INSERT INTO safet_users (username, password, role)
        VALUES (:username, :password, :role)
        ON DUPLICATE KEY UPDATE password = VALUES(password), role = VALUES(role)
    ');
    $stmt->execute([':username' => $username, ':password' => $password, ':role' => $role]);

    respond(['success' => true, 'username' => $username]);
}

// DELETE - Remove a user by username
if ($method === 'DELETE') {
    $username = $_GET['username'] ?? '';

    if (empty($username)) {
        respond(['error' => 'Missing username query parameter'], 400);
    }

    $stmt = $db->prepare('DELETE FROM safet_users WHERE username = :username');
    $stmt->execute([':username' => $username]);

    if ($stmt->rowCount() === 0) {
        respond(['error' => 'User not found'], 404);
    }

    respond(['success' => true]);
}

respond(['error' => 'Method not allowed'], 405);
