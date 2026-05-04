<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

$csvFile    = __DIR__ . '/Liga_Jornada.csv';
$outputJson = __DIR__ . '/partits.json';

if (!file_exists($csvFile)) {
    die("❌ No es troba el CSV");
}

// Llegir CSV amb separador ;
$rows = array_map(
    fn($l) => str_getcsv($l, ';'),
    file($csvFile)
);

$partits = [];

// Recorrem files
foreach ($rows as $index => $row) {

    // 🔸 Saltar títol i capçaleres
    if ($index < 2) continue;

    // Assegurar 5 columnes
    $row = array_pad($row, 5, '');

    $categoria = trim($row[0]);
    $rival     = trim($row[1]);
    $localitat = trim($row[2]);
    $diaHora   = trim($row[3]);
    $campRaw   = trim($row[4]);

    // Si no hi ha categoria → ignorem
    if ($categoria === '') continue;

    // 🟡 DESCANSA
    if (stripos($campRaw, 'descansa') !== false) {
    $partits[] = [
        'categoria' => $categoria,
        'descansa'  => true
    ];
    continue;
}

    // 🔴 ANUL·LAT (mateix comportament que descansa)
    if (stripos($campRaw, 'anul') !== false) {
    $partits[] = [
        'categoria' => $categoria,
        'anulat'    => true
    ];
    continue;
}
 
    // 🟠 AJORNAT
    if (stripos($campRaw, 'ajor') !== false) {
    $partits[] = [
        'categoria' => $categoria,
        'aplazado'  => true
    ];
    continue;
}
    
    // Separar dia i hora
    // Normalitzar separadors estranys
$diaHoraClean = str_replace(['–', '—'], '-', $diaHora);

// Separar dia i hora
$parts = array_map('trim', explode('-', $diaHoraClean));

if (count($parts) !== 2) continue;

$dia  = $parts[0];
$hora = $parts[1];

    $partits[] = [
    'categoria' => $categoria,
    'rival'     => $rival,
    'localitat' => strtoupper($localitat),
    'dia'       => $dia,
    'hora'      => $hora,
    'camp'      => $campRaw
];
}

// Escriure JSON
file_put_contents(
    $outputJson,
    json_encode($partits, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)
);

echo "✅ partits.json generat correctament des del CSV";