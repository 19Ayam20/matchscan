<?php
// used to connect to the database
$host         = "localhost";
$db_name     = "msc";
$username     = "root";
$password     = "";

try {
    $koneksidb = new PDO("mysql:host={$host};dbname={$db_name}", $username, $password);
}

// show error
catch (PDOException $exception) {
    echo "Connection error: " . $exception->getMessage();
}
?>
