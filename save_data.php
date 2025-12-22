<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');

// Obsługa preflight request (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Sprawdź metodę
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Tylko metoda POST jest dozwolona']);
    exit();
}

// Odczytaj dane z żądania POST
$json_data = file_get_contents('php://input');
$data = json_decode($json_data, true);

if ($data === null) {
    echo json_encode(['success' => false, 'message' => 'Nieprawidłowe dane JSON']);
    exit();
}

// Sprawdź podstawową strukturę danych
if (!isset($data['rounds']) || !isset($data['drivers']) || !isset($data['results'])) {
    echo json_encode(['success' => false, 'message' => 'Brakuje wymaganych pól w danych']);
    exit();
}

// Zapisz dane do pliku
$filename = 'data.json';

try {
    // Dodaj timestamp aktualizacji
    $data['last_updated'] = date('Y-m-d H:i:s');
    
    // Zapisz do pliku
    if (file_put_contents($filename, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)) !== false) {
        // Ustaw prawa dostępu (ważne dla serwerów Linux)
        chmod($filename, 0666);
        echo json_encode(['success' => true, 'message' => 'Dane zapisane pomyślnie']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Błąd zapisu do pliku']);
    }
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => 'Błąd: ' . $e->getMessage()]);
}
?>
