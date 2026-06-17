<?php
// =====================================================
// SafeTClaim - Claims API Endpoint
// URL: /api/claims.php
//
// GET    /api/claims.php       → get all claims
// POST   /api/claims.php       → create/update claim (body: JSON)
// DELETE /api/claims.php?id=x  → delete a claim
// =====================================================
require_once __DIR__ . '/config.php';

$db     = getDB();
$method = $_SERVER['REQUEST_METHOD'];

// GET - Return all claims
if ($method === 'GET') {
    $stmt = $db->query('SELECT * FROM safet_claims ORDER BY date_added DESC');
    $rows = $stmt->fetchAll();

    // Decode JSON fields back into arrays for the frontend
    foreach ($rows as &$row) {
        $row['images']  = json_decode($row['images']  ?? '[]', true) ?? [];
        $row['history'] = json_decode($row['history'] ?? '[]', true) ?? [];
        // Map snake_case DB columns to camelCase JS fields
        $row['shipmentId']    = $row['shipment_id'];
        $row['trackingNumber']= $row['tracking_number'];
        $row['returnType']    = $row['return_type'];
        $row['issueType']     = $row['issue_type'];
        $row['dateAdded']     = $row['date_added'];
        $row['addedBy']       = $row['added_by'];
        $row['addedByRole']   = $row['added_by_role'];
        // Remove snake_case duplicates
        unset($row['shipment_id'], $row['tracking_number'], $row['return_type'],
              $row['issue_type'], $row['date_added'], $row['added_by'], $row['added_by_role']);
    }

    respond($rows);
}

// POST - Create or update a claim (upsert)
if ($method === 'POST') {
    $body = json_decode(file_get_contents('php://input'), true);

    if (empty($body['id'])) {
        $body['id'] = 'claim_' . time() . '_' . bin2hex(random_bytes(4));
    }
    if (empty($body['dateAdded'])) {
        $body['dateAdded'] = date('Y-m-d H:i:s');
    }
    if (empty($body['status'])) {
        $body['status'] = 'Pending';
    }

    $stmt = $db->prepare('
        INSERT INTO safet_claims
          (id, shipment_id, tracking_number, return_type, issue_type,
           images, message, status, date_added, added_by, added_by_role, history)
        VALUES
          (:id, :shipment_id, :tracking_number, :return_type, :issue_type,
           :images, :message, :status, :date_added, :added_by, :added_by_role, :history)
        ON DUPLICATE KEY UPDATE
          shipment_id     = VALUES(shipment_id),
          tracking_number = VALUES(tracking_number),
          return_type     = VALUES(return_type),
          issue_type      = VALUES(issue_type),
          images          = VALUES(images),
          message         = VALUES(message),
          status          = VALUES(status),
          date_added      = VALUES(date_added),
          added_by        = VALUES(added_by),
          added_by_role   = VALUES(added_by_role),
          history         = VALUES(history)
    ');

    $stmt->execute([
        ':id'              => $body['id'],
        ':shipment_id'     => $body['shipmentId']     ?? null,
        ':tracking_number' => $body['trackingNumber'] ?? null,
        ':return_type'     => $body['returnType']     ?? null,
        ':issue_type'      => $body['issueType']      ?? null,
        ':images'          => json_encode($body['images']  ?? []),
        ':message'         => $body['message']        ?? null,
        ':status'          => $body['status'],
        ':date_added'      => $body['dateAdded'],
        ':added_by'        => $body['addedBy']        ?? null,
        ':added_by_role'   => $body['addedByRole']    ?? null,
        ':history'         => json_encode($body['history'] ?? []),
    ]);

    respond(['success' => true, 'id' => $body['id']]);
}

// DELETE - Remove a claim by id
if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';

    if (empty($id)) {
        respond(['error' => 'Missing id query parameter'], 400);
    }

    $stmt = $db->prepare('DELETE FROM safet_claims WHERE id = :id');
    $stmt->execute([':id' => $id]);

    if ($stmt->rowCount() === 0) {
        respond(['error' => 'Claim not found'], 404);
    }

    respond(['success' => true]);
}

respond(['error' => 'Method not allowed'], 405);
