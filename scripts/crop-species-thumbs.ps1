Add-Type -AssemblyName System.Drawing
$src = "C:\Users\一鸣\Documents\game\Star-Puff\preview-screenshot.png"
$dstDir = "C:\Users\一鸣\Documents\game\Star-Puff\public\models\species\thumbnails"
if (!(Test-Path $dstDir)) { New-Item -ItemType Directory -Force -Path $dstDir | Out-Null }

# 清理旧 png
Get-ChildItem -Path $dstDir -Filter "*_thumb.png" | Remove-Item -Force

$bmp = [System.Drawing.Bitmap]::FromFile($src)
$W = $bmp.Width
$H = $bmp.Height
Write-Output ("源图尺寸: " + $W + " x " + $H)

# 4 列 3 行 = 12 个 cell
$cols = 4; $rows = 3
$cellW = [int]($W / $cols)
$cellH = [int]($H / $rows)
Write-Output ("每格: " + $cellW + " x " + $cellH)

# 每个 cell 截中间 80%（去掉 padding/border）
$cropRatio = 0.82
for ($r = 0; $r -lt $rows; $r++) {
    for ($c = 0; $c -lt $cols; $c++) {
        $idx = $r * $cols + $c + 1
        $x = [int]($c * $cellW + ($cellW * (1 - $cropRatio) / 2))
        $y = [int]($r * $cellH + ($cellH * (1 - $cropRatio) / 2))
        $w = [int]($cellW * $cropRatio)
        $h = [int]($cellH * $cropRatio)
        $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
        $out = Join-Path $dstDir ("species_{0:D2}_thumb.png" -f $idx)
        $crop = $bmp.Clone($rect, $bmp.PixelFormat)
        $crop.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
        $crop.Dispose()
        Write-Output ("✓ 模型 {0:D2}: " -f $idx) $out
    }
}
$bmp.Dispose()
Write-Output "完成"
