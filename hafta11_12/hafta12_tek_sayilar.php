<!DOCTYPE html>
<html lang="tr">
<head>
    <meta charset="UTF-8">
    <title>1-100 Arası Tek Sayılar</title>
    <style>
        body {
            font-family: 'Segoe UI', sans-serif;
            background: linear-gradient(120deg, #e0f7fa, #ffffff);
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: 80px auto;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        h2 {
            text-align: center;
            color: #00796b;
        }
        .numbers {
            margin-top: 20px;
            font-size: 18px;
            line-height: 2;
            text-align: center;
            word-spacing: 10px;
        }
        a {
            display: inline-block;
            margin-top: 20px;
            text-decoration: none;
            color: white;
            background-color: #00796b;
            padding: 10px 20px;
            border-radius: 8px;
        }
        a:hover {
            background-color: #004d40;
        }
    </style>
</head>
<body>

<div class="container">
    <h2>1 – 100 Arası Tek Sayılar</h2>

    <div class="numbers">
        <?php
        for ($i = 1; $i <= 100; $i += 2) {
            echo $i . " ";
        }
        ?>
    </div>

    <div style="text-align:center;">
        <a href="index.html">Ana Sayfa</a>
    </div>
</div>

</body>
</html>
