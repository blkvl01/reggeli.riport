# HGL REGGELI RIPORT - reggeli_riport.ps1
# SharePoint Direct Access verzió

$today       = Get-Date
$todayDay    = $today.Day
$month       = $today.ToString("MM")
$year        = $today.ToString("yyyy")
$excelBase   = [datetime]"1899-12-30"
$todaySerial = ($today.Date - $excelBase).TotalDays
$tegnap20    = ($todaySerial - 1) + (20.0/24)
$ma08        = $todaySerial + (8.0/24)
$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputHtml  = "$scriptDir\reggeli_riport.html"

Write-Host ""
Write-Host "==========================================="
Write-Host "  HGL ECOMMERCE - REGGELI RIPORT"
Write-Host "  SharePoint Direct Access"
Write-Host "==========================================="
Write-Host ""
Write-Host "Felhasznalo: $env:USERNAME"
Write-Host ""

# =============================================
# SHAREPOINT URL-EK (kozvetlenul)
# =============================================

Write-Host "[1/4] E_COMM nyomonkovetes..." -NoNewline
$xlsbSrc = "https://hgllog.sharepoint.com/sites/Ecommerce/Megosztott%20dokumentumok/E_COMM%20nyomonk%C3%B6vet%C3%A9s_24.xlsb"
Write-Host " SharePoint" -ForegroundColor Green

Write-Host "[2/4] ECOMM + TC beosztas..." -NoNewline
$ecommBeo = "https://hgllog.sharepoint.com/sites/Ecommerce/Megosztott%20dokumentumok/E-COM%20%C3%A9s%20TC%20beoszt%C3%A1s/$month/E-COM+TC%20beoszt%C3%A1s_${year}_${month}.xlsx"
Write-Host " SharePoint" -ForegroundColor Green

Write-Host "[3/4] Belepetes (H7WH)..." -NoNewline
$belpSrc = "https://hgllog.sharepoint.com/sites/Ecommerce/Megosztott%20dokumentumok/Bel%C3%A9ptet%C3%A9s%20H7WH.xlsm"
Write-Host " SharePoint" -ForegroundColor Green

Write-Host "[4/4] LOG SUPPORT beosztas..." -NoNewline
$logSupUrl = "https://hgllog-my.sharepoint.com/personal/virag_szalai_hgllog_com/Documents/Asztal/műszakbeosztás.xlsx"
Write-Host " SharePoint" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================="
Write-Host "  SHAREPOINT FAJLOK - INDITÁS..."
Write-Host "==========================================="
Write-Host ""
Write-Host "Start: $($today.ToString('yyyy-MM-dd HH:mm'))"
Write-Host ""


# --- [char] statusz stringek ---

$stErtesito  = [char]0xC9 + "rtes" + [char]0xED + "t" + [char]0x151   # Ă‰rtesĂ­tĹ‘

$stFelveve   = "Felv" + [char]0xE9 + "ve"                              # FelvĂ©ve

$stMegerk    = "Meg" + [char]0xE9 + "rkezett"                          # MegĂ©rkezett

$stKiadh     = "Kiadhat" + [char]0xF3                                  # KiadhatĂł

$stVamkez    = "V" + [char]0xE1 + "mkez alatt"                        # VĂˇmkez alatt

$stMiTort    = "Mit" + [char]0xF6 + "rt" + [char]0xE9 + "nik"         # MitĂ¶rtĂ©nik

$eAccu       = [char]0xC9



# --- FILESTREAM MASOLAS (mukodik nyitott / zart fajlnal is) ---

function CopyLocked($src, $dst) {

    $fs = [System.IO.File]::Open($src, 'Open', 'Read', 'ReadWrite')

    $ds = [System.IO.FileStream]::new($dst, 'Create')

    $fs.CopyTo($ds); $fs.Close(); $ds.Close()

}



$t1 = "$env:TEMP\riport_ecomm.xlsb"

$t2 = "$env:TEMP\riport_beo.xlsx"

$t3 = "$env:TEMP\riport_logsup.xlsx"

$t4 = "$env:TEMP\riport_belp.xlsm"



Write-Host "Fajlok eloallitak..."

try { CopyLocked $xlsbSrc $t1; Write-Host "  xlsb OK" } catch { $t1 = $xlsbSrc; Write-Host "  xlsb: eredeti path" }

try { CopyLocked $ecommBeo $t2; Write-Host "  beo OK" } catch { $t2 = $ecommBeo; Write-Host "  beo: eredeti path" }

try { CopyLocked $belpSrc $t4; Write-Host "  belp OK" } catch { $t4 = $belpSrc; Write-Host "  belp: eredeti path" }

$t3 = $logSupUrl

Write-Host "  logsup: kozvetlenul COM-mal nyilik"



# --- EXCEL COM: mindig uj instance, AutomationSecurity kikapcs ---

try { $xl = [System.Runtime.InteropServices.Marshal]::GetActiveObject("Excel.Application") }

catch { $xl = $null }

if ($xl) {

    # Ha fut Excel, uj hidden instance-t nyitunk a hatterben

    $xl2 = New-Object -ComObject Excel.Application

    $xl  = $xl2

} else {

    $xl = New-Object -ComObject Excel.Application

}

$xl.Visible            = $false

$xl.DisplayAlerts      = $false

$xl.EnableEvents       = $false

$xl.AutomationSecurity = 3   # msoAutomationSecurityForceDisable - makro dialog tilt

# Varunk amig Excel kĂ©sz

for ($w = 0; $w -lt 10; $w++) {

    try { $null = $xl.Version; break } catch { Start-Sleep -Milliseconds 600 }

}

Write-Host "Excel kesz (v$($xl.Version))"



function OpenWb($xl, $path) {

    for ($i = 0; $i -lt 4; $i++) {

        try { return $xl.Workbooks.Open($path, 0, $true) }   # UpdateLinks=0, ReadOnly=True

        catch { Start-Sleep -Milliseconds 1500 }

    }

    throw "Megnyitas sikertelen: $path"

}



# ============================================================

# 1. E_COMM XLSB

# ============================================================

$ertesito = 0.0; $felveve = 0.0; $megerkezett = 0.0

$ejszakiAmKg = 0.0; $ejszakiAmSor = 0

$ejszakiAtKg = 0.0; $ejszakiAtSor = 0

$raktarKg = 0.0;    $raktarSor = 0
$raktarAwbSet = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

# Orankenti AT bontashoz: 20,21,22,23,0,1,2,3,4,5,6,7

$atOrak = @{}

foreach ($h in @(20,21,22,23,0,1,2,3,4,5,6,7)) { $atOrak["$h"] = @{kg=0.0;db=0} }

$amOrak = @{}

foreach ($h in @(20,21,22,23,0,1,2,3,4,5,6,7)) { $amOrak["$h"] = @{kg=0.0;db=0} }

Write-Host "Olvasom E_COMM..."

try {

    $wb1  = OpenWb $xl $t1

    $ws1  = $wb1.Sheets.Item("E-comm")

    $maxR = $ws1.UsedRange.Rows.Count

    $rngA  = $ws1.Range("A11:A$maxR").Value2
    $rngN  = $ws1.Range("N11:N$maxR").Value2

    $rngF  = $ws1.Range("F11:F$maxR").Value2

    $rngAM = $ws1.Range("AM11:AM$maxR").Value2

    $rngAT = $ws1.Range("AT11:AT$maxR").Value2   # TĂ©tel indulĂˇs (kitĂˇrolas)

    $rows  = $maxR - 10

    for ($i = 1; $i -le $rows; $i++) {

        $st   = if ($rngN  -is [object[,]]) { "$($rngN[$i,1])".Trim()  } else { "$rngN".Trim() }

        $suly = if ($rngF  -is [object[,]]) { $rngF[$i,1]  } else { $rngF }

        $amV  = if ($rngAM -is [object[,]]) { $rngAM[$i,1] } else { $rngAM }

        $atV  = if ($rngAT -is [object[,]]) { $rngAT[$i,1] } else { $rngAT }

        if ($suly -isnot [double]) { $suly = 0.0 }

        if     ($st -eq $stErtesito) { $ertesito    += $suly }

        elseif ($st -eq $stFelveve)  { $felveve     += $suly }

        elseif ($st -eq $stMegerk)   { $megerkezett += $suly }

        # RaktĂˇrban lĂ©vĹ‘ tĂ©telek: KiadhatĂł + VĂˇmkez alatt + MitĂ¶rtĂ©nik + FelvĂ©ve

        if ($st -eq $stKiadh -or $st -eq $stVamkez -or $st -eq $stMiTort -or $st -eq $stFelveve) {

            $raktarKg += $suly
            $awbRaw = if ($rngA -is [object[,]]) { "$($rngA[$i,1])".Trim() } else { "$rngA".Trim() }
            $raktarAwbSet.Add(($awbRaw -replace '-\d+$','')) | Out-Null

        }

        # AM: Ă©jszakai ĂˇttĂˇrolĂˇs (beĂ©rkezĹ‘) - orankent is

        if ($amV -is [double] -and $amV -ge $tegnap20 -and $amV -le $ma08) {

            $ejszakiAmKg += $suly; $ejszakiAmSor++

            $amHour = [int][math]::Floor(($amV % 1) * 24)

            $amKey  = "$amHour"

            if ($amOrak.ContainsKey($amKey)) { $amOrak[$amKey].kg += $suly; $amOrak[$amKey].db++ }

        }

        # AT: ejszakai kitarolas - orankent csak valos sulyu tetelek
        if ($atV -is [double] -and $atV -ge $tegnap20 -and $atV -le $ma08) {
            $ejszakiAtSor++
            if ($suly -gt 0) {
                $ejszakiAtKg += $suly
                $atHour = [int][math]::Floor(($atV % 1) * 24)
                $atKey  = "$atHour"
                if ($atOrak.ContainsKey($atKey)) { $atOrak[$atKey].kg += $suly; $atOrak[$atKey].db++ }
            }
        }

    }

    $wb1.Close($false)

    if ($t1 -ne $xlsbSrc) { Remove-Item $t1 -EA SilentlyContinue }

    $raktarSor = $raktarAwbSet.Count
    Write-Host "E_COMM OK: E=$ertesito F=$felveve M=$megerkezett | AmEj=$ejszakiAmKg ($ejszakiAmSor) | AtEj=$ejszakiAtKg ($ejszakiAtSor) | Raktar=$raktarKg ($raktarSor)"

} catch { Write-Host "HIBA E_COMM: $_" }



# ============================================================

# 2. ECOMM BEOSZTĂS

# ============================================================

$ecommNappal = "N/A"; $ecommEjszaka = "N/A"

Write-Host "Olvasom ECOMM beosztĂˇs..."

try {

    $wb2  = OpenWb $xl $t2

    $ws2  = $wb2.Sheets.Item("ECOM")

    $maxR = $ws2.UsedRange.Rows.Count

    $reNE = "N:\s*(.+?)\s*" + $eAccu + ":(.+)"

    $reE  = $eAccu + ":(.+)"

    for ($r = 1; $r -le $maxR; $r++) {

        for ($c = 1; $c -le 7; $c++) {

            if ($ws2.Cells.Item($r, $c).Value2 -eq $todayDay) {

                $raw = $ws2.Cells.Item($r + 1, $c).Text.Trim()

                if ($raw -match $reNE) {

                    $ecommNappal  = $Matches[1].Trim()

                    $ecommEjszaka = $Matches[2].Trim()

                } elseif ($raw -match $reE) {

                    $ecommNappal = "-"; $ecommEjszaka = $Matches[1].Trim()

                } else { $ecommNappal = $raw }

                break

            }

        }

        if ($ecommNappal -ne "N/A") { break }

    }

    $wb2.Close($false)

    if ($t2 -ne $ecommBeo) { Remove-Item $t2 -EA SilentlyContinue }

    Write-Host "ECOMM OK: N=$ecommNappal E=$ecommEjszaka"

} catch { Write-Host "HIBA ECOMM: $_" }



# ============================================================

# 3. LOG SUPPORT BEOSZTĂS

# ============================================================

$lsNappalThorr="N/A"; $lsNappalCMR="N/A"; $lsNappalLetsz=""

$lsEjThorr="N/A";     $lsEjCMR="N/A";     $lsEjLetsz=""

$lsClearBrigi="";      $lsClearSanyi="";    $lsClearLetsz=""

Write-Host "Olvasom Log Support..."

try {

    if (-not $t3) { throw "logsup URL hiĂˇnyzik" }

    $wb3  = OpenWb $xl $t3

    $ws3  = $wb3.Sheets.Item(1)
    $lsClearBrigiNev = ""
    $lsClearSanyiNev = ""
    try { $lsClearBrigiNev = $ws3.Cells.Item(1, 13).Text.Trim() } catch {}
    try { $lsClearSanyiNev = $ws3.Cells.Item(1, 14).Text.Trim() } catch {}
    $maxR = $ws3.UsedRange.Rows.Count

    $yr   = $today.Year.ToString()

    $dy   = $todayDay.ToString()

    for ($r = 3; $r -le $maxR; $r++) {

        $dv3 = $ws3.Cells.Item($r, 1).Value2
        if (-not ($dv3 -is [double])) { continue }
        $dt3 = [datetime]::FromOADate($dv3)

        if ($dt3.Year -eq $today.Year -and $dt3.Month -eq $today.Month -and $dt3.Day -eq $today.Day) {

            $lsNappalThorr = $ws3.Cells.Item($r,  2).Text.Trim()

            $lsNappalCMR   = $ws3.Cells.Item($r,  3).Text.Trim()

            $lsNappalLetsz = $ws3.Cells.Item($r,  7).Text.Trim()

            $lsEjThorr     = $ws3.Cells.Item($r, 10).Text.Trim()

            $lsEjCMR       = $ws3.Cells.Item($r, 11).Text.Trim()

            $lsEjLetsz     = $ws3.Cells.Item($r, 12).Text.Trim()

            $lsClearBrigi  = $ws3.Cells.Item($r, 13).Text.Trim()

            $lsClearSanyi  = $ws3.Cells.Item($r, 14).Text.Trim()

            $lsClearLetsz  = $ws3.Cells.Item($r, 15).Text.Trim()

            break

        }

    }

    $wb3.Close($false)

    Write-Host "LogSupport OK: N=$lsNappalThorr/$lsNappalCMR Ej=$lsEjThorr/$lsEjCMR"

} catch { Write-Host "HIBA LogSupport: $_" }



$xl.Quit()

[System.Runtime.Interopservices.Marshal]::ReleaseComObject($xl) | Out-Null

Write-Host "Excel bezarva."



# ============================================================

# 4. BELĂ‰PTETĂ‰S - YDiĂˇk szemlĂ©sz nappal

# ============================================================

$szemleszNappal = @()   # @{nev; muszak; rovidMuszak}

Write-Host "Olvasom BelptetĂ©s..."

try {

    if (-not $t4) { throw "belp fajl nem talalhato" }

    $xl2 = New-Object -ComObject Excel.Application

    $xl2.Visible = $false; $xl2.DisplayAlerts = $false; $xl2.EnableEvents = $false

    $xl2.AutomationSecurity = 3

    for ($w = 0; $w -lt 8; $w++) { try { $null=$xl2.Version; break } catch { Start-Sleep -Milliseconds 600 } }

    $wb4 = OpenWb $xl2 $t4

    # Lapnev keresese iteralassal (kulonleges karakterek miatt nem nevvel nyitjuk)

    $ws4 = $null

    for ($si = 1; $si -le $wb4.Sheets.Count; $si++) {

        $sn = $wb4.Sheets.Item($si).Name

        if ($sn -like "*nappal*" -and ($sn -like "*Di*" -or $sn -like "*di*")) {

            $ws4 = $wb4.Sheets.Item($si); break

        }

    }

    if (-not $ws4) { throw "YDiak szemlĂ©sz nappal lap nem talalhato" }

    $maxC4 = $ws4.UsedRange.Columns.Count

    $maxR4 = $ws4.UsedRange.Rows.Count

    $nevek = @{}

    $foOszlop = $maxC4

    for ($c = 2; $c -le $maxC4; $c++) {

        $n = $ws4.Cells.Item(1, $c).Text.Trim()

        if (-not $n) { continue }

        if ($n -notmatch '\s' -and $n.Length -lt 10) { $foOszlop = $c - 1; break }

        $nevek["$c"] = $n

    }

    Write-Host "  Belp: $($nevek.Count) szemelynev, FO elott leallva ($foOszlop. oszlopig)"

    $yr = $today.Year; $mo = $today.Month; $dy = $today.Day

    for ($r = 2; $r -le $maxR4; $r++) {

        $dv = $ws4.Cells.Item($r, 1).Value2

        if ($dv -is [double]) {

            $dt = [datetime]::FromOADate($dv)

            if ($dt.Year -eq $yr -and $dt.Month -eq $mo -and $dt.Day -eq $dy) {

                foreach ($cKey in $nevek.Keys) {

                    $cInt = [int]$cKey

                    if ($cInt -gt $foOszlop) { continue }

                    $val = $ws4.Cells.Item($r, $cInt).Text.Trim()

                    if (-not $val) { continue }

                    $rovidM = $val -like "*-17:00*"

                    if ($rovidM) { $muszakStr = "08:00-17:00" }

                    elseif ($val -like "*-*") { $muszakStr = $val }

                    else { $muszakStr = "08:00-20:00" }

                    $szemleszNappal += @{ nev=$nevek[$cKey]; muszak=$muszakStr; rovid=$rovidM }

                }

                break

            }

        }

    }

    $wb4.Close($false)

    $xl2.Quit()

    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($xl2) | Out-Null

    if ($t4 -ne $belpSrc) { Remove-Item $t4 -EA SilentlyContinue }

    Write-Host "Belptetes OK: $($szemleszNappal.Count) fo talalhato"

} catch { Write-Host "HIBA Belptetes: $_" }



# ============================================================





# ============================================================



# ============================================================
# 4. MUTATÓK + SEGÉDFÜGGVÉNYEK
# ============================================================
function FmtW($kg) {
    $t = [math]::Round($kg/1000,2)
    return "$([int][math]::Round($kg,0)) kg<span class='t'> ($t t)</span>"
}

# File URI-k az Excel megnyito gombokhoz
# SharePoint URL-ek az Excel gombokhoz (ms-excel protokoll)
$xlsbUri     = "ms-excel:ofe|u|https://hgllog.sharepoint.com/sites/Ecommerce/Megosztott%20dokumentumok/E_COMM%20nyomonk%C3%B6vet%C3%A9s_24.xlsb"
$ecommBeoUri = "ms-excel:ofe|u|https://hgllog.sharepoint.com/sites/Ecommerce/Megosztott%20dokumentumok/E-COM%20%C3%A9s%20TC%20beoszt%C3%A1s/04/E-COM+TC%20beoszt%C3%A1s_2026_04.xlsx"
$belpUri     = "ms-excel:ofe|u|https://hgllog.sharepoint.com/sites/Ecommerce/Megosztott%20dokumentumok/Bel%C3%A9ptet%C3%A9s%20H7WH.xlsm"
$logSupXlUri = "ms-excel:ofe|u|$logSupUrl"
$xlsbName    = "E_COMM nyomonkövetés_24"
$ecommBeoName= "E-COM+TC beosztás"
$belpName    = "Beléptetés H7WH"

# Alap mutatók
$osszKg      = $ertesito + $felveve + $megerkezett
$osszT       = [math]::Round($osszKg/1000,1)
$raktarT     = [math]::Round($raktarKg/1000,1)
$amEjszakiT  = [math]::Round($ejszakiAmKg/1000,2)
$atEjszakiT  = [math]::Round($ejszakiAtKg/1000,2)
$frissitve   = $today.ToString("yyyy.MM.dd HH:mm")
$datumStr    = $today.ToString("MM.dd.")

# Raktár szaturáció (400t = 100%)
$raktarSat = [math]::Min(100, [int][math]::Round($raktarKg/1000/400*100))
$raktarBarCol = if($raktarSat -ge 90){"#ef4444"}elseif($raktarSat -ge 80){"#f97316"}elseif($raktarSat -ge 70){"#fb923c"}elseif($raktarSat -ge 60){"#fbbf24"}elseif($raktarSat -ge 50){"#facc15"}elseif($raktarSat -ge 35){"#a3e635"}elseif($raktarSat -ge 20){"#4ade80"}else{"#34d399"}

# Csúcsórák
$amCsucsorH=0; $amCsucsKg=0
foreach ($kk in $amOrak.Keys){if($amOrak[$kk].kg -gt $amCsucsKg){$amCsucsKg=$amOrak[$kk].kg;$amCsucsorH=[int]$kk}}
$atCsucsorH=0; $atCsucsKg=0
foreach ($kk in $atOrak.Keys){if($atOrak[$kk].kg -gt $atCsucsKg){$atCsucsKg=$atOrak[$kk].kg;$atCsucsorH=[int]$kk}}
$amCsucsorStr = ([int]$amCsucsorH).ToString('00')+":00"
$atCsucsorStr = ([int]$atCsucsorH).ToString('00')+":00"
$amMaxKg=1; foreach($kk in $amOrak.Keys){if($amOrak[$kk].kg -gt $amMaxKg){$amMaxKg=$amOrak[$kk].kg}}
$atMaxKg=1; foreach($kk in $atOrak.Keys){if($atOrak[$kk].kg -gt $atMaxKg){$atMaxKg=$atOrak[$kk].kg}}

# ECOMM beosztás parser: "Név1+Név2" -> 2 badge; "Marci 10-22" -> shift badge
function ParseEcommShift($raw) {
    $raw = $raw.Trim()
    $result = @()
    $parts = $raw -split '\+'
    foreach ($p in $parts) {
        $p = $p.Trim()
        if ($p -match '^\(.+?\)\s+\(\d{1,2\}\):\(\d{2\}\)-\(\d{1,2\}\):?\(\d{0,2\}\)$') {
            $nm = $Matches[1].Trim()
            $sh = $Matches[2].PadLeft(2,'0') + ':' + $Matches[3].PadLeft(2,'0')
            $eh = $Matches[4].PadLeft(2,'0') + ':00'
            $result += "<span class='eshift'><span class='en'>$nm</span><span class='et'>$sh&ndash;$eh</span></span>"
        } elseif ($p -match '^\(.+?\)\s+\(\d{1,2\}\)-\(\d{1,2\}\)$') {
            $nm = $Matches[1].Trim()
            $sh = $Matches[2].PadLeft(2,'0') + ':00'
            $eh = $Matches[3].PadLeft(2,'0') + ':00'
            $result += "<span class='eshift'><span class='en'>$nm</span><span class='et'>$sh&ndash;$eh</span></span>"
        } else {
            $result += "<span class='badge'>$p</span>"
        }
    }
    return $result -join ""
}

# ============================================================
# 5. CSS - 3-szín rendszer, smooth animációk
# ============================================================
# Szín rendszer:
# --cl-in  (lila)  = minden IN/beérkezés
# --cl-out (cyan)  = minden OUT/kitárolás
# --cl-dat (kék)   = adatkártyák
# --cl-peo (zöld)  = beosztás kártyák
# --cl-alr (narancs/piros) = figyelmeztetések
$css = ":root{" +
"--bg:#08101e;--srf:#0f1929;--srf2:#141f2e;--brd:#1a2a3e;--brd2:#243548;" +
"--tx:#dde5f0;--tx2:#8fa3bc;--tx3:#4a6178;" +
"--cl-in:#7c3aed;--cl-in2:#a78bfa;" +
"--cl-out:#0891b2;--cl-out2:#22d3ee;" +
"--cl-dat:#1d4ed8;--cl-dat2:#60a5fa;" +
"--cl-peo:#065f46;--cl-peo2:#34d399;" +
"--cl-alr:#92400e;--cl-alr2:#fbbf24;" +
"--cl-warn:#be123c;--cl-warn2:#fb7185;" +
"--cl-stat:#1e3a5f;--cl-stat2:#93c5fd}" +
"*{box-sizing:border-box;margin:0;padding:0}html,body{height:100%}" +
"body{background:var(--bg);color:var(--tx);font-family:'Segoe UI',system-ui,sans-serif;padding:20px 24px;font-size:15px}" +

# Header
".hdr{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;" +
"padding-bottom:16px;border-bottom:1px solid var(--brd)}" +
".hdr-l h1{font-size:1.4rem;font-weight:800;letter-spacing:-.03em;color:var(--tx)}" +
".hdr-l h1 em{color:var(--cl-dat2);font-style:normal}" +
".hdr-l p{font-size:.8rem;color:var(--tx3);margin-top:4px;letter-spacing:.01em}" +
".hdr-r{text-align:right}" +
".hdr-r .ts{font-size:1.05rem;font-weight:700;color:var(--tx2);letter-spacing:-.01em}" +
".hdr-r .sub{font-size:.72rem;color:var(--tx3);margin-top:3px}" +

# Grid
".grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:14px;align-items:start}"

$css +=
# Kártya alap
".card{background:var(--srf);border:1px solid var(--brd);" +
"border-top:2px solid transparent;border-radius:14px;padding:16px;" +
"position:relative;overflow:hidden}" +

# Kártya hover - smooth spring
".card{cursor:default;transition:transform .45s cubic-bezier(.34,1.4,.64,1),box-shadow .45s cubic-bezier(.34,1.4,.64,1),background .3s ease}" +
".card:hover{transform:translateY(-6px) scale(1.013);box-shadow:0 24px 64px rgba(0,0,0,.75);background:var(--srf2);z-index:2}" +

# Kártya színek - felső szegély
".c-dat{border-top-color:var(--cl-dat2)}" +
".c-in {border-top-color:var(--cl-in2)}" +
".c-out{border-top-color:var(--cl-out2)}" +
".c-peo{border-top-color:var(--cl-peo2)}" +
".c-alr{border-top-color:var(--cl-alr2)}" +

# Kártya fejléc
".ct{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.13em;" +
"color:var(--tx3);margin-bottom:15px;display:flex;align-items:center;gap:7px}" +
".ct-ic{width:14px;height:14px;border-radius:3px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:.6rem}" +

# KPI nagy szám
".kpi{margin-bottom:10px}" +
".kpi-n{font-size:2.4rem;font-weight:900;line-height:1;letter-spacing:-.05em;display:flex;align-items:baseline;gap:5px}" +
".kpi-u{font-size:1.35rem;font-weight:600;color:var(--tx2)}" +
".kpi-s{font-size:.78rem;color:var(--tx3);margin-top:6px;line-height:1.4}" +

# Sorok
".row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--brd)}" +
".row:last-child{border-bottom:none}" +
".lbl{font-size:.88rem;color:var(--tx2);display:flex;align-items:center;gap:7px;line-height:1.3}" +
".dot{width:7px;height:7px;border-radius:50%;display:inline-block;flex-shrink:0}" +
".val{font-size:.95rem;font-weight:600;text-align:right}" +
".val .t{font-size:.75rem;font-weight:400;color:var(--tx3);margin-left:4px}"

$css +=
# Szaturáció sáv
".satbar{margin:12px 0 4px;height:8px;background:var(--brd2);border-radius:6px;overflow:hidden;position:relative}" +
".satbar-f{height:100%;border-radius:6px;transition:width 1.2s cubic-bezier(.34,1.2,.64,1)}" +
".satbar-lbl{display:flex;justify-content:space-between;font-size:.72rem;color:var(--tx3);margin-top:5px}" +

# Pill badge-ek
".pill{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.03);" +
"border:1px solid var(--brd2);border-radius:20px;padding:4px 11px;font-size:.75rem;" +
"color:var(--tx2);margin-top:7px;margin-right:5px;line-height:1.3}" +
".pill strong{color:var(--tx);font-weight:600}" +
".pill.hi{border-color:rgba(34,211,238,.3);color:var(--cl-out2)}" +
".pill.ok{border-color:rgba(52,211,153,.3);color:var(--cl-peo2)}" +
".pill.warn{border-color:rgba(251,191,36,.3);color:var(--cl-alr2)}" +

# Barchart
".barchart{margin-top:8px;display:flex;flex-direction:column;gap:3px}" +
".br{display:flex;align-items:center;gap:8px}" +
".br-l{width:40px;font-size:.72rem;color:var(--tx3);flex-shrink:0;font-variant-numeric:tabular-nums;font-weight:500}" +
".br-t{flex:1;height:17px;background:rgba(255,255,255,.03);border-radius:4px;overflow:hidden}" +
".br-f{height:100%;border-radius:4px;transition:width 1s cubic-bezier(.34,1.15,.64,1)}" +
".br-kg{flex-shrink:0;width:66px;font-size:.7rem;font-weight:600;color:var(--tx);text-align:right;font-variant-numeric:tabular-nums}" +
".br-m{width:38px;text-align:right;font-size:.7rem;color:var(--tx2);flex-shrink:0;font-weight:500}" +
".br.pk .br-l{color:var(--tx);font-weight:700}" +
".br.pk .br-t{height:27px}" + ".br.pk .br-f{box-shadow:0 0 14px rgba(255,255,255,.22),inset 0 0 20px rgba(255,255,255,.06);font-weight:800}" +

# Beosztás szekciók
".shf{margin-top:12px}" +
".shf:first-child{margin-top:4px}" +
".shf-l{font-size:.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.1em;" +
"color:var(--tx3);margin-bottom:7px;display:flex;align-items:center;gap:7px}" +
".shf-l .letsz{font-size:.7rem;background:rgba(255,255,255,.04);border:1px solid var(--brd2);" +
"border-radius:10px;padding:1px 8px;color:var(--tx2);font-weight:500}" +
".badges{display:flex;flex-wrap:wrap;gap:6px}" +
".badge{background:rgba(255,255,255,.04);border:1px solid var(--brd2);border-radius:8px;" +
"padding:5px 12px;font-size:.85rem;font-weight:500;display:inline-flex;align-items:center;gap:5px;color:var(--tx)}" +
".badge .rl{font-size:.7rem;color:var(--tx3);font-weight:400}" +
".badge.warn{background:rgba(251,113,133,.08);border-color:rgba(251,113,133,.3);color:var(--cl-warn2)}" +
".badge{transition:background .18s,border-color .18s,transform .18s}" +
".badge:not(.warn):hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.22);transform:translateY(-1px)}" +
".pill{transition:background .18s}" +
".pill:hover{background:rgba(255,255,255,.07)}" +
".eshift{transition:filter .2s}" +
".eshift:hover{filter:brightness(1.25)}" +
".sz-row{transition:background .15s;border-radius:6px}" +
".sz-row:hover{background:rgba(255,255,255,.035)}"

$css +=
# ECOMM shift badge
".eshift{display:inline-flex;align-items:center;gap:0;background:rgba(255,255,255,.04);" +
"border:1px solid var(--brd2);border-radius:8px;overflow:hidden;margin:3px 3px 0 0}" +
".eshift .en{padding:5px 10px;font-size:.85rem;font-weight:600;color:var(--tx)}" +
".eshift .et{padding:5px 10px;font-size:.78rem;color:var(--tx2);background:rgba(255,255,255,.03);border-left:1px solid var(--brd2)}" +

# Szemlész sor
".sz-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--brd)}" +
".sz-row:last-child{border-bottom:none}" +
".sz-name{font-size:.92rem;font-weight:500;color:var(--tx)}" +
".sz-time{font-size:.82rem;color:var(--tx2);font-weight:500}" +
".sz-time.warn{color:var(--cl-warn2);font-weight:600;padding:3px 8px;background:rgba(251,113,133,.1);border:1px solid rgba(251,113,133,.25);border-radius:6px}" +

# Footer
".foot{text-align:center;font-size:.72rem;color:var(--tx3);margin-top:20px;padding-top:12px;border-top:1px solid var(--brd)}" +

# Animációk - smooth stagger, spring feel
"@keyframes cardIn{from{opacity:0;transform:translateY(14px) scale(.98)}to{opacity:1;transform:translateY(0) scale(1)}}" +
"@keyframes barFill{from{width:0!important}}" +
".card{animation:cardIn .6s cubic-bezier(.34,1.3,.64,1) both}" +
".card:nth-child(1){animation-delay:.05s}.card:nth-child(2){animation-delay:.12s}" +
".card:nth-child(3){animation-delay:.19s}.card:nth-child(4){animation-delay:.26s}" +
".card:nth-child(5){animation-delay:.33s}.card:nth-child(6){animation-delay:.40s}" +
".card:nth-child(7){animation-delay:.47s}" +
".br-f{animation:barFill .9s cubic-bezier(.34,1.2,.64,1) both}" +
".br:nth-child(1) .br-f{animation-delay:.7s}.br:nth-child(2) .br-f{animation-delay:.78s}" +
".br:nth-child(3) .br-f{animation-delay:.86s}.br:nth-child(4) .br-f{animation-delay:.94s}" +
".br:nth-child(5) .br-f{animation-delay:1.02s}.br:nth-child(6) .br-f{animation-delay:1.1s}" +
".br:nth-child(7) .br-f{animation-delay:1.18s}" +
".satbar-f{transition:width 0s}" +
"@keyframes brIn{from{opacity:0;transform:translateX(-8px)}to{opacity:1;transform:translateX(0)}}" +
".br{animation:brIn .38s cubic-bezier(.4,0,.2,1) both}" +
".br:nth-child(1){animation-delay:.60s}.br:nth-child(2){animation-delay:.66s}" +
".br:nth-child(3){animation-delay:.72s}.br:nth-child(4){animation-delay:.78s}" +
".br:nth-child(5){animation-delay:.84s}.br:nth-child(6){animation-delay:.90s}" +
".br:nth-child(7){animation-delay:.96s}.br:nth-child(8){animation-delay:1.02s}" +
".br:nth-child(9){animation-delay:1.08s}.br:nth-child(10){animation-delay:1.14s}" +
".br:nth-child(11){animation-delay:1.20s}.br:nth-child(12){animation-delay:1.26s}"

$css +=
".c-dat .kpi-n{text-shadow:0 0 28px rgba(96,165,250,.45)}" +
".c-in  .kpi-n{text-shadow:0 0 28px rgba(167,139,250,.45)}" +
".c-out .kpi-n{text-shadow:0 0 28px rgba(34,211,238,.45)}" +
".c-dat{box-shadow:0 -3px 16px rgba(96,165,250,.08)}" +
".c-in {box-shadow:0 -3px 16px rgba(167,139,250,.08)}" +
".c-out{box-shadow:0 -3px 16px rgba(34,211,238,.08)}" +
".c-peo{box-shadow:0 -3px 16px rgba(52,211,153,.06)}" +
".c-dat:hover{box-shadow:0 10px 36px rgba(0,0,0,.55),0 0 32px rgba(96,165,250,.2)!important}" +
".c-in:hover {box-shadow:0 10px 36px rgba(0,0,0,.55),0 0 32px rgba(167,139,250,.2)!important}" +
".c-out:hover{box-shadow:0 10px 36px rgba(0,0,0,.55),0 0 32px rgba(34,211,238,.2)!important}" +
".c-peo:hover{box-shadow:0 10px 36px rgba(0,0,0,.55),0 0 32px rgba(52,211,153,.16)!important}" +
".card:nth-child(8){animation-delay:.54s}" +
".c-wx{border-top-color:var(--cl-out2);box-shadow:0 -3px 16px rgba(34,211,238,.08)}" +
".c-wx:hover{box-shadow:0 10px 36px rgba(0,0,0,.55),0 0 32px rgba(34,211,238,.2)!important}" +
".wx-now{display:flex;align-items:center;gap:12px;padding:8px 0 10px;border-bottom:1px solid var(--brd);margin-bottom:2px}" +
".wx-emo{font-size:2.1rem;line-height:1;flex-shrink:0;filter:drop-shadow(0 0 6px rgba(255,255,255,.2))}" +
".wx-nowinfo{display:flex;flex-direction:column;gap:3px}" +
".wx-tb{font-size:1.5rem;font-weight:800;color:var(--tx);letter-spacing:-.03em;line-height:1;text-shadow:0 0 18px rgba(34,211,238,.3)}" +
".wx-desc{font-size:.75rem;color:var(--tx2)}" +
".wx-wind{font-size:.7rem;color:var(--tx3)}" +
".wx-grid{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}" +
".wx-cell{flex:1;min-width:48px;background:rgba(255,255,255,.03);border:1px solid var(--brd2);border-radius:7px;padding:6px 3px;text-align:center;transition:border-color .2s}" +
".wx-cell:hover{border-color:rgba(34,211,238,.3)}" +
".wx-hr{font-size:.62rem;color:var(--tx2);margin-bottom:2px;font-variant-numeric:tabular-nums}" +
".wx-ico{font-size:1.05rem;line-height:1.4}" +
".wx-ct{font-size:.8rem;font-weight:700;color:var(--tx)}" +
".wx-pp{font-size:.62rem;color:var(--cl-out2);margin-top:1px}" +

# Excel megnyito gombok
".xl-sep{margin-top:14px;padding-top:12px;border-top:1px solid var(--brd)}" +
".xl-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;" +
"font-size:.76rem;font-weight:600;letter-spacing:.01em;text-decoration:none;border:1px solid;" +
"cursor:pointer;user-select:none;position:relative;overflow:hidden;" +
"transition:transform .25s cubic-bezier(.34,1.5,.64,1),box-shadow .25s,border-color .2s,background .18s}" +
".xl-btn::before{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;" +
"background:linear-gradient(90deg,transparent,rgba(255,255,255,.13),transparent);transition:left .45s}" +
".xl-btn:hover::before{left:150%}" +
".xl-btn:hover{transform:translateY(-3px) scale(1.04)}" +
".xl-btn:active{transform:scale(.93)!important;transition-duration:.07s!important}" +
".xl-ico{font-size:.95rem;line-height:1;flex-shrink:0}" +
".xl-nm{flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px}" +
".xl-arr{font-size:.7rem;opacity:.5;flex-shrink:0;transition:opacity .2s,transform .2s}" +
".xl-btn:hover .xl-arr{opacity:1;transform:translate(2px,-2px)}" +
".xl-ripple{position:absolute;border-radius:50%;background:rgba(255,255,255,.25);transform:scale(0);animation:xlRipple .55s linear;pointer-events:none}" +
"@keyframes xlRipple{to{transform:scale(3);opacity:0}}" +
".xl-dat{background:rgba(96,165,250,.08);border-color:rgba(96,165,250,.22);color:var(--cl-dat2)}" +
".xl-dat:hover{box-shadow:0 6px 22px rgba(96,165,250,.32);border-color:rgba(96,165,250,.55)}" +
".xl-in{background:rgba(167,139,250,.08);border-color:rgba(167,139,250,.22);color:var(--cl-in2)}" +
".xl-in:hover{box-shadow:0 6px 22px rgba(167,139,250,.32);border-color:rgba(167,139,250,.55)}" +
".xl-out{background:rgba(34,211,238,.08);border-color:rgba(34,211,238,.22);color:var(--cl-out2)}" +
".xl-out:hover{box-shadow:0 6px 22px rgba(34,211,238,.32);border-color:rgba(34,211,238,.55)}" +
".xl-peo{background:rgba(52,211,153,.08);border-color:rgba(52,211,153,.22);color:var(--cl-peo2)}" +
".xl-peo:hover{box-shadow:0 6px 22px rgba(52,211,153,.32);border-color:rgba(52,211,153,.55)}" +

# Frissítés gomb
"@keyframes spin{to{transform:rotate(360deg)}}" +
".rfr{display:inline-flex;align-items:center;gap:8px;padding:9px 20px;border-radius:12px;" +
"background:rgba(96,165,250,.08);border:1px solid rgba(96,165,250,.25);color:var(--cl-dat2);" +
"font-size:.82rem;font-weight:600;cursor:pointer;user-select:none;position:relative;overflow:hidden;" +
"transition:transform .2s cubic-bezier(.34,1.5,.64,1),box-shadow .2s,border-color .2s,background .15s}" +
".rfr:hover{transform:translateY(-2px) scale(1.04);box-shadow:0 6px 24px rgba(96,165,250,.28);border-color:rgba(96,165,250,.55)}" +
".rfr:active{transform:scale(.93)!important;transition-duration:.07s!important}" +
".rfr.spin .rfr-ic{animation:spin .7s linear}" +
".rfr-ic{font-size:1rem;line-height:1;display:inline-block;transition:transform .2s}" +
".rfr::before{content:'';position:absolute;top:0;left:-100%;width:60%;height:100%;" +
"background:linear-gradient(90deg,transparent,rgba(255,255,255,.12),transparent);transition:left .4s}" +
".rfr:hover::before{left:150%}"

# ============================================================
# 5b. IDŐJÁRÁS ADATOK (PS-ből, nem browser fetch - file:// kompatibilis)
# ============================================================
$wxJson = "null"
try {
    $wxUrl = "https://api.open-meteo.com/v1/forecast?latitude=47.44&longitude=19.36" +
             "&hourly=temperature_2m,precipitation_probability,weathercode,windspeed_10m" +
             "&current_weather=true&forecast_days=1&timezone=Europe%2FBudapest"
    $wxResp = Invoke-RestMethod -Uri $wxUrl -TimeoutSec 8
    $wxJson = $wxResp | ConvertTo-Json -Depth 10 -Compress
    Write-Host "Idojaras OK: $($wxResp.current_weather.temperature)C"
} catch { Write-Host "Idojaras hiba: $_" }

# ============================================================
# 6. HTML ÖSSZERAKÁS
# ============================================================
$h  = "<!DOCTYPE html><html lang='hu'><head><meta charset='UTF-8'>"
$h += "<title>HGL Ecommerce &mdash; $frissitve</title><style>$css</style></head><body>"

# Fejléc
$h += "<div class='hdr'>"
$h += "<div class='hdr-l'><h1>HGL <em>Ecommerce</em> &mdash; Reggeli Riport</h1>"
$h += "<p>$datumStr &nbsp;&#124;&nbsp; OneDrive + SharePoint</p></div>"
$h += "<div class='hdr-r'><div class='ts'>$frissitve</div><div class='sub'>OneDrive + SharePoint</div></div>"
$h += "<button class='rfr' id='rfr' onclick='doRefresh()'><span class='rfr-ic' id='rfr-ic'>&#8635;</span> Friss&iacute;t&eacute;s</button>"
$h += "</div><div class='grid'>"

# ─── KÁRTYA 1: E-COMM Státusz ───────────────────────────────
$h += "<div class='card c-dat'>"
$h += "<div class='ct'><span>E-COMM ST&Aacute;TUSZ</span></div>"
$h += "<div class='kpi'>"
$h += "<div class='kpi-n' style='color:var(--cl-dat2)'>$osszT<span class='kpi-u'>t</span></div>"
$h += "<div class='kpi-s'>&Ouml;sszes bent l&eacute;v&#337; t&eacute;tel &mdash; $([int]$osszKg) kg</div>"
$h += "</div>"
$h += "<div class='row'><span class='lbl'><span class='dot' style='background:var(--cl-alr2)'></span>&Eacute;rtes&iacute;t&#337;</span>"
$h += "<span class='val' style='color:var(--cl-alr2)'>$([int]$ertesito) kg<span class='t'>($([math]::Round($ertesito/1000,2)) t)</span></span></div>"
$h += "<div class='row'><span class='lbl'><span class='dot' style='background:var(--cl-peo2)'></span>Felv&eacute;ve</span>"
$h += "<span class='val' style='color:var(--cl-peo2)'>$([int]$felveve) kg<span class='t'>($([math]::Round($felveve/1000,2)) t)</span></span></div>"
$h += "<div class='row'><span class='lbl'><span class='dot' style='background:var(--cl-dat2)'></span>Meg&eacute;rkezett</span>"
$h += "<span class='val' style='color:var(--cl-dat2)'>$([int]$megerkezett) kg<span class='t'>($([math]::Round($megerkezett/1000,2)) t)</span></span></div>"
$h += "<div class='xl-sep'><a class='xl-btn xl-dat' href='$xlsbUri'><span class='xl-ico'>📊</span><span class='xl-nm'>$xlsbName</span><span class='xl-arr'>↗</span></a></div>"
$h += "</div>"

# ─── KÁRTYA 2: Raktárban aktív ──────────────────────────────
$h += "<div class='card c-dat'>"
$h += "<div class='ct'>RAKT&Aacute;RBAN AKT&Iacute;V</div>"
$h += "<div class='kpi'>"
$h += "<div class='kpi-n' style='color:var(--cl-dat2)'>$raktarSor<span class='kpi-u'>db</span></div>"
$h += "<div class='kpi-s'>$raktarT t &mdash; &aacute;tlag $([int][math]::Round($raktarKg/[math]::Max(1,$raktarSor))) kg/t&eacute;tel</div>"
$h += "</div>"
$h += "<div class='row'><span class='lbl'>S&uacute;ly</span>"
$h += "<span class='val' style='color:var(--cl-dat2)'>$([int]$raktarKg) kg<span class='t'>($raktarT t)</span></span></div>"
# Szaturáció sáv (400t = 100%)
$h += "<div class='satbar'><div class='satbar-f' id='satf' data-w='$raktarSat%' style='width:0;background:$raktarBarCol'></div></div>"
$h += "<div class='satbar-lbl'><span>0 t</span><span style='color:$raktarBarCol;font-weight:600'>$raktarT t &nbsp;($raktarSat %)</span><span>400 t</span></div>"
$h += "<div class='xl-sep'><a class='xl-btn xl-dat' href='$xlsbUri'><span class='xl-ico'>📊</span><span class='xl-nm'>$xlsbName</span><span class='xl-arr'>↗</span></a></div>"
$h += "</div>"

# ─── KÁRTYA 3: Éjszakai áttárolás (IN) ─────────────────────
$h += "<div class='card c-in'>"
$h += "<div class='ct'>&darr; &Eacute;JSZAKAI &Aacute;TT&Aacute;ROL&Aacute;S &nbsp;20:00&ndash;08:00</div>"
$h += "<div class='kpi'>"
$h += "<div class='kpi-n' style='color:var(--cl-in2)'>$amEjszakiT<span class='kpi-u'>t</span></div>"
$h += "<div class='kpi-s'>$ejszakiAmSor t&eacute;tel &aacute;tt&aacute;rolva &mdash; $([int]$ejszakiAmKg) kg</div>"
$h += "</div>"
$h += "<div class='barchart'>"
foreach ($h_ora in @(20,21,22,23,0,1,2,3,4,5,6,7)) {
    $oraAdat = $amOrak["$h_ora"]
    if ($oraAdat -and $oraAdat.db -gt 0) {
        $oraStr = ([int]$h_ora).ToString('00')+":00"
        $pct    = [int][math]::Max(8,[math]::Round($oraAdat.kg/$amMaxKg*88))
        $pkCls  = if([int]$h_ora -eq $amCsucsorH){" pk"}else{""}
        $h += "<div class='br$pkCls'><span class='br-l'>$oraStr</span><div class='br-t'>"
        $h += "<div class='br-f' style='width:$pct%;background:var(--cl-in2)'></div>"
        $h += "</div><span class='br-kg'>$([int]$oraAdat.kg) kg</span><span class='br-m'>$($oraAdat.db) db</span></div>"
    }
}
$h += "</div>"
if($ejszakiAmSor -gt 0){
    $h += "<span class='pill hi'>Cs&uacute;cs&oacute;ra: <strong>$amCsucsorStr</strong></span>"
    $h += "<span class='pill'>&aacute;tlag $([int]($ejszakiAmKg/[math]::Max(1,$ejszakiAmSor))) kg/t&eacute;tel</span>"
}
$h += "<div class='xl-sep'><a class='xl-btn xl-in' href='$xlsbUri'><span class='xl-ico'>📊</span><span class='xl-nm'>$xlsbName</span><span class='xl-arr'>↗</span></a></div>"
$h += "</div>"

# ─── KÁRTYA 4: Éjszakai kitárolás (OUT) ─────────────────────
$h += "<div class='card c-out'>"
$h += "<div class='ct'>&uarr; &Eacute;JSZAKAI KIT&Aacute;ROL&Aacute;S &nbsp;20:00&ndash;08:00</div>"
$h += "<div class='kpi'>"
$h += "<div class='kpi-n' style='color:var(--cl-out2)'>$atEjszakiT<span class='kpi-u'>t</span></div>"
$h += "<div class='kpi-s'>$ejszakiAtSor t&eacute;tel kiment &mdash; $([int]$ejszakiAtKg) kg</div>"
$h += "</div>"
$h += "<div class='barchart'>"
foreach ($h_ora in @(20,21,22,23,0,1,2,3,4,5,6,7)) {
    $oraAdat = $atOrak["$h_ora"]
    if ($oraAdat -and $oraAdat.db -gt 0) {
        $oraStr = ([int]$h_ora).ToString('00')+":00"
        $pct    = [int][math]::Max(8,[math]::Round($oraAdat.kg/$atMaxKg*88))
        $pkCls  = if([int]$h_ora -eq $atCsucsorH){" pk"}else{""}
        $h += "<div class='br$pkCls'><span class='br-l'>$oraStr</span><div class='br-t'>"
        $h += "<div class='br-f' style='width:$pct%;background:var(--cl-out2)'></div>"
        $h += "</div><span class='br-kg'>$([int]$oraAdat.kg) kg</span><span class='br-m'>$($oraAdat.db) db</span></div>"
    }
}
$h += "</div>"
if($ejszakiAtSor -gt 0){
    $h += "<span class='pill hi'>Cs&uacute;cs&oacute;ra: <strong>$atCsucsorStr</strong></span>"
    $h += "<span class='pill'>&aacute;tlag $([int]($ejszakiAtKg/[math]::Max(1,$ejszakiAtSor))) kg/t&eacute;tel</span>"
}
$h += "<div class='xl-sep'><a class='xl-btn xl-out' href='$xlsbUri'><span class='xl-ico'>📊</span><span class='xl-nm'>$xlsbName</span><span class='xl-arr'>↗</span></a></div>"
$h += "</div>"

# ─── KÁRTYA 5: Szemlész beosztás ────────────────────────────
$h += "<div class='card c-peo'>"
$h += "<div class='ct'>SZEML&Eacute;SZ BEOSZT&Aacute;S &mdash; $datumStr</div>"
if ($szemleszNappal.Count -eq 0) {
    $h += "<div style='color:var(--tx3);font-size:.88rem;padding:6px 0'>Nincs adat a mai napra</div>"
} else {
    foreach ($sz in $szemleszNappal) {
        $h += "<div class='sz-row'>"
        $h += "<span class='sz-name'>$($sz.nev)</span>"
        if ($sz.rovid) {
            $h += "<span class='sz-time warn'>$($sz.muszak) &nbsp;&#9888; 17:00-ig</span>"
        } else {
            $h += "<span class='sz-time'>$($sz.muszak)</span>"
        }
        $h += "</div>"
    }
}
$h += "<div class='xl-sep'><a class='xl-btn xl-peo' href='$belpUri'><span class='xl-ico'>📊</span><span class='xl-nm'>$belpName</span><span class='xl-arr'>↗</span></a></div>"
$h += "</div>"

# ─── KÁRTYA 6: ECOMM beosztás ───────────────────────────────
$h += "<div class='card c-peo'>"
$h += "<div class='ct'>ECOMM BEOSZT&Aacute;S &mdash; $datumStr</div>"
$h += "<div class='shf'><div class='shf-l'>Nappal</div>"
$h += "<div class='badges'>$(ParseEcommShift $ecommNappal)</div></div>"
$h += "<div class='shf'><div class='shf-l'>&Eacute;jszaka &nbsp;20:00&ndash;08:00</div>"
$h += "<div class='badges'>$(ParseEcommShift $ecommEjszaka)</div></div>"
$h += "<div class='xl-sep'><a class='xl-btn xl-peo' href='$ecommBeoUri'><span class='xl-ico'>📊</span><span class='xl-nm'>$ecommBeoName</span><span class='xl-arr'>↗</span></a></div>"
$h += "</div>"

# ─── KÁRTYA 7: Log Support + Clearance beosztás ─────────────
$h += "<div class='card c-peo'>"
$h += "<div class='ct'>LOG SUPPORT + CLEARANCE BEOSZT&Aacute;S &mdash; $datumStr</div>"

$h += "<div class='shf'><div class='shf-l'>Nappal <span class='letsz'>$lsNappalLetsz f&#337;</span></div>"
$h += "<div class='badges'>"
if($lsNappalThorr -and $lsNappalThorr -ne "N/A"){$h += "<span class='badge'>$lsNappalThorr <span class='rl'>Thorr</span></span>"}
if($lsNappalCMR   -and $lsNappalCMR   -ne "N/A"){$h += "<span class='badge'>$lsNappalCMR <span class='rl'>CMR</span></span>"}
$h += "</div></div>"

$h += "<div class='shf'><div class='shf-l'>&Eacute;jszaka <span class='letsz'>$lsEjLetsz f&#337;</span></div>"
$h += "<div class='badges'>"
if($lsEjThorr -and $lsEjThorr -ne "N/A"){$h += "<span class='badge'>$lsEjThorr <span class='rl'>Thorr</span></span>"}
if($lsEjCMR   -and $lsEjCMR   -ne "N/A"){$h += "<span class='badge'>$lsEjCMR <span class='rl'>CMR</span></span>"}
$h += "</div></div>"

$h += "<div class='shf'><div class='shf-l'>Clearance</div>"
$h += "<div class='badges'>"
if($lsClearBrigi -and $lsClearBrigi.Length -gt 0){$h += "<span class='badge'>Brigi</span>"}
if($lsClearSanyi -and $lsClearSanyi.Length -gt 0){$h += "<span class='badge'>Sanyi</span>"}
$h += "</div></div>"
$h += "<div class='xl-sep'><a class='xl-btn xl-peo' href='$logSupXlUri'><span class='xl-ico'>🌐</span><span class='xl-nm'>Log Support beosztás</span><span class='xl-arr'>↗</span></a></div>"
$h += "</div>"

# ─── KÁRTYA 8: Időjárás ─────────────────────────────────────
$h += "<div class='card c-wx'>"
$h += "<div class='ct'>🌤️ ID&#336;J&Aacute;R&Aacute;S MA &mdash; $datumStr &nbsp;<span style='text-transform:none;font-weight:400;color:var(--tx3);letter-spacing:0'>Magl&oacute;d</span></div>"
$h += "<div id='wx-loading' style='color:var(--tx3);font-size:.82rem;padding:6px 0'>Bet&#337;lt&eacute;s...</div>"
$h += "<div id='wx-body' style='display:none'><div id='wx-now' class='wx-now'></div><div id='wx-grid' class='wx-grid'></div></div>"
$h += "</div>"

$h += "</div>"
$h += "<div class='foot'>$frissitve &nbsp;&bull;&nbsp; OneDrive + SharePoint</div>"
$wxJs  = "window.onload=function(){"
$wxJs += "var e=document.getElementById('satf');if(e){var w=e.getAttribute('data-w');setTimeout(function(){e.style.transition='width 1.2s cubic-bezier(.34,1.1,.64,1)';e.style.width=w;},80);}"
$wxJs += "function wxE(c){if(c===0)return'\u2600\uFE0F';if(c<=2)return'\u26C5';if(c<=3)return'\u2601\uFE0F';if(c<=48)return'\uD83C\uDF2B\uFE0F';if(c<=57)return'\uD83C\uDF26\uFE0F';if(c<=65)return'\uD83C\uDF27\uFE0F';if(c<=77)return'\u2744\uFE0F';if(c<=82)return'\uD83C\uDF27\uFE0F';return'\u26C8\uFE0F';}"
$wxJs += "function wxT(c){if(c===0)return'Napos';if(c<=2)return'R\u00E9szben felh\u0151s';if(c<=3)return'Borult';if(c<=48)return'K\u00F6d';if(c<=65)return'Es\u0151';if(c<=82)return'Z\u00E1por';return'Zivatar';}"
$wxJs += "var wxRaw=$wxJson;"
$wxJs += "if(wxRaw&&wxRaw.current_weather){var cw=wxRaw.current_weather,hd=wxRaw.hourly,td=cw.time?cw.time.slice(0,10):'';document.getElementById('wx-now').innerHTML='<span class=wx-emo>'+wxE(cw.weathercode)+'</span><div class=wx-nowinfo><span class=wx-tb>'+Math.round(cw.temperature)+'&#176;C</span><span class=wx-desc>'+wxT(cw.weathercode)+'</span><span class=wx-wind>&#127788; '+Math.round(cw.windspeed)+' km/h</span></div>';var gr='';for(var i=0;i<hd.time.length;i++){if(hd.time[i].slice(0,10)!==td)continue;var hr=parseInt(hd.time[i].slice(11,13));if(hr<6||hr>21||hr%2!==0)continue;gr+='<div class=wx-cell><div class=wx-hr>'+hd.time[i].slice(11,16)+'</div><div class=wx-ico>'+wxE(hd.weathercode[i])+'</div><div class=wx-ct>'+Math.round(hd.temperature_2m[i])+'&#176;</div><div class=wx-pp>'+hd.precipitation_probability[i]+'%</div></div>';}document.getElementById('wx-grid').innerHTML=gr;document.getElementById('wx-loading').style.display='none';document.getElementById('wx-body').style.display='';}else{document.getElementById('wx-loading').textContent='\u26A0\uFE0F Nem el\u00E9rhet\u0151';}"

# Ripple az Excel gombokon
$wxJs += "function doRefresh(){var btn=document.getElementById('rfr');var ic=document.getElementById('rfr-ic');if(btn){btn.disabled=true;ic.style.animation='spin .7s linear infinite';}setTimeout(function(){location.reload();},300);}"
$wxJs += "document.querySelectorAll('.xl-btn').forEach(function(b){b.addEventListener('click',function(e){var r=document.createElement('span');r.className='xl-ripple';var rc=b.getBoundingClientRect(),s=Math.max(rc.width,rc.height);r.style.cssText='width:'+s+'px;height:'+s+'px;left:'+(e.clientX-rc.left-s/2)+'px;top:'+(e.clientY-rc.top-s/2)+'px;';b.appendChild(r);setTimeout(function(){r.remove()},600);});});"

# Cursor glow + trail
$wxJs += "(function(){"
$wxJs += "var pts=[],MAX=18,mx=0,my=0;"
$wxJs += "var cvs=document.createElement('canvas');"
$wxJs += "cvs.style.cssText='position:fixed;top:0;left:0;pointer-events:none;z-index:9998;';"
$wxJs += "document.body.appendChild(cvs);"
$wxJs += "var ctx=cvs.getContext('2d');"
$wxJs += "function rsz(){cvs.width=innerWidth;cvs.height=innerHeight;}rsz();addEventListener('resize',rsz);"
$wxJs += "addEventListener('mousemove',function(e){mx=e.clientX;my=e.clientY;pts.push({x:mx,y:my,t:Date.now()});if(pts.length>MAX)pts.shift();});"
$wxJs += "function frame(){"
$wxJs += "ctx.clearRect(0,0,cvs.width,cvs.height);"
$wxJs += "var now=Date.now();pts=pts.filter(function(p){return now-p.t<300;});"


$wxJs += "requestAnimationFrame(frame);}frame();"
$wxJs += "})();"

$wxJs += "}"
$h += "<script>$wxJs</script>"
$h += "</body></html>"

# ============================================================
# 7. MENTÉS + MEGNYITÁS
# ============================================================
[System.IO.File]::WriteAllText($outputHtml, $h, [System.Text.Encoding]::UTF8)
Write-Host "Kesz: $outputHtml"
Start-Process $outputHtml
