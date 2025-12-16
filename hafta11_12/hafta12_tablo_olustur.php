<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>Dinamik Tablo Oluştur</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(120deg, #f3e5f5, #ffffff);
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 900px;
            margin: 60px auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        h2 {
            text-align: center;
            color: #6a1b9a;
        }
        form {
            text-align: center;
            margin-top: 20px;
        }
        input {
            width: 120px;
            padding: 8px;
            margin: 5px;
            border-radius: 6px;
            border: 1px solid #ccc;
        }
        button {
            padding: 10px 20px;
            background-color: #6a1b9a;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
        }
        button:hover {
            background-color: #4a148c;
        }
        table {
            margin: 30px auto;
            border-collapse: collapse;
        }
        td {
            border: 1px solid #555;
            padding: 12px;
            text-align: center;
            font-weight: bold;
        }
        a {
            display: inline-block;
            margin-top: 20px;
            text-decoration: none;
            color: white;
            background-color: #6a1b9a;
            padding: 10px 20px;
            border-radius: 8px;
        }
    </style>
</head>
<body>

<div class="container">
    <h2>Dinamik Tablo Oluştur</h2>

    <form method="post">
        <input type="number" name="satir" placeholder="Satır" min="1" required>
        <input type="number" name="sutun" placeholder="Sütun" min="1" required>
        <br>
        <button type="submit">Tablo Oluştur</button>
    </form>

    <?php
    if ($_SERVER["REQUEST_METHOD"] == "POST") {
        $satir = $_POST["satir"];
        $sutun = $_POST["sutun"];

        echo "<table>";
        for ($i = 0; $i < $satir; $i++) {
            echo "<tr>";
            for ($j = 0; $j < $sutun; $j++) {
                echo "<td>" . rand(1, 100) . "</td>";
            }
            echo "</tr>";
        }
        echo "</table>";
    }
    ?>

    <div style="text-align:center;">
        <a href="index.html">Ana Sayfa</a>
    </div>
</div>

</body>
</html>
